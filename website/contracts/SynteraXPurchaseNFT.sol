// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import "@openzeppelin/contracts/utils/Base64.sol";

/**
 * @title SynteraXPurchaseNFT
 * @notice ERC721 NFT representing proof of purchase for SynteraX mining packages
 * @dev Features:
 *   - Admin-only minting (no public mint)
 *   - Soulbound option (non-transferable when enabled)
 *   - On-chain metadata storage
 *   - Batch minting support for gas efficiency
 *   - Full ERC721 compliance
 */
contract SynteraXPurchaseNFT is ERC721, ERC721Enumerable, Ownable {
    using Strings for uint256;

    // ============ Structs ============
    struct PurchaseMetadata {
        string purchaseId;       // UUID from database
        string packageName;      // e.g., "Elite Mining Package"
        string packageTier;      // e.g., "ELITE"
        uint256 hashrateThs;     // Hashrate in TH/s
        uint256 xflowTokens;     // XFLOW tokens included
        uint256 priceUsd;        // Price in USD (cents)
        string paymentCurrency;  // USDT or XFLOW
        uint256 purchaseDate;    // Unix timestamp
        uint256 certificateNumber; // Unique certificate number
    }

    struct MintData {
        address recipient;
        string purchaseId;
        string packageName;
        string packageTier;
        uint256 hashrateThs;
        uint256 xflowTokens;
        uint256 priceUsd;
        string paymentCurrency;
        uint256 certificateNumber;
    }

    // ============ State Variables ============
    uint256 private _nextTokenId = 1;
    bool public soulboundEnabled = true;
    string public baseExternalUrl = "https://synterax.io/nft/";
    
    // Token ID => Purchase Metadata
    mapping(uint256 => PurchaseMetadata) public tokenMetadata;
    
    // Purchase ID => Token ID (prevents duplicate minting)
    mapping(string => uint256) public purchaseToToken;
    
    // Authorized minters (besides owner)
    mapping(address => bool) public authorizedMinters;

    // ============ Events ============
    event PurchaseNFTMinted(
        uint256 indexed tokenId,
        address indexed recipient,
        string purchaseId,
        uint256 certificateNumber
    );
    
    event SoulboundToggled(bool enabled);
    event MinterAuthorized(address indexed minter, bool authorized);
    event BaseUrlUpdated(string newUrl);

    // ============ Errors ============
    error AlreadyMinted(string purchaseId);
    error SoulboundTransferBlocked();
    error UnauthorizedMinter();
    error BatchMintFailed();
    error InvalidRecipient();

    // ============ Constructor ============
    constructor(address initialOwner)
        ERC721("SynteraX Mining Certificate", "SXMC")
        Ownable(initialOwner)
    {}

    // ============ Modifiers ============
    modifier onlyMinter() {
        if (msg.sender != owner() && !authorizedMinters[msg.sender]) {
            revert UnauthorizedMinter();
        }
        _;
    }

    // ============ Admin Functions ============

    /**
     * @notice Toggle soulbound mode (non-transferable NFTs)
     * @param enabled Whether soulbound is enabled
     */
    function setSoulbound(bool enabled) external onlyOwner {
        soulboundEnabled = enabled;
        emit SoulboundToggled(enabled);
    }

    /**
     * @notice Authorize/deauthorize a minter address
     * @param minter Address to authorize
     * @param authorized Whether to authorize or revoke
     */
    function setMinterAuthorization(address minter, bool authorized) external onlyOwner {
        authorizedMinters[minter] = authorized;
        emit MinterAuthorized(minter, authorized);
    }

    /**
     * @notice Update base external URL for metadata
     * @param newUrl New base URL
     */
    function setBaseExternalUrl(string calldata newUrl) external onlyOwner {
        baseExternalUrl = newUrl;
        emit BaseUrlUpdated(newUrl);
    }

    // ============ Minting Functions ============

    /**
     * @notice Mint a single NFT receipt for a package purchase
     * @param recipient Address to receive the NFT
     * @param data Mint data containing all purchase information
     * @return tokenId The ID of the minted token
     */
    function mint(address recipient, MintData calldata data) external onlyMinter returns (uint256) {
        if (recipient == address(0)) revert InvalidRecipient();
        if (purchaseToToken[data.purchaseId] != 0) revert AlreadyMinted(data.purchaseId);

        uint256 tokenId = _nextTokenId++;
        
        // Store metadata on-chain
        tokenMetadata[tokenId] = PurchaseMetadata({
            purchaseId: data.purchaseId,
            packageName: data.packageName,
            packageTier: data.packageTier,
            hashrateThs: data.hashrateThs,
            xflowTokens: data.xflowTokens,
            priceUsd: data.priceUsd,
            paymentCurrency: data.paymentCurrency,
            purchaseDate: block.timestamp,
            certificateNumber: data.certificateNumber
        });
        
        // Prevent duplicate mints
        purchaseToToken[data.purchaseId] = tokenId;
        
        _safeMint(recipient, tokenId);
        
        emit PurchaseNFTMinted(tokenId, recipient, data.purchaseId, data.certificateNumber);
        
        return tokenId;
    }

    /**
     * @notice Batch mint multiple NFTs (gas efficient)
     * @param mintDataArray Array of mint data
     * @return tokenIds Array of minted token IDs
     */
    function batchMint(MintData[] calldata mintDataArray) external onlyMinter returns (uint256[] memory) {
        uint256 length = mintDataArray.length;
        uint256[] memory tokenIds = new uint256[](length);
        
        for (uint256 i = 0; i < length; i++) {
            MintData calldata data = mintDataArray[i];
            
            if (data.recipient == address(0)) continue;
            if (purchaseToToken[data.purchaseId] != 0) continue;
            
            uint256 tokenId = _nextTokenId++;
            
            tokenMetadata[tokenId] = PurchaseMetadata({
                purchaseId: data.purchaseId,
                packageName: data.packageName,
                packageTier: data.packageTier,
                hashrateThs: data.hashrateThs,
                xflowTokens: data.xflowTokens,
                priceUsd: data.priceUsd,
                paymentCurrency: data.paymentCurrency,
                purchaseDate: block.timestamp,
                certificateNumber: data.certificateNumber
            });
            
            purchaseToToken[data.purchaseId] = tokenId;
            tokenIds[i] = tokenId;
            
            _safeMint(data.recipient, tokenId);
            
            emit PurchaseNFTMinted(tokenId, data.recipient, data.purchaseId, data.certificateNumber);
        }
        
        return tokenIds;
    }

    // ============ Metadata Functions ============

    /**
     * @notice Returns fully on-chain metadata as base64-encoded JSON
     * @param tokenId Token ID to get metadata for
     * @return Fully-formed tokenURI with base64-encoded JSON
     */
    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        _requireOwned(tokenId);
        
        PurchaseMetadata memory meta = tokenMetadata[tokenId];
        
        // Build attributes array
        string memory attributes = string(abi.encodePacked(
            '[',
            '{"trait_type":"Package Name","value":"', meta.packageName, '"},',
            '{"trait_type":"Package Tier","value":"', meta.packageTier, '"},',
            '{"trait_type":"Hashrate (TH/s)","value":', meta.hashrateThs.toString(), ',"display_type":"number"},',
            '{"trait_type":"XFLOW Tokens","value":', meta.xflowTokens.toString(), ',"display_type":"number"},',
            '{"trait_type":"Price (USD)","value":', (meta.priceUsd / 100).toString(), ',"display_type":"number"},',
            '{"trait_type":"Payment Currency","value":"', meta.paymentCurrency, '"},',
            '{"trait_type":"Certificate Number","value":', meta.certificateNumber.toString(), ',"display_type":"number"},',
            '{"trait_type":"Soulbound","value":"', soulboundEnabled ? 'Yes' : 'No', '"}',
            ']'
        ));
        
        // Build full JSON metadata
        string memory json = string(abi.encodePacked(
            '{"name":"SynteraX Mining Certificate #', meta.certificateNumber.toString(),
            '","description":"Official proof of ownership for ', meta.packageName,
            ' mining package on SynteraX platform. This NFT serves as an immutable receipt and certificate of your investment.',
            '","external_url":"', baseExternalUrl, meta.purchaseId,
            '","image":"', baseExternalUrl, 'certificate/', meta.purchaseId, '.png',
            '","attributes":', attributes,
            '}'
        ));
        
        return string(abi.encodePacked(
            "data:application/json;base64,",
            Base64.encode(bytes(json))
        ));
    }

    /**
     * @notice Get raw metadata for a token
     * @param tokenId Token ID
     * @return PurchaseMetadata struct
     */
    function getMetadata(uint256 tokenId) external view returns (PurchaseMetadata memory) {
        _requireOwned(tokenId);
        return tokenMetadata[tokenId];
    }

    /**
     * @notice Check if a purchase ID has already been minted
     * @param purchaseId The purchase ID to check
     * @return Whether the purchase has been minted
     */
    function isPurchaseMinted(string calldata purchaseId) external view returns (bool) {
        return purchaseToToken[purchaseId] != 0;
    }

    /**
     * @notice Get token ID for a purchase ID
     * @param purchaseId The purchase ID
     * @return Token ID (0 if not minted)
     */
    function getTokenByPurchase(string calldata purchaseId) external view returns (uint256) {
        return purchaseToToken[purchaseId];
    }

    // ============ Soulbound Override ============

    /**
     * @notice Override transfer functions for soulbound functionality
     */
    function _update(address to, uint256 tokenId, address auth)
        internal
        override(ERC721, ERC721Enumerable)
        returns (address)
    {
        address from = _ownerOf(tokenId);
        
        // Allow minting (from = address(0)) and burning (to = address(0))
        // Block transfers when soulbound is enabled
        if (soulboundEnabled && from != address(0) && to != address(0)) {
            revert SoulboundTransferBlocked();
        }
        
        return super._update(to, tokenId, auth);
    }

    function _increaseBalance(address account, uint128 value)
        internal
        override(ERC721, ERC721Enumerable)
    {
        super._increaseBalance(account, value);
    }

    // ============ Required Overrides ============

    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721, ERC721Enumerable)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}
