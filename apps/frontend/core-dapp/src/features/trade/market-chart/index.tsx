import { Icon, media, spacingIncrement } from 'prepo-ui'
import styled from 'styled-components'
import { observer } from 'mobx-react-lite'
import Chart from './Chart'
import Timeframes from './Timeframe'
import Stats from './Stats'
import Card from '../../../components/Card'
import { useRootStore } from '../../../context/RootStoreProvider'
import { isProduction } from '../../../utils/isProduction'

const Wrapper = styled(Card)`
  width: 100%;
  ${media.largeDesktop`
    left: ${spacingIncrement(-16)};
    position: absolute;
    top: ${spacingIncrement(58)};
    transform: translateX(-100%);
    width: ${spacingIncrement(264)};
  `}

  &&& {
    .ant-card-body {
      display: flex;
      flex-direction: column;
      gap: ${spacingIncrement(12)};
      :before,
      :after {
        display: none;
      }
    }
  }
`

const CloseButton = styled.button`
  background-color: transparent;
  border: none;
  color: ${({ theme }): string => theme.color.neutral3};
  cursor: pointer;
  padding: 0;

  :hover {
    opacity: 0.6;
  }
`

const Header = styled.div`
  align-items: center;
  display: flex;
  justify-content: space-between;
`

const MarketChart: React.FC = () => {
  const { tradeStore } = useRootStore()
  const { selectedMarket, showChart } = tradeStore
  const hideChart = isProduction()
  if (!showChart || hideChart) return null

  return (
    <Wrapper>
      <Header>
        <Timeframes market={selectedMarket} />
        <CloseButton onClick={(): void => tradeStore.setShowChart(false)}>
          <Icon name="cross" height="16" width="16" />
        </CloseButton>
      </Header>
      <Chart market={selectedMarket} />
      <Stats market={selectedMarket} />
    </Wrapper>
  )
}

export default observer(MarketChart)
