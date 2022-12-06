import chai, { expect } from 'chai'
import { ethers } from 'hardhat'
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/dist/src/signer-with-address'
import { formatBytes32String, id, parseEther, parseUnits } from 'ethers/lib/utils'
import { BigNumber, Contract } from 'ethers'
import { FakeContract, MockContract, smock } from '@defi-wonderland/smock'
import { utils } from 'prepo-hardhat'
import { JUNK_ADDRESS } from 'prepo-constants'
import { getPermitFromSignature } from './utils'
import { Core } from './harness/core'
import { depositTradeHelperFixture } from './fixtures/DepositTradeHelperFixture'
import { fakeSwapRouterFixture } from './fixtures/UniswapFixtures'
import { DepositTradeHelper } from '../typechain'
import { OffChainTradeParamsStruct, PermitStruct } from '../typechain/DepositTradeHelper'

const { getLastTimestamp, setNextTimestamp } = utils

chai.use(smock.matchers)

describe('=> DepositTradeHelper', () => {
  let core: Core
  let swapRouter: FakeContract<Contract>
  let depositTradeHelper: DepositTradeHelper
  let deployer: SignerWithAddress
  let user: SignerWithAddress

  const junkPermit = <PermitStruct>{
    deadline: 0,
    v: 0,
    r: formatBytes32String('JUNK_DATA'),
    s: formatBytes32String('JUNK_DATA'),
  }

  const junkTradeParams = <OffChainTradeParamsStruct>{
    tokenOut: JUNK_ADDRESS,
    deadline: 0,
    amountOutMinimum: 0,
    sqrtPriceLimitX96: 0,
  }

  beforeEach(async () => {
    core = await Core.Instance.init(ethers, true)
    ;[deployer, user] = core.accounts
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

  describe('# depositAndTrade', () => {
    describe('permit testing', () => {
      it('ignores base token approval if deadline = 0', async () => {
        expect(junkPermit.deadline).to.eq(0)
        const timestampToSignFor = (await getLastTimestamp(ethers.provider)) + 5
        const collateralPermit = await getPermitFromSignature(
          core.collateral as MockContract,
          user,
          depositTradeHelper.address,
          ethers.constants.MaxUint256,
          timestampToSignFor
        )
        await setNextTimestamp(ethers.provider, timestampToSignFor)

        const tx = await depositTradeHelper
          .connect(user)
          .depositAndTrade(parseEther('1'), junkPermit, collateralPermit, junkTradeParams)

        expect(tx).to.not.emit(core.baseToken, 'Approval')
        expect(await core.baseToken.allowance(user.address, depositTradeHelper.address)).to.eq(0)
      })

      it('ignores collateral approval if deadline = 0', async () => {
        expect(junkPermit.deadline).to.eq(0)
        const timestampToSignFor = (await getLastTimestamp(ethers.provider)) + 5
        const baseTokenPermit = await getPermitFromSignature(
          core.baseToken as MockContract,
          user,
          depositTradeHelper.address,
          ethers.constants.MaxUint256,
          timestampToSignFor
        )
        await setNextTimestamp(ethers.provider, timestampToSignFor)

        const tx = await depositTradeHelper
          .connect(user)
          .depositAndTrade(parseEther('1'), baseTokenPermit, junkPermit, junkTradeParams)

        expect(tx).to.not.emit(core.collateral, 'Approval')
        expect(await core.collateral.allowance(user.address, depositTradeHelper.address)).to.eq(0)
      })

      it('ignores both permits if deadlines = 0', async () => {
        expect(junkPermit.deadline).to.eq(0)

        const tx = await depositTradeHelper
          .connect(user)
          .depositAndTrade(parseEther('1'), junkPermit, junkPermit, junkTradeParams)

        expect(tx).to.not.emit(core.baseToken, 'Approval')
        expect(tx).to.not.emit(core.collateral, 'Approval')
        expect(await core.baseToken.allowance(user.address, depositTradeHelper.address)).to.eq(0)
        expect(await core.collateral.allowance(user.address, depositTradeHelper.address)).to.eq(0)
      })

      it('processes base token approval permit from user', async () => {
        expect(await core.baseToken.allowance(user.address, depositTradeHelper.address)).to.eq(0)
        const timestampToSignFor = (await getLastTimestamp(ethers.provider)) + 5
        const baseTokenPermit = await getPermitFromSignature(
          core.baseToken as MockContract,
          user,
          depositTradeHelper.address,
          ethers.constants.MaxUint256,
          timestampToSignFor
        )
        await setNextTimestamp(ethers.provider, timestampToSignFor)

        await depositTradeHelper
          .connect(user)
          .depositAndTrade(parseEther('1'), baseTokenPermit, junkPermit, junkTradeParams)

        expect(await core.baseToken.allowance(user.address, depositTradeHelper.address)).to.eq(
          ethers.constants.MaxUint256
        )
      })

      it('processes collateral approval permit from user', async () => {
        expect(await core.collateral.allowance(user.address, depositTradeHelper.address)).to.eq(0)
        const timestampToSignFor = (await getLastTimestamp(ethers.provider)) + 5
        const collateralPermit = await getPermitFromSignature(
          core.collateral as MockContract,
          user,
          depositTradeHelper.address,
          ethers.constants.MaxUint256,
          timestampToSignFor
        )
        await setNextTimestamp(ethers.provider, timestampToSignFor)

        await depositTradeHelper
          .connect(user)
          .depositAndTrade(parseEther('1'), junkPermit, collateralPermit, junkTradeParams)

        expect(await core.collateral.allowance(user.address, depositTradeHelper.address)).to.eq(
          ethers.constants.MaxUint256
        )
      })

      it('processes both permits', async () => {
        expect(await core.baseToken.allowance(user.address, depositTradeHelper.address)).to.eq(0)
        expect(await core.collateral.allowance(user.address, depositTradeHelper.address)).to.eq(0)
        const timestampToSignFor = (await getLastTimestamp(ethers.provider)) + 5
        const baseTokenPermit = await getPermitFromSignature(
          core.baseToken as MockContract,
          user,
          depositTradeHelper.address,
          ethers.constants.MaxUint256,
          timestampToSignFor
        )
        const collateralPermit = await getPermitFromSignature(
          core.collateral as MockContract,
          user,
          depositTradeHelper.address,
          ethers.constants.MaxUint256,
          timestampToSignFor
        )
        await setNextTimestamp(ethers.provider, timestampToSignFor)

        await depositTradeHelper
          .connect(user)
          .depositAndTrade(parseEther('1'), baseTokenPermit, collateralPermit, junkTradeParams)

        expect(await core.baseToken.allowance(user.address, depositTradeHelper.address)).to.eq(
          ethers.constants.MaxUint256
        )
        expect(await core.collateral.allowance(user.address, depositTradeHelper.address)).to.eq(
          ethers.constants.MaxUint256
        )
      })
    })
  })
})
