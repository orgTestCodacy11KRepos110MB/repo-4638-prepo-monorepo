import { ethers } from 'hardhat'
import { PregenesisPoints, PregenPass, MockPregenPass } from '../../types/generated'

export async function pregenesisPointsFixture(
  pregenPointsOwner: string,
  pregenPointsName: string,
  pregenPointsSymbol: string
): Promise<PregenesisPoints> {
  const Factory = await ethers.getContractFactory('PregenesisPoints')
  return (await Factory.deploy(
    pregenPointsOwner,
    pregenPointsName,
    pregenPointsSymbol
  )) as unknown as PregenesisPoints
}

export async function pregenPassFixture(
  pregenPassOwner: string,
  pregenPassURI: string
): Promise<PregenPass> {
  const Factory = await ethers.getContractFactory('PregenPass')
  return (await Factory.deploy(pregenPassOwner, pregenPassURI)) as unknown as PregenPass
}

export async function mockPregenPassFixture(
  mockPregenPassOwner: string,
  mockPregenPassURI: string
): Promise<MockPregenPass> {
  const Factory = await ethers.getContractFactory('MockPregenPass')
  return (await Factory.deploy(mockPregenPassOwner, mockPregenPassURI)) as unknown as MockPregenPass
}
