import { observer } from 'mobx-react-lite'
import { useRouter } from 'next/router'
import { spacingIncrement } from 'prepo-ui'
import { useEffect, useMemo } from 'react'
import styled, { Color } from 'styled-components'
import PositionLoadingSkeleton, { PositionLoadingSkeletons } from './PositionLoadingSkeleton'
import SlideUpCard from '../SlideUpCard'
import { useRootStore } from '../../../context/RootStoreProvider'
import SlideUpButton from '../SlideUpButton'
import SlideUpRow from '../SlideUpRow'
import { Direction } from '../TradeStore'

const SelectedPosition = styled(SlideUpRow)`
  border: none;
  padding: 0;
  :hover {
    background-color: transparent;
  }
`

const DirectionWrapper = styled.span`
  color: ${({ theme }): string => theme.color.neutral2};
  display: inline-block;
  font-size: ${({ theme }): string => theme.fontSize.base};
  font-weight: ${({ theme }): number => theme.fontWeight.medium};
  margin-left: ${spacingIncrement(2)};
  vertical-align: bottom;
`

const DirectionText = styled.span<{ color: keyof Color }>`
  color: ${({ color, theme }): string => theme.color[color]};
  text-transform: capitalize;
`

const PositionsSlideUp: React.FC = () => {
  const router = useRouter()
  const { portfolioStore, tradeStore, web3Store } = useRootStore()
  const { connected } = web3Store
  const { isLoadingPositions, positions } = portfolioStore
  const { attemptingToSelectPosition, slideUpContent, setSlideUpContent, selectedPosition } =
    tradeStore

  const noPosition = !isLoadingPositions && positions.length === 0

  const handleSelectPosition = (newMarketUrlId: string, newDirection: Direction): void => {
    tradeStore.setSelectedMarket(newMarketUrlId)
    tradeStore.setDirection(newDirection)
    tradeStore.setSlideUpContent()
    router.push(tradeStore.tradeUrl)
  }

  // close SlideUp when this component is unmounted (e.g. user leaves page)
  useEffect(() => () => setSlideUpContent(), [setSlideUpContent])

  useEffect(() => {
    // close SlideUp if user has no position to avoid weird behaviour when switching between addresses
    if (noPosition && slideUpContent === 'ClosePosition') setSlideUpContent()
  }, [noPosition, setSlideUpContent, slideUpContent])

  const buttonContent = useMemo(() => {
    if (selectedPosition)
      return (
        <SelectedPosition
          market={selectedPosition.market}
          afterName={
            <DirectionWrapper>
              (
              <DirectionText color={selectedPosition.direction === 'long' ? 'success' : 'error'}>
                {selectedPosition.direction}
              </DirectionText>
              )
            </DirectionWrapper>
          }
        />
      )

    // user attempts to select a position via url parameters but positions aren't loaded yet
    if (attemptingToSelectPosition) return <PositionLoadingSkeleton noPadding />

    return noPosition ? 'No Opened Position' : 'Select a Position'
  }, [attemptingToSelectPosition, noPosition, selectedPosition])

  return (
    <>
      <SlideUpButton
        disabled={!connected || noPosition}
        showShadow={!selectedPosition}
        onClick={(): void => setSlideUpContent('ClosePosition')}
      >
        {buttonContent}
      </SlideUpButton>
      <SlideUpCard
        show={slideUpContent === 'ClosePosition' && !noPosition}
        onClose={(): void => setSlideUpContent(undefined)}
        title="Select a Position"
      >
        {isLoadingPositions ? (
          <PositionLoadingSkeletons />
        ) : (
          <>
            {selectedPosition && (
              <SlideUpRow
                market={selectedPosition.market}
                selected
                onClick={(): void =>
                  handleSelectPosition(selectedPosition.market.urlId, selectedPosition.direction)
                }
                position={{
                  direction: selectedPosition.direction,
                  totalValue:
                    selectedPosition.data === undefined
                      ? undefined
                      : +selectedPosition.data.totalValue,
                }}
              />
            )}
            {positions
              .filter(({ id }) => id !== selectedPosition?.id)
              .map(({ id, market, data, direction }) => (
                <SlideUpRow
                  key={id}
                  market={market}
                  onClick={(): void => handleSelectPosition(market.urlId, direction)}
                  position={data ? { direction, totalValue: +data.totalValue } : undefined}
                />
              ))}
          </>
        )}
      </SlideUpCard>
    </>
  )
}

export default observer(PositionsSlideUp)
