import { observer } from 'mobx-react-lite'
import { Flex, Icon, spacingIncrement } from 'prepo-ui'
import { useEffect } from 'react'
import styled from 'styled-components'
import { useRouter } from 'next/router'
import { useRootStore } from '../../../context/RootStoreProvider'
import { numberFormatter } from '../../../utils/numberFormatter'
import { Position } from '../../portfolio/PortfolioStore'
import SlideUp from '../SlideUp'

type MarketProps = {
  data: Position
  selected?: boolean
  onClick: (pos: Position) => void
}

const { significantDigits, toUsd } = numberFormatter

const MarketWrapper = styled.div<{ selected?: boolean }>`
  align-items: center;
  border-radius: ${({ theme }): string => theme.borderRadius.base};
  cursor: ${({ selected }): string => (selected ? 'default' : 'pointer')};
  display: flex;
  gap: ${spacingIncrement(16)};
  justify-content: space-between;
  padding: ${spacingIncrement(6)} ${spacingIncrement(8)};
  width: 100%;
  :hover {
    background-color: ${({ theme, selected }): string =>
      selected ? 'unset' : theme.color.accentPrimary};
  }
`

const MarketName = styled.p<{ size?: 'lg' }>`
  color: ${({ theme }): string => theme.color.secondary};
  font-size: ${({ theme, size }): string => theme.fontSize[size ?? 'base']};
  font-weight: ${({ theme }): number => theme.fontWeight.semiBold};
`

const MarketValuation = styled.span<{ size?: 'md' }>`
  color: ${({ theme }): string => theme.color.neutral3};
  font-size: ${({ theme, size }): string => theme.fontSize[size ?? 'sm']};
  font-weight: ${({ theme }): number => theme.fontWeight.medium};
`

const PositionType = styled.span<{ $isLong: boolean; size?: 'lg' }>`
  color: ${({ theme, $isLong }): string => ($isLong ? theme.color.success : theme.color.error)};
  font-size: ${({ theme, size }): string => theme.fontSize[size ?? 'xs']};
  font-weight: ${({ theme }): number => theme.fontWeight.medium};
`

const TotalValue = styled.span`
  color: ${({ theme }): string => theme.color.neutral1};
  font-size: ${({ theme }): string => theme.fontSize.md};
  font-weight: ${({ theme }): number => theme.fontWeight.semiBold};
`

const PositionItem: React.FC<MarketProps> = ({ data, onClick, selected }) => {
  const { market, data: pos = { totalValue: '' }, position } = data
  const isLong = position === 'long'

  return (
    <MarketWrapper onClick={(): void => onClick(data)} selected={selected}>
      <Flex gap={16}>
        <Icon name={market.iconName} height="48" width="48" />
        <div>
          <MarketName>{market.name}</MarketName>
          {market.estimatedValuation !== undefined && (
            <p>
              <MarketValuation>
                ${significantDigits(market.estimatedValuation?.value)}
              </MarketValuation>
            </p>
          )}
        </div>
      </Flex>
      <Flex flexDirection="column" alignItems="flex-end">
        <TotalValue>{toUsd(pos.totalValue)}</TotalValue>
        <PositionType $isLong={isLong}>{isLong ? 'Long' : 'Short'}</PositionType>
      </Flex>
    </MarketWrapper>
  )
}
const PositionSlideUp: React.FC = () => {
  const router = useRouter()
  const {
    portfolioStore,
    tradeStore,
    web3Store: { connected },
  } = useRootStore()
  const { positions, selectedPosition } = portfolioStore
  const { slideUpContent, setSlideUpContent } = tradeStore

  const onSelectPosition = (pos: Position): void => {
    setSlideUpContent(undefined)
    if (pos.position === 'liquidity' || !pos.data) return
    tradeStore.setDirection(pos.position, pos.market)
    const tradeUrl = tradeStore.setSelectedMarket(pos.market.urlId)
    router.push(tradeUrl)
    portfolioStore.setSelectedPosition(pos as Required<Position>)
  }

  // close SlideUp when this component is unmounted (e.g. user leaves page)
  useEffect(
    () => () => {
      setSlideUpContent(undefined)
    },
    [setSlideUpContent]
  )

  return (
    <SlideUp
      getId={(item): string => `${item?.market.urlId}$$${item?.position}`}
      showCard={slideUpContent === 'ClosePosition'}
      cardTitle="Select a Position"
      onCardClose={(): void => setSlideUpContent(undefined)}
      onButtonClick={(): void => setSlideUpContent('ClosePosition')}
      items={positions}
      selected={selectedPosition}
      title={
        selectedPosition ? (
          <Flex gap={16}>
            <Icon name={selectedPosition.market.iconName} height="48" width="48" />
            <Flex flexDirection="column" alignItems="flex-start">
              <MarketName size="lg">
                {selectedPosition.market.name} (
                <PositionType $isLong={selectedPosition.position === 'long'} size="lg">
                  {selectedPosition.position === 'long' ? 'Long' : 'Short'}
                </PositionType>
                )
              </MarketName>
              {selectedPosition.market.estimatedValuation !== undefined && (
                <MarketValuation size="md">
                  ${significantDigits(selectedPosition.market.estimatedValuation.value)}
                </MarketValuation>
              )}
            </Flex>
          </Flex>
        ) : (
          'Select a Position'
        )
      }
      onItemSelect={onSelectPosition}
      SlideUpItem={PositionItem}
      disabled={!connected}
    />
  )
}

export default observer(PositionSlideUp)
