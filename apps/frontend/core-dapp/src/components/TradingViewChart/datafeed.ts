/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable no-console */
import {
  DatafeedConfiguration,
  IBasicDataFeed,
  LibrarySymbolInfo,
  ResolutionString,
} from '../../../public/static/charting_library/charting_library'
import { MarketEntity } from '../../stores/entities/MarketEntity'

const config: DatafeedConfiguration = {
  supported_resolutions: ['60', '120', '240', 'D'] as ResolutionString[],
}

const configFn = (market: MarketEntity): IBasicDataFeed => ({
  onReady: (callback) => setTimeout(() => callback(config)),
  searchSymbols: (userInput, exchange, symbolType, onResultReadyCallback): void => {
    console.log('[searchSymbols]: Method call')
  },
  resolveSymbol: (symbolName, onSymbolResolvedCallback, onResolveErrorCallback): void => {
    console.log('[resolveSymbol]: Method call', symbolName)
    onSymbolResolvedCallback({
      name: symbolName,
      description: 'description',
      session: '24x7',
      minmov: 1,
      pricescale: 10000,
      has_intraday: true,
      supported_resolutions: ['60', '120', '240', 'D'] as ResolutionString[],
      has_no_volume: false,
    } as LibrarySymbolInfo)
  },
  getBars: (symbolInfo, resolution, { from, to, firstDataRequest }, onResult, onError): void => {
    console.log('[getBars] Method call', from, to, firstDataRequest, resolution)
    const data =
      market.cachedHistoricalData?.map((x) => ({
        time: x.timestamp * 1000,
        low: 0,
        high: 10,
        open: 10,
        close: 0,
        volume: x.volume,
      })) ?? []
    onResult(data, { noData: false })
  },
  subscribeBars: (
    symbolInfo,
    resolution,
    onRealtimeCallback,
    subscribeUID,
    onResetCacheNeededCallback
  ): void => {
    console.log('[subscribeBars]: Method call with subscribeUID:', subscribeUID)
  },
  unsubscribeBars: (subscriberUID): void => {
    console.log('[unsubscribeBars]: Method call with subscriberUID:', subscriberUID)
  },
})

export default configFn
