import { ethers } from 'hardhat'
import { MockERC20 } from '../../typechain/MockERC20'

export async function mockERC20Fixture(tokenName: string, tokenSymbol: string): Promise<MockERC20> {
  const mockERC20 = await ethers.getContractFactory('MockERC20')
  return (await mockERC20.deploy(tokenName, tokenSymbol)) as unknown as MockERC20
}
