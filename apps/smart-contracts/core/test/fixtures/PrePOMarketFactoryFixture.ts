import { ethers, upgrades } from 'hardhat'
import { PrePOMarketFactory } from '../../types/generated'

export async function prePOMarketFactoryFixture(): Promise<PrePOMarketFactory> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const prePOMarketFactory: any = await ethers.getContractFactory('PrePOMarketFactory')
  return (await upgrades.deployProxy(prePOMarketFactory, [])) as PrePOMarketFactory
}
