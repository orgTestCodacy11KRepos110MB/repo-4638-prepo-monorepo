// SPDX-License-Identifier: AGPL-3.0
pragma solidity =0.8.7;

import "./interfaces/IDepositTradeHelper.sol";
import "prepo-shared-contracts/contracts/SafeOwnable.sol";

contract DepositTradeHelper is IDepositTradeHelper, SafeOwnable {
  ICollateral private immutable _collateral;
  IERC20Permit private immutable _baseToken;
  ISwapRouter private immutable _swapRouter;
  uint256 public constant override POOL_FEE_TIER = 10000;

  constructor(ICollateral collateral, ISwapRouter swapRouter) {
    _collateral = collateral;
    _baseToken = IERC20Permit(address(collateral.getBaseToken()));
    _swapRouter = swapRouter;
    collateral.getBaseToken().approve(address(collateral), type(uint256).max);
    collateral.approve(address(swapRouter), type(uint256).max);
  }

  function depositAndTrade(
    uint256 baseTokenAmount,
    Permit calldata baseTokenPermit,
    Permit calldata collateralPermit,
    OffChainTradeParams calldata tradeParams
  ) external override {}

  function getCollateral() external view override returns (ICollateral) {
    return _collateral;
  }

  function getBaseToken() external view override returns (IERC20Permit) {
    return _baseToken;
  }

  function getSwapRouter() external view override returns (ISwapRouter) {
    return _swapRouter;
  }
}
