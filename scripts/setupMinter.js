// Import ethers.js library
const { ethers } = require('ethers');
var fs = require('fs');

async function main() {
    // Contract address and ABI
    const contractAddress = ''; // Contract address
    const jsonFile = 'artifacts/contracts/RuniverseItemMinter.sol/RuniverseItemMinter.json';
    const parsed = JSON.parse(fs.readFileSync(jsonFile));
    const contractABI = parsed.abi;

    // Create an ethers.js provider
    const provider = new ethers.providers.JsonRpcProvider('https://saigon-testnet.roninchain.com/rpc');
    const signer = new ethers.Wallet(
        '', // Wallet secret key
        provider
    );

    // Create a contract instance
    const contract = new ethers.Contract(contractAddress, contractABI, provider);
    const contractWithSigner = contract.connect(signer);

    // Owner mint
    let transaction = await contractWithSigner.ownerMint(
        [], // tokenIds
        [], // recipients
        { gasPrice: 30000000000, gasLimit: 1000000 }
    );
    await transaction.wait();
    console.log("Owner mint performed!");

    // Set signer
    transaction = await contractWithSigner.setSigner(
        "" // _signer
    );
    await transaction.wait();
    console.log("New signer set:", contract.getSigner());
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
