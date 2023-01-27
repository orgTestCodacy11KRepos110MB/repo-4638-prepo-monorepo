import { Icon, spacingIncrement, TokenInput } from 'prepo-ui'
import { BigNumber } from 'ethers'
import { formatUnits, parseUnits } from 'ethers/lib/utils'
import { observer } from 'mobx-react-lite'
import { useState } from 'react'
import styled from 'styled-components'
import { safeStringBN, validateStringToBN } from 'prepo-utils'
import TransactionSummary from '../../components/TransactionSummary'
import { useRootStore } from '../../context/RootStoreProvider'
import Table, { RowData } from '../../components/Table'
import { Callback } from '../../types/common.types'
import AdvancedSettingsModal from '../../components/AdvancedSettingsModal'
import { ERC20_UNITS } from '../../lib/constants'
import { PositionEntity } from '../../stores/entities/Position.entity'

type Props = {
  position: Required<PositionEntity>
}

const FormItem = styled.div<{ showBorderTop?: boolean }>`
  border-top: 1px solid
    ${({ theme, showBorderTop }): string =>
      showBorderTop ? theme.color.primaryAccent : 'transparent'};
  margin-bottom: ${spacingIncrement(24)};
  padding-top: ${({ showBorderTop }): string => (showBorderTop ? spacingIncrement(12) : '0')};
`

const SettingsIconWrapper = styled.div`
  cursor: pointer;
  :hover {
    svg,
    path {
      fill: ${({ theme }): string => theme.color.primary};
    }
  }
`

const TitleWrapper = styled.div`
  align-items: center;
  display: flex;
  justify-content: space-between;
  padding-right: ${spacingIncrement(36)};
`

const ClosePositionSummary: React.FC<Props> = ({ position }) => {
  const { advancedSettingsStore, portfolioStore, tradeStore, web3Store } = useRootStore()
  const { isSettingsOpen, setIsSettingsOpen } = advancedSettingsStore
  const { closeTrade, closeTradeHash, setCloseTradeHash } = tradeStore
  const { setSelectedPosition } = portfolioStore
  const { connected } = web3Store
  const [closeValue, setCloseValue] = useState(position.totalValue)
  const closeValueBN = parseUnits(safeStringBN(closeValue), position.token.decimalsNumber)
  const closeAmountBN = closeValueBN
    .mul(BigNumber.from(10).pow(ERC20_UNITS))
    // if priceBN is undefined, position is not loaded and this component will never be rendered
    // so priceBN will never be undefined
    .div(position.priceBN ?? BigNumber.from(0))

  const onClickSettings = (): void => setIsSettingsOpen(true)

  const handleClose = (): void => {
    setSelectedPosition(undefined)
    setCloseTradeHash(undefined)
  }

  const handleClosePosition = async (
    successCallback: Callback<string>,
    failedCallback: Callback<string>
  ): Promise<void> => {
    const { error } = await closeTrade(position.token, closeAmountBN, closeValueBN, position.market)

    if (error) {
      failedCallback(error)
    } else {
      successCallback()
    }
  }

  const tableData: RowData[] = [
    {
      label: 'Market',
      market: {
        name: position.market.name,
        position: position.direction,
      },
    },
    {
      label: 'Position Value',
      amount: position.totalValue,
    },
  ]

  const pnlTableData = [
    {
      label: 'Estimated PNL',
      toolTip: 'Some tooltip',
      amount: position.totalPnl,
      percent: position.positionGrowthPercentage,
    },
  ]

  if (isSettingsOpen) return <AdvancedSettingsModal />
  const insufficentBalance =
    position.totalValueBN !== undefined && closeValueBN.gt(position.totalValueBN)
  const buttonText = insufficentBalance ? 'Insufficent Position Value' : undefined

  return (
    <TransactionSummary
      data={tableData}
      onCancel={handleClose}
      onComplete={handleClose}
      disabled={insufficentBalance}
      onConfirm={handleClosePosition}
      onRetry={handleClosePosition}
      buttonText={buttonText}
      successButtonText="Close"
      title={
        <TitleWrapper>
          <span>Close Position</span>
          <SettingsIconWrapper onClick={onClickSettings}>
            <Icon name="settings" color="neutral5" width="19" height="20" />
          </SettingsIconWrapper>
        </TitleWrapper>
      }
      transactionHash={closeTradeHash}
      unlock={{
        amount: formatUnits(closeAmountBN, position.token.decimalsNumber),
        contentType: 'closeTrade',
        token: position.token,
      }}
      withoutModalButton
    >
      <FormItem showBorderTop>
        <TokenInput
          connected={connected}
          hideBalance
          onChange={(value): void => {
            if (validateStringToBN(value, position.token.decimalsNumber)) setCloseValue(value)
          }}
          max={position.totalValue}
          showSlider
          usd
          value={closeValue}
        />
      </FormItem>
      <Table percentagePrecision={2} data={pnlTableData} />
    </TransactionSummary>
  )
}

export default observer(ClosePositionSummary)
