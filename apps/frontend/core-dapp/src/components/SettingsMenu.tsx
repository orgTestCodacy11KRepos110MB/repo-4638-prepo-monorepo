import { Dropdown, Flex, Icon, IconName, spacingIncrement, ThemeModes } from 'prepo-ui'
import { observer } from 'mobx-react-lite'
import Link from 'next/link'
import styled from 'styled-components'
import { useState } from 'react'
import { useRootStore } from '../context/RootStoreProvider'
import { getShortAccount } from '../utils/account-utils'
import { Routes } from '../lib/routes'
import Identicon from '../features/connect/Identicon'

const externalLinks = [{ link: 'https://docs.prepo.io/', name: 'Documentation' }]

type MenuItemProps = {
  iconName: IconName
  href?: string
  external?: boolean
  onClick?: () => void
}

const MenuWrapper = styled.div`
  background-color: ${({ theme }): string => theme.color.neutral10};
  border-radius: ${({ theme }): string => theme.borderRadius.base};
  box-shadow: 0px 4px 22px rgba(98, 100, 217, 0.11);
  display: flex;
  flex-direction: column;
  gap: ${spacingIncrement(12)};
  margin-top: ${spacingIncrement(12)};
  padding: ${spacingIncrement(20)} 0;
  width: ${spacingIncrement(200)};
`

const MenuItemWrapper = styled.div`
  align-items: center;
  display: flex;
  padding: 0 ${spacingIncrement(18)};
`

const MenuItemButton = styled.button<{ external?: boolean }>`
  align-items: center;
  background-color: ${({ theme }): string => theme.color.neutral10};
  border: none;
  border-radius: ${({ theme }): string => theme.borderRadius.xs};
  color: ${({ theme }): string => theme.color.neutral1};
  cursor: pointer;
  display: flex;
  font-size: ${({ theme, external }): string => theme.fontSize[external ? 'xs' : 'sm']};
  font-weight: ${({ theme }): number => theme.fontWeight.medium};
  justify-content: space-between;
  padding: ${spacingIncrement(6)};
  width: 100%;
  :hover {
    background-color: ${({ theme }): string => theme.color.accentPrimary};
    color: ${({ theme }): string => theme.color.primary};
  }
`

const Divider = styled.div`
  padding: 0px 24px;
  width: 100%;
  ::after {
    background-color: ${({ theme }): string => theme.color.purpleStroke};
    content: '';
    display: block;
    height: ${spacingIncrement(1)};
    width: 100%;
  }
`

const MenuItem: React.FC<MenuItemProps> = ({ children, external, iconName, href, onClick }) => {
  const iconSize = external ? '14px' : '18px'
  const linkProps = external ? { target: '_blank', rel: 'noreferrer' } : {}

  const menuButton = (
    <MenuItemButton external={external} onClick={onClick}>
      {children}
      <Icon name={iconName} height={iconSize} width={iconSize} />
    </MenuItemButton>
  )
  if (href)
    return (
      <MenuItemWrapper onClick={onClick}>
        <Link href={href} passHref>
          <a href={href} {...linkProps} style={{ width: '100%' }}>
            {menuButton}
          </a>
        </Link>
      </MenuItemWrapper>
    )
  return <MenuItemWrapper>{menuButton}</MenuItemWrapper>
}

const SettingsCard: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const { web3Store, uiStore } = useRootStore()
  const { selectedTheme, setTheme } = uiStore
  const { address } = web3Store
  const isDarkTheme = selectedTheme === ThemeModes.Dark

  const toggleTheme = (): void => {
    setTheme(selectedTheme === ThemeModes.Dark ? ThemeModes.Light : ThemeModes.Dark)
  }

  return (
    <MenuWrapper>
      <Flex gap={8} flexDirection="column" alignItems="stretch">
        {address !== undefined ? <Flex>{getShortAccount(address)}</Flex> : null}
        <MenuItem href={Routes.Portfolio} iconName="portfolio" onClick={onClose}>
          Portfolio
        </MenuItem>
        <MenuItem iconName="chevron-right">English</MenuItem>
        <MenuItem iconName={isDarkTheme ? 'light-theme' : 'dark-theme'} onClick={toggleTheme}>
          {isDarkTheme ? `Light` : 'Dark'} Mode
        </MenuItem>
      </Flex>
      <Divider />
      <Flex gap={8} flexDirection="column" alignItems="stretch">
        {externalLinks.map(({ link, name }) => (
          <MenuItem key={link} iconName="share" href={link} external>
            {name}
          </MenuItem>
        ))}
      </Flex>
    </MenuWrapper>
  )
}

const SettingsMenu: React.FC = () => {
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

export default observer(SettingsMenu)
