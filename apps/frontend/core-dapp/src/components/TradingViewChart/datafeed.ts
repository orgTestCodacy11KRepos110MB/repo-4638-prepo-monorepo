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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supported_resolutions: ['60' as any],
}
// order calls: onReady => resolveSymbol => getBars
const configFn = (market: MarketEntity): IBasicDataFeed => ({
  onReady: (callback) => setTimeout(() => callback(config)),
  // can be removed if don't use search
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
      pricescale: 1000,
      has_intraday: true,
      has_no_volume: false,
    } as LibrarySymbolInfo)
  },
  getBars: (symbolInfo, resolution, { from, to, firstDataRequest }, onResult, onError): void => {
    console.log('[getBars] Method call', from, to, firstDataRequest, resolution)
    const num = new Date('24 Oct 2022 00:00:00 GMT').getTime()
    const data = new Array(24 * 60).fill(0).map((x, i) => ({
      time: num - 60000 * i,
      open: 7678.85,
      high: 7702.55,
      low: 7656.98,
      close: 7658.25,
      volume: 0.9834,
    }))

    onResult(data, { noData: false })
  },
  // can be removed
  subscribeBars: (
    symbolInfo,
    resolution,
    onRealtimeCallback,
    subscribeUID,
    onResetCacheNeededCallback
  ): void => {
    console.log('[subscribeBars]: Method call with subscribeUID:', subscribeUID)
  },
  // can be removed
  unsubscribeBars: (subscriberUID): void => {
    console.log('[unsubscribeBars]: Method call with subscriberUID:', subscriberUID)
  },
})

export default configFn
