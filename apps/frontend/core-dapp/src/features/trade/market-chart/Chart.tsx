import { Time } from 'lightweight-charts'
import { observer } from 'mobx-react-lite'
import { spacingIncrement, Typography } from 'prepo-ui'
import Skeleton from 'react-loading-skeleton'
import styled, { useTheme } from 'styled-components'
import { ColorType } from '../../../components/charts'
import AreaChart from '../../../components/charts/templates/AreaChart'
import { numberChartTime } from '../../../components/charts/utils'
import useTransformedValuationData from '../../../hooks/useTransformedValuationData'
import { MarketEntity } from '../../../stores/entities/MarketEntity'
import { getFullStringFromMs } from '../../../utils/date-utils'
import { numberFormatter } from '../../../utils/numberFormatter'
import { useRootStore } from '../../../context/RootStoreProvider'

const { significantDigits } = numberFormatter

const ChartWrapper = styled.div`
  align-items: center;
  display: flex;
  height: ${spacingIncrement(100)};
  justify-content: center;
  width: 100%;
`

const Chart: React.FC<{ market?: MarketEntity }> = ({ market }) => {
  const { tradeStore } = useRootStore()
  const { selectedTimeframe } = tradeStore
  const { color } = useTheme()
  const valuationData = useTransformedValuationData(market?.realTimeChartData)

  if (!market)
    return (
      <ChartWrapper>
        <Typography variant="text-medium-sm" color="neutral5">
          Select a Market
        </Typography>
      </ChartWrapper>
    )
  if (!valuationData)
    return (
      <Skeleton
        baseColor={color.neutral8}
        highlightColor={color.neutral10}
        height={96}
        width="100%"
      />
    )

  const findStartData = (): number | undefined => {
    for (let i = 0; i < valuationData.length; i++) {
      const currentData = valuationData[i]
      if (currentData.value !== undefined) {
        return currentData.value
        break
      }
    }
    return undefined
  }
  const startData = findStartData()
  const currentData = valuationData[valuationData.length - 1].value
  const chartColorKey =
    currentData === undefined || startData === undefined || currentData - startData >= 0
      ? 'success'
      : 'error'
  const chartColor = color[chartColorKey]

  return (
    <ChartWrapper>
      <AreaChart
        options={{
          baseLineColor: chartColor,
          bottomColor: color.neutral10,
          crosshairMarkerBackgroundColor: chartColor,
          crosshairMarkerRadius: 4,
          topColor: color.neutral10,
          lineColor: chartColor,
          lineWidth: 3,
        }}
        chartOptions={{
          crosshair: { vertLine: { visible: false } },
          layout: {
            textColor: color.neutral2,
            background: { type: ColorType.Solid, color: color.neutral10 },
          },
          timeScale: { visible: false },
        }}
        data={valuationData}
        timeframe={selectedTimeframe}
        // eslint-disable-next-line react/jsx-props-no-spreading
        chartTooltipFormatter={{
          valueColor: chartColorKey,
          formatPrice: (price?: number): string =>
            price === undefined ? 'N/A' : `$${significantDigits(price)}`,
          formatTime: (time: Time): string =>
            getFullStringFromMs(numberChartTime(time), {
              date: 'yyyy/LL/d',
              time: 'HH:mm',
            }).replace(',', ''),
        }}
      />
    </ChartWrapper>
  )
}

export default observer(Chart)
