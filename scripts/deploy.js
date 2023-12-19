async function main() {
    // Get the deployer account of contracts
    const [deployer] = await ethers.getSigners();
    console.log("Deploying contracts with the account:", deployer.address);
    console.log("Account balance:", (await deployer.getBalance()).toString());

    // Deploy Runiverse Item Contract
    const RuniverseItemContract = await ethers.getContractFactory("RuniverseItem");
    const runiverseItemContract = await RuniverseItemContract.deploy("https://api.runiverse.world/GetItemInfo?ItemId=");
    console.log("Runiverse Item Contract Address:", runiverseItemContract.address);

    // Deploy Runiverse Item Minter Contract
    const RuniverseItemMinterContract = await ethers.getContractFactory("RuniverseItemMinter");
    const runiverseItemMinterContract = await RuniverseItemMinterContract.deploy(
        runiverseItemContract.address,
        deployer.address
    );
    console.log("Runiverse Item Minter Address:", runiverseItemMinterContract.address);

    // Set minter address
    let tx = await runiverseItemContract.setMinter(runiverseItemMinterContract.address);
    console.log(tx);
    let re = await tx.wait();
    console.log(re);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });