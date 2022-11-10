import { useRouter } from 'next/router'
import { useEffect } from 'react'
import { useRootStore } from '../../context/RootStoreProvider'

const useTradePage = (): void => {
  const router = useRouter()
  const { marketStore, tradeStore } = useRootStore()
  const { markets } = marketStore

  useEffect(() => {
    if (router.query) {
      const { marketId, direction } = router.query

      // handle market selcetion by marketId
      if (typeof marketId === 'string') {
        const foundMarket = Object.entries(markets).find(
          ([id]) => id.toLowerCase() === marketId.toLowerCase()
        )
        if (foundMarket) tradeStore.setSelectedMarket(foundMarket[1])
      }

      // handle direction selection
      if (typeof direction === 'string') {
        tradeStore.setDirection(direction === 'short' ? 'short' : 'long')
      }

      // TODO: add support for market selection by market address
    }
  }, [markets, router.query, tradeStore])
}

export default useTradePage
