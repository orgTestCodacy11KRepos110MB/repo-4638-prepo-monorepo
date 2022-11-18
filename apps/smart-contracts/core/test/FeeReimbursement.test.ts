import { expect } from 'chai'
import { ethers } from 'hardhat'
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/dist/src/signer-with-address'
import { id, parseEther } from 'ethers/lib/utils'
import { DEFAULT_ADMIN_ROLE } from 'prepo-constants'
import { MockContract } from '@defi-wonderland/smock'
import { BigNumber, Contract } from 'ethers'
import { feeReimbursementFixture } from './fixtures/FeeReimbursementFixture'
import { grantAndAcceptRole } from './utils'
import { smockMiniSalesFixture } from './fixtures/MiniSales'
import { testERC20Fixture } from './fixtures/TestERC20Fixture'
import { FeeReimbursement, TestERC20 } from '../typechain'

describe('=> FeeReimbursement', () => {
  let feeReimbursement: FeeReimbursement
  let smockMiniSales: MockContract<Contract>
  let baseToken: TestERC20
  let ppoToken: TestERC20
  let deployer: SignerWithAddress
  let user: SignerWithAddress
  let depositHook: SignerWithAddress
  const TEST_AMOUNT_ONE = parseEther('1')
  const TEST_AMOUNT_HUNDRED = parseEther('100')

  const getSignersAndDeployFeeReimbursement = async (): Promise<void> => {
    ;[deployer, user, depositHook] = await ethers.getSigners()
    feeReimbursement = await feeReimbursementFixture()
    baseToken = await testERC20Fixture('USDC', 'USDC', 6)
    ppoToken = await testERC20Fixture('PPO Token', 'PPO', 18)
    smockMiniSales = await smockMiniSalesFixture(
      baseToken.address,
      ppoToken.address,
      BigNumber.from(6)
    )
    smockMiniSales.getSaleForPayment.returns((payment) => payment)
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
    await feeReimbursement.connect(deployer).setDepositHook(depositHook.address)
    await feeReimbursement.connect(deployer).setMiniSales(smockMiniSales.address)
    await feeReimbursement.connect(deployer).setPPOToken(ppoToken.address)
    await ppoToken.connect(deployer).mint(feeReimbursement.address, TEST_AMOUNT_HUNDRED)
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

    it('should be callable by connected deposit hook', async () => {
      await feeReimbursement.connect(depositHook).registerFee(user.address, TEST_AMOUNT_ONE)
    })

    it('should not be callable by non-authorised address', async () => {
      const tx = feeReimbursement.connect(user).registerFee(user.address, TEST_AMOUNT_ONE)
      await expect(tx).to.be.revertedWith('msg.sender != depositHook')
    })

    it("should correctly add 'amount' to fee", async () => {
      const feesPaidBefore = await feeReimbursement.getFeesPaid(user.address)
      expect(feesPaidBefore).to.eq(0)
      await feeReimbursement.connect(depositHook).registerFee(user.address, TEST_AMOUNT_ONE)
      const feesPaidAfter = await feeReimbursement.getFeesPaid(user.address)
      expect(feesPaidAfter).to.eq(TEST_AMOUNT_ONE)
    })
  })

  describe('# getClaimablePPO', () => {
    beforeEach(async () => {
      await setupFeeReimbursement()
    })

    it('should return the correct amount of claimable PPO for fees paid', async () => {
      await feeReimbursement.connect(depositHook).registerFee(user.address, TEST_AMOUNT_ONE)
      const feesPaid = await feeReimbursement.getFeesPaid(user.address)
      expect(feesPaid).to.eq(TEST_AMOUNT_ONE)
      const claimablePPO = await feeReimbursement.getClaimablePPO(user.address)
      expect(claimablePPO).to.eq(TEST_AMOUNT_ONE)
    })
  })

  describe('# claim', () => {
    beforeEach(async () => {
      await setupFeeReimbursement()
    })

    it('reverts if no fee pending', async () => {
      const claimablePPO = await feeReimbursement.getClaimablePPO(user.address)
      expect(claimablePPO).to.eq(0)
      const tx = feeReimbursement.connect(user).claim()
      await expect(tx).to.be.revertedWith('No reimbursement available')
    })

    it('claims correct amount of PPO if pending fee > 0', async () => {
      await feeReimbursement.connect(depositHook).registerFee(user.address, TEST_AMOUNT_ONE)
      await feeReimbursement.connect(user).claim()
      const ppoBalance = await ppoToken.balanceOf(user.address)
      expect(ppoBalance).to.eq(TEST_AMOUNT_ONE)
    })

    it('reverts if claiming twice', async () => {
      await feeReimbursement.connect(depositHook).registerFee(user.address, TEST_AMOUNT_ONE)
      await feeReimbursement.connect(user).claim() // Claim once
      const tx = feeReimbursement.connect(user).claim() // Claim again
      await expect(tx).to.be.revertedWith('No reimbursement available')
    })
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

      const tx = feeReimbursement.connect(user).setDepositHook(deployer.address)
      await expect(tx).revertedWith(
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
