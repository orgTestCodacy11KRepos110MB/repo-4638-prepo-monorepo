import { useMemo } from 'react'
import { useRouter } from 'next/router'
import { useRootStore } from '../context/RootStoreProvider'
import { MarketEntity } from '../stores/entities/MarketEntity'
import { markets } from '../lib/markets'

const useSelectedMarket = (): MarketEntity => {
  const { query } = useRouter()
  const selectedMarketName = query?.marketId
  const { marketStore } = useRootStore()

  const defaultMarket = marketStore.markets[markets[0].urlId]
  return useMemo(
    () =>
      typeof selectedMarketName === 'string'
        ? marketStore.markets[selectedMarketName] ?? defaultMarket
        : defaultMarket,
    [defaultMarket, marketStore.markets, selectedMarketName]
  )
}

export default useSelectedMarket
