import { ethers } from 'hardhat'
import { FakeContract, MockContract, smock } from '@defi-wonderland/smock'
import { CreateMarketResult, PrePOMarketParams } from '../../types'
import { PrePOMarket, PrePOMarket__factory } from '../../types/generated'

export async function prePOMarketFixture(
  marketParams: PrePOMarketParams,
  longTokenAddress: string,
  shortTokenAddress: string
): Promise<PrePOMarket> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const prePOMarket: any = await ethers.getContractFactory('PrePOMarket')
  return (await prePOMarket.deploy(
    marketParams.governance,
    marketParams.collateral,
    longTokenAddress,
    shortTokenAddress,
    marketParams.floorLongPayout,
    marketParams.ceilingLongPayout,
    marketParams.floorValuation,
    marketParams.ceilingValuation,
    marketParams.expiryTime
  )) as PrePOMarket
}

export async function smockPrePOMarketFixture(
  marketParams: PrePOMarketParams,
  longTokenAddress: string,
  shortTokenAddress: string
): Promise<MockContract<PrePOMarket>> {
  const smockFactory = await smock.mock<PrePOMarket__factory>('PrePOMarket')
  return smockFactory.deploy(
    marketParams.governance,
    marketParams.collateral,
    longTokenAddress,
    shortTokenAddress,
    marketParams.floorLongPayout,
    marketParams.ceilingLongPayout,
    marketParams.floorValuation,
    marketParams.ceilingValuation,
    marketParams.expiryTime
  )
}

export async function fakePrePOMarketFixture(): Promise<FakeContract> {
  const fakeContract = await smock.fake('PrePOMarket')
  return fakeContract
}

export async function prePOMarketAttachFixture(
  market: string | CreateMarketResult
): Promise<PrePOMarket> {
  const marketAddress: string = typeof market !== 'string' ? market.market : market

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const prePOMarket: any = await ethers.getContractFactory('PrePOMarket')
  return prePOMarket.attach(marketAddress) as PrePOMarket
}
