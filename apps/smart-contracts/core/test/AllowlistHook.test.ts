import { expect } from 'chai'
import { ethers } from 'hardhat'
import { id } from 'ethers/lib/utils'
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/dist/src/signer-with-address'
import { grantAndAcceptRole } from './utils'
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
    await grantAndAcceptRole(
      allowlistHook,
      deployer,
      deployer,
      await allowlistHook.SET_ALLOWLIST_ROLE()
    )
  })

  describe('# initialize', () => {
    it('should be initialized with no allowlist set', async () => {
      expect(await allowlistHook.getAllowlist()).to.eq(ethers.constants.AddressZero)
    })

    it('sets role constants to the correct hash', async () => {
      expect(await allowlistHook.SET_ALLOWLIST_ROLE()).to.eq(
        id('AllowlistHook_setAllowlist(IAccountList)')
      )
    })
  })

  describe('# setAllowlist', () => {
    it('reverts if not role holder', async () => {
      expect(
        await allowlistHook.hasRole(await allowlistHook.SET_ALLOWLIST_ROLE(), user.address)
      ).to.eq(false)

      await expect(allowlistHook.connect(user).setAllowlist(allowlist.address)).revertedWith(
        `AccessControl: account ${user.address.toLowerCase()} is missing role ${await allowlistHook.SET_ALLOWLIST_ROLE()}`
      )
    })

    it('sets to non-zero address', async () => {
      expect(await allowlistHook.getAllowlist()).to.eq(ethers.constants.AddressZero)

      await allowlistHook.setAllowlist(allowlist.address)

      expect(await allowlistHook.getAllowlist()).to.eq(allowlist.address)
    })

    it('sets to zero address', async () => {
      await allowlistHook.setAllowlist(allowlist.address)
      expect(await allowlistHook.getAllowlist()).to.eq(allowlist.address)

      await allowlistHook.setAllowlist(ethers.constants.AddressZero)

      expect(await allowlistHook.getAllowlist()).to.eq(ethers.constants.AddressZero)
    })

    it('is idempotent for non-zero address', async () => {
      await allowlistHook.setAllowlist(allowlist.address)
      expect(await allowlistHook.getAllowlist()).to.eq(allowlist.address)

      await allowlistHook.setAllowlist(allowlist.address)

      expect(await allowlistHook.getAllowlist()).to.eq(allowlist.address)
    })

    it('is idempotent for zero address', async () => {
      expect(await allowlistHook.getAllowlist()).to.eq(ethers.constants.AddressZero)

      await allowlistHook.setAllowlist(ethers.constants.AddressZero)

      expect(await allowlistHook.getAllowlist()).to.eq(ethers.constants.AddressZero)
    })

    it('emits event', async () => {
      await expect(allowlistHook.setAllowlist(allowlist.address))
        .to.emit(allowlistHook, 'AllowlistChange')
        .withArgs(allowlist.address)
    })
  })
})
