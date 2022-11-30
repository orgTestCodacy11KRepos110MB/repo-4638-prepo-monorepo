import chai, { expect } from 'chai'
import { ethers } from 'hardhat'
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/dist/src/signer-with-address'
import { smock } from '@defi-wonderland/smock'
import { allowedCallersFixture } from './fixtures/AllowedCallersFixture'
import { AllowedCallers } from '../typechain'

chai.use(smock.matchers)

describe('=> AllowedCallers', () => {
  let allowedCallers: AllowedCallers
  let deployer: SignerWithAddress
  let user: SignerWithAddress
  let user2: SignerWithAddress

  beforeEach(async () => {
    ;[deployer, user, user2] = await ethers.getSigners()
    allowedCallers = await allowedCallersFixture()
  })

  describe('initial state', () => {
    it('has no allowed accounts', async () => {
      expect(await allowedCallers.isCallerAllowed(deployer.address)).to.be.false
    })
  })

  describe('# setAllowedCallers', () => {
    it('reverts if array length mismatch', async () => {
      await expect(
        allowedCallers.setAllowedCallers([user.address], [true, false])
      ).to.be.revertedWith('Array length mismatch')
    })

    it('reverts if empty callers array', async () => {
      await expect(allowedCallers.setAllowedCallers([], [true])).to.be.revertedWith('Empty array')
    })

    it('reverts if empty allowed array', async () => {
      await expect(allowedCallers.setAllowedCallers([user.address], [])).to.be.revertedWith(
        'Empty array'
      )
    })

    it('reverts if both arrays empty', async () => {
      await expect(allowedCallers.setAllowedCallers([], [])).to.be.revertedWith('Empty array')
    })

    it('sets account as allowed', async () => {
      expect(await allowedCallers.isCallerAllowed(user.address)).to.be.false

      await allowedCallers.setAllowedCallers([user.address], [true])

      expect(await allowedCallers.isCallerAllowed(user.address)).to.be.true
    })

    it('sets multiple accounts as allowed', async () => {
      expect(await allowedCallers.isCallerAllowed(user.address)).to.be.false
      expect(await allowedCallers.isCallerAllowed(user2.address)).to.be.false

      await allowedCallers.setAllowedCallers([user.address, user2.address], [true, true])

      expect(await allowedCallers.isCallerAllowed(user.address)).to.be.true
      expect(await allowedCallers.isCallerAllowed(user2.address)).to.be.true
    })

    it('sets account as disallowed', async () => {
      await allowedCallers.setAllowedCallers([user.address], [true])
      expect(await allowedCallers.isCallerAllowed(user.address)).to.be.true

      await allowedCallers.setAllowedCallers([user.address], [false])

      expect(await allowedCallers.isCallerAllowed(user.address)).to.be.false
    })

    it('sets multiple accounts as disallowed', async () => {
      await allowedCallers.setAllowedCallers([user.address, user2.address], [true, true])
      expect(await allowedCallers.isCallerAllowed(user.address)).to.be.true
      expect(await allowedCallers.isCallerAllowed(user2.address)).to.be.true

      await allowedCallers.setAllowedCallers([user.address, user2.address], [false, false])

      expect(await allowedCallers.isCallerAllowed(user.address)).to.be.false
      expect(await allowedCallers.isCallerAllowed(user2.address)).to.be.false
    })

    it('disallows previously allowed account and allows new account', async () => {
      await allowedCallers.setAllowedCallers([user.address], [true])
      expect(await allowedCallers.isCallerAllowed(user.address)).to.be.true
      expect(await allowedCallers.isCallerAllowed(user2.address)).to.be.false

      await allowedCallers.setAllowedCallers([user.address, user2.address], [false, true])

      expect(await allowedCallers.isCallerAllowed(user.address)).to.be.false
      expect(await allowedCallers.isCallerAllowed(user2.address)).to.be.true
    })

    it('is idempotent if single account', async () => {
      await allowedCallers.setAllowedCallers([user.address], [true])
      expect(await allowedCallers.isCallerAllowed(user.address)).to.be.true

      await allowedCallers.setAllowedCallers([user.address], [true])

      expect(await allowedCallers.isCallerAllowed(user.address)).to.be.true
    })

    it('is idempotent if multiple accounts', async () => {
      await allowedCallers.setAllowedCallers([user.address, user2.address], [true, true])
      expect(await allowedCallers.isCallerAllowed(user.address)).to.be.true
      expect(await allowedCallers.isCallerAllowed(user2.address)).to.be.true

      await allowedCallers.setAllowedCallers([user.address, user2.address], [true, true])

      expect(await allowedCallers.isCallerAllowed(user.address)).to.be.true
      expect(await allowedCallers.isCallerAllowed(user2.address)).to.be.true
    })

    it('is idempotent if allowed account and disallowed account', async () => {
      await allowedCallers.setAllowedCallers([user.address, user2.address], [true, false])
      expect(await allowedCallers.isCallerAllowed(user.address)).to.be.true
      expect(await allowedCallers.isCallerAllowed(user2.address)).to.be.false

      await allowedCallers.setAllowedCallers([user.address, user2.address], [true, false])

      expect(await allowedCallers.isCallerAllowed(user.address)).to.be.true
      expect(await allowedCallers.isCallerAllowed(user2.address)).to.be.false
    })

    it('emits AllowedCallersChange', async () => {
      await expect(allowedCallers.setAllowedCallers([user.address], [true]))
        .to.emit(allowedCallers, 'AllowedCallersChange')
        .withArgs([user.address], [true])
    })

    it('emits AllowedCallersChange once for multiple accounts', async () => {
      await expect(allowedCallers.setAllowedCallers([user.address, user2.address], [true, true]))
        .to.emit(allowedCallers, 'AllowedCallersChange')
        .withArgs([user.address, user2.address], [true, true])
    })
  })
})
