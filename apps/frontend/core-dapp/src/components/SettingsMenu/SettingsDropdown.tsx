import { observer } from 'mobx-react-lite'
import { Dropdown, Flex } from 'prepo-ui'
import { useState } from 'react'
import SettingsCard from './SettingsCard'
import { useRootStore } from '../../context/RootStoreProvider'
import Identicon from '../../features/connect/Identicon'
import { getShortAccount } from '../../utils/account-utils'

const SettingsDropdown: React.FC = () => {
  const { uiStore, web3Store } = useRootStore()
  const { address, onboardEns } = web3Store
  const [visible, setVisible] = useState(false)
  const { showLanguageList } = uiStore

  const handleVisibleChange = (flag: boolean): void => {
    setVisible(flag)
    // always show main menu on open
    if (flag === true && flag === showLanguageList) {
      uiStore.setShowLanguageList(false)
    }
  }

  return (
    <Flex alignSelf="stretch">
      <Dropdown
        visible={visible}
        onVisibleChange={handleVisibleChange}
        destroyPopupOnHide
        trigger={['click']}
        placement="bottomRight"
        overlay={<SettingsCard onClose={(): void => setVisible(false)} />}
      >
        {address ? (
          <Flex gap={8}>
            <Identicon
              account={address}
              avatarUrl={onboardEns?.avatar?.url}
              diameterDesktop={23}
              diameterMobile={23}
            />
            {onboardEns?.name ?? getShortAccount(address)}
          </Flex>
        ) : null}
      </Dropdown>
    </Flex>
  )
}

export default observer(SettingsDropdown)
