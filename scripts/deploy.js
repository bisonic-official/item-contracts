async function main() {
    const [deployer] = await ethers.getSigners();

    console.log("Deploying contracts with the account:", deployer.address);
    console.log("Account balance:", (await deployer.getBalance()).toString());

    const RuniverseItem = await ethers.getContractFactory("RuniverseItem");
    const runiverseItem = await RuniverseItem.deploy(
        "0xa0Ff5b048E0e53f1204F0537F1cEC8f49dC9D515", 
        "https://testnets.opensea.io/assets/arbitrum-goerli/"
    );

    console.log("RuniverseItem address:", runiverseItem.address);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });