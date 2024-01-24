//SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.18;

import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Burnable.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import "./IRuniverseItem.sol";

contract RuniverseItem is
    ERC721Burnable,
    ERC721Enumerable,
    Ownable,
    ReentrancyGuard,
    IRuniverseItem
{
    /// @notice ddress of only-valid minter.
    address public minterAddress;

    /// @notice The base URI for the metadata of the tokens
    string public baseTokenURI;

    /// @notice Counter to track the number minted so far.
    uint256 public numMinted = 0;

    /// @notice Address zero error.
    error Address0Error();

    /**
     * @dev Constructor of the contract.
     * @notice We pass the name and symbol to the ERC721 constructor.
     * @notice We set the valid signer address of contract.
     */
    constructor(string memory _baseURI) ERC721("RuniverseItem", "RITM") {
        baseTokenURI = _baseURI;
    }

    /**
     * @dev Overrides _beforeTokenTransfer
     * see {https://docs.openzeppelin.com/contracts/4.x/api/token/erc721#ERC721-_beforeTokenTransfer-address-address-uint256-uint256-}.
     */
    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 firstTokenId,
        uint256 batchSize
    ) internal override(ERC721, ERC721Enumerable) {
        super._beforeTokenTransfer(from, to, firstTokenId, batchSize);
    }

    /**
     * @dev Overrides supportsInterface
     * see {https://docs.openzeppelin.com/contracts/4.x/api/utils#IERC165-supportsInterface-bytes4-}.
     */
    function supportsInterface(
        bytes4 interfaceId
    ) public view virtual override(ERC721, ERC721Enumerable) returns (bool) {
        return super.supportsInterface(interfaceId);
    }

    /**
     * @dev Mint a new token with a specific id.
     * @param recipient address representing the owner of the new tokenId.
     * @param tokenId uint256 ID of the token to be minted.
     */
    function mintTokenId(
        address recipient,
        uint256 tokenId
    ) public override nonReentrant {
        require(_msgSender() == minterAddress, "Minter address is not valid");

        ++numMinted;
        emit RuniverseItemMinted(recipient, tokenId);
        _safeMint(recipient, tokenId);
    }

    /**
     * @dev Returns the URL of a given tokenId
     * @param tokenId uint256 ID of the token to be minted
     * @return string the URL of a given tokenId
     */
    function tokenURI(
        uint256 tokenId
    ) public view virtual override returns (string memory) {
        require(
            _exists(tokenId),
            "ERC721Metadata: URI query for nonexistent token"
        );

        return string.concat(baseTokenURI, Strings.toString(tokenId));
    }

    /**
     * @dev Returns if the token exists.
     * @param tokenId uint256 with the ID of the token.
     * @return exists bool if it exists.
     */
    function exists(uint256 tokenId) external view returns (bool) {
        return _exists(tokenId);
    }

    /**
     * @dev Returns the base URI of the token.
     * @return baseTokenURI String value of base Token URI.
     */
    function getBaseURI() external view returns (string memory) {
        return baseTokenURI;
    }

    /**
     * @dev Sets a new base URI
     * @param newBaseURI string the new token base URI
     */
    function setBaseURI(string calldata newBaseURI) external onlyOwner {
        baseTokenURI = newBaseURI;
    }

    /**
     * @dev Sets a new minter address.
     * @param newMinter Address of the new minter.
     */
    function setMinter(address newMinter) external onlyOwner {
        require(newMinter != address(0), "Invalid minter address");
        minterAddress = newMinter;
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
