import { Dropdown as ADropdown, DropDownProps } from 'antd'
import styled from 'styled-components'
import { spacingIncrement } from '../../common-utils'
import Icon from '../Icon'

type Props = {
  iconHeight?: number
  iconWidth?: number
}

const StyledDropdown = styled(ADropdown)<DropDownProps>``

const Handler = styled.button<{ visible?: boolean }>`
  align-items: center;
  background-color: ${({ theme, visible }): string =>
    theme.color[visible ? 'neutral7' : 'transparent']};
  border: solid 1px ${({ theme }): string => theme.color.neutral7};
  border-radius: ${({ theme: { borderRadius } }): string => borderRadius.md};
  color: ${({ theme }): string => theme.color.neutral1};
  cursor: pointer;
  display: flex;
  gap: ${spacingIncrement(8)};
  height: ${spacingIncrement(40)};
  justify-content: space-between;
  line-height: 1;
  padding: ${spacingIncrement(8)} ${spacingIncrement(11)};
  :hover {
    border-color: ${({ theme, visible }): string => theme.color[visible ? 'neutral7' : 'neutral5']};
  }
`

const Dropdown: React.FC<Props & DropDownProps> = ({
  iconHeight = 16,
  iconWidth = 16,
  children,
  visible,
  ...props
}) => (
  // eslint-disable-next-line react/jsx-props-no-spreading
  <StyledDropdown visible={visible} {...props}>
    <Handler visible={visible}>
      {children}
      <Icon
        name={visible ? 'chevron-up' : 'chevron-down'}
        width={spacingIncrement(iconWidth)}
        height={spacingIncrement(iconHeight)}
        color="neutral1"
      />
    </Handler>
  </StyledDropdown>
)

export default Dropdown
