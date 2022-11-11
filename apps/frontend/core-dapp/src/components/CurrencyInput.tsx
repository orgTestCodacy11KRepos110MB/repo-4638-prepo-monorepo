import { InputProps } from 'antd'
import { Flex, Icon, IconName } from 'prepo-ui'
import { displayDecimals } from 'prepo-utils'
import { useMemo, useState } from 'react'
import styled, { css, DefaultTheme, FlattenInterpolation, ThemeProps } from 'styled-components'

export type CurrencyType = { icon: IconName; text: string }

type Props = {
  balance?: string
  isBalanceZero?: boolean
  disabled?: boolean
  onChange?: (e: string) => void
  showBalance?: boolean
}

const Balance = styled(Flex)`
  color: #6a7271;
  font-size: 14px;
  font-weight: 500;
`

const MaxButton = styled.button`
  align-items: center;
  background: rgba(155, 157, 255, 0.25);
  border: none;
  border-radius: 12px;
  color: ${({ theme }): string => theme.color.dartkPrimaryLight};
  cursor: ${({ disabled }): string => (disabled ? 'not-allowed' : 'pointer')};
  display: flex;
  font-size: 11px;
  font-weight: 500;
  height: 16px;
  margin-left: 4px;
  padding: 2px 6px;
`

const Wrapper = styled(Flex)<{ disabled?: boolean }>`
  border: 1px solid ${({ theme }): string => theme.color.neutral12};
  cursor: ${({ disabled }): string => (disabled ? 'not-allowed' : 'auto')};
  :hover {
    border: 1px solid
      ${({ disabled, theme }): string => theme.color[disabled ? 'neutral12' : 'neutral7']};
  }
`

const StyledInput = styled.input<{ disabled?: boolean }>`
  background: transparent;
  border: none;
  color: ${({ theme }): string => theme.color.neutral1};
  cursor: ${({ disabled }): string => (disabled ? 'not-allowed' : 'auto')};
  font-size: ${({ theme }): string => theme.fontSize['2xl']};
  font-weight: ${({ theme }): number => theme.fontWeight.regular};
  min-width: 40px;
  text-overflow: ellipsis;
  &:focus {
    outline: none;
  }
`
const FlexText = styled(Flex)<{ disabled?: boolean }>`
  color: ${({ theme }): string => theme.color.neutral1};
  font-size: 18px;
  font-weight: 500;
  ${({ disabled }): FlattenInterpolation<ThemeProps<DefaultTheme>> =>
    disabled
      ? css`
          -khtml-user-select: none; /* Konqueror HTML */
          -moz-user-select: none; /* Old versions of Firefox */
          -ms-user-select: none; /* Internet Explorer/Edge */
          -webkit-touch-callout: none; /* iOS Safari */
          -webkit-user-select: none; /* Safari */
          user-select: none; /* Non-prefixed version, currently supported by Chrome, Edge, Opera and Firefox */
        `
      : css``}
`

const Currency: React.FC<{ disabled?: boolean } & CurrencyType> = ({ disabled, icon, text }) => (
  <FlexText
    disabled={disabled}
    borderRadius={16}
    p={8}
    pr={12}
    background="neutral13"
    gap={8}
    height={40}
  >
    <Icon name={icon} height="24px" width="24px" />
    {text}
  </FlexText>
)

const CurrencyInput: React.FC<
  Omit<InputProps, 'onChange'> &
    Props & {
      currency: CurrencyType
    }
> = ({
  balance,
  disabled,
  isBalanceZero,
  onFocus,
  onBlur,
  placeholder,
  value,
  onChange,
  currency,
  children,
  showBalance,
}) => {
  const [focused, setFocused] = useState(false)

  const handleFocus = (e: React.FocusEvent<HTMLInputElement, Element>): void => {
    setFocused(true)
    if (onFocus) onFocus(e)
  }

  const handleMax = (): void => {
    if (onChange && balance !== undefined) onChange(balance)
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    try {
      if (onChange) onChange(e.target.value)
    } catch (error) {
      // invalid input
    }
  }
  const handleBlur = (e: React.FocusEvent<HTMLInputElement, Element>): void => {
    setFocused(false)
    if (onBlur) onBlur(e)
  }

  const inputValue = useMemo(() => {
    if (value === undefined || value === '') return ''
    const valueParts = `${value}`.split('.')
    // only format significant number so we can remain the long decimals
    const formattedSignificantNumber = Number(valueParts[0]).toLocaleString()
    if (focused) return value
    if (valueParts[1] && valueParts.length > 0)
      return `${formattedSignificantNumber}.${valueParts[1]}`
    return formattedSignificantNumber
  }, [focused, value])

  return (
    <Wrapper
      opacity={disabled ? 0.6 : 1}
      background="neutral12"
      borderRadius={20}
      p={16}
      alignItems="stretch"
      flexDirection="column"
      gap={4}
      disabled={disabled}
    >
      <Flex justifyContent="space-between">
        <StyledInput
          disabled={disabled}
          onFocus={handleFocus}
          onBlur={handleBlur}
          placeholder={placeholder}
          value={inputValue}
          onChange={handleInputChange}
        />
        <Currency disabled={disabled} icon={currency.icon} text={currency.text} />
      </Flex>
      {showBalance && (
        <Balance alignSelf="flex-end" height={16}>
          {balance !== undefined && !disabled && (
            <>
              {`Balance: ${displayDecimals(balance)}`}
              {inputValue !== balance && !isBalanceZero && (
                <MaxButton disabled={disabled} onClick={handleMax}>
                  MAX
                </MaxButton>
              )}
            </>
          )}
        </Balance>
      )}
      {children}
    </Wrapper>
  )
}

export default CurrencyInput
