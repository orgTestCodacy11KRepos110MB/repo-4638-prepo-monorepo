import { observer } from 'mobx-react-lite'
import { TokenInput } from 'prepo-ui'
import WithdrawTransactionSummary from './WithdrawTransactionSummary'
import { useRootStore } from '../../context/RootStoreProvider'
import CurrenciesBreakdown from '../../components/CurrenciesBreakdown'
import PageCard from '../../components/PageCard'
import { Routes } from '../../lib/routes'

const WithdrawPage: React.FC = () => {
  const { web3Store, preCTTokenStore, withdrawStore } = useRootStore()
  const { tokenBalanceFormat } = preCTTokenStore
  const { connected } = web3Store
  const { setWithdrawalAmount, withdrawalAmount } = withdrawStore

  return (
    <PageCard backUrl={Routes.Portfolio} title="Withdraw">
      <TokenInput
        alignInput="right"
        balance={tokenBalanceFormat}
        connected={connected}
        disableClickBalance
        max={tokenBalanceFormat}
        onChange={setWithdrawalAmount}
        shadowSuffix=""
        symbol="USD"
        usd
        value={withdrawalAmount}
      />
      <CurrenciesBreakdown />
      <WithdrawTransactionSummary />
    </PageCard>
  )
}

export default observer(WithdrawPage)
