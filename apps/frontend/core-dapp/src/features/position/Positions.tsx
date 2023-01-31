import { Box, Button, Flex, Typography } from 'prepo-ui'
import { observer } from 'mobx-react-lite'
import { t, Trans } from '@lingui/macro'
import ClosePositionSummary from './ClosePositionSummary'
import { useRootStore } from '../../context/RootStoreProvider'
import { Routes } from '../../lib/routes'
import Record, { RecordSkeleton } from '../portfolio/Record'

const Positions: React.FC = () => {
  const { portfolioStore, web3Store } = useRootStore()
  const { userPositions, selectedPosition, setSelectedPosition } = portfolioStore
  const { connected } = web3Store

  if (!connected)
    return (
      <Flex p={24} flexDirection="column">
        <Typography color="neutral3" mb={12} textAlign="center" variant="text-regular-base">
          <Trans>Your wallet is not connected.</Trans>
        </Typography>
      </Flex>
    )

  if (userPositions === undefined)
    return (
      <Box position="relative">
        <RecordSkeleton />
        <RecordSkeleton />
        <RecordSkeleton />
      </Box>
    )

  if (userPositions.length === 0)
    return (
      <Flex p={24} flexDirection="column">
        <Typography color="neutral3" mb={12} variant="text-regular-base">
          <Trans>No position found!</Trans>
        </Typography>
        <Button type="primary" size="sm" href={Routes.Markets}>
          <Trans>Trade Now</Trans>
        </Button>
      </Flex>
    )

  return (
    <Box position="relative">
      {userPositions.map((position) => (
        <Record
          key={position.id}
          iconName={position.market.iconName}
          name={position.market.name}
          nameRedirectUrl={`/markets/${position.market.urlId}/trade`}
          position={position.direction}
          buttonLabel={t`Close Position`}
          buttonStyles={{
            backgroundColor: 'primaryAccent',
            color: 'primaryWhite',
          }}
          data={[
            {
              label: 'PNL',
              amount: position.totalPnl,
              percent: position.positionGrowthPercentage,
            },
            {
              label: t`Total Value`,
              amount: position.totalValue,
              usd: true,
            },
          ]}
          onButtonClicked={(): void => setSelectedPosition(position)}
        />
      ))}
      {selectedPosition && <ClosePositionSummary position={selectedPosition} />}
    </Box>
  )
}

export default observer(Positions)
