// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Address.sol";

/// @title Advanced TokenFactory - ERC20 token creation with badges
contract TokenFactory is Ownable, ReentrancyGuard {
    using Address for address payable;

    uint256 public baseFee = 0.00005 ether; // Fee for creating a token
    address[] public allTokens;

    mapping(address => bool) public isTokenFromFactory;
    mapping(address => uint256) public userCreatedSupply; // total supply created by user
    mapping(address => uint256) public pendingWithdrawals; // withdrawal pattern

    event TokenCreated(address indexed creator, address indexed tokenAddress, string name, string symbol, uint256 supply, uint256 feePaid);
    event Withdrawn(address indexed user, uint256 amount);

    constructor() Ownable(msg.sender) {}

    /// @notice Create a new ERC20 token
    function createToken(string memory name, string memory symbol, uint256 supply)
        external
        payable
        nonReentrant
        returns (address)
    {
        require(bytes(name).length > 0, "Name required");
        require(bytes(symbol).length > 0, "Symbol required");
        require(supply > 0, "Supply must be > 0");
        require(msg.value >= baseFee, "Insufficient fee");
        require(userCreatedSupply[msg.sender] + supply >= userCreatedSupply[msg.sender], "Overflow"); // extra safety

        // Add fee to owner before emitting events (prevents front-running)
        pendingWithdrawals[owner()] += baseFee;

        // Mint the token
        CustomToken token = new CustomToken(name, symbol, supply, msg.sender);
        address tokenAddr = address(token);

        allTokens.push(tokenAddr);
        isTokenFromFactory[tokenAddr] = true;

        // Update user total supply created
        userCreatedSupply[msg.sender] += supply;

        emit TokenCreated(msg.sender, tokenAddr, name, symbol, supply, baseFee);

        // Refund excess ETH to sender
        uint256 excess = msg.value - baseFee;
        if (excess > 0) {
            pendingWithdrawals[msg.sender] += excess;
        }

        return tokenAddr;
    }

    /// @notice Withdraw your pending ETH
    function withdraw() external nonReentrant {
        uint256 amount = pendingWithdrawals[msg.sender];
        require(amount > 0, "No balance to withdraw");
        pendingWithdrawals[msg.sender] = 0;

        payable(msg.sender).sendValue(amount); // safe transfer
        emit Withdrawn(msg.sender, amount);
    }

    /// @notice Withdraw collected fees (owner only)
    function withdrawFees() external nonReentrant onlyOwner {
        uint256 amount = pendingWithdrawals[owner()];
        require(amount > 0, "No fees to withdraw");
        pendingWithdrawals[owner()] = 0;

        payable(owner()).sendValue(amount);
        emit Withdrawn(owner(), amount);
    }

    /// @notice Get total number of tokens created
    function totalTokensCreated() external view returns (uint256) {
        return allTokens.length;
    }

    /// @notice Get the badge for a user based on total supply created
    function getBadge(address user) public view returns (string memory) {
        uint256 total = userCreatedSupply[user];

        if (total >= 1_000_000) return "Super Minter";
        else if (total >= 100_000) return "Token Master";
        else if (total >= 10_000) return "Novice Creator";
        else return "New Creator";
    }
}

/// @title CustomToken - ERC20 token created by the factory
contract CustomToken is ERC20 {
    constructor(string memory name, string memory symbol, uint256 initialSupply, address creator)
        ERC20(name, symbol)
    {
        require(initialSupply < (type(uint256).max / (10 ** decimals())), "Supply too large");
        _mint(creator, initialSupply * 10 ** decimals());
    }
}
