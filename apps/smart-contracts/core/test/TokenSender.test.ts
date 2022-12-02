import { ethers } from 'hardhat'
import { expect } from 'chai'
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/dist/src/signer-with-address'
import { id } from 'ethers/lib/utils'
import { ZERO_ADDRESS } from 'prepo-constants'
import { tokenSenderFixture } from './fixtures/TokenSenderFixture'
import { testERC20Fixture } from './fixtures/TestERC20Fixture'
import { grantAndAcceptRole } from './utils'
import { TokenSender } from '../typechain/TokenSender'
import { TestERC20 } from '../typechain'

describe('=> TokenSender', () => {
  let tokenSender: TokenSender
  let deployer: SignerWithAddress
  let user: SignerWithAddress
  let outputToken: TestERC20

  beforeEach(async () => {
    ;[deployer, user] = await ethers.getSigners()
    outputToken = await testERC20Fixture('Output Token', 'OUT', 18)
    tokenSender = await tokenSenderFixture(outputToken.address)
    await grantAndAcceptRole(tokenSender, deployer, deployer, await tokenSender.SET_PRICE_ROLE())
    await grantAndAcceptRole(
      tokenSender,
      deployer,
      deployer,
      await tokenSender.SET_PRICE_MULTIPLIER_ROLE()
    )
    await grantAndAcceptRole(
      tokenSender,
      deployer,
      deployer,
      await tokenSender.SET_SCALED_PRICE_LOWER_BOUND_ROLE()
    )
    await grantAndAcceptRole(
      tokenSender,
      deployer,
      deployer,
      await tokenSender.SET_ALLOWED_CALLERS_ROLE()
    )
  })

  describe('# initialize', () => {
    it('sets output token from constructor', async () => {
      expect(await tokenSender.getOutputToken()).to.eq(outputToken.address)
    })
    it('does not set price', async () => {
      expect(await tokenSender.getPrice()).to.eq(ZERO_ADDRESS)
    })
    it('does not set price multiplier', async () => {
      expect(await tokenSender.getPriceMultiplier()).to.eq(0)
    })
    it('does not set scaled price lower bound', async () => {
      expect(await tokenSender.getScaledPriceLowerBound()).to.eq(0)
    })
    it('sets role constants', async () => {
      expect(await tokenSender.SET_PRICE_ROLE()).to.eq(id('TokenSender_setPrice(IUintValue)'))
      expect(await tokenSender.SET_PRICE_MULTIPLIER_ROLE()).to.eq(
        id('TokenSender_setPriceMultiplier(uint256)')
      )
      expect(await tokenSender.SET_SCALED_PRICE_LOWER_BOUND_ROLE()).to.eq(
        id('TokenSender_setScaledPriceLowerBound(uint256)')
      )
      expect(await tokenSender.SET_ALLOWED_CALLERS_ROLE()).to.eq(
        id('TokenSender_setAllowedCallers(address[],bool[])')
      )
    })
  })

  describe('# setPrice', () => {
    it('reverts if not role holder', async () => {
      expect(await tokenSender.hasRole(await tokenSender.SET_PRICE_ROLE(), user.address)).to.eq(
        false
      )

      await expect(tokenSender.connect(user).setPrice(user.address)).revertedWith(
        `AccessControl: account ${user.address.toLowerCase()} is missing role ${await tokenSender.SET_PRICE_ROLE()}`
      )
    })

    it('sets to non-zero address', async () => {
      await tokenSender.setPrice(user.address)

      expect(await tokenSender.getPrice()).to.eq(user.address)
    })

    it('sets to zero address', async () => {
      await tokenSender.setPrice(ZERO_ADDRESS)

      expect(await tokenSender.getPrice()).to.eq(ZERO_ADDRESS)
    })

    it('is idempotent for non-zero address', async () => {
      await tokenSender.setPrice(user.address)
      expect(await tokenSender.getPrice()).to.eq(user.address)

      await tokenSender.setPrice(user.address)

      expect(await tokenSender.getPrice()).to.eq(user.address)
    })

    it('is idempotent for zero address', async () => {
      await tokenSender.setPrice(ZERO_ADDRESS)
      expect(await tokenSender.getPrice()).to.eq(ZERO_ADDRESS)

      await tokenSender.setPrice(ZERO_ADDRESS)

      expect(await tokenSender.getPrice()).to.eq(ZERO_ADDRESS)
    })

    it('emits PriceChange', async () => {
      await expect(tokenSender.setPrice(user.address))
        .to.emit(tokenSender, 'PriceChange')
        .withArgs(user.address)
    })
  })

  describe('# setPriceMultiplier', () => {
    it('reverts if not role holder', async () => {
      expect(
        await tokenSender.hasRole(await tokenSender.SET_PRICE_MULTIPLIER_ROLE(), user.address)
      ).to.eq(false)

      await expect(tokenSender.connect(user).setPriceMultiplier(0)).revertedWith(
        `AccessControl: account ${user.address.toLowerCase()} is missing role ${await tokenSender.SET_PRICE_MULTIPLIER_ROLE()}`
      )
    })

    it('sets to zero', async () => {
      await tokenSender.setPriceMultiplier(0)

      expect(await tokenSender.getPriceMultiplier()).to.eq(0)
    })

    it('sets to non-zero', async () => {
      await tokenSender.setPriceMultiplier(1)

      expect(await tokenSender.getPriceMultiplier()).to.eq(1)
    })

    it('is idempotent for zero', async () => {
      await tokenSender.setPriceMultiplier(0)
      expect(await tokenSender.getPriceMultiplier()).to.eq(0)

      await tokenSender.setPriceMultiplier(0)

      expect(await tokenSender.getPriceMultiplier()).to.eq(0)
    })

    it('is idempotent for non-zero', async () => {
      await tokenSender.setPriceMultiplier(1)
      expect(await tokenSender.getPriceMultiplier()).to.eq(1)

      await tokenSender.setPriceMultiplier(1)

      expect(await tokenSender.getPriceMultiplier()).to.eq(1)
    })

    it('emits PriceMultiplierChange', async () => {
      await expect(tokenSender.setPriceMultiplier(1))
        .to.emit(tokenSender, 'PriceMultiplierChange')
        .withArgs(1)
    })
  })

  describe('# setScaledPriceLowerBound', () => {
    it('reverts if not role holder', async () => {
      expect(
        await tokenSender.hasRole(
          await tokenSender.SET_SCALED_PRICE_LOWER_BOUND_ROLE(),
          user.address
        )
      ).to.eq(false)

      await expect(tokenSender.connect(user).setScaledPriceLowerBound(0)).revertedWith(
        `AccessControl: account ${user.address.toLowerCase()} is missing role ${await tokenSender.SET_SCALED_PRICE_LOWER_BOUND_ROLE()}`
      )
    })

    it('sets to zero', async () => {
      await tokenSender.setScaledPriceLowerBound(0)

      expect(await tokenSender.getScaledPriceLowerBound()).to.eq(0)
    })

    it('sets to non-zero', async () => {
      await tokenSender.setScaledPriceLowerBound(1)

      expect(await tokenSender.getScaledPriceLowerBound()).to.eq(1)
    })

    it('is idempotent for zero', async () => {
      await tokenSender.setScaledPriceLowerBound(0)
      expect(await tokenSender.getScaledPriceLowerBound()).to.eq(0)

      await tokenSender.setScaledPriceLowerBound(0)

      expect(await tokenSender.getScaledPriceLowerBound()).to.eq(0)
    })

    it('is idempotent for non-zero', async () => {
      await tokenSender.setScaledPriceLowerBound(1)
      expect(await tokenSender.getScaledPriceLowerBound()).to.eq(1)

      await tokenSender.setScaledPriceLowerBound(1)

      expect(await tokenSender.getScaledPriceLowerBound()).to.eq(1)
    })

    it('emits ScaledPriceLowerBoundChange', async () => {
      await expect(tokenSender.setScaledPriceLowerBound(1))
        .to.emit(tokenSender, 'ScaledPriceLowerBoundChange')
        .withArgs(1)
    })
  })

  describe('# setAllowedCallers', () => {
    it('reverts if not role holder', async () => {
      expect(
        await tokenSender.hasRole(await tokenSender.SET_ALLOWED_CALLERS_ROLE(), user.address)
      ).to.eq(false)

      await expect(tokenSender.connect(user).setAllowedCallers([], [])).revertedWith(
        `AccessControl: account ${user.address.toLowerCase()} is missing role ${await tokenSender.SET_ALLOWED_CALLERS_ROLE()}`
      )
    })
  })
})
