import { Flex } from 'prepo-ui'
import { observer } from 'mobx-react-lite'
import Skeleton from '../../components/Skeleton'
import SummaryRecord from '../../components/SummaryRecord'
import { useRootStore } from '../../context/RootStoreProvider'
import { EstimatedWithdrawAmount } from '../definitions'

const WithdrawSummary: React.FC = () => {
  const { withdrawStore } = useRootStore()
  const { withdrawalAmount, receivedAmount, withdrawalFee } = withdrawStore

  // empty input or 0 input
  if (withdrawalAmount === '' || receivedAmount === 0) return null

  return (
    <Flex flexDirection="column" gap={8} width="100%" px={12}>
      <SummaryRecord
        label="Received Amount"
        tooltip={
          withdrawalFee !== undefined && withdrawalFee > 0 ? (
            <EstimatedWithdrawAmount fee={withdrawalFee} />
          ) : undefined
        }
      >
        {receivedAmount === undefined ? (
          <Skeleton height="22px" width="64px" />
        ) : (
          `$${Intl.NumberFormat(undefined, {
            maximumFractionDigits: 2,
            minimumFractionDigits: 2,
          }).format(receivedAmount)}`
        )}
      </SummaryRecord>
    </Flex>
  )
}

export default observer(WithdrawSummary)
