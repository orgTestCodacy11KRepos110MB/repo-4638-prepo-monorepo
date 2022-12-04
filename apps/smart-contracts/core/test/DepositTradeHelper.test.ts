import chai, { expect } from 'chai'
import { ethers } from 'hardhat'
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/dist/src/signer-with-address'
import { id, parseEther, parseUnits } from 'ethers/lib/utils'
import { BigNumber, Contract } from 'ethers'
import { FakeContract, smock } from '@defi-wonderland/smock'
import { Core } from './harness/core'
import { depositTradeHelperFixture } from './fixtures/DepositTradeHelperFixture'
import { fakeSwapRouterFixture } from './fixtures/UniswapFixtures'
import { DepositTradeHelper } from '../typechain'

chai.use(smock.matchers)

describe('=> DepositTradeHelper', () => {
  let core: Core
  let swapRouter: FakeContract<Contract>
  let depositTradeHelper: DepositTradeHelper
  beforeEach(async () => {
    core = await Core.Instance.init(ethers, true)
    swapRouter = await fakeSwapRouterFixture()
    depositTradeHelper = await depositTradeHelperFixture(
      core.collateral.address,
      swapRouter.address
    )
  })

  describe('initial state', () => {
    it('sets collateral from constructor', async () => {
      expect(await depositTradeHelper.getCollateral()).to.eq(core.collateral.address)
    })

    it('sets base token from collateral', async () => {
      expect(await depositTradeHelper.getBaseToken()).to.eq(core.baseToken.address)
    })

    it('sets swap router from constructor', async () => {
      expect(await depositTradeHelper.getSwapRouter()).to.eq(swapRouter.address)
    })

    it('gives collateral contract unlimited base token approval', async () => {
      expect(
        await core.baseToken.allowance(depositTradeHelper.address, core.collateral.address)
      ).to.eq(ethers.constants.MaxUint256)
    })

    it('gives swap router unlimited collateral approval', async () => {
      expect(await core.collateral.allowance(depositTradeHelper.address, swapRouter.address)).to.eq(
        ethers.constants.MaxUint256
      )
    })
  })
})
