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

describe("🔥 RuniverseItem contract", function () {
  it("Deployment should verify name and symbol", async function () {
    const [signer] = await ethers.getSigners();

    const RuniverseItem = await ethers.getContractFactory("RuniverseItem");
    const hardhatRuniverseItem = await RuniverseItem.deploy(
      signer.address,
      "https://testnets.opensea.io/assets/arbitrum-goerli/"
    );

    expect(await hardhatRuniverseItem.name()).to.equal("RuniverseItem");
    expect(await hardhatRuniverseItem.symbol()).to.equal("RITM");
  });

  it("Deployment should return the default initial signer", async function () {
    const [signer] = await ethers.getSigners();

    const RuniverseItem = await ethers.getContractFactory("RuniverseItem");
    const hardhatRuniverseItem = await RuniverseItem.deploy(
      signer.address,
      "https://testnets.opensea.io/assets/arbitrum-goerli/"
    );

    const default_signer = signer.address;
    expect(await hardhatRuniverseItem.getSigner()).to.equal(default_signer);
  });
});

describe("🔥 Verify signer getter and setter", function () {
  it("Should get a valid signer address", async function () {
    const [signer] = await ethers.getSigners();

    const RuniverseItem = await ethers.getContractFactory("RuniverseItem");
    const contract = await RuniverseItem.deploy(
      signer.address,
      "https://testnets.opensea.io/assets/arbitrum-goerli/"
    );
    await contract.deployed();

    const addressRegex = /^0x[a-fA-F0-9]{40}$/;
    const address = await contract.getSigner();
    expect(address).to.match(addressRegex);
  });

  it("Should set a new signer address", async function () {
    const [signer] = await ethers.getSigners();

    const RuniverseItem = await ethers.getContractFactory("RuniverseItem");
    const contract = await RuniverseItem.deploy(
      signer.address,
      "https://testnets.opensea.io/assets/arbitrum-goerli/"
    );
    await contract.deployed();

    await contract.setSigner(signer.address);
    expect(await contract.getSigner()).to.equal(signer.address);
  });
});

describe("🔥 Verify signature + mint", function () {
  it("Check if signer matches with recovered signer", async function () {
    const [user, signer] = await ethers.getSigners();

    const RuniverseItem = await ethers.getContractFactory("RuniverseItem");
    const contract = await RuniverseItem.deploy(
      signer.address,
      "https://testnets.opensea.io/assets/arbitrum-goerli/"
    );
    await contract.deployed();

    const { message, signature } = await generateSignature(
      user.address,
      123456789,
      contract,
      signer
    );

    // Correct signature and message returns true
    expect(await contract.verify(message, signature)).to.equal(true);
  });

  it("Verify signer and mint token function", async function () {
    const [user, signer, hacker] = await ethers.getSigners();

    const RuniverseItem = await ethers.getContractFactory("RuniverseItem");
    const contract = await RuniverseItem.deploy(
      signer.address,
      "https://testnets.opensea.io/assets/arbitrum-goerli/"
    );
    await contract.deployed();

    const token_id = 123456789;
    const { signature } = await generateSignature(
      user.address,
      token_id,
      contract,
      signer
    );

    // Verify can't use signature to mint wrong token
    await expect(contract.verifyAndMint(signature, "42")).to.be.revertedWith(
      "Bad signature"
    );

    // Verify wrong use can't use the same signature
    await expect(
      contract.connect(hacker).verifyAndMint(signature, token_id)
    ).to.be.revertedWith("Bad signature");

    // Verify signature and mint token
    await contract.verifyAndMint(signature, token_id);

    // Verify can't use same signature to mint another token (prevented since token id is part of signature)
    await expect(contract.verifyAndMint(signature, 1111111)).to.be.revertedWith(
      "Bad signature"
    );

    // Check if token was minted
    expect(await contract.ownerOf(token_id)).to.equal(user.address);
    expect(await contract.exists(token_id)).to.equal(true);
  });

  it("Verify error when signer does not match", async function () {
    const [user, signer] = await ethers.getSigners();

    const RuniverseItem = await ethers.getContractFactory("RuniverseItem");
    const contract = await RuniverseItem.deploy(
      "0x0000000000000000000000000000000000000000",
      "https://testnets.opensea.io/assets/arbitrum-goerli/"
    );
    await contract.deployed();

    const token_id = 123456789;
    const { message, signature } = await generateSignature(
      user.address,
      token_id,
      contract,
      signer
    );

    // Verify signature using another signer
    await expect(
      contract.verifyAndMint(signature, token_id)
    ).to.be.revertedWith("Bad signature");
  });

  it("Verify multiple calls from same user with same token id", async function () {
    const [user, signer] = await ethers.getSigners();

    const RuniverseItem = await ethers.getContractFactory("RuniverseItem");
    const contract = await RuniverseItem.deploy(
      signer.address,
      "https://testnets.opensea.io/assets/arbitrum-goerli/"
    );
    await contract.deployed();

    const token_id = 123456789;
    const { signature } = await generateSignature(
      user.address,
      token_id,
      contract,
      signer
    );

    // Verify signature and mint token
    await contract.verifyAndMint(signature, token_id);
    await expect(
      contract.verifyAndMint(signature, token_id)
    ).to.be.revertedWith("ERC721: token already minted");
  });
});

describe("🔥 Verify ownerMint function for private minting", function () {
  it("Function ownerMint should mint several tokens", async function () {
    const [signer] = await ethers.getSigners();

    const RuniverseItem = await ethers.getContractFactory("RuniverseItem");
    const contract = await RuniverseItem.deploy(
      signer.address,
      "https://testnets.opensea.io/assets/arbitrum-goerli/"
    );
    await contract.deployed();

    // Set signer to verify minting
    await contract.setSigner(signer.address);

    // Test ownerMint function for several tokens
    await contract.ownerMint(
      [0, 1, 2, 3, 4],
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
      expect(await contract.ownerOf(i)).to.equal(signer.address);
      expect(await contract.exists(i)).to.equal(true);
    }
  });

  it("Function ownerMint should revert with not matching arrays (in size)", async function () {
    const [signer] = await ethers.getSigners();

    const RuniverseItem = await ethers.getContractFactory("RuniverseItem");
    const contract = await RuniverseItem.deploy(
      signer.address,
      "https://testnets.opensea.io/assets/arbitrum-goerli/"
    );
    await contract.deployed();

    // Set signer to verify minting
    await contract.setSigner(signer.address);

    // Test ownerMint function for several tokens
    await expect(
      contract.ownerMint(
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

    const RuniverseItem = await ethers.getContractFactory("RuniverseItem");
    const contract = await RuniverseItem.deploy(
      signer.address,
      "https://testnets.opensea.io/assets/arbitrum-goerli/"
    );

    // Update base URI
    const baseURI = await contract.getBaseURI();

    const newURI_data = new Array(baseURI, contract.address.toLowerCase(), "/");
    const newURI = newURI_data.join("");
    await contract.setBaseURI(newURI);

    expect(await contract.getBaseURI()).to.equal(newURI);
  });

  it("Should return the Token URI", async function () {
    const [user, signer] = await ethers.getSigners();

    const RuniverseItem = await ethers.getContractFactory("RuniverseItem");
    const contract = await RuniverseItem.deploy(
      signer.address,
      "https://testnets.opensea.io/assets/arbitrum-goerli/"
    );

    // Update base URI
    const baseURI = await contract.getBaseURI();

    const newURI_data = new Array(baseURI, contract.address.toLowerCase(), "/");
    const newURI = newURI_data.join("");
    await contract.setBaseURI(newURI);

    // Mint token
    const token_id = 123456789;
    const { signature } = await generateSignature(
      user.address,
      token_id,
      contract,
      signer
    );

    // Verify signature and mint token
    await contract.verifyAndMint(signature, token_id);

    // Get minted token URI
    const newBaseURI = await contract.getBaseURI();
    const newTokenId_data = new Array(newBaseURI, token_id);
    const newTokenId = newTokenId_data.join("");
    expect(await contract.tokenURI(token_id)).to.equal(newTokenId);
  });

  it("Should revert with non existing token", async function () {
    const [signer] = await ethers.getSigners();

    const RuniverseItem = await ethers.getContractFactory("RuniverseItem");
    const contract = await RuniverseItem.deploy(
      signer.address,
      "https://testnets.opensea.io/assets/arbitrum-goerli/"
    );

    // Update base URI
    const baseURI = await contract.getBaseURI();

    const newURI_data = new Array(baseURI, contract.address.toLowerCase(), "/");
    const newURI = newURI_data.join("");
    await contract.setBaseURI(newURI);

    // Get minted token URI
    await expect(contract.tokenURI(123456789)).to.be.revertedWith(
      "ERC721Metadata: URI query for nonexistent token"
    );
  });
});