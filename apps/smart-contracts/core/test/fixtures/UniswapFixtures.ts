import { ethers } from 'hardhat'
import { FakeContract, smock } from '@defi-wonderland/smock'
import { abi as UNIV3_FACTORY_ABI } from '@uniswap/v3-core/artifacts/contracts/UniswapV3Factory.sol/UniswapV3Factory.json'
import { abi as UNIV3_POOL_ABI } from '@uniswap/v3-core/artifacts/contracts/UniswapV3Pool.sol/UniswapV3Pool.json'
import { abi as SWAP_ROUTER_ABI } from '@uniswap/v3-periphery/artifacts/contracts/SwapRouter.sol/SwapRouter.json'
import { abi as POSITION_MANAGER_ABI } from '@uniswap/v3-periphery/artifacts/contracts/NonfungiblePositionManager.sol/NonfungiblePositionManager.json'
import {
  NonfungiblePositionManager,
  SwapRouter,
  UniswapV3Factory,
  UniswapV3Pool,
} from '../../types/generated'

export function fakeSwapRouterFixture(): Promise<FakeContract<SwapRouter>> {
  return smock.fake<SwapRouter>(SWAP_ROUTER_ABI)
}

export function attachUniV3Factory(address: string): Promise<UniswapV3Factory> {
  return ethers.getContractAt(UNIV3_FACTORY_ABI, address)
}

export function attachUniV3Pool(address: string): Promise<UniswapV3Pool> {
  return ethers.getContractAt(UNIV3_POOL_ABI, address)
}

export function attachNonfungiblePositionManager(
  address: string
): Promise<NonfungiblePositionManager> {
  return ethers.getContractAt(POSITION_MANAGER_ABI, address)
}

export function attachSwapRouter(address: string): Promise<SwapRouter> {
  return ethers.getContractAt(SWAP_ROUTER_ABI, address)
}
