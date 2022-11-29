import { ethers } from 'hardhat'
import { MockContract, smock } from '@defi-wonderland/smock'
import { TokenSender } from '../../typechain'

export async function tokenSenderFixture(): Promise<TokenSender> {
  const factory = await ethers.getContractFactory('TokenSender')
  return (await factory.deploy()) as unknown as TokenSender
}

export async function smockTokenSenderFixture(): Promise<MockContract> {
  const mockFactory = await smock.mock('TokenSender')
  return mockFactory.deploy()
}
