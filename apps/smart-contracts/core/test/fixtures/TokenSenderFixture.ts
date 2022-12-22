import { ethers } from 'hardhat'
import { MockContract, FakeContract, smock } from '@defi-wonderland/smock'
import { TokenSender, TokenSender__factory } from '../../types/generated'

export async function tokenSenderFixture(outputToken): Promise<TokenSender> {
  const factory = await ethers.getContractFactory('TokenSender')
  return (await factory.deploy(outputToken)) as unknown as TokenSender
}

export async function smockTokenSenderFixture(outputToken): Promise<MockContract<TokenSender>> {
  const mockFactory = await smock.mock<TokenSender__factory>('TokenSender')
  return mockFactory.deploy(outputToken)
}

export async function fakeTokenSenderFixture(): Promise<FakeContract<TokenSender>> {
  const fakeContract = await smock.fake<TokenSender>('TokenSender')
  return fakeContract
}
