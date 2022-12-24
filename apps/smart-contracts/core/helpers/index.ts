import { findMarketAddedEvent } from './events'
import { CreateMarketParams, CreateMarketResult } from '../types'

export * from './events'

export async function createMarket(marketParams: CreateMarketParams): Promise<CreateMarketResult> {
  const tx = await marketParams.factory
    .connect(marketParams.caller)
    .createMarket(
      marketParams.tokenNameSuffix,
      marketParams.tokenSymbolSuffix,
      marketParams.longTokenSalt,
      marketParams.shortTokenSalt,
      marketParams.governance,
      marketParams.collateral,
      marketParams.floorLongPayout,
      marketParams.ceilingLongPayout,
      marketParams.floorValuation,
      marketParams.ceilingValuation,
      marketParams.expiryTime
    )
  const events = await findMarketAddedEvent(marketParams.factory)
  return {
    tx,
    market: events[0].args.market,
    hash: events[0].args.longShortHash,
  }
}
