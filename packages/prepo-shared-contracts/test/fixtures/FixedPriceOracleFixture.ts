import { ethers } from 'hardhat'
import { FixedPriceOracle } from '../../types/generated'

export async function fixedPriceOracleFixture(): Promise<FixedPriceOracle> {
  const Factory = await ethers.getContractFactory('FixedPriceOracle')
  return (await Factory.deploy()) as FixedPriceOracle
}
