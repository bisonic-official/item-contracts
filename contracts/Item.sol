//SPDX-License-Identifier: UNLICENSED

// Solidity files have to start with this pragma.
// It will be used by the Solidity compiler to validate its version.
pragma solidity ^0.8.18;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/* Signature Verification

How to Sign and Verify
# Signing
1. Create message to sign
2. Hash the message
3. Sign the hash (off chain, keep your private key secret)

# Verify
1. Recreate hash from the original message
2. Recover signer from signature and hash
3. Compare recovered signer to claimed signer
*/

// This is the main building block for smart contracts.
contract Item is ERC721, Ownable {
    // Signer variable
    address public signer;

    // This is the constructor whose code is
    // run only when the contract is created.
    constructor() ERC721("Item", "ITM") {
        signer = 0x0d72fD549214Eb53cC241f400B147364e926E15B;
    }

    // Set signer
    function setSigner(address _signer) external onlyOwner {
        signer = _signer;
    }

    // Get signer
    function getSigner() external view returns (address) {
        return signer;
    }

    // Verify signature
    function verify(
        address _signer,
        string memory _message,
        bytes memory _signature
    ) external pure returns (bool) {
        bytes32 messageHash = getMessageHash(_message);
        bytes32 ethSignedMessageHash = getEthSignedMessageHash(messageHash);

        return recover(ethSignedMessageHash, _signature) == _signer;
    }

    // Recover message hash
    function getMessageHash(
        string memory _message
    ) public pure returns (bytes32) {
        return keccak256(abi.encodePacked(_message));
    }

    // Recover signed message hash
    function getEthSignedMessageHash(
        bytes32 _messageHash
    ) public pure returns (bytes32) {
        return
            keccak256(
                abi.encodePacked(
                    "\x19Ethereum Signed Message:\n32",
                    _messageHash
                )
            );
    }

    // Recover signer from signed message
    function recover(
        bytes32 _ethSignedMessageHash,
        bytes memory _signature
    ) public pure returns (address) {
        (bytes32 r, bytes32 s, uint8 v) = splitSignature(_signature);

        return ecrecover(_ethSignedMessageHash, v, r, s);
    }

    // Split signature into `r`, `s` and `v` variables
    function splitSignature(
        bytes memory _signature
    ) internal pure returns (bytes32 r, bytes32 s, uint8 v) {
        require(_signature.length == 65, "Invalid signature length!");

        assembly {
            // First 32 bytes stores the length of the signature
            r := mload(add(_signature, 32))
            // Next 32 bytes stores the length of the signature
            s := mload(add(_signature, 64))
            // Final byte stores the signature type
            v := byte(0, mload(add(_signature, 96)))
        }
    }

    // Verify + mint function
    function verifyAndMint(
        string memory _message,
        bytes memory _signature,
        address to,
        uint256 tokenId
    ) public {
        require(
            this.verify(signer, _message, _signature) == true,
            "Invalid signer"
        );
        _safeMint(to, tokenId);
    }

    // Owner mint function
    function ownerMint(
        uint256[] calldata tokenIds,
        address[] calldata recipients
    ) external onlyOwner {
        require(
            tokenIds.length == recipients.length,
            "Arrays should have the same size"
        );
        for (uint256 i = 0; i < recipients.length; ++i) {
            _safeMint(recipients[i], tokenIds[i]);
        }
    }
}
