import { ethers } from 'hardhat'
import { ERC20 } from '../../types/generated'

export async function ERC20AttachFixture(tokenAddress: string): Promise<ERC20> {
  const factory = await ethers.getContractFactory('ERC20')
  return (await factory.attach(tokenAddress)) as ERC20
}
