import { ethers, upgrades } from 'hardhat'
import { BigNumber, ContractTransaction } from 'ethers'
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/dist/src/signer-with-address'
import { PrePOMarketFactory } from '../../typechain/PrePOMarketFactory'
import { getMarketAddedEvent } from '../events'

export type CreateMarketParams = {
  caller: SignerWithAddress
  factory: PrePOMarketFactory
  tokenNameSuffix: string
  tokenSymbolSuffix: string
  governance: string
  collateral: string
  floorLongPayout: BigNumber
  ceilingLongPayout: BigNumber
  floorValuation: BigNumber
  ceilingValuation: BigNumber
  expiryTime: number
}

export type CreateMarketResult = {
  tx: ContractTransaction
  market: string
}

export async function prePOMarketFactoryFixture(): Promise<PrePOMarketFactory> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const prePOMarketFactory: any = await ethers.getContractFactory('PrePOMarketFactory')
  return (await upgrades.deployProxy(prePOMarketFactory, [])) as PrePOMarketFactory
}

// passing in factory so that block time is not incremented by factory initialization prior to createMarket call, returns address of deployed market
export async function createMarketFixture(
  marketParams: CreateMarketParams
): Promise<CreateMarketResult> {
  const tx = await marketParams.factory
    .connect(marketParams.caller)
    .createMarket(
      marketParams.tokenNameSuffix,
      marketParams.tokenSymbolSuffix,
      marketParams.governance,
      marketParams.collateral,
      marketParams.floorLongPayout,
      marketParams.ceilingLongPayout,
      marketParams.floorValuation,
      marketParams.ceilingValuation,
      marketParams.expiryTime
    )
  const events = await getMarketAddedEvent(marketParams.factory)
  return {
    tx,
    market: events.market,
  }
}
