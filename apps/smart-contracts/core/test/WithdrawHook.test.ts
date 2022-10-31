import chai, { expect } from 'chai'
import { ethers } from 'hardhat'
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/dist/src/signer-with-address'
import { id, parseEther } from 'ethers/lib/utils'
import { ZERO_ADDRESS } from 'prepo-constants'
import { Contract } from 'ethers'
import { MockContract, smock } from '@defi-wonderland/smock'
import { withdrawHookFixture } from './fixtures/HookFixture'
import { smockCollateralDepositRecordFixture } from './fixtures/CollateralDepositRecordFixture'
import { grantAndAcceptRole } from './utils'
import { WithdrawHook } from '../typechain'

chai.use(smock.matchers)

describe('=> WithdrawHook', () => {
  let withdrawHook: WithdrawHook
  let deployer: SignerWithAddress
  let user: SignerWithAddress
  let vault: SignerWithAddress
  let depositRecord: MockContract<Contract>
  const TEST_GLOBAL_DEPOSIT_CAP = parseEther('50000')
  const TEST_ACCOUNT_DEPOSIT_CAP = parseEther('50')
  const TEST_AMOUNT_ONE = parseEther('1')
  const TEST_AMOUNT_TWO = parseEther('2')

  beforeEach(async () => {
    ;[deployer, user, vault] = await ethers.getSigners()
    depositRecord = await smockCollateralDepositRecordFixture(
      TEST_GLOBAL_DEPOSIT_CAP,
      TEST_ACCOUNT_DEPOSIT_CAP
    )
    withdrawHook = await withdrawHookFixture(depositRecord.address)
    await grantAndAcceptRole(
      withdrawHook,
      deployer,
      deployer,
      await withdrawHook.SET_COLLATERAL_ROLE()
    )
    await grantAndAcceptRole(
      withdrawHook,
      deployer,
      deployer,
      await withdrawHook.SET_DEPOSIT_RECORD_ROLE()
    )
    await depositRecord.connect(deployer).setAllowedHook(user.address, true)
    await depositRecord.connect(deployer).setAllowedHook(withdrawHook.address, true)
  })

  describe('initial state', () => {
    it('sets collateral to zero address', async () => {
      expect(await withdrawHook.getCollateral()).to.eq(ZERO_ADDRESS)
    })

    it('sets deposit record from constructor', async () => {
      expect(await withdrawHook.getDepositRecord()).to.eq(depositRecord.address)
    })

    it('sets role constants to the correct hash', async () => {
      expect(await withdrawHook.SET_COLLATERAL_ROLE()).to.eq(
        id('WithdrawHook_setCollateral(address)')
      )
      expect(await withdrawHook.SET_DEPOSIT_RECORD_ROLE()).to.eq(
        id('WithdrawHook_setDepositRecord(address)')
      )
    })
  })

  describe('# hook', () => {
    beforeEach(async () => {
      await withdrawHook.setCollateral(vault.address)
    })

    it('should only usable by the vault', async () => {
      expect(await withdrawHook.getCollateral()).to.not.eq(user.address)

      await expect(
        withdrawHook.connect(user).hook(user.address, TEST_AMOUNT_ONE, TEST_AMOUNT_TWO)
      ).to.revertedWith('msg.sender != collateral')
    })

    it('should call recordWithdrawal with the correct parameters', async () => {
      await withdrawHook.connect(vault).hook(user.address, TEST_AMOUNT_ONE, TEST_AMOUNT_TWO)

      expect(depositRecord.recordWithdrawal).to.be.calledWith(user.address, TEST_AMOUNT_TWO)
    })
  })

  describe('# setCollateral', () => {
    it('reverts if not role holder', async () => {
      expect(
        await withdrawHook.hasRole(await withdrawHook.SET_COLLATERAL_ROLE(), user.address)
      ).to.eq(false)

      await expect(withdrawHook.connect(user).setCollateral(vault.address)).revertedWith(
        `AccessControl: account ${user.address.toLowerCase()} is missing role ${await withdrawHook.SET_COLLATERAL_ROLE()}`
      )
    })

    it('should be settable to an address', async () => {
      expect(await withdrawHook.getCollateral()).to.eq(ZERO_ADDRESS)

      await withdrawHook.connect(deployer).setCollateral(vault.address)

      expect(await withdrawHook.getCollateral()).to.eq(vault.address)
    })

    it('should be settable to the zero address', async () => {
      await withdrawHook.connect(deployer).setCollateral(vault.address)
      expect(await withdrawHook.getCollateral()).to.eq(vault.address)

      await withdrawHook.connect(deployer).setCollateral(ZERO_ADDRESS)

      expect(await withdrawHook.getCollateral()).to.eq(ZERO_ADDRESS)
    })

    it('should be settable to the same value twice', async () => {
      expect(await withdrawHook.getCollateral()).to.eq(ZERO_ADDRESS)

      await withdrawHook.connect(deployer).setCollateral(vault.address)

      expect(await withdrawHook.getCollateral()).to.eq(vault.address)

      await withdrawHook.connect(deployer).setCollateral(vault.address)

      expect(await withdrawHook.getCollateral()).to.eq(vault.address)
    })

    it('should emit a CollateralChange event', async () => {
      const tx = await withdrawHook.connect(deployer).setCollateral(vault.address)

      await expect(tx).to.emit(withdrawHook, 'CollateralChange').withArgs(vault.address)
    })
  })

  describe('# setDepositRecord', () => {
    it('reverts if not role holder', async () => {
      expect(
        await withdrawHook.hasRole(await withdrawHook.SET_DEPOSIT_RECORD_ROLE(), user.address)
      ).to.eq(false)

      await expect(withdrawHook.connect(user).setDepositRecord(depositRecord.address)).revertedWith(
        `AccessControl: account ${user.address.toLowerCase()} is missing role ${await withdrawHook.SET_DEPOSIT_RECORD_ROLE()}`
      )
    })

    it('sets to non-zero address', async () => {
      await withdrawHook.connect(deployer).setDepositRecord(ZERO_ADDRESS)
      expect(depositRecord.address).to.not.eq(ZERO_ADDRESS)
      expect(await withdrawHook.getDepositRecord()).to.not.eq(depositRecord.address)

      await withdrawHook.connect(deployer).setDepositRecord(depositRecord.address)

      expect(await withdrawHook.getDepositRecord()).to.eq(depositRecord.address)
    })

    it('sets to zero address', async () => {
      expect(await withdrawHook.getDepositRecord()).to.not.eq(ZERO_ADDRESS)

      await withdrawHook.connect(deployer).setDepositRecord(ZERO_ADDRESS)

      expect(await withdrawHook.getDepositRecord()).to.eq(ZERO_ADDRESS)
    })

    it('is idempotent', async () => {
      await withdrawHook.connect(deployer).setDepositRecord(ZERO_ADDRESS)
      expect(await withdrawHook.getDepositRecord()).to.not.eq(depositRecord.address)

      await withdrawHook.connect(deployer).setDepositRecord(depositRecord.address)

      expect(await withdrawHook.getDepositRecord()).to.eq(depositRecord.address)

      await withdrawHook.connect(deployer).setDepositRecord(depositRecord.address)

      expect(await withdrawHook.getDepositRecord()).to.eq(depositRecord.address)
    })
  })
})
