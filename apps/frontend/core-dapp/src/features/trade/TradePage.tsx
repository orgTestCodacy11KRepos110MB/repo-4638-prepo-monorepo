import styled from 'styled-components'
import { RadioChangeEvent } from 'antd'
import { observer } from 'mobx-react-lite'
import { useRouter } from 'next/router'
import { spacingIncrement, Alert, media, Icon, TokenInput } from 'prepo-ui'
import TradeTransactionSummary from './TradeTransactionSummary'
import useTradePage from './useTradePage'
import Link from '../../components/Link'
import RadioGroup from '../../components/RadioGroup'
import Radio from '../../components/Radio'
import SecondaryNavigation from '../../components/SecondaryNavigation'
import Card from '../../components/Card'
import { useRootStore } from '../../context/RootStoreProvider'
import MarketDropdown from '../../components/MarketDropdown'
import useResponsive from '../../hooks/useResponsive'
import CurrenciesBreakdown from '../../components/CurrenciesBreakdown'
import { Routes } from '../../lib/routes'
import { makeQueryString } from '../../utils/makeQueryString'

const AlertWrapper = styled.div`
  div[class*='ant-alert-message'] {
    ${media.desktop`
      font-size: ${({ theme }): string => theme.fontSize.base};
    `}
  }
`

const CardWrapper = styled(Card)`
  padding: 0 ${spacingIncrement(10)};
  width: ${spacingIncrement(720)};
`

const FormItem = styled.div`
  margin-bottom: ${spacingIncrement(24)};
  &&& {
    ${media.desktop`
      p {
        font-size: ${({ theme }): string => theme.fontSize.md};
      }
    `}
  }
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
  svg,
  div[class*='IconTitle__IconWrapper'] {
    height: ${spacingIncrement(30)};
    width: ${spacingIncrement(30)};
    ${media.desktop`
      height: ${spacingIncrement(38)};
      width: ${spacingIncrement(38)};
    `}
  }
`

const Navigation = styled(SecondaryNavigation)`
  margin-bottom: ${spacingIncrement(32)};
`

const StyledRadio = styled(Radio)<{ active: boolean }>`
  ${media.desktop<{ active: boolean }>`
    font-size: ${({ active, theme }): string => (active ? theme.fontSize.xl : theme.fontSize.lg)};
  `}
`

const Message = styled.div`
  a {
    &:hover {
      color: ${({ theme }): string => theme.color.darkPrimary};
    }

    text-decoration: underline;
  }
`

const Wrapper: React.FC = ({ children }) => {
  const { isPhone } = useResponsive()
  if (isPhone) {
    return <>{children}</>
  }
  return <CardWrapper>{children}</CardWrapper>
}

const TradePage: React.FC = () => {
  useTradePage()
  const router = useRouter()
  const { tradeStore, web3Store, preCTTokenStore } = useRootStore()
  const { direction, openTradeAmount, openTradeAmountBN, setOpenTradeAmount, selectedMarket } =
    tradeStore
  const { balanceOfSigner, tokenBalanceFormat } = preCTTokenStore
  const {
    connected,
    network: { testNetwork = true },
  } = web3Store

  const makeTradeUrl = (marketId?: string, newDirection?: string): string => {
    const queryString = makeQueryString({ marketId, direction: newDirection })
    return `${Routes.Trade}${queryString}`
  }

  const onSelectDirection = (e: RadioChangeEvent): void => {
    const tradeUrl = makeTradeUrl(selectedMarket?.urlId, e.target.value)
    router.push(tradeUrl)
  }

  const onSelectMarket = (key: string): void => {
    const tradeUrl = makeTradeUrl(key, direction)
    router.push(tradeUrl)
  }

  return (
    <Wrapper>
      <Navigation title="Trade" />
      <FormItem>
        <MartketDropdownWrapper>
          <MarketDropdown
            label="I want to trade"
            selectedMarket={selectedMarket}
            onSelectMarket={onSelectMarket}
          />
        </MartketDropdownWrapper>
      </FormItem>
      <FormItem>
        <RadioGroup label="I want to go" value={direction} onChange={onSelectDirection}>
          <StyledRadio
            active={direction === 'long'}
            value="long"
            color="success"
            icon={<Icon name="long" />}
          >
            Long
          </StyledRadio>
          <StyledRadio
            active={direction === 'short'}
            value="short"
            color="error"
            icon={<Icon name="short" />}
          >
            Short
          </StyledRadio>
        </RadioGroup>
      </FormItem>
      <FormItem>
        <TokenInput
          balance={tokenBalanceFormat}
          connected={connected}
          onChange={setOpenTradeAmount}
          showSlider
          max={tokenBalanceFormat}
          usd
          value={openTradeAmount}
        />
      </FormItem>
      <FormItem>
        <CurrenciesBreakdown />
      </FormItem>
      <FormItem>
        <TradeTransactionSummary />
      </FormItem>
      {openTradeAmountBN !== undefined &&
        (balanceOfSigner?.lt(openTradeAmountBN) || balanceOfSigner?.eq(0)) && (
          <FormItem>
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
          </FormItem>
        )}
      <FormItem>
        {!testNetwork && (
          <AlertWrapper>
            <Alert
              message="prePO is still in alpha - use at your own risk."
              type="warning"
              showIcon
              icon={<Icon name="info" color="warning" />}
            />
          </AlertWrapper>
        )}
      </FormItem>
    </Wrapper>
  )
}

export default observer(TradePage)
