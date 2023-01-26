import { observer } from 'mobx-react-lite'
import { Flex } from 'prepo-ui'
import Skeleton from '../../../components/Skeleton'
import SummaryRecord from '../../../components/SummaryRecord'
import { useRootStore } from '../../../context/RootStoreProvider'
import { numberFormatter } from '../../../utils/numberFormatter'
import { EstimatedValuation } from '../../definitions'

const { significantDigits } = numberFormatter
const OpenTradeSummary: React.FC = () => {
  const { tradeStore } = useRootStore()
  const { withinBounds, tradingValuation, selectedMarket, openTradeAmountBN } = tradeStore

  if (
    !selectedMarket ||
    openTradeAmountBN === undefined ||
    openTradeAmountBN.eq(0) ||
    withinBounds === false
  )
    return null

  const loading = tradingValuation === undefined || withinBounds === undefined

  return (
    <Flex width="100%" px={12} pb={8}>
      <SummaryRecord label="Estimated Valuation Price" tooltip={<EstimatedValuation />}>
        {loading ? (
          <Skeleton height="22px" width="64px" />
        ) : (
          `$${significantDigits(tradingValuation)}`
        )}
      </SummaryRecord>
    </Flex>
  )
}

export default observer(OpenTradeSummary)
