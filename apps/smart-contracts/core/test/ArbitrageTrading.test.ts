import chai, { expect } from 'chai'
import { ethers, network } from 'hardhat'
import { smock } from '@defi-wonderland/smock'
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/dist/src/signer-with-address'
import { BigNumber, Contract } from 'ethers'
import { POOL_FEE_TIER, getPrePOAddressForNetwork } from 'prepo-constants'
import { utils } from 'prepo-hardhat'
import { parseEther } from '@ethersproject/units'
import { attachUniV3Factory } from './fixtures/UniswapFixtures'
import { Snapshotter } from './snapshots'
import { MockCore } from '../harnesses/mock'
import { PrePOMarketParams } from '../types'

const { nowPlusMonths } = utils

chai.use(smock.matchers)
const snapshotter = new Snapshotter()

describe('=> Functional Testing with Arbitrage Trades', () => {
  let core: MockCore
  let deployer: SignerWithAddress
  let governance: SignerWithAddress
  let user: SignerWithAddress
  let defaultMarketParams: PrePOMarketParams
  let univ3Factory: Contract
  const TEST_NAME_SUFFIX = 'preSPACEX 2000-10000 31-December 2022'
  const TEST_SYMBOL_SUFFIX = 'preSPACEX_2000_10000_31_DEC_22'
  const TEST_FLOOR_PAYOUT = ethers.utils.parseEther('0.2')
  const TEST_CEILING_PAYOUT = ethers.utils.parseEther('0.8')
  const TEST_FLOOR_VAL = BigNumber.from(2000)
  const TEST_CEILING_VAL = BigNumber.from(10000)
  const TEST_EXPIRY = nowPlusMonths(2)

  snapshotter.setupSnapshotContext('ArbitrageTrading')
  before(async () => {
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
    await core.createAndAddMockMarket(
      deployer,
      TEST_NAME_SUFFIX,
      TEST_SYMBOL_SUFFIX,
      defaultMarketParams
    )
    univ3Factory = await attachUniV3Factory(
      getPrePOAddressForNetwork('UNIV3_FACTORY', 'arbitrumOne')
    )
    await univ3Factory.createPool(
      core.markets[TEST_NAME_SUFFIX].address,
      core.collateral.address,
      POOL_FEE_TIER
    )
    await snapshotter.saveSnapshot()
  })

  describe('fdsfd', () => {
    it('sfd', async () => {
      console.log(
        await univ3Factory.getPool(
          core.markets[TEST_NAME_SUFFIX].address,
          core.collateral.address,
          POOL_FEE_TIER
        )
      )
    })
  })
})
