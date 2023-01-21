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
import { PrePOMarketParams } from '../types'
import {
  Create2Deployer,
  UniswapV3Factory,
  NonfungiblePositionManager,
  ArbitrageBroker,
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
})
