// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./Verifier.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract KYCRegistry is Ownable {
    Groth16Verifier public verifier;

    struct CredentialMeta {
        uint8 level;
        uint256 statusBits;
        uint256 updatedAt;
        address owner;
        bool exists;
    }

    // wallet → latest credential hash
    mapping(address => uint256) public latestCredentialOf;

    // credential hash → metadata
    mapping(uint256 => CredentialMeta) public metadataOfCredential;

    event KYCUpdated(address indexed user, uint256 indexed credentialHash, uint8 level);
    event KYCRegisteredByAdmin(address indexed user, uint256 indexed credentialHash, uint8 level, address indexed admin);
    event KYCForceRegistered(address indexed user, uint256 indexed credentialHash, uint8 level, address indexed admin);

    constructor(address _verifier) {
        verifier = Groth16Verifier(_verifier);
    }

    /**
     * publicSignals = [statusBits, level, credentialHash]
     * User-submitted proof flow — trustless
     */
    function submitKYCProof(
        uint256[2] calldata a,
        uint256[2][2] calldata b,
        uint256[2] calldata c,
        uint256[3] calldata publicSignals
    ) external 
    {
        uint256 statusBits = publicSignals[0];
        uint8 level = uint8(publicSignals[1]);
        uint256 credHash = publicSignals[2];

        require(level > 0, "Invalid level");
        require(credHash != 0, "Invalid credential hash");

        // 1. Verify ZK proof
        require(
            verifier.verifyProof(a, b, c, publicSignals),
            "Invalid proof"
        );

        // 2. If credential already exists, ensure same owner
        if (metadataOfCredential[credHash].exists) {
            require(
                metadataOfCredential[credHash].owner == msg.sender,
                "Credential belongs to another wallet"
            );
        }

        // 3. Update metadata
        metadataOfCredential[credHash] = CredentialMeta({
            level: level,
            statusBits: statusBits,
            updatedAt: block.timestamp,
            owner: msg.sender,
            exists: true
        });

        // 4. Update wallet → credential mapping
        latestCredentialOf[msg.sender] = credHash;

        emit KYCUpdated(msg.sender, credHash, level);
    }

    /**
     * Admin/issuer registration (no overwrite).
     * Use when admin wants to register a credentialHash for a user (e.g., manual verification).
     */
    function registerCredentialForUser(
        address user,
        uint256 credentialHash,
        uint8 level,
        uint256 statusBits
    ) external onlyOwner {
        require(user != address(0), "Invalid user");
        require(credentialHash != 0, "Invalid credential hash");
        require(level > 0, "Invalid level");

        // If credential already exists, disallow to avoid accidental overwrite
        require(!metadataOfCredential[credentialHash].exists, "Credential already exists");

        // write metadata and mapping
        metadataOfCredential[credentialHash] = CredentialMeta({
            level: level,
            statusBits: statusBits,
            updatedAt: block.timestamp,
            owner: user,
            exists: true
        });

        latestCredentialOf[user] = credentialHash;

        emit KYCRegisteredByAdmin(user, credentialHash, level, msg.sender);
        emit KYCUpdated(user, credentialHash, level);
    }

    /**
     * Admin forced registration / overwrite.
     * Use carefully (migration, corrections). Emits a distinct event.
     */
    function forceRegisterCredentialForUser(
        address user,
        uint256 credentialHash,
        uint8 level,
        uint256 statusBits
    ) external onlyOwner {
        require(user != address(0), "Invalid user");
        require(credentialHash != 0, "Invalid credential hash");
        require(level > 0, "Invalid level");

        // overwrite metadata and mapping
        metadataOfCredential[credentialHash] = CredentialMeta({
            level: level,
            statusBits: statusBits,
            updatedAt: block.timestamp,
            owner: user,
            exists: true
        });

        latestCredentialOf[user] = credentialHash;

        emit KYCForceRegistered(user, credentialHash, level, msg.sender);
        emit KYCUpdated(user, credentialHash, level);
    }

    /* ========== VIEWS ========== */

    function getCredentialOf(address user) external view returns (uint256) {
        return latestCredentialOf[user];
    }

    function getMetadata(uint256 credentialHash)
        external
        view
        returns (uint8 level, uint256 statusBits, uint256 updatedAt, address owner, bool exists)
    {
        CredentialMeta memory m = metadataOfCredential[credentialHash];
        return (m.level, m.statusBits, m.updatedAt, m.owner, m.exists);
    }

    /* ========== ADMIN ========== */

    function setVerifier(address newVerifier) external onlyOwner {
        verifier = Groth16Verifier(newVerifier);
    }
}
