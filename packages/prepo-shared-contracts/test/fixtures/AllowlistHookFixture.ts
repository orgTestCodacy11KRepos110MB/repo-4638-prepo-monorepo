import { ethers } from 'hardhat'
import { MockContract, smock } from '@defi-wonderland/smock'
import { AllowlistHook } from '../../types/generated'

export async function allowlistHookFixture(): Promise<AllowlistHook> {
  const factory = await ethers.getContractFactory('AllowlistHook')
  return (await factory.deploy()) as AllowlistHook
}
