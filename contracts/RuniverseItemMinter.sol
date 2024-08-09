//SPDX-License-Identifier: UNLICENSED

// Solidity files have to start with this pragma.
// It will be used by the Solidity compiler to validate its version.
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Address.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import "./IRuniverseItem.sol";

contract RuniverseItemMinter is Ownable, ReentrancyGuard {
    /// @notice Address to the ERC721 RuniverseItem contract.
    IRuniverseItem public runiverseItem;

    /// @notice Address of the valid signer in contract.
    address public signer;

    /// @notice Address zero error.
    error Address0Error();

    /// @notice Adds locked item event.
    event TokenLocked(
        uint256 indexed tokenId,
        address indexed approvedContract
    );

    /// @notice Adds unlocked item event.
    event TokenUnlocked(
        uint256 indexed tokenId,
        address indexed approvedContract
    );

    /**
     * @dev Create the contract and set the initial baseURI.
     * @param _runiverseItem Address the initial base URI for the token metadata URL.
     */
    constructor(IRuniverseItem _runiverseItem, address _signer) {
        setRuniverseItem(_runiverseItem);
        signer = _signer;
    }

    /**
     * @dev Assigns the main contract.
     * @param _newruniverseItemAddress IRuniverseItem Main contract.
     */
    function setRuniverseItem(
        IRuniverseItem _newruniverseItemAddress
    ) public onlyOwner {
        runiverseItem = _newruniverseItemAddress;
    }

    /**
     * @dev Sets the valid signer address of contract.
     * @param _signer Address of the signer.
     */
    function setSigner(address _signer) external onlyOwner {
        signer = _signer;
    }

    /**
     * @dev Returns the signer address of contract.
     * @return signer Address of the valid signer in contract.
     */
    function getSigner() external view returns (address) {
        return signer;
    }

    /**
     * @dev Verifies if the signature corresponds to the signer.
     * @param _message Message to verify with signature.
     * @param _signature Signature used to verify the message.
     * @return bool Returns if the signature is valid or not.
     */
    function verify(
        string memory _message,
        bytes memory _signature
    ) public view returns (bool) {
        bytes32 messageHash = getMessageHash(_message);
        bytes32 ethSignedMessageHash = getEthSignedMessageHash(messageHash);

        return recover(ethSignedMessageHash, _signature) == signer;
    }

    /**
     * @dev Returns the message hash that is signed to create the signature.
     * @param _message Message to be hashed.
     * @return bytes32 Hash of the message.
     */
    function getMessageHash(
        string memory _message
    ) public pure returns (bytes32) {
        return keccak256(abi.encodePacked(_message));
    }

    /**
     * @dev Returns the message hash that is signed to create the signature.
     * @param _messageHash Hash of the message to be signed.
     * @return bytes32 Hash of the message.
     */
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

    /**
     * @dev Split signature and recover signer address.
     * @param _ethSignedMessageHash Hash of the signed message.
     * @param _signature Signature to split.
     * @return address Address of the signer.
     */
    function recover(
        bytes32 _ethSignedMessageHash,
        bytes memory _signature
    ) private pure returns (address) {
        (bytes32 r, bytes32 s, uint8 v) = splitSignature(_signature);

        return ecrecover(_ethSignedMessageHash, v, r, s);
    }

    /**
     * @dev Split signature into `r`, `s` and `v` variables, used by recover method.
     * @param _signature Signature to split.
     * @return r
     * @return s
     * @return v
     */
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

    /**
     * @dev Method to verify a message and mint an RuniverseItem to an address. Used for public minting.
     * @param signature Signature used to verify the message.
     * @param tokenId ID of the token to be minted.
     */
    function verifyAndMint(bytes memory signature, uint256 tokenId) public {
        string memory message = string.concat(
            Strings.toHexString(msg.sender),
            "_",
            Strings.toString(tokenId)
        );

        require(this.verify(message, signature), "Bad signature");

        runiverseItem.mintTokenId(msg.sender, tokenId);

        if (runiverseItem.isItemPaused(tokenId)) {
            emit TokenLocked(tokenId, address(runiverseItem));
        }
    }

    /**
     * @dev Method to mint many RuniverseItems and assign them to an addresses without any requirement. Used for private minting.
     * @param tokenIds uint256[] Tokens to be transferred.
     * @param recipients address[] Addresses where each token will be transferred.
     */
    function ownerMint(
        uint256[] calldata tokenIds,
        address[] calldata recipients
    ) external onlyOwner {
        require(
            tokenIds.length == recipients.length,
            "Arrays should have the same size"
        );
        for (uint256 i = 0; i < recipients.length; ++i) {
            runiverseItem.mintTokenId(recipients[i], tokenIds[i]);
        }
    }

    /**
     * @dev Method to unlock tokens.
     * @param tokenIds[] ID of the token to be minted.
     */
    function unlockTokens(uint256[] memory tokenIds) public onlyOwner {
        for (uint256 i = 0; i < tokenIds.length; i++) {
            emit TokenUnlocked(tokenIds[i], address(runiverseItem));
        }
    }

    /**
     * @dev ETH should not be sent to this contract, but in the case that it is
     * sent by accident, this function allows the owner to withdraw it.
     */
    function withdrawAll() external payable onlyOwner {
        (bool success, ) = msg.sender.call{value: address(this).balance}("");
        require(success, "withdraw was not succesfull");
    }

    /**
     * @dev Again, ERC20s should not be sent to this contract, but if someone
     * does, it's nice to be able to recover them.
     * @param token IERC20 The token address.
     * @param amount uint256 The amount to send.
     */
    function forwardERC20s(IERC20 token, uint256 amount) external onlyOwner {
        if (address(msg.sender) == address(0)) {
            revert Address0Error();
        }
        token.transfer(msg.sender, amount);
    }
}
