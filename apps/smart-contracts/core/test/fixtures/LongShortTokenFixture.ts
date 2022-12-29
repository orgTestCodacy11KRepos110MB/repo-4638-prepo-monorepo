import { ethers } from 'hardhat'
import { FakeContract, MockContract, smock } from '@defi-wonderland/smock'
import { LongShortToken, LongShortToken__factory } from '../../types/generated'

export async function LongShortTokenFixture(
  tokenName: string,
  tokenSymbol: string
): Promise<LongShortToken> {
  const factory = await ethers.getContractFactory('LongShortToken')
  return (await factory.deploy(tokenName, tokenSymbol)) as LongShortToken
}

export async function LongShortTokenAttachFixture(tokenAddress: string): Promise<LongShortToken> {
  const factory = await ethers.getContractFactory('LongShortToken')
  return factory.attach(tokenAddress) as LongShortToken
}

export async function smockLongShortTokenFixture(
  tokenName: string,
  tokenSymbol: string
): Promise<MockContract<LongShortToken>> {
  const mockFactory = await smock.mock<LongShortToken__factory>('LongShortToken')
  return mockFactory.deploy(tokenName, tokenSymbol)
}

export function fakeLongShortTokenFixture(): Promise<FakeContract<LongShortToken>> {
  return smock.fake<LongShortToken>('LongShortToken')
}
