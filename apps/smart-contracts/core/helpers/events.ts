import { MockContract } from '@defi-wonderland/smock'
import { PrePOMarket, PrePOMarketFactory } from '../types/generated'
import { MarketCreatedEvent } from '../types/generated/contracts/PrePOMarket'
import { MarketAddedEvent } from '../types/generated/contracts/PrePOMarketFactory'

export async function findMarketAddedEvent(
  factory: PrePOMarketFactory | MockContract<PrePOMarket>,
  startBlock?: string,
  endBlock = 'latest'
): Promise<MarketAddedEvent[]> {
  const filter = factory.filters.MarketAdded()
  const events = await factory.queryFilter(filter, startBlock, endBlock)
  return events as MarketAddedEvent[]
}

export async function findMarketCreatedEvent(
  market: PrePOMarket | MockContract<PrePOMarket>,
  startBlock?: string,
  endBlock = 'latest'
): Promise<MarketCreatedEvent[]> {
  const filter = market.filters.MarketCreated()
  const events = await market.queryFilter(filter, startBlock, endBlock)
  return events as MarketCreatedEvent[]
}
