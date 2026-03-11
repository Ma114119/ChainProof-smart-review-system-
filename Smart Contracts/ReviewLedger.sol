// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title ReviewLedger
 * @dev This contract stores immutable fingerprints (hashes) of reviews
 * to ensure their integrity and prevent tampering.
 */
contract ReviewLedger {

    // --- State Variables ---

    address public owner;
    mapping(uint256 => string) public reviewHashes;

    // --- Events ---

    event ReviewHashAdded(uint256 indexed reviewId, string reviewHash);

    // --- Modifiers ---

    modifier onlyOwner() {
        require(msg.sender == owner, "Only the owner can call this function.");
        _;
    }

    // --- Constructor ---

    constructor() {
        owner = msg.sender;
    }

    // --- Functions ---

    /**
     * @dev Stores a hash for a given review ID. Can only be called by the owner.
     * @param _reviewId The ID of the review from the main database.
     * @param _reviewHash The cryptographic hash (fingerprint) of the review content.
     */
    function addReviewHash(uint256 _reviewId, string memory _reviewHash) public onlyOwner {
        reviewHashes[_reviewId] = _reviewHash;
        emit ReviewHashAdded(_reviewId, _reviewHash);
    }

    /**
     * @dev Retrieves the stored hash for a given review ID.
     * @param _reviewId The ID of the review to look up.
     * @return The stored review hash as a string.
     */
    function getReviewHash(uint256 _reviewId) public view returns (string memory) {
        return reviewHashes[_reviewId];
    }
}