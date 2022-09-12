import { Flex, Icon, IconName, spacingIncrement, ThemeModes } from 'prepo-ui'
import { Dropdown, Menu } from 'antd'
import { ItemType } from 'antd/lib/menu/hooks/useItems'
import { observer } from 'mobx-react-lite'
import styled from 'styled-components'
import { useMemo, useState } from 'react'
import { t } from '@lingui/macro'
import { NextRouter, useRouter } from 'next/router'
import Link from 'next/link'
import { i18n } from '@lingui/core'
import { useRootStore } from '../context/RootStoreProvider'
import useResponsive from '../hooks/useResponsive'
import { PREPO_DISCORD, PREPO_TWITTER, PREPO_WEBSITE } from '../lib/constants'
import { UiStore } from '../stores/UiStore'
import useFeatureFlag, { FeatureFlag } from '../hooks/useFeatureFlag'

const StyledDropdown = styled(Dropdown)`
  &&& {
    &.ant-dropdown-trigger {
      align-items: center;
      background-color: transparent;
      border: 1px solid ${({ theme }): string => theme.color.neutral7};
      border-radius: ${({ theme }): string => `${theme.borderRadius}px`};
      cursor: pointer;
      display: flex;
      height: 100%;
      justify-content: center;
      transition: border-color 0.2s ease;
      width: 100%;
      &:hover {
        border-color: ${({ theme }): string => theme.color.neutral5};
      }
    }
  }
`

const StyledMenu = styled(Menu)`
  background: ${({ theme }): string => theme.color.neutral9};
  display: flex;
  flex-direction: column;
  padding: ${spacingIncrement(13)} 0;
  &&& .ant-dropdown-menu-item {
    color: ${({ theme }): string => theme.color.neutral1};
    font-size: ${({ theme }): string => theme.fontSize.sm};
    font-weight: ${({ theme }): number => theme.fontWeight.medium};
    padding: ${spacingIncrement(13)} ${spacingIncrement(30)} ${spacingIncrement(13)}
      ${spacingIncrement(20)};
    width: ${spacingIncrement(200)};
    .ant-dropdown-menu-title-content {
      display: flex;
      justify-content: space-between;
    }
    &:hover {
      background: ${({ theme }): string => theme.color.neutral7};
    }
  }
`

const menuList: Array<{
  label: string
  href?: string
  key?: 'theme' | 'language'
  icon: IconName
  altIcon?: IconName
}> = [
  { label: t`About`, href: PREPO_WEBSITE, icon: 'info-outlined' },
  { label: 'Discord', href: PREPO_DISCORD, icon: 'discord-outlined' },
  { label: 'Twitter', href: PREPO_TWITTER, icon: 'twitter-outlined' },
  { label: t`Docs`, href: 'https://docs.prepo.io/', icon: 'docs-outlined' },
  { label: t`Switch to Dark`, key: 'theme', icon: 'dark-theme', altIcon: 'light-theme' },
  { label: t`Language`, icon: 'language', key: 'language' },
  // TODO: privacy link { label: 'Legal & Privacy', href: '' },
]

const renderItem = (item: typeof menuList[number], uiStore: UiStore): ItemType => {
  const isLink = !!item.href
  const { key } = item
  let { label, icon } = item

  let onClick = (): void => undefined
  if (key === 'theme') {
    if (uiStore.selectedTheme === ThemeModes.Dark) {
      label = t`Switch to Light`
      onClick = (): void => uiStore.setTheme(ThemeModes.Light)
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      icon = item.altIcon!
    } else {
      onClick = (): void => uiStore.setTheme(ThemeModes.Dark)
    }
  } else if (key === 'language') {
    onClick = (): void => {
      uiStore.setShowLanguageList(true)
    }
  }

  return isLink
    ? ({
        label: (
          <>
            <a href={item.href} target="_blank" rel="noreferrer">
              {i18n._(label)}
            </a>
            <Icon name={icon} width="20px" height="20px" color="neutral4" />
          </>
        ),
      } as ItemType)
    : ({
        key,
        onClick,
        label: (
          <>
            {i18n._(label)}
            <Icon name={icon} width="20px" height="20px" color="neutral4" />
          </>
        ),
      } as ItemType)
}

const languageList = [
  { label: 'English', locale: 'en' },
  { label: 'Русский', locale: 'ru' },
]

const renderLangulageList = (
  { locale, label }: typeof languageList[number],
  router: NextRouter
): ItemType =>
  ({
    key: label,
    label: (
      <Link href={router.asPath} locale={locale} passHref={undefined}>
        {label}
      </Link>
    ),
  } as ItemType)

const SettingsMenu: React.FC = () => {
  const { isDesktop } = useResponsive()
  const { uiStore } = useRootStore()
  const [visible, setVisible] = useState(false)
  const { showLanguageList } = uiStore
  const handleVisibleChange = (flag: boolean): void => {
    setVisible(flag)
    // always show main menu on open
    if (flag === true && flag === showLanguageList) {
      uiStore.setShowLanguageList(false)
    }
  }
  const { enabled } = useFeatureFlag(FeatureFlag.enableI18nLocally)
  const menuListFiltered = useMemo(
    () => (enabled ? menuList : menuList.filter((item) => item.key !== 'language')),
    [enabled]
  )
  const router = useRouter()
  const size = isDesktop ? '32px' : '24px'
  const items = showLanguageList
    ? languageList.map((item) => renderLangulageList(item, router))
    : menuListFiltered.map((item) => renderItem(item, uiStore))

  return (
    <Flex alignSelf="stretch" width={38}>
      <StyledDropdown
        visible={visible}
        onVisibleChange={handleVisibleChange}
        destroyPopupOnHide
        trigger={['click']}
        overlay={<StyledMenu items={items} onClick={(): void => setVisible(true)} />}
      >
        <button type="button">
          <Icon name="dots" width={size} height={size} color="neutral1" />
        </button>
      </StyledDropdown>
    </Flex>
  )
}

export default observer(SettingsMenu)
