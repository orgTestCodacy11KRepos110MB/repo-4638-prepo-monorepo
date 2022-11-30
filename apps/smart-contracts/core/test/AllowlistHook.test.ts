import { expect } from 'chai'
import { ethers } from 'hardhat'
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/dist/src/signer-with-address'
import { ZERO_ADDRESS } from 'prepo-constants'
import { allowlistHookFixture } from './fixtures/HookFixture'
import { AllowlistHook } from '../typechain/AllowlistHook'

describe('=> AllowlistHook', () => {
  let allowlistHook: AllowlistHook
  let deployer: SignerWithAddress
  let user: SignerWithAddress
  let allowlist: SignerWithAddress

  beforeEach(async () => {
    ;[deployer, user, allowlist] = await ethers.getSigners()
    allowlistHook = await allowlistHookFixture()
  })

  describe('# initialize', () => {
    it('initializes allowlist to zero address', async () => {
      expect(await allowlistHook.getAllowlist()).to.eq(ZERO_ADDRESS)
    })
  })

  describe('# setAllowlist', () => {
    it('sets to non-zero address', async () => {
      expect(await allowlistHook.getAllowlist()).to.eq(ZERO_ADDRESS)

      await allowlistHook.setAllowlist(allowlist.address)

      expect(await allowlistHook.getAllowlist()).to.eq(allowlist.address)
    })

    it('sets to zero address', async () => {
      await allowlistHook.setAllowlist(allowlist.address)
      expect(await allowlistHook.getAllowlist()).to.eq(allowlist.address)

      await allowlistHook.setAllowlist(ZERO_ADDRESS)

      expect(await allowlistHook.getAllowlist()).to.eq(ZERO_ADDRESS)
    })

    it('is idempotent if non-zero address', async () => {
      await allowlistHook.setAllowlist(allowlist.address)
      expect(await allowlistHook.getAllowlist()).to.eq(allowlist.address)

      await allowlistHook.setAllowlist(allowlist.address)

      expect(await allowlistHook.getAllowlist()).to.eq(allowlist.address)
    })

    it('is idempotent if zero address', async () => {
      expect(await allowlistHook.getAllowlist()).to.eq(ZERO_ADDRESS)

      await allowlistHook.setAllowlist(ZERO_ADDRESS)

      expect(await allowlistHook.getAllowlist()).to.eq(ZERO_ADDRESS)
    })

    it('emits AllowlistChange', async () => {
      await expect(allowlistHook.setAllowlist(allowlist.address))
        .to.emit(allowlistHook, 'AllowlistChange')
        .withArgs(allowlist.address)
    })
  })
})
