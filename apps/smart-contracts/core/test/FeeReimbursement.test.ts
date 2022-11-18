import { expect } from 'chai'
import { ethers } from 'hardhat'
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/dist/src/signer-with-address'
import { id, parseEther } from 'ethers/lib/utils'
import { DEFAULT_ADMIN_ROLE } from 'prepo-constants'
import { MockContract } from '@defi-wonderland/smock'
import { BigNumber, Contract } from 'ethers'
import { feeReimbursementFixture } from './fixtures/FeeReimbursementFixture'
import { grantAndAcceptRole } from './utils'
import { smockDepositHookFixture } from './fixtures/HookFixture'
import { smockMiniSalesFixture } from './fixtures/MiniSales'
import { testERC20Fixture } from './fixtures/TestERC20Fixture'
import { FeeReimbursement, TestERC20 } from '../typechain'

describe('=> FeeReimbursement', () => {
  let feeReimbursement: FeeReimbursement
  let smockDepositHook: MockContract<Contract>
  let smockMiniSales: MockContract<Contract>
  let usdcToken: TestERC20
  let ppoToken: TestERC20
  let deployer: SignerWithAddress
  let user: SignerWithAddress
  const TEST_AMOUNT_ONE = parseEther('1')

  const getSignersAndDeployFeeReimbursement = async (): Promise<void> => {
    ;[deployer, user] = await ethers.getSigners()
    feeReimbursement = await feeReimbursementFixture()
    smockDepositHook = await smockDepositHookFixture()
    usdcToken = await testERC20Fixture('USDC', 'USDC', 6)
    ppoToken = await testERC20Fixture('PPO Token', 'PPO', 18)
    smockMiniSales = await smockMiniSalesFixture(
      usdcToken.address,
      ppoToken.address,
      BigNumber.from(6)
    )
  }

  const setupFeeReimbursement = async (): Promise<void> => {
    await getSignersAndDeployFeeReimbursement()
    await grantAndAcceptRole(
      feeReimbursement,
      deployer,
      deployer,
      await feeReimbursement.SET_DEPOSIT_HOOK_ROLE()
    )
    await grantAndAcceptRole(
      feeReimbursement,
      deployer,
      deployer,
      await feeReimbursement.SET_MINISALES_ROLE()
    )
    await grantAndAcceptRole(
      feeReimbursement,
      deployer,
      deployer,
      await feeReimbursement.SET_PPO_TOKEN_ROLE()
    )
    await feeReimbursement.connect(deployer).setDepositHook(smockDepositHook.address)
    await feeReimbursement.connect(deployer).setMiniSales(smockMiniSales.address)
    await feeReimbursement.connect(deployer).setPPOToken(ppoToken.address)
  }

  describe('initial state', () => {
    beforeEach(async () => {
      await getSignersAndDeployFeeReimbursement()
    })

    it('sets DEFAULT_ADMIN_ROLE holder to deployer', async () => {
      expect(await feeReimbursement.hasRole(DEFAULT_ADMIN_ROLE, deployer.address)).to.eq(true)
    })

    it('sets role constants to the correct hash', async () => {
      expect(await feeReimbursement.SET_DEPOSIT_HOOK_ROLE()).to.eq(
        id('FeeReimbursement_setDepositHook(IDepositHook)')
      )
      expect(await feeReimbursement.SET_MINISALES_ROLE()).to.eq(
        id('FeeReimbursement_setMiniSales(IMiniSales)')
      )
      expect(await feeReimbursement.SET_PPO_TOKEN_ROLE()).to.eq(
        id('FeeReimbursement_setPPOToken(IERC20)')
      )
    })
  })

  describe('# registerFee', () => {
    beforeEach(async () => {
      await setupFeeReimbursement()
    })

    it('should only be callable by allowed contracts', async () => {})

    it("should correctly add 'amount' to fee", async () => {})

    it("should correctly add 'amount' to fee starting from a non-zero value", async () => {})
  })

  describe('# claim', () => {
    beforeEach(async () => {
      await setupFeeReimbursement()
    })

    it('reverts if no fee pending', async () => {})

    it('claims if pending fee > 0', async () => {})

    it('reverts if claiming twice', async () => {})

    it('recieves the correct amount of PPO', async () => {})
  })

  describe('# setDepositHook', () => {
    beforeEach(async () => {
      await getSignersAndDeployFeeReimbursement()
      await grantAndAcceptRole(
        feeReimbursement,
        deployer,
        deployer,
        await feeReimbursement.SET_DEPOSIT_HOOK_ROLE()
      )
    })

    it('reverts if not role holder', async () => {
      expect(
        await feeReimbursement.hasRole(await feeReimbursement.SET_DEPOSIT_HOOK_ROLE(), user.address)
      ).to.eq(false)

      await expect(feeReimbursement.connect(user).setDepositHook(deployer.address)).revertedWith(
        `AccessControl: account ${user.address.toLowerCase()} is missing role ${await feeReimbursement.SET_DEPOSIT_HOOK_ROLE()}`
      )
    })

    it('should be able to set deposit hook', async () => {
      expect(await feeReimbursement.depositHook()).to.eq(ethers.constants.AddressZero)

      await feeReimbursement.connect(deployer).setDepositHook(deployer.address)

      expect(await feeReimbursement.depositHook()).to.eq(deployer.address)
    })

    it('should emit a DepositHookChange event', async () => {
      const tx = await feeReimbursement.connect(deployer).setDepositHook(deployer.address)

      await expect(tx).to.emit(feeReimbursement, 'DepositHookChange').withArgs(deployer.address)
    })
  })
})
