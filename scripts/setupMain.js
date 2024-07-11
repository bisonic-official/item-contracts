// Import ethers.js library
const { ethers } = require('ethers');
var fs = require('fs');

async function main() {
    // Contract address and ABI
    const contractAddress = ''; // Contract address
    const jsonFile = 'artifacts/contracts/RuniverseItem.sol/RuniverseItem.json';
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

    // Pause contract
    let transaction = await contractWithSigner.pauseContract(
        { gasPrice: 30000000000 }
    );
    await transaction.wait();
    console.log("Contract paused!");

    // Unpause contract
    transaction = await contractWithSigner.unpauseContract(
        { gasPrice: 30000000000 }
    );
    await transaction.wait();
    console.log("Contract unpaused!");

    // Set new URI for Tokens
    const newBaseURI = '' // New URI
    transaction = await contractWithSigner.setNewBaseURI(
        newBaseURI, { gasPrice: 30000000000 }
    );
    await transaction.wait();
    console.log("New base URI set:", await contract.getBaseURI());

    // Set new minter address
    const newMinter = '' // New minter address
    transaction = await contractWithSigner.setMinter(
        newMinter, { gasPrice: 30000000000 }
    );
    await transaction.wait();
    console.log("New minter set:", await contract.minterAddress());

    // Mint token
    const tokenId = 0;
    const recipient = '';
    transaction = await contractWithSigner.mintTokenId(
        recipient, tokenId, { gasPrice: 30000000000 }
    );
    console.log("Minted token:", tokenId);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
