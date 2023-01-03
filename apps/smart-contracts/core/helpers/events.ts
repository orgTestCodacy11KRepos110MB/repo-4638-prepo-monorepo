import { MockContract } from '@defi-wonderland/smock'
import { ERC20, PrePOMarket, PrePOMarketFactory } from '../types/generated'
import { TransferEvent } from '../types/generated/@openzeppelin/artifacts/contracts/token/ERC20/ERC20'
import { MarketCreatedEvent } from '../types/generated/artifacts/contracts/PrePOMarket'
import { MarketAddedEvent } from '../types/generated/artifacts/contracts/PrePOMarketFactory'

export async function findMarketAddedEvent(
  factory: PrePOMarketFactory | MockContract<PrePOMarket>,
  startBlock = 'latest',
  endBlock = 'latest'
): Promise<MarketAddedEvent[]> {
  const filter = factory.filters.MarketAdded()
  const events = await factory.queryFilter(filter, startBlock, endBlock)
  return events as MarketAddedEvent[]
}

export async function findMarketCreatedEvent(
  market: PrePOMarket | MockContract<PrePOMarket>,
  startBlock = 'latest',
  endBlock = 'latest'
): Promise<MarketCreatedEvent[]> {
  const filter = market.filters.MarketCreated()
  const events = await market.queryFilter(filter, startBlock, endBlock)
  return events as MarketCreatedEvent[]
}

export async function findTransferEvent(
  erc20: ERC20 | MockContract<ERC20>,
  source: string,
  destination: string,
  startBlock = 'latest',
  endBlock = 'latest'
): Promise<TransferEvent[]> {
  const filter = erc20.filters.Transfer(source, destination)
  const events = await erc20.queryFilter(filter, startBlock, endBlock)
  return events as TransferEvent[]
}
