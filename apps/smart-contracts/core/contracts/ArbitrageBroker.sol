// SPDX-License-Identifier: AGPL-3.0
pragma solidity =0.8.7;

import "./interfaces/IArbitrageBroker.sol";
import "prepo-shared-contracts/contracts/SafeAccessControlEnumerable.sol";

contract ArbitrageBroker is IArbitrageBroker, SafeAccessControlEnumerable {
  ICollateral private immutable _collateral;
  ISwapRouter private immutable _swapRouter;
  mapping(address => bool) private _marketToValidity;

  uint24 public constant override POOL_FEE_TIER = 10000;
  bytes32 public immutable override BUY_AND_REDEEM_ROLE =
    keccak256("buyAndRedeem");
  bytes32 public immutable override MINT_AND_SELL_ROLE =
    keccak256("mintAndSell");
  bytes32 public immutable override SET_MARKET_VALIDITY_ROLE =
    keccak256("setMarketValidity");

  constructor(ICollateral collateral, ISwapRouter swapRouter) {
    _collateral = collateral;
    _swapRouter = swapRouter;
  }

  function buyAndRedeem(
    IPrePOMarket market,
    OffChainTradeParams calldata tradeParams
  ) external override onlyRole(BUY_AND_REDEEM_ROLE) returns (uint256) {}

  function mintAndSell(
    IPrePOMarket market,
    OffChainTradeParams calldata tradeParams
  ) external override onlyRole(MINT_AND_SELL_ROLE) returns (uint256) {
    if (!_marketToValidity[address(market)]) {
      revert InvalidMarket(address(market));
    }
    _collateral.approve(address(market), tradeParams.longShortAmount);
    market.mint(tradeParams.longShortAmount);
  }

  function setMarketValidity(address market, bool validity)
    external
    override
    onlyRole(SET_MARKET_VALIDITY_ROLE)
  {
    _marketToValidity[market] = validity;
    emit MarketValidityChange(market, validity);
  }

  function getCollateral() external view override returns (ICollateral) {
    return _collateral;
  }

  function getSwapRouter() external view override returns (ISwapRouter) {
    return _swapRouter;
  }

  function isMarketValid(address market)
    external
    view
    override
    returns (bool)
  {
    return _marketToValidity[market];
  }
}
