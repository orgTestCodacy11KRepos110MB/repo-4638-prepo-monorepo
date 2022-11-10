import { observer } from 'mobx-react-lite'
import styled from 'styled-components'
import Dropdown from './Dropdown'
import Menu from './Menu'
import MarketIconTitle from './MarketIconTitle'
import { MarketEntity } from '../stores/entities/MarketEntity'
import { useRootStore } from '../context/RootStoreProvider'

type Props = {
  label?: string
  selectedMarket?: MarketEntity
  onSelectMarket?: (key: string) => unknown
}

const SelectMarketText = styled.p`
  color: ${({ theme }): string => theme.color.neutral3};
  font-size: ${({ theme }): string => theme.fontSize.base};
  margin-bottom: 0;
`

const MarketDropdown: React.FC<Props> = ({
  label = 'Select Market',
  onSelectMarket,
  selectedMarket,
}) => {
  const { marketStore } = useRootStore()
  const { markets } = marketStore
  const onClick = ({ key }: { key: string }): void => {
    if (typeof onSelectMarket === 'function') onSelectMarket(key)
  }
  const getMarketsDropdownMenu = (
    <Menu
      size="md"
      onClick={onClick}
      items={Object.values(markets).map((market) => ({
        key: market.urlId,
        label: (
          <MarketIconTitle iconName={market.iconName} size="sm">
            {market.name}
          </MarketIconTitle>
        ),
      }))}
    />
  )

  return (
    <Dropdown label={label} overlay={getMarketsDropdownMenu} variant="outline" size="md">
      {selectedMarket ? (
        <MarketIconTitle iconName={selectedMarket.iconName} size="sm">
          {selectedMarket.name}
        </MarketIconTitle>
      ) : (
        <SelectMarketText>Select a Market</SelectMarketText>
      )}
    </Dropdown>
  )
}

export default observer(MarketDropdown)
