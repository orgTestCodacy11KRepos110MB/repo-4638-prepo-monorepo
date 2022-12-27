import { observer } from 'mobx-react-lite'
import styled from 'styled-components'
import { useMemo, useState } from 'react'
import { Button, spacingIncrement, Switch } from 'prepo-ui'
import SlideUpCard from './SlideUpCard'
import { useRootStore } from '../../context/RootStoreProvider'

const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${spacingIncrement(24)};
  margin-top: ${spacingIncrement(12)};
`

const Row = styled.div`
  align-items: center;
  display: flex;
  justify-content: space-between;
`

const Label = styled.p`
  color: ${({ theme }): string => theme.color.neutral1};
  font-size: ${({ theme }): string => theme.fontSize.base};
  font-weight: ${({ theme }): number => theme.fontWeight.medium};
`

const TradeSettings: React.FC = () => {
  const { tradeStore } = useRootStore()
  const { showSettings, showChart } = tradeStore

  // local states
  const [localShowChart, setLocalShowChart] = useState(showChart)
  // TODO: show simulator
  // TODO: slippage protection

  const unchanged = useMemo(() => localShowChart === showChart, [localShowChart, showChart])

  const onToggleChart = (): void => {
    tradeStore.setShowChart(!showChart)
  }

  const onClose = (): void => {
    tradeStore.setShowSettings(false)
    // reset all local states to same as states trade store
    tradeStore.setShowChart(localShowChart)
  }

  const onSave = (): void => {
    tradeStore.setShowSettings(false)
    // sync trade store states with local states
    setLocalShowChart(showChart)
  }

  return (
    <SlideUpCard show={showSettings} title="Trade Settings" onClose={onClose}>
      <Wrapper>
        <Row>
          <Label>Show Chart</Label>
          <Switch onChange={onToggleChart} checked={showChart} />
        </Row>
        <Button block disabled={unchanged} size="sm" onClick={onSave}>
          Save
        </Button>
      </Wrapper>
    </SlideUpCard>
  )
}

export default observer(TradeSettings)
