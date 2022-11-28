import { useRouter } from 'next/router'
import { useEffect } from 'react'
import { useRootStore } from '../../context/RootStoreProvider'

const useTradePage = (): void => {
  const router = useRouter()
  const { marketStore, tradeStore, portfolioStore } = useRootStore()
  const { markets } = marketStore

  useEffect(() => {
    if (router.query) {
      const { action, marketId, direction } = router.query

      // handle direction selection
      if (typeof action === 'string') {
        tradeStore.setAction(action === 'close' ? 'close' : 'open')
      }

      // handle market selcetion by marketId
      if (typeof marketId === 'string') {
        tradeStore.setSelectedMarket(marketId)
      }

      // handle direction selection
      if (typeof direction === 'string') {
        tradeStore.setDirection(direction === 'short' ? 'short' : 'long')
      }
      // trying to find position on close tab
      if (action === 'close' && typeof marketId === 'string' && typeof direction === 'string') {
        portfolioStore.setSelectedPositionByMarketIdDirection(
          marketId,
          direction as 'long' | 'short'
        )
      }

      // TODO: add support for market selection by market address
    }
  }, [markets, portfolioStore, router.query, tradeStore])
}

export default useTradePage
