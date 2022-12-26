import { ethers } from 'hardhat'
import { ArbitrageBroker } from '../../types/generated'

export async function arbitrageBrokerFixture(
  collateral: string,
  swapRouter: string
): Promise<ArbitrageBroker> {
  const factory = await ethers.getContractFactory('ArbitrageBroker')
  return (await factory.deploy(collateral, swapRouter)) as ArbitrageBroker
}
