import { ethers } from 'hardhat'
import { TestERC20 } from '../../typechain/TestERC20'

export async function testERC20Fixture(
  tokenName: string,
  tokenSymbol: string,
  decimals: number
): Promise<TestERC20> {
  const testERC20 = await ethers.getContractFactory('TestERC20')
  return (await testERC20.deploy(tokenName, tokenSymbol, decimals)) as TestERC20
}
