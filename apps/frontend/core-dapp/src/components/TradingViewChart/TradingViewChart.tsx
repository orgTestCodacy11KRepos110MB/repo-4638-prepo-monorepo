import { Flex, ThemeModes } from 'prepo-ui'
import { useEffect, useRef } from 'react'
import { observer } from 'mobx-react-lite'
import datafeed from './datafeed'
import {
  widget as Widget,
  ChartingLibraryWidgetOptions,
  IChartingLibraryWidget,
} from '../../../public/static/charting_library'
import useSelectedMarket from '../../hooks/useSelectedMarket'
import { useRootStore } from '../../context/RootStoreProvider'

const chartId = 'tv_chart_container'

const TradingViewChart: React.FC = () => {
  const { uiStore } = useRootStore()
  const { selectedTheme } = uiStore
  const tvWidgetRef = useRef<IChartingLibraryWidget | null>(null)
  const selectedMarket = useSelectedMarket()

  useEffect(() => {
    if (!selectedMarket) return
    const widgetOptions: ChartingLibraryWidgetOptions = {
      symbol: 'EUR/USD',
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      interval: '60' as any, // every hour
      container: chartId,
      locale: 'en',
      fullscreen: false,
      autosize: true,
      datafeed: datafeed(selectedMarket),
      client_id: 'tradingview.com',
      user_id: 'public_user_id',
      library_path: '/static/charting_library/',
      disabled_features: [
        'use_localstorage_for_settings',
        'left_toolbar',
        'header_widget',
        'border_around_the_chart',
      ],
      theme: selectedTheme === ThemeModes.Dark ? 'Dark' : 'Light',
    }
    const tvWidget = new Widget(widgetOptions)

    tvWidget.onChartReady(() => {
      tvWidgetRef.current = tvWidget
    })
  }, [selectedMarket, selectedTheme])
  return <Flex height="calc(100% - 20px)" id={chartId} width="100%" />
}

export default observer(TradingViewChart)
