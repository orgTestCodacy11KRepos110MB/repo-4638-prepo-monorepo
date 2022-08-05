import { ethers, upgrades } from 'hardhat'
import { MiniSales } from '../../types/generated'

export async function miniSalesFixture(
  saleTokenAddress: string,
  paymentTokenAddress: string,
  nominatedOwnerAddress: string
): Promise<MiniSales> {
  const Factory = await ethers.getContractFactory('MiniSales')
  return (await upgrades.deployProxy(Factory, [nominatedOwnerAddress], {
    unsafeAllow: ['state-variable-immutable', 'constructor'],
    constructorArgs: [saleTokenAddress, paymentTokenAddress],
  })) as MiniSales
}
