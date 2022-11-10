import { Icon, IconName, spacingIncrement } from 'prepo-ui'
import { observer } from 'mobx-react-lite'
import { useRouter } from 'next/router'
import styled, { Color } from 'styled-components'
import { Direction } from './TradeStore'
import { useRootStore } from '../../context/RootStoreProvider'

const directions: Direction[] = ['long', 'short']

const Wrapper = styled.div`
  align-items: center;
  display: flex;
  gap: ${spacingIncrement(8)};
`

const RadioButtonWrapper = styled.div<{ selected?: boolean }>`
  align-items: center;
  background-color: ${({ theme, selected }): string =>
    theme.color[selected ? 'neutral8' : 'transparent']};
  border: solid 1px ${({ theme }): string => theme.color.neutral8};
  border-radius: ${({ theme }): string => theme.borderRadius.base};
  cursor: pointer;
  display: flex;
  gap: ${spacingIncrement(8)};
  justify-content: center;
  padding: ${spacingIncrement(16)};
  width: 100%;
  :hover {
    border: solid 1px
      ${({ theme, selected }): string => theme.color[selected ? 'neutral8' : 'neutral5']};
  }
`

const RadioTitle = styled.p<{ color: keyof Color }>`
  color: ${({ theme, color }): string => theme.color[color]};
  font-size: ${({ theme }): string => theme.fontSize.md};
  font-weight: ${({ theme }): number => theme.fontWeight.semiBold};
  line-height: 24px;
  margin-bottom: 0;
`
const RadioButton: React.FC<{
  direction: Direction
  selected: boolean
  onClick: (direction: Direction) => void
}> = ({ direction, selected, onClick }) => {
  const name = direction === 'long' ? 'Long' : 'Short'
  const iconName: IconName = direction === 'long' ? 'long' : 'short'

  const handleClick = (): void => {
    onClick(direction)
  }

  return (
    <RadioButtonWrapper selected={selected} onClick={handleClick}>
      <RadioTitle color={direction === 'long' ? 'success' : 'error'}>{name}</RadioTitle>
      <Icon name={iconName} />
    </RadioButtonWrapper>
  )
}

const DirectionRadio: React.FC = () => {
  const router = useRouter()
  const { tradeStore } = useRootStore()
  const { direction } = tradeStore

  const onSelectDirection = (newDirection: Direction): void => {
    if (newDirection === direction) return
    const tradeUrl = tradeStore.setDirection(newDirection)
    router.push(tradeUrl)
  }

  return (
    <Wrapper>
      {directions.map((value) => (
        <RadioButton
          key={value}
          direction={value}
          selected={direction === value}
          onClick={onSelectDirection}
        />
      ))}
    </Wrapper>
  )
}

export default observer(DirectionRadio)
