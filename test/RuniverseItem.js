const { expect } = require("chai");

const generateSignature = async (address, tokenId, contract, signer) => {
  const raw_msg = new Array(address.toLowerCase(), tokenId);
  const message = raw_msg.join("_");

  const hash = await contract.getMessageHash(message);

  return {
    signature: await signer.signMessage(ethers.utils.arrayify(hash)),
    message,
  };
};

describe("🔥 RuniverseItem contract deployment tests", function () {
  it("Deployment should work for contract and minter + verify name and symbol", async function () {
    const [signer] = await ethers.getSigners();

    // Deploy contracts
    const RuniverseItem = await ethers.getContractFactory("RuniverseItem");
    const runiverseItem = await RuniverseItem.deploy(
      "https://testnets.opensea.io/assets/arbitrum-goerli/"
    );

    const RuniverseItemMinter = await ethers.getContractFactory("RuniverseItemMinter");
    const runiverseItemMinter = await RuniverseItemMinter.deploy(
      runiverseItem.address, signer.address
    );
    runiverseItem.setMinter(runiverseItemMinter.address);

    expect(await runiverseItem.name()).to.equal("RuniverseItem");
    expect(await runiverseItem.symbol()).to.equal("RITM");
  });

  it("Deployment should return the default initial signer", async function () {
    const [signer] = await ethers.getSigners();

    // Deploy contracts
    const RuniverseItem = await ethers.getContractFactory("RuniverseItem");
    const runiverseItem = await RuniverseItem.deploy(
      "https://testnets.opensea.io/assets/arbitrum-goerli/"
    );

    const RuniverseItemMinter = await ethers.getContractFactory("RuniverseItemMinter");
    const runiverseItemMinter = await RuniverseItemMinter.deploy(
      runiverseItem.address, signer.address
    );
    runiverseItem.setMinter(runiverseItemMinter.address);

    const default_signer = signer.address;
    expect(await runiverseItemMinter.getSigner()).to.equal(default_signer);
  });
});

describe("🔥 Verify signer getter and setter", function () {
  it("Should get a valid signer address", async function () {
    const [signer] = await ethers.getSigners();

    // Deploy contracts
    const RuniverseItem = await ethers.getContractFactory("RuniverseItem");
    const runiverseItem = await RuniverseItem.deploy(
      "https://testnets.opensea.io/assets/arbitrum-goerli/"
    );

    const RuniverseItemMinter = await ethers.getContractFactory("RuniverseItemMinter");
    const runiverseItemMinter = await RuniverseItemMinter.deploy(
      runiverseItem.address, signer.address
    );
    runiverseItem.setMinter(runiverseItemMinter.address);

    const addressRegex = /^0x[a-fA-F0-9]{40}$/;
    const address = await runiverseItemMinter.getSigner();
    expect(address).to.match(addressRegex);
  });

  it("Should set a new signer address", async function () {
    const [owner, signer] = await ethers.getSigners();

    // Deploy contracts
    const RuniverseItem = await ethers.getContractFactory("RuniverseItem");
    const runiverseItem = await RuniverseItem.deploy(
      "https://testnets.opensea.io/assets/arbitrum-goerli/"
    );

    const RuniverseItemMinter = await ethers.getContractFactory("RuniverseItemMinter");
    const runiverseItemMinter = await RuniverseItemMinter.deploy(
      runiverseItem.address, owner.address
    );
    runiverseItem.setMinter(runiverseItemMinter.address);

    await runiverseItemMinter.setSigner(signer.address);
    expect(await runiverseItemMinter.getSigner()).to.equal(signer.address);
  });
});

describe("🔥 Verify signature + mint + enumerability", function () {
  it("Check if signer matches with recovered signer", async function () {
    const [user, signer] = await ethers.getSigners();

    // Deploy contracts
    const RuniverseItem = await ethers.getContractFactory("RuniverseItem");
    const runiverseItem = await RuniverseItem.deploy(
      "https://testnets.opensea.io/assets/arbitrum-goerli/"
    );

    const RuniverseItemMinter = await ethers.getContractFactory("RuniverseItemMinter");
    const runiverseItemMinter = await RuniverseItemMinter.deploy(
      runiverseItem.address, signer.address
    );
    runiverseItem.setMinter(runiverseItemMinter.address);

    const { message, signature } = await generateSignature(
      user.address,
      123456789,
      runiverseItemMinter,
      signer
    );

    // Correct signature and message returns true
    expect(await runiverseItemMinter.verify(message, signature)).to.equal(true);
  });

  it("Verify signer and mint token function + test enumerability", async function () {
    const [user, signer, hacker] = await ethers.getSigners();

    // Deploy contracts
    const RuniverseItem = await ethers.getContractFactory("RuniverseItem");
    const runiverseItem = await RuniverseItem.deploy(
      "https://testnets.opensea.io/assets/arbitrum-goerli/"
    );

    const RuniverseItemMinter = await ethers.getContractFactory("RuniverseItemMinter");
    const runiverseItemMinter = await RuniverseItemMinter.deploy(
      runiverseItem.address, signer.address
    );
    runiverseItem.setMinter(runiverseItemMinter.address);

    const token_id = 123456789;
    const { signature } = await generateSignature(
      user.address,
      token_id,
      runiverseItemMinter,
      signer
    );

    // Verify can't use signature to mint wrong token
    await expect(runiverseItemMinter.verifyAndMint(
      signature, "42"
    )).to.be.revertedWith(
      "Bad signature"
    );

    // Verify wrong use can't use the same signature
    await expect(
      runiverseItemMinter.connect(hacker).verifyAndMint(signature, token_id)
    ).to.be.revertedWith("Bad signature");

    // Verify signature and mint token
    await runiverseItemMinter.verifyAndMint(signature, token_id);

    // Verify can't use same signature to mint another token (prevented since token id is part of signature)
    await expect(runiverseItemMinter.verifyAndMint(signature, 1111111)).to.be.revertedWith(
      "Bad signature"
    );

    // Check if token was minted
    expect(await runiverseItem.ownerOf(token_id)).to.equal(user.address);
    expect(await runiverseItem.exists(token_id)).to.equal(true);

    // Verify total supply with new minted token
    const totalSupply = await runiverseItem.totalSupply();
    const tokenByIndex = await runiverseItem.tokenByIndex(totalSupply - 1);
    expect(tokenByIndex).to.equal(token_id);

    // Get balance of signer (total of tokens minted by signer)
    const balanceOf = await runiverseItem.balanceOf(user.address);
    expect(balanceOf).to.equal(1);

    // Get token of owner by index
    const tokenOfOwnerByIndex = await runiverseItem.tokenOfOwnerByIndex(
      user.address, 0
    );
    expect(tokenOfOwnerByIndex).to.equal(token_id);

    // Test enumerablity
    const tokensOwned = await runiverseItem.getTokens(user.address);
    expect(tokensOwned.length).to.equal(1);

  });

  it("Verify error when signer does not match", async function () {
    const [user, signer] = await ethers.getSigners();

    // Deploy contracts
    const RuniverseItem = await ethers.getContractFactory("RuniverseItem");
    const runiverseItem = await RuniverseItem.deploy(
      "https://testnets.opensea.io/assets/arbitrum-goerli/"
    );

    const RuniverseItemMinter = await ethers.getContractFactory("RuniverseItemMinter");
    const runiverseItemMinter = await RuniverseItemMinter.deploy(
      runiverseItem.address,
      "0x0000000000000000000000000000000000000000" // Use another signer address
    );
    runiverseItem.setMinter(runiverseItemMinter.address);

    const token_id = 123456789;
    const { signature } = await generateSignature(
      user.address,
      token_id,
      runiverseItemMinter,
      signer
    );

    // Verify signature using another signer
    await expect(
      runiverseItemMinter.verifyAndMint(signature, token_id)
    ).to.be.revertedWith("Bad signature");
  });

  it("Verify multiple calls from same user with same token id", async function () {
    const [user, signer] = await ethers.getSigners();

    // Deploy contracts
    const RuniverseItem = await ethers.getContractFactory("RuniverseItem");
    const runiverseItem = await RuniverseItem.deploy(
      "https://testnets.opensea.io/assets/arbitrum-goerli/"
    );

    const RuniverseItemMinter = await ethers.getContractFactory("RuniverseItemMinter");
    const runiverseItemMinter = await RuniverseItemMinter.deploy(
      runiverseItem.address, signer.address
    );
    runiverseItem.setMinter(runiverseItemMinter.address);

    const token_id = 123456789;
    const { signature } = await generateSignature(
      user.address,
      token_id,
      runiverseItemMinter,
      signer
    );

    // Verify signature and mint token
    await runiverseItemMinter.verifyAndMint(signature, token_id);
    await expect(
      runiverseItemMinter.verifyAndMint(signature, token_id)
    ).to.be.revertedWith("ERC721: token already minted");
  });
});

describe("🔥 Test pausing and unpausing contract", function () {
  it("Pausing contract should pause minting", async function () {
    const [user, signer, hacker] = await ethers.getSigners();

    // Deploy contracts
    const RuniverseItem = await ethers.getContractFactory("RuniverseItem");
    const runiverseItem = await RuniverseItem.deploy(
      "https://testnets.opensea.io/assets/arbitrum-goerli/"
    );

    const RuniverseItemMinter = await ethers.getContractFactory("RuniverseItemMinter");
    const runiverseItemMinter = await RuniverseItemMinter.deploy(
      runiverseItem.address, signer.address
    );
    runiverseItem.setMinter(runiverseItemMinter.address);

    // Prepare new token
    const before_token_id = 123456789;
    const before_signature = await generateSignature(
      user.address,
      before_token_id,
      runiverseItemMinter,
      signer
    );

    // Mint before pausing contract 
    runiverseItemMinter.verifyAndMint(
      before_signature["signature"],
      before_token_id
    );

    // Verify only owner can pause contract minting
    await expect(runiverseItem.connect(hacker).pauseContract()).to.be.revertedWith(
      "Ownable: caller is not the owner"
    );

    // Pause contract minting
    await runiverseItem.pauseContract();

    // Prepare new token
    const token_id = 987654321;
    const new_signature = await generateSignature(
      user.address,
      token_id,
      runiverseItemMinter,
      signer
    );

    // Should revert with paused minting 
    await expect(
      runiverseItemMinter.verifyAndMint(new_signature["signature"], token_id)
    ).to.be.revertedWith("Minting is paused");

    // Verify only owner can unpause contract minting
    await expect(runiverseItem.connect(hacker).unpauseContract()).to.be.revertedWith(
      "Ownable: caller is not the owner"
    );

    // Unpause contract minting
    await runiverseItem.unpauseContract();

    // Verify signature and mint token
    await runiverseItemMinter.verifyAndMint(new_signature["signature"], token_id);

    // Check if token was minted
    expect(await runiverseItem.ownerOf(token_id)).to.equal(user.address);
    expect(await runiverseItem.exists(token_id)).to.equal(true);
  });

  it("Individual pausing and lock should work per Token type", async function () {
    const [user, signer, new_owner] = await ethers.getSigners();

    // Deploy contracts
    const RuniverseItem = await ethers.getContractFactory("RuniverseItem");
    const runiverseItem = await RuniverseItem.deploy(
      "https://testnets.opensea.io/assets/arbitrum-goerli/"
    );

    const RuniverseItemMinter = await ethers.getContractFactory("RuniverseItemMinter");
    const runiverseItemMinter = await RuniverseItemMinter.deploy(
      runiverseItem.address, signer.address
    );
    runiverseItem.setMinter(runiverseItemMinter.address);

    // Prepare new token
    const token_id = 2469777655453455634692290178366975519697639599971058388045n; // Sample token id
    const signature = await generateSignature(
      user.address,
      token_id,
      runiverseItemMinter,
      signer
    );

    // Token items should not be paused
    expect(await runiverseItem.isItemPaused(token_id)).to.equal(false);

    // Pause individual token type and verify it is paused
    const tag = token_id >> 96n;
    await runiverseItem.pauseItem(tag, true);
    expect(await runiverseItem.isItemPaused(token_id)).to.equal(true);

    // Mint paused item
    await runiverseItemMinter.verifyAndMint(
      signature["signature"],
      token_id
    );

    // Check if token was minted
    expect(await runiverseItem.ownerOf(token_id)).to.equal(user.address);
    expect(await runiverseItem.exists(token_id)).to.equal(true);

    // Test blocked transferFrom
    await expect(
      runiverseItem.transferFrom(user.address, new_owner.address, token_id)
    ).to.be.revertedWith("Item is paused");
    // _transfer and _burn are internals, so there's no need to be tested

    // Prepare new token
    const token_id_new = 2469777655453455634692290178366975519697639599971058388046n; // New sample token id
    const signature_new = await generateSignature(
      user.address,
      token_id_new,
      runiverseItemMinter,
      signer
    );

    // Verify token does not exists
    expect(await runiverseItem.exists(token_id_new)).to.equal(false);

    // Mint paused item
    await runiverseItemMinter.verifyAndMint(
      signature_new["signature"],
      token_id_new
    );

    // Check if token was minted
    expect(await runiverseItem.ownerOf(token_id_new)).to.equal(user.address);
    expect(await runiverseItem.exists(token_id_new)).to.equal(true);
    expect(await runiverseItem.isItemPaused(token_id_new)).to.equal(true);

    // Test pauseItemsBatch
    const tags = [tag, tag, tag];
    const paused = [false, true, false];
    await runiverseItem.pauseItemsBatch(tags, paused);
    expect(await runiverseItem.isItemPaused(token_id)).to.equal(false); // Last one is false

    // Now transfer the token and verify ownership
    await runiverseItem.transferFrom(user.address, new_owner.address, token_id);
    expect(await runiverseItem.ownerOf(token_id)).to.equal(new_owner.address);
    expect(await runiverseItem.exists(token_id)).to.equal(true);
  });
});

describe("🔥 Verify ownerMint function for private minting + enumerability", function () {
  it("Function ownerMint should mint several tokens", async function () {
    const [signer] = await ethers.getSigners();

    // Deploy contracts
    const RuniverseItem = await ethers.getContractFactory("RuniverseItem");
    const runiverseItem = await RuniverseItem.deploy(
      "https://testnets.opensea.io/assets/arbitrum-goerli/"
    );

    const RuniverseItemMinter = await ethers.getContractFactory("RuniverseItemMinter");
    const runiverseItemMinter = await RuniverseItemMinter.deploy(
      runiverseItem.address, signer.address
    );
    runiverseItem.setMinter(runiverseItemMinter.address);

    // Test ownerMint function for several tokens
    await runiverseItemMinter.ownerMint(
      [0, 4, 3, 1, 2], // Token IDs
      [
        signer.address,
        signer.address,
        signer.address,
        signer.address,
        signer.address,
      ]
    );

    // Check if tokens were minted
    for (let i = 0; i < 5; i++) {
      expect(await runiverseItem.ownerOf(i)).to.equal(signer.address);
      expect(await runiverseItem.exists(i)).to.equal(true);
    }

    // Get total supply (total of tokens minted)
    const totalSupply = await runiverseItem.totalSupply();
    expect(totalSupply).to.equal(5);

    // Get balance of signer (total of tokens minted by signer)
    const balanceOf = await runiverseItem.balanceOf(signer.address);
    expect(balanceOf).to.equal(5);

    // Get token of owner by index
    const tokenOfOwnerByIndex = await runiverseItem.tokenOfOwnerByIndex(
      signer.address, 1
    );
    expect(tokenOfOwnerByIndex).to.equal(4);

    // Get token by index
    const tokenByIndex = await runiverseItem.tokenByIndex(1);
    expect(tokenByIndex).to.equal(4);

    // Test minting with a new token ID
    const newId = 123456789;
    await runiverseItemMinter.ownerMint(
      [newId],
      [signer.address]
    );

    const newTotalSupply = await runiverseItem.totalSupply();
    const newTokenByIndex = await runiverseItem.tokenByIndex(newTotalSupply - 1);
    expect(newTokenByIndex).to.equal(newId);
  });

  it("Function ownerMint should revert with not matching arrays (in size)", async function () {
    const [signer] = await ethers.getSigners();

    // Deploy contracts
    const RuniverseItem = await ethers.getContractFactory("RuniverseItem");
    const runiverseItem = await RuniverseItem.deploy(
      "https://testnets.opensea.io/assets/arbitrum-goerli/"
    );

    const RuniverseItemMinter = await ethers.getContractFactory("RuniverseItemMinter");
    const runiverseItemMinter = await RuniverseItemMinter.deploy(
      runiverseItem.address, signer.address
    );
    runiverseItem.setMinter(runiverseItemMinter.address);

    // Test ownerMint function for several tokens
    await expect(
      runiverseItemMinter.ownerMint(
        [0, 1],
        [
          signer.address,
          signer.address,
          signer.address,
          signer.address,
          signer.address,
        ]
      )
    ).to.be.revertedWith("Arrays should have the same size");
  });
});

describe("🔥 Verify URIs of RuniverseItems", function () {
  it("Should return the new set URI", async function () {
    const [signer] = await ethers.getSigners();

    // Deploy contracts
    const RuniverseItem = await ethers.getContractFactory("RuniverseItem");
    const runiverseItem = await RuniverseItem.deploy(
      "https://testnets.opensea.io/assets/arbitrum-goerli/"
    );

    const RuniverseItemMinter = await ethers.getContractFactory("RuniverseItemMinter");
    const runiverseItemMinter = await RuniverseItemMinter.deploy(
      runiverseItem.address, signer.address
    );
    runiverseItem.setMinter(runiverseItemMinter.address);

    // Update base URI
    const baseURI = await runiverseItem.getBaseURI();

    const newURI_data = new Array(baseURI, runiverseItem.address.toLowerCase(), "/");
    const newURI = newURI_data.join("");
    await runiverseItem.setNewBaseURI(newURI);

    expect(await runiverseItem.getBaseURI()).to.equal(newURI);
  });

  it("Should return the Token URI", async function () {
    const [user, signer] = await ethers.getSigners();

    // Deploy contracts
    const RuniverseItem = await ethers.getContractFactory("RuniverseItem");
    const runiverseItem = await RuniverseItem.deploy(
      "https://testnets.opensea.io/assets/arbitrum-goerli/"
    );

    const RuniverseItemMinter = await ethers.getContractFactory("RuniverseItemMinter");
    const runiverseItemMinter = await RuniverseItemMinter.deploy(
      runiverseItem.address, signer.address
    );
    runiverseItem.setMinter(runiverseItemMinter.address);

    // Update base URI
    const baseURI = await runiverseItem.getBaseURI();

    const newURI_data = new Array(baseURI, runiverseItem.address.toLowerCase(), "/");
    const newURI = newURI_data.join("");
    await runiverseItem.setNewBaseURI(newURI);

    // Mint token
    const token_id = 123456789;
    const { signature } = await generateSignature(
      user.address,
      token_id,
      runiverseItemMinter,
      signer
    );

    // Verify signature and mint token
    await runiverseItemMinter.verifyAndMint(signature, token_id);

    // Get minted token URI
    const newBaseURI = await runiverseItem.getBaseURI();
    const newTokenId_data = new Array(newBaseURI, token_id);
    const newTokenId = newTokenId_data.join("");
    expect(await runiverseItem.tokenURI(token_id)).to.equal(newTokenId);
  });

  it("Should revert with non existing token", async function () {
    const [signer] = await ethers.getSigners();

    // Deploy contracts
    const RuniverseItem = await ethers.getContractFactory("RuniverseItem");
    const runiverseItem = await RuniverseItem.deploy(
      "https://testnets.opensea.io/assets/arbitrum-goerli/"
    );

    const RuniverseItemMinter = await ethers.getContractFactory("RuniverseItemMinter");
    const runiverseItemMinter = await RuniverseItemMinter.deploy(
      runiverseItem.address, signer.address
    );
    runiverseItem.setMinter(runiverseItemMinter.address);

    // Update base URI
    const baseURI = await runiverseItem.getBaseURI();

    const newURI_data = new Array(baseURI, runiverseItem.address.toLowerCase(), "/");
    const newURI = newURI_data.join("");
    await runiverseItem.setNewBaseURI(newURI);

    // Get minted token URI
    await expect(runiverseItem.tokenURI(123456789)).to.be.revertedWith(
      "ERC721Metadata: URI query for nonexistent token"
    );
  });
});