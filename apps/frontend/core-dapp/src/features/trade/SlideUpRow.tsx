import { observer } from 'mobx-react-lite'
import { Flex, Icon, spacingIncrement } from 'prepo-ui'
import styled from 'styled-components'
import Skeleton from '../../components/Skeleton'
import { MarketEntity } from '../../stores/entities/MarketEntity'

type Props = {
  className?: string
  onClick?: () => void
  selected?: boolean
  market: MarketEntity
}

const Wrapper = styled.div<{ $selected?: boolean }>`
  align-items: center;
  border: ${({ $selected, theme }): string =>
    `solid 2px ${theme.color[$selected ? 'success' : 'transparent']}`};
  border-radius: ${({ theme }): string => theme.borderRadius.base};
  cursor: pointer;
  display: flex;
  gap: ${spacingIncrement(16)};
  justify-content: space-between;
  padding: ${spacingIncrement(6)} ${spacingIncrement(8)};
  width: 100%;
  :hover {
    background-color: ${({ theme }): string => theme.color.accentPrimary};
  }
`

const Name = styled.p`
  color: ${({ theme }): string => theme.color.secondary};
  font-size: ${({ theme }): string => theme.fontSize.md};
  font-weight: ${({ theme }): number => theme.fontWeight.semiBold};
  line-height: 1.2;
`

const Valuation = styled.p`
  color: ${({ theme }): string => theme.color.neutral3};
  font-size: ${({ theme }): string => theme.fontSize.sm};
  font-weight: ${({ theme }): number => theme.fontWeight.medium};
  line-height: 1.2;
`

const SlideUpRow: React.FC<Props> = ({ className, selected, onClick, market }) => (
  <Wrapper className={className} onClick={onClick} $selected={selected}>
    <Flex gap={16} alignItems="center" justifyContent="center">
      <Flex position="relative">
        <Icon name={market.iconName} height="48" width="48" />
        {selected && (
          <Flex
            color="white"
            bg="success"
            position="absolute"
            bottom={0}
            right={0}
            width={16}
            height={16}
            borderRadius={16}
          >
            <Icon name="check" width="12" height="12" />
          </Flex>
        )}
      </Flex>
      <Flex flexDirection="column" alignItems="start" justifyContent="center">
        <Name>{market.name}</Name>
        {market.estimatedValuation !== undefined ? (
          <Valuation>
            $
            {Intl.NumberFormat(undefined, {
              notation: 'compact',
              maximumFractionDigits: 2,
            }).format(market.estimatedValuation.value)}
          </Valuation>
        ) : (
          <Skeleton width={60} height={16} />
        )}
      </Flex>
    </Flex>
  </Wrapper>
)

export default observer(SlideUpRow)
