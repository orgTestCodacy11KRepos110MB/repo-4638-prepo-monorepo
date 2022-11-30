import { ethers } from 'hardhat'
import { MockContract, smock } from '@defi-wonderland/smock'
import { AllowedCallers } from '../../types/generated'

export async function allowedCallersFixture(): Promise<AllowedCallers> {
  const allowedCallersFactory = await ethers.getContractFactory('AllowedCallers')
  return (await allowedCallersFactory.deploy()) as AllowedCallers
}

export async function smockAllowedCallersFixture(): Promise<MockContract> {
  const smockAllowedCallers = await smock.mock('AllowedCallers')
  return (await smockAllowedCallers.deploy()) as MockContract
}
