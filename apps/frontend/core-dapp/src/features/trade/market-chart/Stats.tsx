import { observer } from 'mobx-react-lite'
import { Flex, Icon, IconName, spacingIncrement, Tooltip } from 'prepo-ui'
import Skeleton from 'react-loading-skeleton'
import styled from 'styled-components'
import { MarketEntity } from '../../../stores/entities/MarketEntity'
import { numberFormatter } from '../../../utils/numberFormatter'

type Props = {
  market?: MarketEntity
}

type StatProps = {
  iconName: IconName
  name: string
  value?: string
}

const { significantDigits } = numberFormatter

const Wrapper = styled.div`
  align-items: center;
  border-top: solid 1px ${({ theme }): string => theme.color.neutral13};
  display: flex;
  gap: ${spacingIncrement(8)};
  justify-content: center;
  padding-top: ${spacingIncrement(12)};
`

const StatWrapper = styled.div`
  align-items: center;
  color: ${({ theme }): string => theme.color.neutral3};
  display: flex;
  gap: ${spacingIncrement(2)};
  height: ${spacingIncrement(12)};
  line-height: 1;
`

const StatText = styled.p`
  font-size: ${({ theme }): string => theme.fontSize.xs};
  font-weight: ${({ theme }): number => theme.fontWeight.medium};
`

const Stat: React.FC<StatProps> = ({ iconName, name, value }) => (
  <Flex width={58} justifyContent="flex-start">
    <Tooltip overlay={name}>
      <StatWrapper>
        <Icon name={iconName} height="12" width="12" />
        {value !== undefined ? <StatText>{value}</StatText> : <Skeleton height={12} width={40} />}
      </StatWrapper>
    </Tooltip>
  </Flex>
)

const Stats: React.FC<Props> = ({ market }) => {
  const volume = (): string | undefined => {
    if (!market) return '???'
    if (market.tradingVolume === undefined) return undefined
    return `$${significantDigits(market.tradingVolume?.value)}`
  }

  const liquidity = (): string | undefined => {
    if (!market) return '???'
    if (market.liquidity === undefined) return undefined
    return `$${significantDigits(market.liquidity.value)}`
  }

  return (
    <Wrapper>
      <Stat iconName="trading-volume" name="Volume" value={volume()} />
      <Stat iconName="trading-liquidity" name="Liquidity" value={liquidity()} />
    </Wrapper>
  )
}

export default observer(Stats)
