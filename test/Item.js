const { expect } = require("chai");

describe("Item contract", function () {
    it("Deployment should verify name and symbol.", async function () {
        const Item = await ethers.getContractFactory("Item");
        const hardhatItem = await Item.deploy();

        expect(await hardhatItem.name()).to.equal("Item");
        expect(await hardhatItem.symbol()).to.equal("ITM");
    });
});