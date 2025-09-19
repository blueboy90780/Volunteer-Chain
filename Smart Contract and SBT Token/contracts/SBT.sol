// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title Volunteer SBT
 * @notice Non-transferable ERC-721 (Soulbound) with:
 *  - Organizer whitelist
 *  - Anti-replay (usedNonces)
 *  - Per-event attendance tracking (eventId => student => claimed)
 *  - Optional business rule: maxHoursPerEvent
 *  - IPFS metadata per token
 */
contract SBT is ERC721, Ownable {
    // ========== State ==========
    uint256 public nextId = 1;

    // Organizer whitelist
    mapping(address => bool) public organizers;

    // Anti-replay for off-chain vouchers
    mapping(bytes32 => bool) public usedNonces;

    // Prevent duplicate claims per event per student
    mapping(bytes32 => mapping(address => bool)) public eventClaimed;

    // Optional business rule: 0 = no limit
    mapping(bytes32 => uint256) public maxHoursPerEvent;

    // Persist metadata (full IPFS URI string or CID; up to you)
    mapping(uint256 => string) private _tokenURIs;

    // ========== Events ==========
    event OrganizerAdded(address indexed org);
    event OrganizerRemoved(address indexed org);
    event EventMaxHoursSet(bytes32 indexed eventId, uint256 maxHours);
    event Minted(
        uint256 indexed tokenId,
        address indexed student,
        bytes32 indexed eventId,
        uint256 contributedHours,
        string uri,
        address organizer
    );

    // ========== Modifiers ==========
    /// @dev Allow either contract owner or an already-whitelisted organizer
    modifier onlyOrganizerOrOwner() {
        require(
            organizers[_msgSender()] || _msgSender() == owner(),
            "Not organizer"
        );
        _;
    }

    // ========== Constructor ==========
    constructor() ERC721("Volunteer SBT", "vSBT") {
        // Bootstrap: deployer becomes the first organizer
        organizers[_msgSender()] = true;
        emit OrganizerAdded(_msgSender());
    }

    // ========== Organizer Management ==========
    function addOrganizer(address org) external onlyOrganizerOrOwner {
        require(org != address(0), "zero addr");
        require(!organizers[org], "already organizer");
        organizers[org] = true;
        emit OrganizerAdded(org);
    }

    function removeOrganizer(address org) external onlyOwner {
        require(organizers[org], "not organizer");
        organizers[org] = false;
        emit OrganizerRemoved(org);
    }

    function isOrganizer(address org) public view returns (bool) {
        return organizers[org];
    }

    // ========== Business Rules ==========
    function setMaxHoursForEvent(bytes32 eventId, uint256 maxHours) external onlyOwner {
        maxHoursPerEvent[eventId] = maxHours; // 0 = no limit
        emit EventMaxHoursSet(eventId, maxHours);
    }

    // ========== Mint (Soulbound issuance) ==========
    /**
     * @notice Mint a non-transferable SBT to `student`.
     * @dev Verification of EIP-712 signature is done off-chain; on-chain checks:
     *  - organizer is whitelisted
     *  - nonce not used (anti-replay)
     *  - student has not claimed this eventId
     *  - contributedHours <= maxHoursPerEvent[eventId] (if max set)
     */
    function mintSBT(
        address student,
        string memory uri,
        bytes32 nonce32,
        bytes32 eventId,
        uint256 contributedHours,
        address organizer
    ) external onlyOrganizerOrOwner {
        require(organizers[organizer], "Organizer not whitelisted");
        require(!usedNonces[nonce32], "Nonce already used");
        require(!eventClaimed[eventId][student], "Already claimed for event");

        uint256 maxH = maxHoursPerEvent[eventId];
        if (maxH > 0) {
            require(contributedHours <= maxH, "Exceeds max allowed hours");
        }

        // effects
        usedNonces[nonce32] = true;
        eventClaimed[eventId][student] = true;

        // mint
        uint256 tokenId = nextId++;
        _safeMint(student, tokenId);
        _tokenURIs[tokenId] = uri;

        emit Minted(tokenId, student, eventId, contributedHours, uri, organizer);
    }

    // ========== Soulbound (non-transferable) ==========
    /// @dev Block all transfers; minting (_safeMint) still works.
    function _transfer(address from, address to, uint256 tokenId) internal virtual override {
        revert("Non-transferable SBT");
    }

    // ========== Token URI ==========
    function tokenURI(uint256 tokenId) public view virtual override returns (string memory) {
        require(_exists(tokenId), "ERC721: URI query for nonexistent token");
        return _tokenURIs[tokenId];
    }
}
