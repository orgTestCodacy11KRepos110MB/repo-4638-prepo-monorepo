import SlideUpButton from './SlideUpButton'
import SlideUpCard from './SlideUpCard'
import { MarketEntity } from '../../stores/entities/MarketEntity'
import { Position } from '../portfolio/PortfolioStore'

type SlideUpProps<T, ID> = {
  disabled?: boolean
  items: T[]
  selected?: T
  onButtonClick?: () => void
  title?: React.ReactNode
  showCard: boolean
  cardTitle?: React.ReactNode
  onCardClose?: () => void
  onItemSelect: (id: ID) => void
  SlideUpItem: React.FC<{
    data: T
    selected?: boolean
    onClick: (id: ID) => void
  }>
  getId: (item?: T) => string | undefined
}

const SlideUp = function SlideUpFn<T extends MarketEntity | Position, P = string>({
  items,
  disabled,
  selected,
  onButtonClick,
  title,
  showCard,
  cardTitle,
  onCardClose,
  onItemSelect,
  SlideUpItem,
  getId,
}: SlideUpProps<T, P>): React.ReactElement {
  return (
    <>
      <SlideUpButton showShadow={!selected} onClick={onButtonClick} disabled={disabled}>
        {disabled ? cardTitle : title}
      </SlideUpButton>
      <SlideUpCard show={showCard} onClose={onCardClose} title={cardTitle}>
        {selected && <SlideUpItem data={selected} selected onClick={onItemSelect} />}
        {items
          .filter((item) => getId(item) !== getId(selected))
          .map((item) => (
            <SlideUpItem
              key={getId(item)}
              data={item}
              onClick={onItemSelect}
              selected={selected === item}
            />
          ))}
      </SlideUpCard>
    </>
  )
}

export default SlideUp
