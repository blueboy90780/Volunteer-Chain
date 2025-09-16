// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract SBT is ERC721, Ownable {
    error NonTransferable();
    error NotOrganizer();

    address public organizer;
    uint256 public nextId;
    mapping(uint256 => bytes32) public cidHashByToken;

    event Minted(address indexed to, uint256 indexed tokenId, bytes32 cidHash);

    constructor(address _organizer) ERC721("VolunteerChainSBT","VCSBT") {
        organizer = _organizer;
    }

    function setOrganizer(address _org) external onlyOwner {
        organizer = _org;
    }

    function mintSBT(address to, bytes32 cidHash) external {
        if (msg.sender != organizer) revert NotOrganizer();
        uint256 id = ++nextId;
        _safeMint(to, id);
        cidHashByToken[id] = cidHash;
        emit Minted(to, id, cidHash);
    }

    // Soulbound: chặn mọi chuyển nhượng	
    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 tokenId,
        uint256 batchSize
    ) internal override {
        if (from != address(0) && to != address(0)) {
            revert NonTransferable();
        }
        super._beforeTokenTransfer(from, to, tokenId, batchSize);
    }
}
