// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title SmartReviewToken
 * @dev This is the official ERC-20 token for the SmartReview platform.
 * The owner (the admin/backend server) has the exclusive right to mint new tokens.
 */
contract SmartReviewToken is ERC20, Ownable {

    /**
     * @dev Sets the initial owner of the contract and mints the initial supply of tokens.
     */
    constructor(address initialOwner) ERC20("SmartReview Token", "SRT") Ownable(initialOwner) {
        // Mint an initial supply of 1,000,000 tokens to the contract deployer (the admin).
        // 18 decimals is standard, so we add 18 zeros.
        _mint(initialOwner, 1000000 * 10**18);
    }

    /**
     * @dev Creates new tokens and assigns them to an address. Can only be called by the owner.
     * This function can be used for things like the "new owner coin bonus".
     * @param to The address that will receive the minted tokens.
     * @param amount The amount of tokens to mint.
     */
    function mint(address to, uint256 amount) public onlyOwner {
        _mint(to, amount);
    }
}