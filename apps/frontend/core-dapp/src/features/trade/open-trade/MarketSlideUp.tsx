import { observer } from 'mobx-react-lite'
import { useRouter } from 'next/router'
import { useEffect, useMemo } from 'react'
import { Flex, Icon, spacingIncrement } from 'prepo-ui'
import styled from 'styled-components'
import { useRootStore } from '../../../context/RootStoreProvider'
import { MarketEntity } from '../../../stores/entities/MarketEntity'
import { numberFormatter } from '../../../utils/numberFormatter'
import SlideUp from '../SlideUp'

type MarketProps = {
  data: MarketEntity
  selected?: boolean
  onClick: (id: string) => void
}

const { significantDigits } = numberFormatter

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

const MarketItem: React.FC<MarketProps> = ({ data, onClick, selected }) => (
  <MarketWrapper onClick={(): void => onClick(data.urlId)} selected={selected}>
    <Flex gap={16}>
      <Icon name={data.iconName} height="48" width="48" />
      <div>
        <MarketName>{data.name}</MarketName>
        {data.estimatedValuation !== undefined && (
          <p>
            <MarketValuation>${significantDigits(data.estimatedValuation?.value)}</MarketValuation>
          </p>
        )}
      </div>
    </Flex>
    {selected && (
      <Flex color="success">
        <Icon name="check" height="24" width="24" />
      </Flex>
    )}
  </MarketWrapper>
)

const MarketSlideUp: React.FC = () => {
  const router = useRouter()
  const { marketStore, tradeStore } = useRootStore()
  const { slideUpContent, selectedMarket, setSlideUpContent } = tradeStore
  const { markets } = marketStore
  const marketArray = useMemo(() => Object.values(markets), [markets])

  const onSelectMarket = (key: string): void => {
    setSlideUpContent(undefined)
    if (selectedMarket?.urlId === key) return
    const tradeUrl = tradeStore.setSelectedMarket(key)
    router.push(tradeUrl)
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
      getId={(item): string | undefined => item?.urlId}
      showCard={slideUpContent === 'OpenMarket'}
      cardTitle="Select a Market"
      onCardClose={(): void => setSlideUpContent(undefined)}
      onButtonClick={(): void => setSlideUpContent('OpenMarket')}
      items={marketArray}
      selected={selectedMarket}
      title={
        selectedMarket ? (
          <Flex gap={16}>
            <Icon name={selectedMarket.iconName} height="36" width="36" />
            <MarketName size="lg">
              {selectedMarket.name}{' '}
              {selectedMarket.estimatedValuation !== undefined && (
                <MarketValuation size="md">
                  (${significantDigits(selectedMarket.estimatedValuation.value)})
                </MarketValuation>
              )}
            </MarketName>
          </Flex>
        ) : (
          'Select a Market'
        )
      }
      onItemSelect={onSelectMarket}
      SlideUpItem={MarketItem}
    />
  )
}

export default observer(MarketSlideUp)
