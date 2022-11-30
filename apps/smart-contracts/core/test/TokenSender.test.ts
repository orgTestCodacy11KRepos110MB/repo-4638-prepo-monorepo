import { ethers } from 'hardhat'
import { expect } from 'chai'
import { id } from 'ethers/lib/utils'
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/dist/src/signer-with-address'
import { MockContract } from '@defi-wonderland/smock'
import { Contract } from 'ethers'
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
  let price: SignerWithAddress

  beforeEach(async () => {
    ;[deployer, user, price] = await ethers.getSigners()
    outputToken = await testERC20Fixture('Output Token', 'OUT', 18)
    tokenSender = await tokenSenderFixture(outputToken.address)
    await grantAndAcceptRole(
      tokenSender,
      deployer,
      deployer,
      await tokenSender.SET_ALLOWED_CALLERS_ROLE()
    )
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
  })

  describe('# initialize', () => {
    it('sets output token from constructor', async () => {
      expect(await tokenSender.getOutputToken()).to.eq(outputToken.address)
    })

    it('has price set to zero address', async () => {
      expect(await tokenSender.getPrice()).to.eq(ethers.constants.AddressZero)
    })

    it('has price multiplier = 0', async () => {
      expect(await tokenSender.getPriceMultiplier()).to.eq(0)
    })

    it('has scaled price lower bound = 0', async () => {
      expect(await tokenSender.getScaledPriceLowerBound()).to.eq(0)
    })

    it('sets role constants to the correct hash', async () => {
      expect(await tokenSender.SET_ALLOWED_CALLERS_ROLE()).to.eq(
        id('TokenSender_setAllowedCallers(address[],bool[])')
      )
      expect(await tokenSender.SET_PRICE_ROLE()).to.eq(id('TokenSender_setPrice(IUintValue)'))
      expect(await tokenSender.SET_PRICE_MULTIPLIER_ROLE()).to.eq(
        id('TokenSender_setPriceMultiplier(uint256)')
      )
      expect(await tokenSender.SET_SCALED_PRICE_LOWER_BOUND_ROLE()).to.eq(
        id('TokenSender_setScaledPriceLowerBound(uint256)')
      )
    })
  })

  describe('# setPrice', () => {
    it('reverts if not role holder', async () => {
      expect(await tokenSender.hasRole(await tokenSender.SET_PRICE_ROLE(), user.address)).to.eq(
        false
      )

      await expect(tokenSender.connect(user).setPrice(price.address)).revertedWith(
        `AccessControl: account ${user.address.toLowerCase()} is missing role ${await tokenSender.SET_PRICE_ROLE()}`
      )
    })

    it('sets to zero address', async () => {
      await tokenSender.connect(deployer).setPrice(price.address)
      expect(await tokenSender.getPrice()).to.not.eq(ethers.constants.AddressZero)

      await tokenSender.connect(deployer).setPrice(ethers.constants.AddressZero)

      expect(await tokenSender.getPrice()).to.eq(ethers.constants.AddressZero)
    })

    it('sets to non-zero address', async () => {
      expect(await tokenSender.getPrice()).to.eq(ethers.constants.AddressZero)

      await tokenSender.connect(deployer).setPrice(price.address)

      expect(await tokenSender.getPrice()).to.eq(price.address)
    })

    it('is idempotent for zero address', async () => {
      expect(await tokenSender.getPrice()).to.eq(ethers.constants.AddressZero)

      await tokenSender.connect(deployer).setPrice(ethers.constants.AddressZero)

      expect(await tokenSender.getPrice()).to.eq(ethers.constants.AddressZero)
    })

    it('is idempotet for non-zero address', async () => {
      await tokenSender.connect(deployer).setPrice(price.address)
      expect(await tokenSender.getPrice()).to.eq(price.address)

      await tokenSender.connect(deployer).setPrice(price.address)

      expect(await tokenSender.getPrice()).to.eq(price.address)
    })

    it('emits event', async () => {
      await expect(tokenSender.connect(deployer).setPrice(price.address))
        .to.emit(tokenSender, 'PriceChange')
        .withArgs(price.address)
    })
  })

  describe('# setPriceMultiplier', () => {
    it('reverts if not role holder', async () => {
      expect(
        await tokenSender.hasRole(await tokenSender.SET_PRICE_MULTIPLIER_ROLE(), user.address)
      ).to.eq(false)

      await expect(tokenSender.connect(user).setPriceMultiplier(1)).revertedWith(
        `AccessControl: account ${user.address.toLowerCase()} is missing role ${await tokenSender.SET_PRICE_MULTIPLIER_ROLE()}`
      )
    })

    it('sets to 0', async () => {
      await tokenSender.connect(deployer).setPriceMultiplier(1)
      expect(await tokenSender.getPriceMultiplier()).to.not.eq(0)

      await tokenSender.connect(deployer).setPriceMultiplier(0)

      expect(await tokenSender.getPriceMultiplier()).to.eq(0)
    })

    it('sets to non-zero', async () => {
      expect(await tokenSender.getPriceMultiplier()).to.eq(0)

      await tokenSender.connect(deployer).setPriceMultiplier(1)

      expect(await tokenSender.getPriceMultiplier()).to.eq(1)
    })

    it('is idempotent for 0', async () => {
      expect(await tokenSender.getPriceMultiplier()).to.eq(0)

      await tokenSender.connect(deployer).setPriceMultiplier(0)

      expect(await tokenSender.getPriceMultiplier()).to.eq(0)
    })

    it('is idempotet for non-zero', async () => {
      await tokenSender.connect(deployer).setPriceMultiplier(1)
      expect(await tokenSender.getPriceMultiplier()).to.eq(1)

      await tokenSender.connect(deployer).setPriceMultiplier(1)

      expect(await tokenSender.getPriceMultiplier()).to.eq(1)
    })

    it('emits event', async () => {
      await expect(tokenSender.connect(deployer).setPriceMultiplier(1))
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

      await expect(tokenSender.connect(user).setScaledPriceLowerBound(1)).revertedWith(
        `AccessControl: account ${user.address.toLowerCase()} is missing role ${await tokenSender.SET_SCALED_PRICE_LOWER_BOUND_ROLE()}`
      )
    })

    it('sets to 0', async () => {
      await tokenSender.connect(deployer).setScaledPriceLowerBound(1)
      expect(await tokenSender.getScaledPriceLowerBound()).to.not.eq(0)

      await tokenSender.connect(deployer).setScaledPriceLowerBound(0)

      expect(await tokenSender.getScaledPriceLowerBound()).to.eq(0)
    })

    it('sets to non-zero', async () => {
      expect(await tokenSender.getScaledPriceLowerBound()).to.eq(0)

      await tokenSender.connect(deployer).setScaledPriceLowerBound(1)

      expect(await tokenSender.getScaledPriceLowerBound()).to.eq(1)
    })

    it('is idempotent for 0', async () => {
      expect(await tokenSender.getScaledPriceLowerBound()).to.eq(0)

      await tokenSender.connect(deployer).setScaledPriceLowerBound(0)

      expect(await tokenSender.getScaledPriceLowerBound()).to.eq(0)
    })

    it('is idempotet for non-zero', async () => {
      await tokenSender.connect(deployer).setScaledPriceLowerBound(1)
      expect(await tokenSender.getScaledPriceLowerBound()).to.eq(1)

      await tokenSender.connect(deployer).setScaledPriceLowerBound(1)

      expect(await tokenSender.getScaledPriceLowerBound()).to.eq(1)
    })

    it('emits event', async () => {
      await expect(tokenSender.connect(deployer).setScaledPriceLowerBound(1))
        .to.emit(tokenSender, 'ScaledPriceLowerBoundChange')
        .withArgs(1)
    })
  })
})
