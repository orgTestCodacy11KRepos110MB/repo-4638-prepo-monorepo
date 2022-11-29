// SPDX-License-Identifier: AGPL-3.0
pragma solidity =0.8.7;

import "./IAccountList.sol";
import "prepo-shared-contracts/contracts/interfaces/IUintValue.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/**
 * @title ITokenSender
 * @dev A generic TokenSender contract that receives an amount of a pre-conversion asset,
 * and sends a converted amount of post-conversion asset to a recipient.
 */
interface ITokenSender {
  /**
   * @dev Emitted when the price is changed.
   */
  event PriceChange(IUintValue price);

  /**
   * @dev Emitted when the prive multiplier is changed.
   */
  event PriceMultiplierChange(uint256 priceMultiplier);

  /**
   * @dev Emitted when the scaled price lower bound is changed.
   */
  event ScaledPriceLowerBoundChange(uint256 scaledPriceLowerBound);

  /**
   * @notice Sends tokens an account.
   *
   * @param _recipient is the reciever address
   * @param _unconvertedAmount is the pre-conversion amount to send, e.g. the baseToken or Collateral fee extracted from deposit/withdraw/redeem()
   */
  function send(address _recipient, uint256 _unconvertedAmount) external;

  /**
   * @notice Sets te price of the token.
   *
   * @param _price is the new price
   */
  function setPrice(IUintValue _price) external;

  /**
   * @notice Sets the price multiplier.
   * @dev This is a multiplier applied to the price to get the scaled price
   *
   * @param _priceMultiplier is the new price multiplier
   */
  function setPriceMultiplier(uint256 _priceMultiplier) external;

  /**
   * @notice Sets the scaled price lower bound.
   * @dev Non-inclusive lower bound of the scaled price (after applying the price multiplier) that the price cannot reach
   * Protects against incorrect prices (e.g. a bad oracle or a typo) being used (which could drain this contract’s token balance)
   *
   * @param _scaledPriceLowerBound is the new scaled price lower bound
   */
  function setScaledPriceLowerBound(uint256 _scaledPriceLowerBound) external;

  /**
   * @notice Returns the output token
   */
  function getOutputToken() external view returns (IERC20);

  /**
   * @notice Returns the price
   * @dev This price should be denominated in the pre-conversion asset.
   * Following the same convention as MiniSales, e.g. if PPO was 2 USDC , MiniSales would report 2000000 (2 USDC).
   */
  function getPrice() external view returns (IUintValue);

  /**
   * @notice Returns the price multiplier
   */
  function getPriceMultiplier() external view returns (uint256);

  /**
   * @notice Returns the scaled price lower bound
   */
  function getScaledPriceLowerBound() external view returns (uint256);
}
