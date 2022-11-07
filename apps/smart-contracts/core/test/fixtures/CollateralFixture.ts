import { ethers, upgrades } from 'hardhat'
import { MockContract, smock } from '@defi-wonderland/smock'
import { Collateral } from '../../typechain'

export async function collateralFixture(
  name: string,
  symbol: string,
  baseToken: string
): Promise<Collateral> {
  const Factory = await ethers.getContractFactory('Collateral')
  return (await upgrades.deployProxy(Factory, [name, symbol, baseToken])) as Collateral
}

export async function smockCollateralFixture(
  name: string,
  symbol: string,
  baseToken: string
): Promise<MockContract> {
  const smockCollateral = await smock.mock('Collateral')
  return (await smockCollateral.deploy(name, symbol, baseToken)) as MockContract
}
