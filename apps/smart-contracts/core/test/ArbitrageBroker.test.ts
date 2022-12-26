import chai, { expect } from 'chai'
import { ethers } from 'hardhat'
import { FakeContract, smock } from '@defi-wonderland/smock'
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/dist/src/signer-with-address'
import { Contract } from 'ethers'
import { parseEther } from '@ethersproject/units'
import { id } from 'ethers/lib/utils'
import { utils } from 'prepo-hardhat'
import { Snapshotter } from './snapshots'
import { batchGrantAndAcceptRoles, revertsIfNotRoleHolder } from './utils'
import { arbitrageBrokerFixture } from './fixtures/ArbitrageBrokerFixture'
import { fakePrePOMarketFixture } from './fixtures/PrePOMarketFixture'
import { fakeSwapRouterFixture } from './fixtures/UniswapFixtures'
import { MockCore } from '../harnesses/mock'
import { ArbitrageBroker, IArbitrageBroker } from '../types/generated'

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
  let arbitrageBroker: ArbitrageBroker

  const tradeParams = <IArbitrageBroker.OffChainTradeParamsStruct>{
    deadline: nowPlusMonths(2),
    longShortAmount: parseEther('1'),
    collateralLimitForLong: parseEther('2'),
    collateralLimitForShort: parseEther('3'),
  }

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
    await snapshotter.saveSnapshot()
  })

  describe('initial state', () => {
    it('sets collateral from constructor', async () => {
      expect(await arbitrageBroker.getCollateral()).to.eq(core.collateral.address)
    })

    it('sets swap router from constructor', async () => {
      expect(await arbitrageBroker.getSwapRouter()).to.eq(swapRouter.address)
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

  describe('# mintAndSell', () => {
    beforeEach(async () => {
      await arbitrageBroker.connect(governance).setMarketValidity(market.address, true)
      market.mint.returns()
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

    it('gives collateral approval to market', async () => {
      const tx = await arbitrageBroker.connect(governance).mintAndSell(market.address, tradeParams)

      expect(core.collateral.approve).to.be.calledWith(market.address, tradeParams.longShortAmount)
      expect(tx)
        .to.emit(core.collateral, 'Approval')
        .withArgs(arbitrageBroker.address, market.address, tradeParams.longShortAmount)
    })

    it('mints positions after collateral approval', async () => {
      await arbitrageBroker.connect(governance).mintAndSell(market.address, tradeParams)

      expect(market.mint).to.be.calledImmediatelyAfter(core.collateral.approve)
      expect(market.mint).to.be.calledWith(tradeParams.longShortAmount)
    })

    afterEach(() => {
      core.collateral.approve.reset()
      market.mint.reset()
    })
  })
})
