import Link from 'next/link'
import { Icon, IconName, spacingIncrement } from 'prepo-ui'
import styled from 'styled-components'

type MenuItemProps = {
  iconName: IconName
  href?: string
  external?: boolean
  onClick?: () => void
}

const Wrapper = styled.div`
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
  p {
    margin-bottom: 0;
  }
`

const SettingsMenuItem: React.FC<MenuItemProps> = ({
  children,
  external,
  iconName,
  href,
  onClick,
}) => {
  const iconSize = external ? '14px' : '18px'
  const linkProps = external ? { target: '_blank', rel: 'noreferrer' } : {}

  const menuButton = (
    <MenuItemButton external={external} onClick={onClick}>
      <p>{children}</p>
      <Icon name={iconName} height={iconSize} width={iconSize} />
    </MenuItemButton>
  )
  if (href)
    return (
      <Wrapper onClick={onClick}>
        <Link href={href} passHref>
          <a href={href} {...linkProps} style={{ width: '100%' }}>
            {menuButton}
          </a>
        </Link>
      </Wrapper>
    )

  return <Wrapper>{menuButton}</Wrapper>
}

export default SettingsMenuItem
