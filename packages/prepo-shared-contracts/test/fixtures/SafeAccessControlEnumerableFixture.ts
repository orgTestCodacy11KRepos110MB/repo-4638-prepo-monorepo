import { ethers } from 'hardhat'
import { SafeAccessControlEnumerable } from '../../types/generated'

export async function safeAccessControlEnumerableFixture(): Promise<SafeAccessControlEnumerable> {
  const Factory = await ethers.getContractFactory('SafeAccessControlEnumerable')
  return (await Factory.deploy()) as SafeAccessControlEnumerable
}
