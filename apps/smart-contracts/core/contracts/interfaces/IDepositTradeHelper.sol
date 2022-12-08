// SPDX-License-Identifier: AGPL-3.0
pragma solidity =0.8.7;

import "./ICollateral.sol";
import "./IPrePOMarket.sol";
import "@uniswap/v3-periphery/contracts/interfaces/ISwapRouter.sol";

interface IDepositTradeHelper {
  struct Permit {
    uint256 deadline;
    uint8 v;
    bytes32 r;
    bytes32 s;
  }

  struct OffChainTradeParams {
    address tokenOut;
    uint256 deadline;
    uint256 amountOutMinimum;
    uint160 sqrtPriceLimitX96;
  }

  /**
   * @dev `baseTokenAmount` will be taken from msg.sender (assumes that
   * msg.sender has already approved at least `baseTokenAmount` of the
   * Collateral's base token) and then deposited to mint Collateral. This
   * minted Collateral will be used entirely towards purchasing either Long or
   * Short tokens from the corresponding UniswapV3 pool.
   *
   * The UniswapV3 pool address does not need to be provided since the
   * SwapRouter will automatically identify the pool based on token inputs.
   * @param _baseTokenAmount Base Token to be used towards position
   * @param _baseTokenPermit Permit to let contract take user's base token
   * @param _collateralPermit Permit to let contract take user's collateral
   * @param _tradeParams Swap parameters determined off-chain
   */
  function depositAndTrade(
    uint256 _baseTokenAmount,
    Permit calldata _baseTokenPermit,
    Permit calldata _collateralPermit,
    OffChainTradeParams calldata _tradeParams
  ) external;

  function getBaseToken() external view returns (IERC20);

  function getCollateral() external view returns (ICollateral);

  function getSwapRouter() external view returns (ISwapRouter);

  function POOL_FEE_TIER() external view returns (uint24);
}
