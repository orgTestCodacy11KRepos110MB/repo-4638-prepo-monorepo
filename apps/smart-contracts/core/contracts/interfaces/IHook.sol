// SPDX-License-Identifier: UNLICENSED
pragma solidity =0.8.7;

import "./ICollateral.sol";

/// @notice Used for adding additional checks and/or data recording when
/// interacting with the Collateral vault.
interface IHook {
  /**
   * @dev Emitted via `setCollateral()`.
   * @param collateral The new collateral address
   */
  event CollateralChange(address collateral);

  /**
   * @dev This hook should only contain calls to external contracts, where
   * the actual implementation and state of a feature will reside.
   *
   * `amountBeforeFee` is the `baseToken` amount deposited/withdrawn by the
   * caller before fees are taken.
   *
   * `amountAfterFee` is the `baseToken` amount deposited/withdrawn by the
   * caller after fees are taken.
   *
   * Only callable by allowed collateral.
   * @param sender Caller depositing/withdrawing collateral
   * @param amountBeforeFee `baseToken` amount before fees
   * @param amountAfterFee `baseToken` amount after fees
   */
  function hook(
    address sender,
    uint256 amountBeforeFee,
    uint256 amountAfterFee
  ) external;

  /**
   * @notice Sets the collateral that will be allowed to call this hook.
   * @dev Only callable by owner().
   * @param newCollateral The new allowed collateral
   */
  function setCollateral(ICollateral newCollateral) external;

  /// @return The collateral that is allowed to call this hook.
  function getCollateral() external view returns (ICollateral);
}
