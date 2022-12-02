import { ethers } from 'hardhat'
import { expect } from 'chai'
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/dist/src/signer-with-address'
import { id } from 'ethers/lib/utils'
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
