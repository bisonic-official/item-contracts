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

describe("🔥 Verify signature + mint + enumerability + burnability", function () {
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

  it("Verify signer and mint token function", async function () {
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

    // Test burn function
    await runiverseItem.burn(token_id);
    expect(await runiverseItem.exists(token_id)).to.equal(false);
    await expect(runiverseItem.ownerOf(token_id)).to.be.revertedWith("ERC721: invalid token ID");

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

describe("🔥 Test burning tokens", function () {
  it("Only owner can burn an item + burned items should not exist", async function () {
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
    
    // Prepare token
    const token_id = 123456789;
    const { signature } = await generateSignature(
      user.address,
      token_id,
      runiverseItemMinter,
      signer
    );
    
    // Verify signature and mint token
    await runiverseItemMinter.verifyAndMint(signature, token_id);

    // Check if token was minted
    expect(await runiverseItem.ownerOf(token_id)).to.equal(user.address);
    expect(await runiverseItem.exists(token_id)).to.equal(true);

    // Verify only owner can burn tokens
    await expect(runiverseItem.connect(hacker).burn(token_id)).to.be.revertedWith(
      "ERC721: caller is not token owner or approved"
    );

    // Verify burnable token is not available anymore
    await runiverseItem.burn(token_id);
    expect(await runiverseItem.exists(token_id)).to.equal(false);
  });
});

describe("🔥 Verify ownerMint function for private minting + enumerability + burnability", function () {
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
    await runiverseItem.setBaseURI(newURI);

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
    await runiverseItem.setBaseURI(newURI);

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
    await runiverseItem.setBaseURI(newURI);

    // Get minted token URI
    await expect(runiverseItem.tokenURI(123456789)).to.be.revertedWith(
      "ERC721Metadata: URI query for nonexistent token"
    );
  });
});