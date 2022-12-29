import { FakeContract, smock } from '@defi-wonderland/smock'
import { abi as UNIV3_FACTORY_ABI } from '@uniswap/v3-core/artifacts/contracts/UniswapV3Factory.sol/UniswapV3Factory.json'
import { abi as UNIV3_POOL_ABI } from '@uniswap/v3-core/artifacts/contracts/UniswapV3Pool.sol/UniswapV3Pool.json'
import { abi as SWAP_ROUTER_ABI } from '@uniswap/v3-periphery/artifacts/contracts/SwapRouter.sol/SwapRouter.json'
import { Contract } from 'ethers'
import { ethers } from 'hardhat'

export function fakeSwapRouterFixture(): Promise<FakeContract<Contract>> {
  return smock.fake(SWAP_ROUTER_ABI)
}

export function attachUniV3Factory(address: string): Promise<Contract> {
  return ethers.getContractAt(UNIV3_FACTORY_ABI, address)
}

export function attachUniV3Pool(address: string): Promise<Contract> {
  return ethers.getContractAt(UNIV3_POOL_ABI, address)
}
