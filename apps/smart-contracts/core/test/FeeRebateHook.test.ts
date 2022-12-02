import chai, { expect } from 'chai'
import { ethers } from 'hardhat'
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/dist/src/signer-with-address'
import { id } from 'ethers/lib/utils'
import { smock } from '@defi-wonderland/smock'
import { ZERO_ADDRESS } from 'prepo-constants'
import { feeRebateHookFixture } from './fixtures/HookFixture'
import { grantAndAcceptRole } from './utils'
import { FeeRebateHook } from '../typechain'

chai.use(smock.matchers)

describe('=> FeeRebateHook', () => {
  let feeRebateHook: FeeRebateHook
  let deployer: SignerWithAddress
  let user: SignerWithAddress
  let treasury: SignerWithAddress
  let tokenSender: SignerWithAddress

  beforeEach(async () => {
    ;[deployer, user, treasury, tokenSender] = await ethers.getSigners()
    feeRebateHook = await feeRebateHookFixture()
  })

  describe('initial state', () => {
    it('does not set treasury', async () => {
      expect(await feeRebateHook.getTreasury()).to.eq(ZERO_ADDRESS)
    })
  })

  describe('# setTreasury', () => {
    it('sets treasury to non-zero address', async () => {
      await feeRebateHook.connect(deployer).setTreasury(treasury.address)

      expect(await feeRebateHook.getTreasury()).to.eq(treasury.address)
    })

    it('sets treasury to zero address', async () => {
      await feeRebateHook.connect(deployer).setTreasury(ZERO_ADDRESS)

      expect(await feeRebateHook.getTreasury()).to.eq(ZERO_ADDRESS)
    })

    it('is idempotent', async () => {
      await feeRebateHook.connect(deployer).setTreasury(treasury.address)
      expect(await feeRebateHook.getTreasury()).to.eq(treasury.address)

      await feeRebateHook.connect(deployer).setTreasury(treasury.address)

      expect(await feeRebateHook.getTreasury()).to.eq(treasury.address)
    })

    it('emits TreasuryChange event', async () => {
      await expect(feeRebateHook.connect(deployer).setTreasury(treasury.address))
        .to.emit(feeRebateHook, 'TreasuryChange')
        .withArgs(treasury.address)
    })
  })

  describe('# setTokenSender', () => {
    it('sets non-zero address', async () => {
      await feeRebateHook.connect(deployer).setTokenSender(tokenSender.address)

      expect(await feeRebateHook.getTokenSender()).to.eq(tokenSender.address)
    })

    it('sets zero address', async () => {
      await feeRebateHook.connect(deployer).setTokenSender(ZERO_ADDRESS)

      expect(await feeRebateHook.getTokenSender()).to.eq(ZERO_ADDRESS)
    })

    it('is idempotent', async () => {
      await feeRebateHook.connect(deployer).setTokenSender(tokenSender.address)
      expect(await feeRebateHook.getTokenSender()).to.eq(tokenSender.address)

      await feeRebateHook.connect(deployer).setTokenSender(tokenSender.address)

      expect(await feeRebateHook.getTokenSender()).to.eq(tokenSender.address)
    })

    it('emits TokenSenderChange event', async () => {
      await expect(feeRebateHook.connect(deployer).setTokenSender(tokenSender.address))
        .to.emit(feeRebateHook, 'TokenSenderChange')
        .withArgs(tokenSender.address)
    })
  })
})
