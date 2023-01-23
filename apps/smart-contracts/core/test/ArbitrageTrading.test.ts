import chai, { expect } from 'chai'
import { ethers, network } from 'hardhat'
import { smock } from '@defi-wonderland/smock'
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/dist/src/signer-with-address'
import { BigNumber } from 'ethers'
import { getPrePOAddressForNetwork } from 'prepo-constants'
import { utils } from 'prepo-hardhat'
import { parseEther } from '@ethersproject/units'
import { arbitrageBrokerFixture } from './fixtures/ArbitrageBrokerFixture'
import { create2DeployerFixture } from './fixtures/Create2DeployerFixtures'
import {
  attachUniV3Factory,
  attachNonfungiblePositionManager,
  attachSwapRouter,
} from './fixtures/UniswapFixtures'
import { Snapshotter } from './snapshots'
import { batchGrantAndAcceptRoles } from './utils'
import { MockCore } from '../harnesses/mock'
import { assignCollateralRoles } from '../helpers/roles'
import {
  mintLiquidityForLongShort,
  getAmountInForExactOutputSingle,
  getAmountOutForExactInputSingle,
  getNearestSqrtX96FromWei,
} from '../helpers/uniswap'
import { PrePOMarketParams } from '../types'
import {
  Create2Deployer,
  UniswapV3Factory,
  NonfungiblePositionManager,
  ArbitrageBroker,
  IArbitrageBroker,
  ERC20,
  SwapRouter,
} from '../types/generated'

const { nowPlusMonths } = utils

chai.use(smock.matchers)
const snapshotter = new Snapshotter()

describe('=> Arbitrage Trading', () => {
  let core: MockCore
  let deployer: SignerWithAddress
  let governance: SignerWithAddress
  let user: SignerWithAddress
  let defaultMarketParams: PrePOMarketParams
  let create2Deployer: Create2Deployer
  let univ3Factory: UniswapV3Factory
  let positionManager: NonfungiblePositionManager
  let swapRouter: SwapRouter
  let arbitrageBroker: ArbitrageBroker
  const TEST_NAME_SUFFIX = 'preSPACEX 2000-10000 31-December 2022'
  const TEST_SYMBOL_SUFFIX = 'preSPACEX_2000_10000_31_DEC_22'
  const TEST_FLOOR_PAYOUT = ethers.utils.parseEther('0.2')
  const TEST_CEILING_PAYOUT = ethers.utils.parseEther('0.8')
  const TEST_FLOOR_VAL = BigNumber.from(2000)
  const TEST_CEILING_VAL = BigNumber.from(10000)
  const TEST_EXPIRY = nowPlusMonths(2)
  const TEST_POSITION_SIZE = parseEther('1')
  /**
   * Default deadline just uses our existing `nowPlusMonth()` function
   * for simplicity. If we were to use a much closer deadline, perhaps
   * now + some seconds, we would need to poll the current block time
   * for every testcase to ensure the deadline stays valid.
   */
  const TEST_DEADLINE = nowPlusMonths(1)
  const GOVERNANCE_COLLATERAL_SUPPLY = parseEther('10000')
  const GOVERNANCE_LSTOKEN_SUPPLY = parseEther('10000')
  /**
   * Since L/S tokens will be priced at < 1 Collateral, so supplying
   * twice the Long and Short amount we plan to buy in Collateral is
   * more than sufficient, and is not a magic number.
   *
   * Collateral will be used to purchase Long and Short tokens if long
   * price + short price < 1 Collateral. Therefore it will be more than
   * sufficient to supply 1 Collateral in broker capital per Long+Short
   * token to be purchased for redemption.
   */
  const TEST_BROKER_CAPITAL = TEST_POSITION_SIZE.mul(2)

  snapshotter.setupSnapshotContext('ArbitrageTrading')
  before(async () => {
    /**
     * Connect to Alchemy provider since forking off a specific block
     * number is available to free tiers.
     */
    await network.provider.request({
      method: 'hardhat_reset',
      params: [
        {
          forking: {
            jsonRpcUrl: `https://arb-mainnet.g.alchemy.com/v2/${process.env.ALCHEMY_API_KEY}`,
            blockNumber: 46247692,
          },
        },
      ],
    })
    core = await MockCore.Instance.init(ethers)
    ;[deployer, governance, user] = core.accounts
    await core.baseToken.connect(deployer).mint(governance.address, parseEther('100000'))
    defaultMarketParams = {
      governance: governance.address,
      collateral: core.collateral.address,
      floorLongPayout: TEST_FLOOR_PAYOUT,
      ceilingLongPayout: TEST_CEILING_PAYOUT,
      floorValuation: TEST_FLOOR_VAL,
      ceilingValuation: TEST_CEILING_VAL,
      expiryTime: TEST_EXPIRY,
    }
    /**
     * Deploy market ensuring L/S token addresses are less than
     * the Collateral address.
     */
    create2Deployer = await create2DeployerFixture()
    await core.createAndAddMockMarket(
      TEST_NAME_SUFFIX,
      TEST_SYMBOL_SUFFIX,
      defaultMarketParams,
      create2Deployer
    )
    /**
     * Connect to existing Uniswap V3 contracts and deploy pools
     * for the Long and Short tokens.
     */
    univ3Factory = await attachUniV3Factory(
      getPrePOAddressForNetwork('UNIV3_FACTORY', 'arbitrumOne')
    )
    positionManager = await attachNonfungiblePositionManager(
      getPrePOAddressForNetwork('UNIV3_POSITION_MANAGER', 'arbitrumOne')
    )
    swapRouter = await attachSwapRouter(
      getPrePOAddressForNetwork('UNIV3_SWAP_ROUTER', 'arbitrumOne')
    )
    // Only need to assign deposit fee since test is only using deposit
    await assignCollateralRoles(deployer, governance, core.collateral)
    await core.collateral.connect(governance).setDepositFee(10000)
    // Supply governance with Collateral and LongShort tokens
    await core.mintLSFromBaseToken(
      governance,
      governance,
      GOVERNANCE_COLLATERAL_SUPPLY,
      TEST_NAME_SUFFIX
    )
    await core.mintCollateralFromBaseToken(
      governance,
      governance.address,
      GOVERNANCE_LSTOKEN_SUPPLY
    )
    // Setup ArbitrageBroker and supply it with trading capital for testing
    arbitrageBroker = await arbitrageBrokerFixture(core.collateral.address, swapRouter.address)
    await batchGrantAndAcceptRoles(arbitrageBroker, deployer, governance, [
      arbitrageBroker.BUY_AND_REDEEM_ROLE(),
      arbitrageBroker.MINT_AND_SELL_ROLE(),
      arbitrageBroker.SET_MARKET_VALIDITY_ROLE(),
    ])
    await arbitrageBroker
      .connect(governance)
      .setMarketValidity(core.markets[TEST_NAME_SUFFIX].address, true)
    await core.collateral.connect(governance).transfer(arbitrageBroker.address, TEST_BROKER_CAPITAL)
    await snapshotter.saveSnapshot()
  })

  describe('# ArbitrageBroker Functional Testing', () => {
    describe('# buyAndRedeem', () => {
      it('reverts if profit < 0', async () => {
        // initialize pools at 0.5 so buying will occur at a loss
        await core.deployPoolsForMarket(
          TEST_NAME_SUFFIX,
          univ3Factory,
          parseEther('0.5'),
          parseEther('0.5')
        )
        /**
         * Since we must provide liquidity across a range, we can just
         * supply L/S liquidity at 0.5-0.51 to both, ensuring that
         * L + S will exceed 1. Note that these ether values are
         * approximate and helpers convert this to an actual tick
         * price, so in reality 0.5-0.51 is 0.496-0.506. However, this
         * will still result in a loss since overall L + S > 1.
         *
         * The price curve is not linear and will lean heavily towards the upper
         * end of the range if we only provide just enough or a little over the
         * amount we plan to buy. We supply twice the amount we plan to buy to
         * ensure the average purchase price is closer to the middle of the range.
         *
         * We provide a Collateral amount of 0 since the range of 0.496-0.506 is
         * above the current price 0.496 and therefore only uses L/S tokens;
         * i.e. buying L/S tokens will be facilitated but not selling into Collateral.
         */
        await mintLiquidityForLongShort(
          core.markets[TEST_NAME_SUFFIX].longToken,
          core.collateral,
          positionManager,
          parseEther('0.5'),
          parseEther('0.51'),
          TEST_POSITION_SIZE.mul(2),
          BigNumber.from(0),
          governance.address,
          governance
        )
        await mintLiquidityForLongShort(
          core.markets[TEST_NAME_SUFFIX].shortToken,
          core.collateral,
          positionManager,
          parseEther('0.5'),
          parseEther('0.51'),
          TEST_POSITION_SIZE.mul(2),
          BigNumber.from(0),
          governance.address,
          governance
        )
        /**
         * Simulate the swap to determine how much it will cost to purchase
         * each. This is for verifying the expected profit/loss and the script
         * won't need to do this.
         */
        const expectedCollateralToBuyLong = await getAmountInForExactOutputSingle(
          core.collateral as unknown as ERC20,
          core.markets[TEST_NAME_SUFFIX].longToken.address,
          TEST_POSITION_SIZE,
          governance,
          governance.address,
          swapRouter
        )
        const expectedCollateralToBuyShort = await getAmountInForExactOutputSingle(
          core.collateral as unknown as ERC20,
          core.markets[TEST_NAME_SUFFIX].shortToken.address,
          TEST_POSITION_SIZE,
          governance,
          governance.address,
          swapRouter
        )
        /**
         * Expected profit is the combined redemption value of the L/S tokens,
         * minus the cost of buying them.
         */
        const expectedProfit = TEST_POSITION_SIZE.sub(
          expectedCollateralToBuyLong.add(expectedCollateralToBuyShort)
        )
        expect(expectedProfit).lt(0)
        const brokerBalanceBefore = await core.collateral.balanceOf(arbitrageBroker.address)
        const tradeParams = <IArbitrageBroker.OffChainTradeParamsStruct>{
          deadline: TEST_DEADLINE,
          longShortAmount: TEST_POSITION_SIZE,
          collateralLimitForLong: ethers.constants.MaxUint256,
          collateralLimitForShort: ethers.constants.MaxUint256,
        }

        await expect(
          arbitrageBroker
            .connect(governance)
            .buyAndRedeem(core.markets[TEST_NAME_SUFFIX].address, tradeParams)
        )
          .revertedWithCustomError(arbitrageBroker, 'UnprofitableTrade')
          .withArgs(brokerBalanceBefore, brokerBalanceBefore.add(expectedProfit))
      })

      it('succeeds if profit > 0', async () => {
        // initialize pools at 0.49 so buying will occur at a profit
        await core.deployPoolsForMarket(
          TEST_NAME_SUFFIX,
          univ3Factory,
          parseEther('0.49'),
          parseEther('0.49')
        )
        /**
         * 0.49-0.5 will actually be ~0.486-0.496. However, this
         * will still result in a profit since overall L + S < 1.
         */
        await mintLiquidityForLongShort(
          core.markets[TEST_NAME_SUFFIX].longToken,
          core.collateral,
          positionManager,
          parseEther('0.49'),
          parseEther('0.5'),
          TEST_POSITION_SIZE.mul(2),
          BigNumber.from(0),
          governance.address,
          governance
        )
        await mintLiquidityForLongShort(
          core.markets[TEST_NAME_SUFFIX].shortToken,
          core.collateral,
          positionManager,
          parseEther('0.49'),
          parseEther('0.5'),
          TEST_POSITION_SIZE.mul(2),
          BigNumber.from(0),
          governance.address,
          governance
        )
        const expectedCollateralToBuyLong = await getAmountInForExactOutputSingle(
          core.collateral as unknown as ERC20,
          core.markets[TEST_NAME_SUFFIX].longToken.address,
          TEST_POSITION_SIZE,
          governance,
          governance.address,
          swapRouter
        )
        const expectedCollateralToBuyShort = await getAmountInForExactOutputSingle(
          core.collateral as unknown as ERC20,
          core.markets[TEST_NAME_SUFFIX].shortToken.address,
          TEST_POSITION_SIZE,
          governance,
          governance.address,
          swapRouter
        )
        const expectedProfit = TEST_POSITION_SIZE.sub(
          expectedCollateralToBuyLong.add(expectedCollateralToBuyShort)
        )
        expect(expectedProfit).gt(0)
        const brokerBalanceBefore = await core.collateral.balanceOf(arbitrageBroker.address)
        const tradeParams = <IArbitrageBroker.OffChainTradeParamsStruct>{
          deadline: TEST_DEADLINE,
          longShortAmount: TEST_POSITION_SIZE,
          collateralLimitForLong: ethers.constants.MaxUint256,
          collateralLimitForShort: ethers.constants.MaxUint256,
        }

        await arbitrageBroker
          .connect(governance)
          .buyAndRedeem(core.markets[TEST_NAME_SUFFIX].address, tradeParams)

        expect(await core.collateral.balanceOf(arbitrageBroker.address)).eq(
          brokerBalanceBefore.add(expectedProfit)
        )
      })
    })

    describe('# mintAndSell', () => {
      it('reverts if profit < 0', async () => {
        /**
         * Initialize pools at 0.5 so selling begins at a loss.
         * Liquidity will be provided down to 0.49 to ensure overall
         * L + S < 1. Conversely from `buyAndRedeem()` cases, we only
         * provide Collateral rather than L/S.
         */
        await core.deployPoolsForMarket(
          TEST_NAME_SUFFIX,
          univ3Factory,
          parseEther('0.5'),
          parseEther('0.5')
        )
        /**
         * The price curve is not linear and will lean heavily towards the lower
         * end of the range if we only provide just enough or a little over the
         * amount we plan to sell. We supply twice the amount we plan to sell to
         * ensure the average sale price is closer to the middle of the range.
         */
        await mintLiquidityForLongShort(
          core.markets[TEST_NAME_SUFFIX].longToken,
          core.collateral,
          positionManager,
          parseEther('0.49'),
          parseEther('0.5'),
          BigNumber.from(0),
          TEST_POSITION_SIZE.mul(2),
          governance.address,
          governance
        )
        await mintLiquidityForLongShort(
          core.markets[TEST_NAME_SUFFIX].shortToken,
          core.collateral,
          positionManager,
          parseEther('0.49'),
          parseEther('0.5'),
          BigNumber.from(0),
          TEST_POSITION_SIZE.mul(2),
          governance.address,
          governance
        )
        /**
         * Simulate the swap to determine how much each sale would return.
         * This is for verifying the expected profit/loss and the script
         * won't need to do this.
         */
        const expectedCollateralFromSellingLong = await getAmountOutForExactInputSingle(
          core.markets[TEST_NAME_SUFFIX].longToken,
          core.collateral.address,
          TEST_POSITION_SIZE,
          governance,
          governance.address,
          swapRouter
        )
        const expectedCollateralFromSellingShort = await getAmountOutForExactInputSingle(
          core.markets[TEST_NAME_SUFFIX].shortToken,
          core.collateral.address,
          TEST_POSITION_SIZE,
          governance,
          governance.address,
          swapRouter
        )
        /**
         * Expected profit is the amount the L/S tokens sold for minus the cost
         * of minting them.
         */
        const expectedProfit = expectedCollateralFromSellingLong
          .add(expectedCollateralFromSellingShort)
          .sub(TEST_POSITION_SIZE)
        expect(expectedProfit).lt(0)
        const brokerBalanceBefore = await core.collateral.balanceOf(arbitrageBroker.address)
        const tradeParams = <IArbitrageBroker.OffChainTradeParamsStruct>{
          deadline: TEST_DEADLINE,
          longShortAmount: TEST_POSITION_SIZE,
          collateralLimitForLong: 0,
          collateralLimitForShort: 0,
        }

        await expect(
          arbitrageBroker
            .connect(governance)
            .mintAndSell(core.markets[TEST_NAME_SUFFIX].address, tradeParams)
        )
          .revertedWithCustomError(arbitrageBroker, 'UnprofitableTrade')
          .withArgs(brokerBalanceBefore, brokerBalanceBefore.add(expectedProfit))
      })

      it('succeeds if profit > 0', async () => {
        /**
         * Initialize pools at 0.51 so selling begins at a
         * profit. Liquidity will be provided down to 0.5 to
         * ensure overall L + S > 1.
         */
        await core.deployPoolsForMarket(
          TEST_NAME_SUFFIX,
          univ3Factory,
          parseEther('0.51'),
          parseEther('0.51')
        )
        await mintLiquidityForLongShort(
          core.markets[TEST_NAME_SUFFIX].longToken,
          core.collateral,
          positionManager,
          parseEther('0.5'),
          parseEther('0.51'),
          BigNumber.from(0),
          TEST_POSITION_SIZE.mul(2),
          governance.address,
          governance
        )
        await mintLiquidityForLongShort(
          core.markets[TEST_NAME_SUFFIX].shortToken,
          core.collateral,
          positionManager,
          parseEther('0.5'),
          parseEther('0.51'),
          BigNumber.from(0),
          TEST_POSITION_SIZE.mul(2),
          governance.address,
          governance
        )
        const expectedCollateralFromSellingLong = await getAmountOutForExactInputSingle(
          core.markets[TEST_NAME_SUFFIX].longToken,
          core.collateral.address,
          TEST_POSITION_SIZE,
          governance,
          governance.address,
          swapRouter
        )
        const expectedCollateralFromSellingShort = await getAmountOutForExactInputSingle(
          core.markets[TEST_NAME_SUFFIX].shortToken,
          core.collateral.address,
          TEST_POSITION_SIZE,
          governance,
          governance.address,
          swapRouter
        )
        const expectedProfit = expectedCollateralFromSellingLong
          .add(expectedCollateralFromSellingShort)
          .sub(TEST_POSITION_SIZE)
        expect(expectedProfit).gt(0)
        const brokerBalanceBefore = await core.collateral.balanceOf(arbitrageBroker.address)
        const tradeParams = <IArbitrageBroker.OffChainTradeParamsStruct>{
          deadline: TEST_DEADLINE,
          longShortAmount: TEST_POSITION_SIZE,
          collateralLimitForLong: 0,
          collateralLimitForShort: 0,
        }

        await arbitrageBroker
          .connect(governance)
          .mintAndSell(core.markets[TEST_NAME_SUFFIX].address, tradeParams)

        expect(await core.collateral.balanceOf(arbitrageBroker.address)).eq(
          brokerBalanceBefore.add(expectedProfit)
        )
      })
    })
  })
})
