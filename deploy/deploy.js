const func = async function (hre) {
    const { deployments, getNamedAccounts } = hre;
    const { deploy } = deployments;

    const { deployer } = await getNamedAccounts();
    console.log("Deploying contracts with the account:", deployer);

    try {
        const runiverseItemContract = await deploy('RuniverseItem', {
            from: deployer,
            args: [
                "https://api.runiverse.world/GetItemInfo?ItemId="
            ],
            log: true,
            gasPrice: 30000000000
        });

        const runiverseItemMinterContract = await deploy('RuniverseItemMinter', {
            from: deployer,
            args: [
                runiverseItemContract.address,
                deployer
            ],
            log: true,
            gasPrice: 30000000000
        });
    } catch (error) {
        console.error("Error deploying contracts:", error);
    }
};

module.exports = func;
func.tags = ['RuniverseItem'];
