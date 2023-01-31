import { action, makeAutoObservable, observable } from 'mobx'
import { RootStore } from './RootStore'
import { MarketEntity } from './entities/MarketEntity'
import { markets } from '../lib/markets'
import { MarketType } from '../types/market.types'

export class MarketStore {
  root: RootStore
  markets: {
    [key: string]: MarketEntity
  } = {}
  fetchingMarkets = false
  searchQuery: string

  constructor(root: RootStore) {
    this.root = root
    this.searchQuery = ''
    this.markets = markets.reduce(
      (value, market) => ({
        ...value,
        [market.urlId]: new MarketEntity(this.root, market),
      }),
      {}
    )
    makeAutoObservable(this, {
      searchQuery: observable,
      setSearchQuery: action.bound,
    })
  }

  setSearchQuery(query: string): void {
    this.searchQuery = query
  }

  get searchKeyWords(): { label: string; value: string }[] {
    if (!this.markets) return []
    return Object.entries(this.markets).map(([value, market]) => ({ label: market.name, value }))
  }

  get filteredIpoMarkets(): MarketEntity[] {
    return MarketStore.getFilteredByType(this.getFilteredMarkets(), 'preIPO')
  }

  get filteredIcoMarkets(): MarketEntity[] {
    return MarketStore.getFilteredByType(this.getFilteredMarkets(), 'preICO')
  }

  get filteredMarkets(): MarketEntity[] {
    return MarketStore.getFilteredByType(this.getFilteredMarkets())
  }

  private static getFilteredByType = (records: MarketEntity[], type?: MarketType): MarketEntity[] =>
    records.filter((record) => type === undefined || record.type === type)

  private getFilteredMarkets = (): MarketEntity[] => {
    if (!this.markets) return []
    const marketsList = Object.keys(this.markets).map((marketName) => this.markets[marketName])
    if (this.searchQuery === '') return marketsList

    return marketsList.filter((market) =>
      market.name.toLowerCase().includes(this.searchQuery.toLowerCase())
    )
  }
}
