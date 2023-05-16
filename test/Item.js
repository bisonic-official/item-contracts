const { expect } = require("chai");

describe("🔥 Item contract", function () {
    it("Deployment should verify name and symbol.", async function () {
        const Item = await ethers.getContractFactory("Item");
        const hardhatItem = await Item.deploy();

        expect(await hardhatItem.name()).to.equal("Item");
        expect(await hardhatItem.symbol()).to.equal("ITM");
    });
});

describe("🔥 Mint token", function () {
    it("Should mint token and verify balance.", async function () {
        const [signer] = await ethers.getSigners();

        const Item = await ethers.getContractFactory("Item");
        const contract = await Item.deploy();
        await contract.deployed();

        // Verify signature and mint token by looking at balance of address
        const token_id = "1234567890";
        let balance = await contract.balanceOf(signer.address);
        await contract.mint(signer.address, token_id);
        expect(
            await contract.balanceOf(signer.address)
        ).to.equal(balance + 1);

    });
});

describe("🔥 Verify signature", function () {
    it("Check if signer matches with recovered signer.", async function () {
        const [signer] = await ethers.getSigners();

        const Item = await ethers.getContractFactory("Item");
        const contract = await Item.deploy();
        await contract.deployed();

        const signer_address = signer.address;
        const raw_msg = new Array(signer_address, "_", "1234567890");
        const message = raw_msg.join("");
        // console.log("▶️ Message:         ", message);

        const hash = await contract.getMessageHash(message);
        const signature = await signer.signMessage(ethers.utils.arrayify(hash));

        const ethHash = await contract.getEthSignedMessageHash(hash);

        // At this point signer.address == recovered signer:
        console.log("\t▶️  Signer:          ", signer.address);
        console.log("\t▶️  Recovered signer:", await contract.recover(ethHash, signature));

        // Correct signature and message returns true
        expect(
            await contract.verify(signer.address, message, signature)
        ).to.equal(true);
    });

    it("Verify signer and mint token.", async function () {
        const [signer] = await ethers.getSigners();

        const Item = await ethers.getContractFactory("Item");
        const contract = await Item.deploy();
        await contract.deployed();

        const signer_address = signer.address;
        let token_id = "31068995411928846042680088694";
        const raw_msg = new Array(signer_address, "_", token_id);
        const message = raw_msg.join("");
        console.log("\t▶️  Signer:          ", signer.address);
        console.log("\t▶️  Message:         ", message);

        const hash = await contract.getMessageHash(message);
        const signature = await signer.signMessage(ethers.utils.arrayify(hash));

        const ethHash = await contract.getEthSignedMessageHash(hash);

        // At this point signer.address == recovered signer then mint token:
        console.log("\t▶️  Signature:       ", signature);
        console.log("\t▶️  Recovered signer:", await contract.recover(ethHash, signature));

        // Verify signature and mint token by looking at balance of address
        // let balance = await contract.balanceOf(signer_address);
        // await contract.verifyAndMint(signer_address, message, signature, signer_address, token_id);

        expect(
            await contract.verifyAndMint(signer_address, message, signature, signer_address, token_id)
        ).to.equal(true);

        // expect(
        //     await contract.balanceOf(signer_address)
        // ).to.equal(balance + 1);

        // Test with custom data
        // const sig_address = '0x0d72fD549214Eb53cC241f400B147364e926E15B';
        // const msg = "0x0d72fD549214Eb53cC241f400B147364e926E15B_31068974659341763119434520693";
        // const sig = "0x83189457b9052dbb7693987ecd3e28e9cf5e38b7e669dbce832d691212d431a22f6763abeefa4c695181df061f11ff68f7bb0cd66b260f911e1d44d697944dea1b";
        // token_id = "31068974659341763119434520693";
        // console.log("\t▶️  Signer:          ", sig_address);
        // console.log("\t▶️  Message:         ", msg);
        // console.log("\t▶️  Signature:       ", sig);
        // await contract.verifyAndMint(sig_address, msg, sig, sig_address, token_id);
        // expect(
        //     await contract.verifyAndMint(sig_address, msg, sig, sig_address, token_id)
        // ).to.equal(true);
    });
});