import { useState } from 'react'
import styled from 'styled-components'
import { observer } from 'mobx-react-lite'
import { CopyToClipboard } from 'react-copy-to-clipboard'
import { Button, Flex, Icon } from 'prepo-ui'
import { SEC_IN_MS } from 'prepo-constants'
import Identicon from './Identicon'
import Modal from '../../components/Modal'
import { useRootStore } from '../../context/RootStoreProvider'

const Address = styled.p`
  color: ${({ theme }): string => theme.color.secondary};
  font-size: ${({ theme }): string => theme.fontSize.lg};
  font-weight: ${({ theme }): number => theme.fontWeight.medium};
  margin-bottom: 0;
`

const StyledModal = styled(Modal)`
  max-width: 418px;
  width: 100% !important;
  &&&& {
    .ant-modal-content {
      border-radius: 20px;
      max-width: 418px;
      padding: 16px;
    }
    .ant-modal-close {
      right: 16px;
      top: 16px;
    }
    .ant-modal-header {
      color: ${({ theme }): string => theme.color.secondary};
      font-size: ${({ theme }): string => theme.fontSize.base};
      padding: 0px;
      padding-bottom: 16px;
    }
    .ant-modal-body {
      border: 1px solid #ced0d9; /** Uniswap's color */
      border-radius: 20px;
      display: flex;
      flex-direction: column;
      padding: 16px;
    }
  }
`

const StyledButton = styled(Button)`
  &&&& button {
    border-radius: 12px;
    font-weight: 400;
    height: 24px;
    padding: 4px 6px;
    * svg {
      margin-right: 4px;
    }
  }
`

const StyledIconButton = styled(StyledButton)`
  &&&& button {
    padding: 0;
    &:hover {
      background: transparent;
    }
  }
`

const StyledLinkButton = styled(Button)`
  border-radius: 12px;
  color: ${({ theme }): string => theme.color.neutral3};
  font-weight: 400;
  height: 24px;
  padding: 0;
  div {
    margin-right: 4px;
  }
  &:hover {
    background: transparent;
    color: ${({ theme }): string => theme.color.neutral1};
  }
`

const SubTitle = styled.div`
  color: ${({ theme }): string => theme.color.neutral1};
  font-size: ${({ theme }): string => theme.fontSize.sm};
  font-weight: ${({ theme }): number => theme.fontWeight.medium};
`

const ModalSection = styled.div`
  align-items: center;
  display: flex;
  justify-content: space-between;
`

const AccountModal: React.FC = () => {
  const { uiStore, web3Store } = useRootStore()
  const [copied, setCopied] = useState(false)
  const { accountModalOpen } = uiStore
  const {
    onboardEns,
    signerState: { address },
    walletState,
  } = web3Store

  const onClose = (): void => {
    uiStore.setAccountModalOpen(false)
  }

  const handleDeactivateAccount = (): void => {
    web3Store.disconnect()
    onClose()
  }

  const handleChangeAccount = (): void => {
    uiStore.setAccountModalOpen(false)
    web3Store.connect()
  }

  const handleCopied = (): void => {
    if (copied) return
    setCopied(true)
    setTimeout(() => {
      setCopied(false)
    }, SEC_IN_MS)
  }

  return (
    <StyledModal
      title="Account"
      titleAlign="left"
      centered={false}
      visible={accountModalOpen}
      onOk={onClose}
      onCancel={onClose}
      footer={null}
    >
      <Flex gap={12} flexDirection="column" alignItems="stretch">
        <ModalSection>
          <SubTitle>Connected to {walletState?.label}</SubTitle>
          <Flex gap={8}>
            <StyledButton size="xs" onClick={handleDeactivateAccount}>
              Disconnect
            </StyledButton>
            <StyledButton size="xs" onClick={handleChangeAccount}>
              Change
            </StyledButton>
          </Flex>
        </ModalSection>
        <ModalSection>
          <Flex gap={8}>
            <Identicon
              account={address ?? ''}
              avatarUrl={onboardEns?.avatar?.url}
              diameterDesktop={16}
              diameterMobile={16}
            />
            <Address>
              {address &&
                `${address.slice(0, 6)}...${address.slice(address.length - 4, address.length)}`}
            </Address>
          </Flex>
        </ModalSection>
        <ModalSection>
          <Flex gap={16}>
            <CopyToClipboard onCopy={handleCopied} text={address ?? ''}>
              <StyledIconButton
                icon={
                  <Icon
                    name={copied ? 'check-icon' : 'copy'}
                    height="16"
                    width="16"
                    color={copied ? 'success' : undefined}
                  />
                }
                type="text"
                size="xs"
              >
                {copied ? 'Copied!' : 'Copy Address'}
              </StyledIconButton>
            </CopyToClipboard>
            <StyledLinkButton
              icon={<Icon name="share" height="16" width="16" />}
              type="text"
              size="xs"
              href={web3Store.getBlockExplorerUrl(address ?? '')}
              target="_blank"
            >
              View on Explorer
            </StyledLinkButton>
          </Flex>
        </ModalSection>
      </Flex>
    </StyledModal>
  )
}

export default observer(AccountModal)
