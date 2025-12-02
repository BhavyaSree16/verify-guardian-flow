// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Base64.sol";

/**
 * @title KYCBadge1155Soulbound
 * @dev ERC1155 Soulbound KYC Badges with pricing, metadata, burn, and supply control.
 */
contract KYCBadge1155Soulbound is ERC1155, Ownable {

    // Struct for metadata JSON components
    struct Metadata {
        string name;
        string description;
        string image;
        string level;
        string tier;
    }

    // tokenId => metadata
    mapping(uint256 => Metadata) public metadataOf;

    // tokenId => price in wei
    mapping(uint256 => uint256) public prices;

    // tokenId => max supply
    mapping(uint256 => uint256) public maxSupply;

    // total minted per tokenId
    mapping(uint256 => uint256) public totalMinted;

    // track if a user already claimed a particular badge
    mapping(address => mapping(uint256 => bool)) public hasClaimed;

    // global max supply across all NFTs
    uint256 public maxTotalSupply;
    uint256 public totalMintedGlobal;

    // Next tokenId (auto-increment badge ID)
    uint256 public nextTokenId = 1;

    event BadgeClaimed(address indexed user, uint256 indexed tokenId, uint256 pricePaid);
    event BadgeBurned(address indexed user, uint256 indexed tokenId);
    event ConfigUpdated(uint256 indexed tokenId, uint256 price, uint256 maxSupply);

    constructor()
        ERC1155("")
    {}

    // ------------------------
    // OWNER FUNCTIONS
    // ------------------------

    function setGlobalMaxSupply(uint256 _maxTotal) external onlyOwner {
        maxTotalSupply = _maxTotal;
    }

    /**
     * @dev Owner creates a new badge with metadata.
     */
    function createBadge(
        string memory name,
        string memory description,
        string memory image,
        string memory level,
        string memory tier,
        uint256 priceWei,
        uint256 _maxSupply
    ) external onlyOwner {
        uint256 tokenId = nextTokenId;

        metadataOf[tokenId] = Metadata(
            name,
            description,
            image,
            level,
            tier
        );

        prices[tokenId] = priceWei;
        maxSupply[tokenId] = _maxSupply;

        nextTokenId++;

        emit ConfigUpdated(tokenId, priceWei, _maxSupply);
    }

    /**
     * @dev Withdraw ETH
     */
    function withdraw(address payable to) external onlyOwner {
        require(to != address(0), "Zero address");
        uint256 bal = address(this).balance;
        require(bal > 0, "No balance");
        to.transfer(bal);
    }

    // ------------------------
    // CLAIM
    // ------------------------

    function claim(uint256 tokenId) external payable {
        uint256 price = prices[tokenId];
        require(price > 0, "Token not claimable");
        require(msg.value == price, "Incorrect ETH sent");

        require(!hasClaimed[msg.sender][tokenId], "Already claimed");

        // enforce token max supply
        if (maxSupply[tokenId] != 0) {
            require(totalMinted[tokenId] + 1 <= maxSupply[tokenId], "Max supply reached");
        }

        // enforce global max supply
        if (maxTotalSupply != 0) {
            require(totalMintedGlobal + 1 <= maxTotalSupply, "Global max supply reached");
        }

        hasClaimed[msg.sender][tokenId] = true;

        totalMinted[tokenId] += 1;
        totalMintedGlobal += 1;

        _mint(msg.sender, tokenId, 1, "");

        emit BadgeClaimed(msg.sender, tokenId, price);
    }

    // ------------------------
    // BURN
    // ------------------------

    function burn(uint256 tokenId) external {
        require(hasClaimed[msg.sender][tokenId], "You don't own this badge");

        hasClaimed[msg.sender][tokenId] = false;
        totalMinted[tokenId] -= 1;
        totalMintedGlobal -= 1;

        _burn(msg.sender, tokenId, 1);

        emit BadgeBurned(msg.sender, tokenId);
    }

    // ------------------------
    // SOULBOUND OVERRIDES
    // ------------------------

    function safeTransferFrom(
        address,
        address,
        uint256,
        uint256,
        bytes memory
    ) public virtual override {
        revert("Soulbound: non-transferable");
    }

    function safeBatchTransferFrom(
        address,
        address,
        uint256[] memory,
        uint256[] memory,
        bytes memory
    ) public virtual override {
        revert("Soulbound: non-transferable");
    }

    function setApprovalForAll(address, bool) public virtual override {
        revert("Soulbound: approvals disabled");
    }

    // ------------------------
    // METADATA - On-chain JSON
    // ------------------------

    function uri(uint256 tokenId) public view override returns (string memory) {
        Metadata memory m = metadataOf[tokenId];

        require(bytes(m.name).length != 0, "Token does not exist");

        string memory json = string(
            abi.encodePacked(
                '{',
                    '"name":"', m.name, '",',
                    '"description":"', m.description, '",',
                    '"image":"', m.image, '",',
                    '"attributes":[',
                        '{"trait_type":"Badge Level","value":"', m.level, '"},',
                        '{"trait_type":"Tier","value":"', m.tier, '"}',
                    ']',
                '}'
            )
        );

        string memory encoded = Base64.encode(bytes(json));

        return string(abi.encodePacked(
            "data:application/json;base64,", encoded
        ));
    }

    // ------------------------
    // VERIFICATION
    // ------------------------

    function verifyClaim(address user, uint256 tokenId) external view returns (bool) {
        return hasClaimed[user][tokenId];
    }
}
