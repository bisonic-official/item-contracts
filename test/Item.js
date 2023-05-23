const { expect } = require("chai");

describe("🔥 Item contract", function () {
    it("Deployment should verify name and symbol", async function () {
        const Item = await ethers.getContractFactory("Item");
        const hardhatItem = await Item.deploy();

        expect(await hardhatItem.name()).to.equal("Item");
        expect(await hardhatItem.symbol()).to.equal("ITM");
    });

    it("Deployment should return the default initial signer", async function () {
        const Item = await ethers.getContractFactory("Item");
        const hardhatItem = await Item.deploy();

        const default_signer = "0x0d72fD549214Eb53cC241f400B147364e926E15B";
        expect(await hardhatItem.getSigner()).to.equal(default_signer);
    });
});

describe("🔥 Verify signer getter and setter", function () {
    it("Should get a valid signer address", async function () {

        const Item = await ethers.getContractFactory("Item");
        const contract = await Item.deploy();
        await contract.deployed();

        const addressRegex = /^0x[a-fA-F0-9]{40}$/;
        const address = await contract.getSigner();
        expect(address).to.match(addressRegex);
    });

    it("Should set a new signer address", async function () {
        const [signer] = await ethers.getSigners();

        const Item = await ethers.getContractFactory("Item");
        const contract = await Item.deploy();
        await contract.deployed();

        await contract.setSigner(signer.address);
        expect(await contract.getSigner()).to.equal(signer.address);
    });
});

describe("🔥 Verify signature + mint", function () {
    it("Check if signer matches with recovered signer", async function () {
        const [signer] = await ethers.getSigners();

        const Item = await ethers.getContractFactory("Item");
        const contract = await Item.deploy();
        await contract.deployed();

        const signer_address = signer.address;
        const raw_msg = new Array(signer_address, "_", "1234567890");
        const message = raw_msg.join("");

        const hash = await contract.getMessageHash(message);
        const signature = await signer.signMessage(ethers.utils.arrayify(hash));
        const ethHash = await contract.getEthSignedMessageHash(hash);

        // Correct signature and message returns true
        expect(
            await contract.verify(signer.address, message, signature)
        ).to.equal(true);
    });

    it("Verify signer and mint token function", async function () {
        const [signer] = await ethers.getSigners();

        const Item = await ethers.getContractFactory("Item");
        const contract = await Item.deploy();
        await contract.deployed();

        const signer_address = signer.address;
        const token_id = "0123456789";
        const raw_msg = new Array(signer_address, "_", token_id);
        const message = raw_msg.join("");

        // Set signer to verify minting
        await contract.setSigner(signer.address);
        const hash = await contract.getMessageHash(message);
        const signature = await signer.signMessage(ethers.utils.arrayify(hash));
        const ethHash = await contract.getEthSignedMessageHash(hash);

        // Verify signature and mint token
        await contract.verifyAndMint(message, signature, signer_address, token_id);
    });

    it("Verify error when signer does not match", async function () {
        const [signer] = await ethers.getSigners();

        const Item = await ethers.getContractFactory("Item");
        const contract = await Item.deploy();
        await contract.deployed();

        const signer_address = signer.address;
        const token_id = "0123456789";
        const raw_msg = new Array(signer_address, "_", token_id);
        const message = raw_msg.join("");

        const hash = await contract.getMessageHash(message);
        const signature = await signer.signMessage(ethers.utils.arrayify(hash));
        const ethHash = await contract.getEthSignedMessageHash(hash);

        // Verify signature using another signer
        await expect(contract.verifyAndMint(message, signature, signer_address, token_id)).to.be.revertedWith("Invalid signer");
    });

    it("Verify multiple calls from same user with same token id", async function () {
        const [signer] = await ethers.getSigners();

        const Item = await ethers.getContractFactory("Item");
        const contract = await Item.deploy();
        await contract.deployed();

        let token_id = "0123456789";
        const raw_msg = new Array(signer.address, "_", token_id);
        const message = raw_msg.join("");

        // Set signer to verify minting
        await contract.setSigner(signer.address);

        const hash = await contract.getMessageHash(message);
        const signature = await signer.signMessage(ethers.utils.arrayify(hash));
        const ethHash = await contract.getEthSignedMessageHash(hash);

        // Verify signature and mint token
        await contract.verifyAndMint(message, signature, signer.address, token_id);
        await expect(contract.verifyAndMint(message, signature, signer.address, token_id)).to.be.revertedWith("ERC721: token already minted");
    });

});

describe("🔥 Verify ownerMint function for private minting", function () {
    it("Function ownerMint should mint several tokens", async function () {
        const [signer] = await ethers.getSigners();

        const Item = await ethers.getContractFactory("Item");
        const contract = await Item.deploy();
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
                signer.address
            ]);
    });

    it("Function ownerMint should revert with not matching arrays (in size)", async function () {
        const [signer] = await ethers.getSigners();

        const Item = await ethers.getContractFactory("Item");
        const contract = await Item.deploy();
        await contract.deployed();

        // Set signer to verify minting
        await contract.setSigner(signer.address);

        // Test ownerMint function for several tokens
        await expect(contract.ownerMint(
            [0, 1],
            [
                signer.address,
                signer.address,
                signer.address,
                signer.address,
                signer.address
            ])).to.be.revertedWith("Arrays should have the same size");
    });
});