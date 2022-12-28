import chai, { expect } from 'chai'
import { ethers } from 'hardhat'
import { FakeContract, smock } from '@defi-wonderland/smock'
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/dist/src/signer-with-address'
import { Contract, BigNumberish } from 'ethers'
import { parseEther } from '@ethersproject/units'
import { id } from 'ethers/lib/utils'
import { utils } from 'prepo-hardhat'
import { Snapshotter } from './snapshots'
import { batchGrantAndAcceptRoles, revertsIfNotRoleHolder } from './utils'
import { arbitrageBrokerFixture } from './fixtures/ArbitrageBrokerFixture'
import { fakeLongShortTokenFixture } from './fixtures/LongShortTokenFixture'
import { fakePrePOMarketFixture } from './fixtures/PrePOMarketFixture'
import { fakeSwapRouterFixture } from './fixtures/UniswapFixtures'
import { MockCore } from '../harnesses/mock'
import { ArbitrageBroker, IArbitrageBroker, LongShortToken } from '../types/generated'
import { PromiseOrValue } from '../types/generated/common'

chai.use(smock.matchers)
const snapshotter = new Snapshotter()
const { nowPlusMonths } = utils

describe('=> ArbitrageBroker', () => {
  let core: MockCore
  let deployer: SignerWithAddress
  let governance: SignerWithAddress
  let user: SignerWithAddress
  let swapRouter: FakeContract<Contract>
  let market: FakeContract<Contract>
  let longToken: FakeContract<LongShortToken>
  let shortToken: FakeContract<LongShortToken>
  let arbitrageBroker: ArbitrageBroker
  let correctBuyLongArgs: PromiseOrValue<BigNumberish>[]
  let correctBuyShortArgs: PromiseOrValue<BigNumberish>[]
  let correctSellLongArgs: PromiseOrValue<BigNumberish>[]
  let correctSellShortArgs: PromiseOrValue<BigNumberish>[]

  const tradingCapitalBefore = parseEther('1')
  const tradingCapitalAfter = parseEther('10')
  const tradeParams = <IArbitrageBroker.OffChainTradeParamsStruct>{
    deadline: nowPlusMonths(2),
    longShortAmount: parseEther('1'),
    collateralLimitForLong: parseEther('2'),
    collateralLimitForShort: parseEther('3'),
  }
  const SWAP_ARG_COUNT = 8

  snapshotter.setupSnapshotContext('ArbitrageBroker')
  before(async () => {
    core = await MockCore.Instance.init(ethers, parseEther('100000'), parseEther('10000'))
    ;[deployer, governance, user] = core.accounts
    swapRouter = await fakeSwapRouterFixture()
    arbitrageBroker = await arbitrageBrokerFixture(core.collateral.address, swapRouter.address)
    await batchGrantAndAcceptRoles(arbitrageBroker, deployer, governance, [
      arbitrageBroker.BUY_AND_REDEEM_ROLE(),
      arbitrageBroker.MINT_AND_SELL_ROLE(),
      arbitrageBroker.SET_MARKET_VALIDITY_ROLE(),
    ])
    market = await fakePrePOMarketFixture()
    longToken = await fakeLongShortTokenFixture()
    shortToken = await fakeLongShortTokenFixture()
    market.getLongToken.returns(longToken.address)
    market.getShortToken.returns(shortToken.address)
    correctBuyLongArgs = [
      core.collateral.address,
      longToken.address,
      10000,
      arbitrageBroker.address,
      tradeParams.deadline,
      tradeParams.longShortAmount,
      tradeParams.collateralLimitForLong,
      0,
    ]
    correctBuyShortArgs = [
      core.collateral.address,
      shortToken.address,
      10000,
      arbitrageBroker.address,
      tradeParams.deadline,
      tradeParams.longShortAmount,
      tradeParams.collateralLimitForShort,
      0,
    ]
    correctSellLongArgs = [longToken.address as PromiseOrValue<BigNumberish>]
      .concat(core.collateral.address as PromiseOrValue<BigNumberish>)
      .concat(correctBuyLongArgs.slice(2))
    correctSellShortArgs = [shortToken.address as PromiseOrValue<BigNumberish>]
      .concat(core.collateral.address as PromiseOrValue<BigNumberish>)
      .concat(correctBuyShortArgs.slice(2))
    await snapshotter.saveSnapshot()
  })

  describe('initial state', () => {
    it('sets collateral from constructor', async () => {
      expect(await arbitrageBroker.getCollateral()).to.eq(core.collateral.address)
    })

    it('sets swap router from constructor', async () => {
      expect(await arbitrageBroker.getSwapRouter()).to.eq(swapRouter.address)
    })

    it('gives swap router unlimited collateral approval', async () => {
      expect(await core.collateral.allowance(arbitrageBroker.address, swapRouter.address)).to.eq(
        ethers.constants.MaxUint256
      )
    })

    it('sets role constants', async () => {
      expect(await arbitrageBroker.BUY_AND_REDEEM_ROLE()).to.eq(id('buyAndRedeem'))
      expect(await arbitrageBroker.MINT_AND_SELL_ROLE()).to.eq(id('mintAndSell'))
      expect(await arbitrageBroker.SET_MARKET_VALIDITY_ROLE()).to.eq(id('setMarketValidity'))
    })
  })

  describe('# setMarketValidity', () => {
    it('reverts if not role holder', async () => {
      await revertsIfNotRoleHolder(
        arbitrageBroker.SET_MARKET_VALIDITY_ROLE(),
        arbitrageBroker.populateTransaction.setMarketValidity(user.address, true)
      )
    })

    it('sets to true', async () => {
      expect(await arbitrageBroker.isMarketValid(user.address)).to.not.eq(true)

      await arbitrageBroker.connect(governance).setMarketValidity(user.address, true)

      expect(await arbitrageBroker.isMarketValid(user.address)).to.eq(true)
    })

    it('sets to false', async () => {
      await arbitrageBroker.connect(governance).setMarketValidity(user.address, true)
      expect(await arbitrageBroker.isMarketValid(user.address)).to.not.eq(false)

      await arbitrageBroker.connect(governance).setMarketValidity(user.address, false)

      expect(await arbitrageBroker.isMarketValid(user.address)).to.eq(false)
    })

    it('is idempotent', async () => {
      expect(await arbitrageBroker.isMarketValid(user.address)).to.not.eq(true)

      await arbitrageBroker.connect(governance).setMarketValidity(user.address, true)

      expect(await arbitrageBroker.isMarketValid(user.address)).to.eq(true)

      await arbitrageBroker.connect(governance).setMarketValidity(user.address, true)

      expect(await arbitrageBroker.isMarketValid(user.address)).to.eq(true)
    })

    it('emits MarketValidityChanged', async () => {
      const tx = await arbitrageBroker.connect(governance).setMarketValidity(user.address, true)

      expect(tx).to.emit(arbitrageBroker, 'MarketValidityChange').withArgs(user.address, true)
    })
  })

  describe('# buyAndRedeem', () => {
    beforeEach(async () => {
      await arbitrageBroker.connect(governance).setMarketValidity(market.address, true)
      market.redeem.returns()
      core.collateral.balanceOf.returnsAtCall(0, tradingCapitalBefore)
      core.collateral.balanceOf.returnsAtCall(1, tradingCapitalAfter)
    })

    it('reverts if not role holder', async () => {
      await revertsIfNotRoleHolder(
        arbitrageBroker.BUY_AND_REDEEM_ROLE(),
        arbitrageBroker.populateTransaction.buyAndRedeem(market.address, tradeParams)
      )
    })

    it('reverts if market not valid', async () => {
      const invalidMarket = await fakePrePOMarketFixture()
      expect(await arbitrageBroker.isMarketValid(invalidMarket.address)).to.eq(false)

      await expect(
        arbitrageBroker.connect(governance).buyAndRedeem(invalidMarket.address, tradeParams)
      )
        .revertedWithCustomError(arbitrageBroker, 'InvalidMarket')
        .withArgs(invalidMarket.address)
    })

    it('reverts if long swap reverts', async () => {
      swapRouter.exactOutputSingle.whenCalledWith(correctBuyLongArgs).reverts()

      await expect(
        arbitrageBroker.connect(governance).callStatic.buyAndRedeem(market.address, tradeParams)
      ).reverted
    })

    it('reverts if short swap reverts', async () => {
      swapRouter.exactOutputSingle.whenCalledWith(correctBuyShortArgs).reverts()

      await expect(
        arbitrageBroker.connect(governance).callStatic.buyAndRedeem(market.address, tradeParams)
      ).reverted
    })

    it('reverts if profit exactly 0', async () => {
      core.collateral.balanceOf.returnsAtCall(0, tradingCapitalBefore)
      core.collateral.balanceOf.returnsAtCall(1, tradingCapitalBefore)

      await expect(
        arbitrageBroker.connect(governance).callStatic.buyAndRedeem(market.address, tradeParams)
      )
        .revertedWithCustomError(arbitrageBroker, 'UnprofitableTrade')
        .withArgs(tradingCapitalBefore, tradingCapitalBefore)
    })

    it('reverts if loss taken', async () => {
      core.collateral.balanceOf.returnsAtCall(0, tradingCapitalBefore)
      core.collateral.balanceOf.returnsAtCall(1, tradingCapitalBefore.sub(1))

      await expect(
        arbitrageBroker.connect(governance).callStatic.buyAndRedeem(market.address, tradeParams)
      )
        .revertedWithCustomError(arbitrageBroker, 'UnprofitableTrade')
        .withArgs(tradingCapitalBefore, tradingCapitalBefore.sub(1))
    })

    it('buys long token first', async () => {
      await arbitrageBroker.connect(governance).callStatic.buyAndRedeem(market.address, tradeParams)

      const swapRouterCallArgs = swapRouter.exactOutputSingle
        .atCall(0)
        .callHistory[0].args[0].slice(0, SWAP_ARG_COUNT)
      swapRouterCallArgs.forEach((arg, i) => {
        expect(arg).eq(correctBuyLongArgs[i])
      })
    })

    it('buys short token after long', async () => {
      await arbitrageBroker.connect(governance).callStatic.buyAndRedeem(market.address, tradeParams)

      const swapRouterCallArgs = swapRouter.exactOutputSingle
        .atCall(1)
        .callHistory[0].args[0].slice(0, SWAP_ARG_COUNT)
      swapRouterCallArgs.forEach((arg, i) => {
        expect(arg).eq(correctBuyShortArgs[i])
      })
    })

    it('redeems after buying both', async () => {
      await arbitrageBroker.connect(governance).callStatic.buyAndRedeem(market.address, tradeParams)

      expect(swapRouter.exactOutputSingle.atCall(1)).calledImmediatelyBefore(market.redeem)
      expect(market.redeem).calledWith(tradeParams.longShortAmount, tradeParams.longShortAmount)
    })

    it('returns profit earned', async () => {
      expect(
        await arbitrageBroker
          .connect(governance)
          .callStatic.buyAndRedeem(market.address, tradeParams)
      ).eq(tradingCapitalAfter.sub(tradingCapitalBefore))
    })

    afterEach(() => {
      core.collateral.balanceOf.reset()
      market.redeem.reset()
      swapRouter.exactOutputSingle.reset()
    })
  })

  describe('# mintAndSell', () => {
    beforeEach(async () => {
      await arbitrageBroker.connect(governance).setMarketValidity(market.address, true)
      market.mint.returns()
      core.collateral.balanceOf.returnsAtCall(0, tradingCapitalBefore)
      core.collateral.balanceOf.returnsAtCall(1, tradingCapitalAfter)
    })

    it('reverts if not role holder', async () => {
      await revertsIfNotRoleHolder(
        arbitrageBroker.MINT_AND_SELL_ROLE(),
        arbitrageBroker.populateTransaction.mintAndSell(market.address, tradeParams)
      )
    })

    it('reverts if market not valid', async () => {
      const invalidMarket = await fakePrePOMarketFixture()
      expect(await arbitrageBroker.isMarketValid(invalidMarket.address)).to.eq(false)

      await expect(
        arbitrageBroker.connect(governance).mintAndSell(invalidMarket.address, tradeParams)
      )
        .revertedWithCustomError(arbitrageBroker, 'InvalidMarket')
        .withArgs(invalidMarket.address)
    })

    it('reverts if profit exactly 0', async () => {
      core.collateral.balanceOf.returnsAtCall(0, tradingCapitalBefore)
      core.collateral.balanceOf.returnsAtCall(1, tradingCapitalBefore)

      await expect(
        arbitrageBroker.connect(governance).callStatic.mintAndSell(market.address, tradeParams)
      )
        .revertedWithCustomError(arbitrageBroker, 'UnprofitableTrade')
        .withArgs(tradingCapitalBefore, tradingCapitalBefore)
    })

    it('reverts if loss taken', async () => {
      core.collateral.balanceOf.returnsAtCall(0, tradingCapitalBefore)
      core.collateral.balanceOf.returnsAtCall(1, tradingCapitalBefore.sub(1))

      await expect(
        arbitrageBroker.connect(governance).callStatic.mintAndSell(market.address, tradeParams)
      )
        .revertedWithCustomError(arbitrageBroker, 'UnprofitableTrade')
        .withArgs(tradingCapitalBefore, tradingCapitalBefore.sub(1))
    })

    it('reverts if long swap reverts', async () => {
      swapRouter.exactInputSingle.whenCalledWith(correctSellLongArgs).reverts()

      await expect(
        arbitrageBroker.connect(governance).callStatic.mintAndSell(market.address, tradeParams)
      ).reverted
    })

    it('reverts if short swap reverts', async () => {
      swapRouter.exactInputSingle.whenCalledWith(correctSellShortArgs).reverts()

      await expect(
        arbitrageBroker.connect(governance).callStatic.mintAndSell(market.address, tradeParams)
      ).reverted
    })

    it('gives collateral approval to market', async () => {
      await arbitrageBroker.connect(governance).callStatic.mintAndSell(market.address, tradeParams)

      expect(core.collateral.approve).calledWith(market.address, tradeParams.longShortAmount)
    })

    it('mints positions after collateral approval', async () => {
      await arbitrageBroker.connect(governance).callStatic.mintAndSell(market.address, tradeParams)

      expect(market.mint).calledImmediatelyAfter(core.collateral.approve)
      expect(market.mint).calledWith(tradeParams.longShortAmount)
    })

    it('approves long token after minting', async () => {
      await arbitrageBroker.connect(governance).callStatic.mintAndSell(market.address, tradeParams)

      expect(longToken.approve).calledAfter(market.mint)
      expect(longToken.approve).calledWith(swapRouter.address, tradeParams.longShortAmount)
    })

    it('sells long token after approval', async () => {
      await arbitrageBroker.connect(governance).callStatic.mintAndSell(market.address, tradeParams)

      expect(swapRouter.exactInputSingle).calledAfter(longToken.approve)
      const swapRouterCallArgs = swapRouter.exactInputSingle
        .atCall(0)
        .callHistory[0].args[0].slice(0, SWAP_ARG_COUNT)
      swapRouterCallArgs.forEach((arg, i) => {
        expect(arg).eq(correctSellLongArgs[i])
      })
    })

    it('approves short token after selling long', async () => {
      await arbitrageBroker.connect(governance).callStatic.mintAndSell(market.address, tradeParams)

      expect(shortToken.approve).calledAfter(swapRouter.exactInputSingle)
      expect(shortToken.approve).calledWith(swapRouter.address, tradeParams.longShortAmount)
    })

    it('sells short token after approval', async () => {
      await arbitrageBroker.connect(governance).callStatic.mintAndSell(market.address, tradeParams)

      expect(swapRouter.exactInputSingle).calledAfter(shortToken.approve)
      const swapRouterCallArgs = swapRouter.exactInputSingle
        .atCall(1)
        .callHistory[0].args[0].slice(0, SWAP_ARG_COUNT)
      swapRouterCallArgs.forEach((arg, i) => {
        expect(arg).eq(correctSellShortArgs[i])
      })
    })

    it('returns profit earned', async () => {
      expect(
        await arbitrageBroker
          .connect(governance)
          .callStatic.mintAndSell(market.address, tradeParams)
      ).eq(tradingCapitalAfter.sub(tradingCapitalBefore))
    })

    afterEach(() => {
      core.collateral.approve.reset()
      core.collateral.balanceOf.reset()
      market.mint.reset()
      longToken.approve.reset()
      shortToken.approve.reset()
      swapRouter.exactInputSingle.reset()
    })
  })
})
