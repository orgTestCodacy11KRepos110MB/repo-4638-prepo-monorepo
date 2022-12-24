import { ethers } from 'hardhat'
import { MockContract, smock } from '@defi-wonderland/smock'
import { LongShortToken, LongShortToken__factory } from '../../types/generated'

export async function LongShortTokenFixture(
  tokenName: string,
  tokenSymbol: string
): Promise<LongShortToken> {
  const longShort = await ethers.getContractFactory('LongShortToken')
  return (await longShort.deploy(tokenName, tokenSymbol)) as unknown as LongShortToken
}

export async function LongShortTokenAttachFixture(tokenAddress: string): Promise<LongShortToken> {
  const mintable = await ethers.getContractFactory('LongShortToken')
  return mintable.attach(tokenAddress) as unknown as LongShortToken
}

export async function smockLongShortTokenFixture(
  tokenName: string,
  tokenSymbol: string
): Promise<MockContract<LongShortToken>> {
  const smockFactory = await smock.mock<LongShortToken__factory>('LongShortToken')
  return smockFactory.deploy(tokenName, tokenSymbol)
}
