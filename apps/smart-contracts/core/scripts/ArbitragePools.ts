import { BigNumber, Contract, ethers } from 'ethers'
import IERC20Artifact from './exportedArtifacts/IERC20.json'
import IPrePOMarketArtifact from './exportedArtifacts/IPrePOMarket.json'
import IUniswapV3FactoryArtifact from './exportedArtifacts/IUniswapV3Factory.json'
import IUniswapV3PoolArtifact from './exportedArtifacts/IUniswapV3Pool.json'

/**
 * TODO: Write an error handling wrapper that is able to differentiate between
 * failure due to an unresponsive relayer or RPC (e.g. Infura) versus failure
 * because of an invalid transaction/contract call.
 */

const UNIV3_FACTORY = '0x1F98431c8aD98523631AE4a59f267346ea31F984'
const POOL_FEE_TIER = 10000

// Taken from helpers/uniswap.ts
const getWeiFromSqrtX96 = (sqrtX96Price: BigNumber): BigNumber =>
  sqrtX96Price.pow(2).mul(ethers.utils.parseEther('1')).div(BigNumber.from(2).pow(192))

export type MarketTokens = {
  longToken: Contract
  shortToken: Contract
}

export type MarketPools = {
  longPool: Contract
  shortPool: Contract
}

export type PoolPrices = {
  longPoolPrice: BigNumber
  shortPoolPrice: BigNumber
}

export enum ArbitrageStrategy {
  'BUY_AND_REDEEM',
  'MINT_AND_SELL',
  'INSUFFICIENT_SPREAD',
}

export const getTokensFromMarket = async (
  provider: ethers.providers.BaseProvider,
  marketAddress: string
): Promise<MarketTokens> => {
  const market = new ethers.Contract(marketAddress, IPrePOMarketArtifact.abi, provider)
  const longTokenAddress = await market.getLongToken()
  const shortTokenAddress = await market.getShortToken()
  const longToken = new ethers.Contract(longTokenAddress, IERC20Artifact.abi, provider)
  const shortToken = new ethers.Contract(shortTokenAddress, IERC20Artifact.abi, provider)
  return { longToken, shortToken }
}

export const getPoolsFromTokens = async (
  provider: ethers.providers.BaseProvider,
  collateralAddress: string,
  longTokenAddress: string,
  shortTokenAddress: string
): Promise<MarketPools> => {
  const factory = new ethers.Contract(UNIV3_FACTORY, IUniswapV3FactoryArtifact.abi, provider)
  const longPoolAddress = await factory.getPool(longTokenAddress, collateralAddress, POOL_FEE_TIER)
  const shortPoolAddress = await factory.getPool(
    shortTokenAddress,
    collateralAddress,
    POOL_FEE_TIER
  )
  const longPool = new ethers.Contract(longPoolAddress, IUniswapV3PoolArtifact.abi, provider)
  const shortPool = new ethers.Contract(shortPoolAddress, IUniswapV3PoolArtifact.abi, provider)
  return { longPool, shortPool }
}

export const getWeiPricesFromPools = async (marketPools: MarketPools): Promise<PoolPrices> => {
  const longPoolSlot0 = await marketPools.longPool.slot0()
  const shortPoolSlot0 = await marketPools.shortPool.slot0()
  const longPoolPrice = getWeiFromSqrtX96(longPoolSlot0.sqrtPriceX96)
  const shortPoolPrice = getWeiFromSqrtX96(shortPoolSlot0.sqrtPriceX96)
  return { longPoolPrice, shortPoolPrice }
}

export const getStrategyToUse = (
  longPoolWeiPrice: BigNumber,
  shortPoolWeiPrice: BigNumber,
  minStartingSpread: BigNumber
): ArbitrageStrategy => {
  const combinedPriceInWei = longPoolWeiPrice.add(shortPoolWeiPrice)
  if (combinedPriceInWei.lt(ethers.utils.parseEther('1').sub(minStartingSpread))) {
    return ArbitrageStrategy.BUY_AND_REDEEM
  }
  if (combinedPriceInWei.gt(ethers.utils.parseEther('1').add(minStartingSpread))) {
    return ArbitrageStrategy.MINT_AND_SELL
  }
  /**
   * TODO when testing with real relayer, add OZ notification containing
   * the spread amount when spread is insufficient.
   */
  return ArbitrageStrategy.INSUFFICIENT_SPREAD
}
