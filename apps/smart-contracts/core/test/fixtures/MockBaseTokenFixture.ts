import { ethers } from 'hardhat'
import { MockBaseToken } from '../../typechain/MockBaseToken'

export async function mockBaseTokenFixture(name: string, symbol: string): Promise<MockBaseToken> {
  const mockBaseToken = await ethers.getContractFactory('MockBaseToken')
  return (await mockBaseToken.deploy(name, symbol)) as unknown as MockBaseToken
}
