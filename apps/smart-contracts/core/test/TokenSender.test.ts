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

  beforeEach(async () => {
    ;[deployer, user] = await ethers.getSigners()
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
})
