import styled from 'styled-components'
import { observer } from 'mobx-react-lite'
import { useRouter } from 'next/router'
import { spacingIncrement, Alert, media, Icon } from 'prepo-ui'
import DirectionRadio from './DirectionRadio'
import useTradePage from './useTradePage'
import TradeTransactionSummary from './TradeTransactionSummary'
import Link from '../../components/Link'
import Card from '../../components/Card'
import { useRootStore } from '../../context/RootStoreProvider'
import MarketDropdown from '../../components/MarketDropdown'
import { Routes } from '../../lib/routes'
import CurrencyInput from '../../components/CurrencyInput'

const AlertWrapper = styled.div`
  div[class*='ant-alert-message'] {
    ${media.desktop`
      font-size: ${({ theme }): string => theme.fontSize.base};
    `}
  }
`

const Wrapper = styled(Card)`
  max-width: ${spacingIncrement(380)};
  width: 100%;
  &&& {
    .ant-card-body {
      padding: 0;
    }
  }
`

const FormWrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${spacingIncrement(16)};
  padding: ${spacingIncrement(8)};
`

const MartketDropdownWrapper = styled.div`
  div[class*='Dropdown__DropdownButton'] {
    ${media.desktop`
      height: auto;
      padding-bottom: ${spacingIncrement(16)};
      padding-top: ${spacingIncrement(16)};
    `}
  }
  span {
    font-size: ${({ theme }): string => theme.fontSize.base};
    ${media.desktop`
      font-size: ${({ theme }): string => theme.fontSize.xl};
    `}
  }
`

const Message = styled.div`
  a {
    &:hover {
      color: ${({ theme }): string => theme.color.darkPrimary};
    }

    text-decoration: underline;
  }
`

const TradePage: React.FC = () => {
  useTradePage()
  const router = useRouter()
  const { tradeStore, preCTTokenStore, web3Store } = useRootStore()
  const { connected, isNetworkSupported } = web3Store
  const { openTradeAmount, openTradeAmountBN, setOpenTradeAmount, selectedMarket } = tradeStore
  const { balanceOfSigner, tokenBalanceFormat } = preCTTokenStore

  const onSelectMarket = (key: string): void => {
    const tradeUrl = tradeStore.setSelectedMarket(key)
    router.push(tradeUrl)
  }

  return (
    <Wrapper>
      <FormWrapper>
        <MartketDropdownWrapper>
          <MarketDropdown selectedMarket={selectedMarket} onSelectMarket={onSelectMarket} />
        </MartketDropdownWrapper>
        <DirectionRadio />
        <CurrencyInput
          balance={tokenBalanceFormat}
          isBalanceZero={balanceOfSigner?.eq(0)}
          disabled={!connected || !isNetworkSupported}
          currency={{ icon: 'cash', text: 'USD' }}
          onChange={setOpenTradeAmount}
          value={openTradeAmount}
          placeholder="0"
          showBalance
        />

        <TradeTransactionSummary />
        {openTradeAmountBN !== undefined &&
          (balanceOfSigner?.lt(openTradeAmountBN) || balanceOfSigner?.eq(0)) && (
            <AlertWrapper>
              <Alert
                message={
                  <Message>
                    You need to <Link href={Routes.Deposit}>deposit more funds</Link> to make this
                    trade.
                  </Message>
                }
                type="warning"
                showIcon
                icon={<Icon name="info" color="warning" />}
              />
            </AlertWrapper>
          )}
      </FormWrapper>
    </Wrapper>
  )
}

export default observer(TradePage)
