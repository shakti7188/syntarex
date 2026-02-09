// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/utils/cryptography/MerkleProof.sol";

/**
 * @title HybridPayoutVault
 * @notice Manages weekly commission payouts using Merkle proofs for verification
 * @dev All commission calculations (40% cap, binary, direct, override) are done off-chain
 *      Contract only verifies Merkle proofs and prevents double-claims
 */
contract HybridPayoutVault is Ownable, ReentrancyGuard, Pausable {
    using SafeERC20 for IERC20;

    // ============================================
    // STATE VARIABLES
    // ============================================

    /// @notice The ERC-20 token used for payouts (USDT, MUSD, etc.)
    IERC20 public payoutToken;

    /// @notice Mapping of week start timestamp => Merkle root
    mapping(uint256 => bytes32) public weekRoot;

    /// @notice Mapping of week start => user address => claimed status
    mapping(uint256 => mapping(address => bool)) public claimed;

    // ============================================
    // EVENTS
    // ============================================

    event PayoutTokenUpdated(address indexed oldToken, address indexed newToken);
    event WeekRootSet(uint256 indexed weekStart, bytes32 root);
    event Claimed(uint256 indexed weekStart, address indexed user, uint256 amount);
    event EmergencyWithdraw(address indexed token, uint256 amount, address indexed recipient);

    // ============================================
    // ERRORS
    // ============================================

    error InvalidToken();
    error InvalidMerkleRoot();
    error InvalidProof();
    error AlreadyClaimed();
    error NoAllocation();
    error InsufficientBalance();
    error TransferFailed();

    // ============================================
    // CONSTRUCTOR
    // ============================================

    constructor(address _payoutToken) {
        if (_payoutToken == address(0)) revert InvalidToken();
        payoutToken = IERC20(_payoutToken);
    }

    // ============================================
    // ADMIN FUNCTIONS
    // ============================================

    /**
     * @notice Set the payout token (USDT, MUSD, etc.)
     * @param _payoutToken Address of the ERC-20 token
     */
    function setPayoutToken(address _payoutToken) external onlyOwner {
        if (_payoutToken == address(0)) revert InvalidToken();
        
        address oldToken = address(payoutToken);
        payoutToken = IERC20(_payoutToken);
        
        emit PayoutTokenUpdated(oldToken, _payoutToken);
    }

    /**
     * @notice Set the Merkle root for a specific week
     * @dev This should be called after off-chain commission calculation
     * @param weekStart The week start timestamp (Unix timestamp)
     * @param root The Merkle root of all user claims for this week
     */
    function setWeekRoot(uint256 weekStart, bytes32 root) external onlyOwner {
        if (root == bytes32(0)) revert InvalidMerkleRoot();
        
        weekRoot[weekStart] = root;
        
        emit WeekRootSet(weekStart, root);
    }

    /**
     * @notice Pause all claims (emergency use only)
     */
    function pause() external onlyOwner {
        _pause();
    }

    /**
     * @notice Unpause claims
     */
    function unpause() external onlyOwner {
        _unpause();
    }

    /**
     * @notice Emergency withdraw tokens from contract
     * @param token Address of token to withdraw (use address(0) for ETH)
     * @param amount Amount to withdraw
     * @param recipient Address to send tokens to
     */
    function emergencyWithdraw(
        address token,
        uint256 amount,
        address recipient
    ) external onlyOwner {
        if (recipient == address(0)) revert InvalidToken();
        
        if (token == address(0)) {
            // Withdraw ETH
            (bool success, ) = recipient.call{value: amount}("");
            if (!success) revert TransferFailed();
        } else {
            // Withdraw ERC-20
            IERC20(token).safeTransfer(recipient, amount);
        }
        
        emit EmergencyWithdraw(token, amount, recipient);
    }

    // ============================================
    // USER FUNCTIONS
    // ============================================

    /**
     * @notice Claim weekly commission payout using Merkle proof
     * @param weekStart The week start timestamp
     * @param amount The amount to claim (as determined off-chain)
     * @param proof Array of Merkle proof hashes
     */
    function claim(
        uint256 weekStart,
        uint256 amount,
        bytes32[] calldata proof
    ) external nonReentrant whenNotPaused {
        // Verify address is msg.sender (implicit)
        // Check if already claimed
        require(!claimed[weekStart][msg.sender], "Already claimed");
        
        // Check if amount is non-zero
        if (amount == 0) revert NoAllocation();
        
        // Rebuild leaf: keccak256(abi.encode(msg.sender, weekStart, amount))
        bytes32 leaf = keccak256(abi.encode(msg.sender, weekStart, amount));
        
        // Verify Merkle proof against weekRoot[weekStart]
        bytes32 root = weekRoot[weekStart];
        if (root == bytes32(0)) revert InvalidMerkleRoot();
        if (!MerkleProof.verify(proof, root, leaf)) revert InvalidProof();
        
        // Check contract has sufficient balance
        uint256 balance = payoutToken.balanceOf(address(this));
        if (balance < amount) revert InsufficientBalance();
        
        // Transfer amount of payout token to msg.sender
        payoutToken.safeTransfer(msg.sender, amount);
        
        // Mark as claimed
        claimed[weekStart][msg.sender] = true;
        
        emit Claimed(weekStart, msg.sender, amount);
    }

    /**
     * @notice Batch claim multiple weeks at once
     * @param weekStarts Array of week start timestamps
     * @param amounts Array of amounts to claim
     * @param proofs Array of Merkle proofs (one per week)
     */
    function claimMultiple(
        uint256[] calldata weekStarts,
        uint256[] calldata amounts,
        bytes32[][] calldata proofs
    ) external nonReentrant whenNotPaused {
        require(
            weekStarts.length == amounts.length && amounts.length == proofs.length,
            "Array length mismatch"
        );
        
        uint256 totalAmount = 0;
        
        for (uint256 i = 0; i < weekStarts.length; i++) {
            uint256 weekStart = weekStarts[i];
            uint256 amount = amounts[i];
            bytes32[] calldata proof = proofs[i];
            
            // Check if already claimed
            require(!claimed[weekStart][msg.sender], "Already claimed");
            
            // Check if amount is non-zero
            if (amount == 0) revert NoAllocation();
            
            // Rebuild leaf and verify proof
            bytes32 leaf = keccak256(abi.encode(msg.sender, weekStart, amount));
            bytes32 root = weekRoot[weekStart];
            if (root == bytes32(0)) revert InvalidMerkleRoot();
            if (!MerkleProof.verify(proof, root, leaf)) revert InvalidProof();
            
            // Mark as claimed
            claimed[weekStart][msg.sender] = true;
            
            totalAmount += amount;
            
            emit Claimed(weekStart, msg.sender, amount);
        }
        
        // Check contract has sufficient balance
        uint256 balance = payoutToken.balanceOf(address(this));
        if (balance < totalAmount) revert InsufficientBalance();
        
        // Transfer total tokens
        payoutToken.safeTransfer(msg.sender, totalAmount);
    }

    // ============================================
    // VIEW FUNCTIONS
    // ============================================

    /**
     * @notice Get contract's current token balance
     */
    function getContractBalance() external view returns (uint256) {
        return payoutToken.balanceOf(address(this));
    }

    // ============================================
    // RECEIVE FUNCTION
    // ============================================

    /// @notice Allow contract to receive ETH (for emergency use)
    receive() external payable {}
}
