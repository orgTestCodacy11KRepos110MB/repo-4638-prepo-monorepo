import { Flex } from 'prepo-ui'
import { useEffect, useRef } from 'react'
import datafeed from './datafeed'
import {
  widget as Widget,
  ChartingLibraryWidgetOptions,
  IChartingLibraryWidget,
} from '../../../public/static/charting_library'

const chartId = 'tv_chart_container'

const TradingViewChart: React.FC = () => {
  const tvWidgetRef = useRef<IChartingLibraryWidget | null>(null)

  useEffect(() => {
    const widgetOptions: ChartingLibraryWidgetOptions = {
      symbol: 'Bitfinex:BTC/USD', // default symbol
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      interval: '1D' as any, // default interval
      container: chartId,
      locale: 'en',
      fullscreen: false,
      autosize: true,
      datafeed,
      library_path: '/static/charting_library/',
    }
    const tvWidget = new Widget(widgetOptions)

    tvWidget.onChartReady(() => {
      tvWidgetRef.current = tvWidget
    })
  }, [])
  return <Flex flex={1} id={chartId} width="100%" />
}

export default TradingViewChart
