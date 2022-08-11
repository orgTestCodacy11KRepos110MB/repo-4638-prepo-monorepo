// SPDX-License-Identifier: AGPL-3.0-or-later
pragma solidity =0.8.7;

import "./IPurchaseHook.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/IERC20Metadata.sol";

/**
 * @notice Accepts a payment token in a one-way immediate exchange for a sale
 * token at a fixed price.
 * @dev Sales are unpermissioned by default, but can be made permissioned by
 * setting a purchase hook with participation restriction logic.
 *
 * Sale tokens sent to the contract are automatically allocated to the sale
 * and attributed to the contract owner. Sale tokens and payment tokens can
 * both be withdrawn from the sale by the owner at any time. Sales can be
 * implicitly paused/ended by the owner by withdrawing the sale token balance
 * in full.
 *
 * This contract can be reused for multiple sequential sales.
 */
interface IMiniSales {
  /**
   * @dev Emitted via `purchase()`.
   * @param purchaser Address that payment token was taken from
   * @param recipient Address that sale token was delivered to
   * @param amount Amount of sale token purchased
   * @param price Sale token price in terms of payment token
   */
  event Purchase(
    address indexed purchaser,
    address indexed recipient,
    uint256 amount,
    uint256 price
  );

  /**
   * @dev Emitted via `setPrice()`.
   * @param newPrice New sale token price in terms of payment token
   */
  event PriceChange(uint256 newPrice);

  /**
   * @dev Emitted via `setPurchaseHook()`.
   * @param newPurchaseHook Address of the new purchase hook
   */
  event PurchaseHookChange(IPurchaseHook newPurchaseHook);

  /**
   * @notice Purchases sale token in exchange for payment token at a fixed
   * price.
   * @dev msg.sender must have approved this contract to spend at least the
   * required amount of their payment token balance.
   *
   * `price` must match contract's current price.
   *
   * If a purchase hook is set, the hook will be called within this function.
   * @param recipient Address that sale token will be delivered to
   * @param amount Amount of sale token to be purchased
   * @param price Sale token price in terms of payment token
   */
  function purchase(
    address recipient,
    uint256 amount,
    uint256 price
  ) external;

  /**
   * @notice Sets the fixed price of sale token in terms of payment token.
   * @dev Price must be set in terms of how much payment token (using the
   * payment token's decimal precision) would buy 1 sale token. E.g. a
   * price of 1.234 USDC would be set as 1.234e6 since USDC has 6 decimals.
   *
   * Only callable by `owner()`.
   * @param newPrice New fixed price of sale token
   */
  function setPrice(uint256 newPrice) external;

  /**
   * @notice Sets the `IPurchaseHook` contract to be called during a purchase.
   * @dev Can be set to zero address to make the sale unpermissioned.
   *
   * Only callable by `owner()`.
   * @param newPurchaseHook Address of the new purchase hook
   */
  function setPurchaseHook(IPurchaseHook newPurchaseHook) external;

  /// @return The ERC20 token being sold
  function getSaleToken() external view returns (IERC20Metadata);

  /// @return The ERC20 token used for payment
  function getPaymentToken() external view returns (IERC20Metadata);

  /// @return The fixed price of sale token in terms of payment token
  function getPrice() external view returns (uint256);

  /// @return The purchase hook contract
  function getPurchaseHook() external view returns (IPurchaseHook);
}
