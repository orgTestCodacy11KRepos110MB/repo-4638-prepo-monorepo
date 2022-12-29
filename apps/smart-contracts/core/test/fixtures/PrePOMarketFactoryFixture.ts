import { ethers, upgrades } from 'hardhat'
import { PrePOMarketFactory } from '../../types/generated'

export async function prePOMarketFactoryFixture(): Promise<PrePOMarketFactory> {
  const factory = await ethers.getContractFactory('PrePOMarketFactory')
  return (await upgrades.deployProxy(factory, [])) as PrePOMarketFactory
}
