//SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import "./ERC721Common.sol";
import "./IRuniverseItem.sol";

contract RuniverseItem is
    ERC721Common,
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

    /// @notice Pausable items map<tag, bool>
    mapping(uint256 => bool) private pausedToken;

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
     * @dev Constructor of the contract.
     * @notice We pass the name and symbol to the ERC721 constructor.
     * @notice We set the valid signer address of contract.
     */
    constructor(
        string memory _baseURI
    ) ERC721Common("RuniverseItem", "RITM", _baseURI) {
        baseTokenURI = _baseURI;
        _baseTokenURI = _baseURI;
    }

    /**
     * @dev Pause minting in contract.
     */
    function pauseContract() external onlyOwner {
        if (!this.paused()) {
            _pause();
        }
    }

    /**
     * @dev Unpause minting in contract.
     */
    function unpauseContract() external onlyOwner {
        if (this.paused()) {
            _unpause();
        }
    }

    /**
     * @dev Pause/unpause Items.
     * @param tag uint256 the tag/type of Item.
     * @param paused bool the value to be set.
     */
    function pauseItem(uint256 tag, bool paused) external onlyOwner {
        pausedToken[tag] = paused;
    }

    /**
     * @dev Pause/unpause Items in batches.
     * @param tags uint256[] the tags/types of Items.
     * @param paused bool[] the values to be set.
     */
    function pauseItemsBatch(
        uint256[] calldata tags,
        bool[] calldata paused
    ) external onlyOwner {
        require(
            tags.length == paused.length,
            "Arrays should have the same length"
        );
        for (uint256 i = 0; i < tags.length; ++i) {
            pausedToken[tags[i]] = paused[i];
        }
    }

    /**
     * @dev Verify if Item is paused.
     * @param tokenId uint256 Token Id to be verified.
     */
    function isItemPaused(uint256 tokenId) external view returns (bool) {
        uint256 tag = tokenId >> (24 * 4);
        return pausedToken[tag];
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
    ) internal override(ERC721Common) {
        if (from != address(0)) {
            require(!this.isItemPaused(firstTokenId), "Item is paused");
        }
        super._beforeTokenTransfer(from, to, firstTokenId, batchSize);
    }

    /**
     * @dev Overrides supportsInterface
     * see {https://docs.openzeppelin.com/contracts/4.x/api/utils#IERC165-supportsInterface-bytes4-}.
     */
    function supportsInterface(
        bytes4 interfaceId
    ) public view virtual override(ERC721Common) returns (bool) {
        return super.supportsInterface(interfaceId);
    }

    /**
     * @dev Overrides _transfer.
     */
    function _transfer(
        address from,
        address to,
        uint256 tokenId
    ) internal override {
        require(!this.isItemPaused(tokenId), "Item is paused");
        super._transfer(from, to, tokenId);
    }

    /**
     * @dev Overrides transferFrom.
     */
    function transferFrom(
        address from,
        address to,
        uint256 tokenId
    ) public virtual override(ERC721, IERC721) {
        require(!this.isItemPaused(tokenId), "Item is paused");
        super.transferFrom(from, to, tokenId);
    }

    /**
     * @dev Overrides _burn.
     */
    function _burn(uint256 tokenId) internal override {
        require(!this.isItemPaused(tokenId), "Item is paused");
        super._burn(tokenId);
    }

    /**
     *
     * @param ownerAddress address of owner.
     * @return tokensOwned uint256 with IDs of owned tokens.
     */
    function getTokens(
        address ownerAddress
    ) public view returns (uint256[] memory) {
        uint256 numTokensOwned = this.balanceOf(ownerAddress);
        uint256[] memory tokensOwned = new uint256[](numTokensOwned);

        for (uint256 index = 0; index < numTokensOwned; index++) {
            tokensOwned[index] = this.tokenOfOwnerByIndex(ownerAddress, index);
        }

        return tokensOwned;
    }

    /**
     * @dev Mint a new token with a specific id.
     * @param recipient address representing the owner of the new tokenId.
     * @param tokenId uint256 ID of the token to be minted.
     */
    function mintTokenId(address recipient, uint256 tokenId) public {
        mintTokenId(recipient, tokenId, false);
    }

    /**
     * @dev Mint a new token with a specific id.
     * @param recipient address representing the owner of the new tokenId.
     * @param tokenId uint256 ID of the token to be minted.
     * @param lock bool Specifies if the token is locked to emit event.
     */
    function mintTokenId(
        address recipient,
        uint256 tokenId,
        bool lock
    ) public virtual nonReentrant {
        require(!paused(), "Minting is paused");
        require(_msgSender() == minterAddress, "Minter address is not valid");

        ++numMinted;
        emit RuniverseItemMinted(recipient, tokenId);
        _safeMint(recipient, tokenId);

        if (lock) {
            if (this.isItemPaused(tokenId)) {
                emit TokenLocked(tokenId, address(this));
            }
        }
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
     * @dev Method to unlock tokens.
     * @param tokenIds[] ID of the token to be minted.
     */
    function unlockTokens(uint256[] memory tokenIds) public onlyOwner {
        for (uint256 i = 0; i < tokenIds.length; i++) {
            emit TokenUnlocked(tokenIds[i], address(this));
        }
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
    function setNewBaseURI(string calldata newBaseURI) external onlyOwner {
        baseTokenURI = newBaseURI;
        _baseTokenURI = newBaseURI;
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
