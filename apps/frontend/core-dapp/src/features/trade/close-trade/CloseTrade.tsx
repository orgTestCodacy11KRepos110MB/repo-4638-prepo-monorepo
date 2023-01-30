import { observer } from 'mobx-react-lite'
import { CurrencyInput, spacingIncrement } from 'prepo-ui'
import styled from 'styled-components'
import PositionsSlideUp from './PositionsSlideUp'
import { useRootStore } from '../../../context/RootStoreProvider'

const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${spacingIncrement(16)};
  min-height: ${spacingIncrement(324)};
  padding: ${spacingIncrement(8)};
  width: 100%;
`

const CloseTrade: React.FC = () => {
  const { tradeStore, web3Store } = useRootStore()
  const { selectedPosition } = tradeStore
  const { connected } = web3Store
  return (
    <Wrapper>
      <PositionsSlideUp />
      <CurrencyInput
        disabled={!selectedPosition || !connected}
        isBalanceZero={selectedPosition?.totalValueBN?.eq(0)}
        balance={selectedPosition?.totalValue}
        currency={{ icon: 'cash', text: 'USD' }}
        showBalance
      />
      <p>TODO: Button</p>
      <p>TODO: Summary</p>
    </Wrapper>
  )
}

export default observer(CloseTrade)
