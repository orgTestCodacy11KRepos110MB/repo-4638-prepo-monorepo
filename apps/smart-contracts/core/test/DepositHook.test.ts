import chai, { expect } from 'chai'
import { ethers } from 'hardhat'
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/dist/src/signer-with-address'
import { id, parseEther } from 'ethers/lib/utils'
import { Contract } from 'ethers'
import { MockContract, smock } from '@defi-wonderland/smock'
import { ZERO_ADDRESS } from 'prepo-constants'
import { depositHookFixture, smockAccountListFixture } from './fixtures/HookFixture'
import { smockDepositRecordFixture } from './fixtures/DepositRecordFixture'
import { grantAndAcceptRole } from './utils'
import { DepositHook } from '../typechain'

chai.use(smock.matchers)

describe('=> DepositHook', () => {
  let depositHook: DepositHook
  let deployer: SignerWithAddress
  let user: SignerWithAddress
  let vault: SignerWithAddress
  let mockDepositRecord: MockContract<Contract>
  let mockAllowlist: MockContract<Contract>
  const TEST_GLOBAL_DEPOSIT_CAP = parseEther('50000')
  const TEST_ACCOUNT_DEPOSIT_CAP = parseEther('50')
  const TEST_AMOUNT_BEFORE_FEE = parseEther('1.01')
  const TEST_AMOUNT_AFTER_FEE = parseEther('1')

  beforeEach(async () => {
    ;[deployer, user, vault] = await ethers.getSigners()
    mockDepositRecord = await smockDepositRecordFixture(
      TEST_GLOBAL_DEPOSIT_CAP,
      TEST_ACCOUNT_DEPOSIT_CAP
    )
    mockAllowlist = await smockAccountListFixture()
    depositHook = await depositHookFixture()
    await grantAndAcceptRole(
      depositHook,
      deployer,
      deployer,
      await depositHook.SET_COLLATERAL_ROLE()
    )
    await grantAndAcceptRole(
      depositHook,
      deployer,
      deployer,
      await depositHook.SET_DEPOSIT_RECORD_ROLE()
    )
    await grantAndAcceptRole(
      depositHook,
      deployer,
      deployer,
      await depositHook.SET_DEPOSITS_ALLOWED_ROLE()
    )
    await grantAndAcceptRole(
      depositHook,
      deployer,
      deployer,
      await depositHook.SET_ALLOWLIST_ROLE()
    )
    await grantAndAcceptRole(
      mockDepositRecord,
      deployer,
      deployer,
      await mockDepositRecord.SET_ALLOWED_HOOK_ROLE()
    )
    await mockDepositRecord.connect(deployer).setAllowedHook(depositHook.address, true)
  })

  describe('initial state', () => {
    it('sets collateral to zero address', async () => {
      expect(await depositHook.getCollateral()).to.eq(ZERO_ADDRESS)
    })

    it('sets role constants to the correct hash', async () => {
      expect(await depositHook.SET_COLLATERAL_ROLE()).to.eq(
        id('DepositHook_setCollateral(address)')
      )
      expect(await depositHook.SET_DEPOSIT_RECORD_ROLE()).to.eq(
        id('DepositHook_setDepositRecord(address)')
      )
      expect(await depositHook.SET_DEPOSITS_ALLOWED_ROLE()).to.eq(
        id('DepositHook_setDepositsAllowed(bool)')
      )
    })
  })

  describe('# hook', () => {
    /**
     * Tests below use different values for TEST_AMOUNT_BEFORE_FEE and
     * TEST_AMOUNT_AFTER_FEE to ensure TEST_AMOUNT_BEFORE_FEE is ignored.
     */
    beforeEach(async () => {
      await depositHook.connect(deployer).setCollateral(vault.address)
      await depositHook.connect(deployer).setDepositsAllowed(true)
      await depositHook.connect(deployer).setDepositRecord(mockDepositRecord.address)
      await depositHook.connect(deployer).setAllowlist(mockAllowlist.address)
    })

    it('should only usable by the vault', async () => {
      expect(await depositHook.getCollateral()).to.not.eq(user.address)

      await expect(
        depositHook.connect(user).hook(user.address, TEST_AMOUNT_BEFORE_FEE, TEST_AMOUNT_AFTER_FEE)
      ).to.revertedWith('msg.sender != collateral')
    })

    it('reverts if deposits not allowed and account not on allow list', async () => {
      mockAllowlist.isIncluded.returns(false)
      expect(await mockAllowlist.isIncluded(user.address)).to.be.false
      await depositHook.connect(deployer).setDepositsAllowed(false)
      expect(await depositHook.depositsAllowed()).to.eq(false)

      await expect(
        depositHook.connect(vault).hook(user.address, TEST_AMOUNT_BEFORE_FEE, TEST_AMOUNT_AFTER_FEE)
      ).to.revertedWith('deposits not allowed')
    })

    it('reverts if deposits not allowed and account on allow list', async () => {
      mockAllowlist.isIncluded.returns(true)
      expect(await mockAllowlist.isIncluded(user.address)).to.be.true
      await depositHook.connect(deployer).setDepositsAllowed(false)
      expect(await depositHook.depositsAllowed()).to.eq(false)

      await expect(
        depositHook.connect(vault).hook(user.address, TEST_AMOUNT_BEFORE_FEE, TEST_AMOUNT_AFTER_FEE)
      ).to.revertedWith('deposits not allowed')
    })

    it('reverts if account not on allow list', async () => {
      mockAllowlist.isIncluded.returns(false)
      expect(await mockAllowlist.isIncluded(user.address)).to.be.false
      await depositHook.connect(deployer).setDepositsAllowed(true)
      expect(await depositHook.depositsAllowed()).to.eq(true)

      await expect(
        depositHook.connect(vault).hook(user.address, TEST_AMOUNT_BEFORE_FEE, TEST_AMOUNT_AFTER_FEE)
      ).to.revertedWith('sender not allowed')
    })

    it('succeeds if account on allow list', async () => {
      mockAllowlist.isIncluded.returns(true)
      expect(await mockAllowlist.isIncluded(user.address)).to.be.true
      expect(await depositHook.depositsAllowed()).to.eq(true)

      await depositHook
        .connect(vault)
        .hook(user.address, TEST_AMOUNT_BEFORE_FEE, TEST_AMOUNT_AFTER_FEE)
    })

    it('calls recordDeposit with the correct parameters', async () => {
      mockAllowlist.isIncluded.returns(true)
      expect(await mockAllowlist.isIncluded(user.address)).to.be.true
      expect(TEST_AMOUNT_BEFORE_FEE).to.not.eq(TEST_AMOUNT_AFTER_FEE)
      await depositHook
        .connect(vault)
        .hook(user.address, TEST_AMOUNT_BEFORE_FEE, TEST_AMOUNT_AFTER_FEE)

      expect(mockDepositRecord.recordDeposit).to.be.calledWith(user.address, TEST_AMOUNT_AFTER_FEE)
    })
  })

  describe('# setCollateral', () => {
    it('reverts if not role holder', async () => {
      expect(
        await depositHook.hasRole(await depositHook.SET_COLLATERAL_ROLE(), user.address)
      ).to.eq(false)

      await expect(depositHook.connect(user).setCollateral(vault.address)).revertedWith(
        `AccessControl: account ${user.address.toLowerCase()} is missing role ${await depositHook.SET_COLLATERAL_ROLE()}`
      )
    })

    it('should be settable to an address', async () => {
      expect(await depositHook.getCollateral()).to.eq(ZERO_ADDRESS)

      await depositHook.connect(deployer).setCollateral(vault.address)

      expect(await depositHook.getCollateral()).to.eq(vault.address)
    })

    it('should be settable to the zero address', async () => {
      await depositHook.connect(deployer).setCollateral(vault.address)
      expect(await depositHook.getCollateral()).to.eq(vault.address)

      await depositHook.connect(deployer).setCollateral(ZERO_ADDRESS)

      expect(await depositHook.getCollateral()).to.eq(ZERO_ADDRESS)
    })

    it('should be settable to the same value twice', async () => {
      expect(await depositHook.getCollateral()).to.eq(ZERO_ADDRESS)

      await depositHook.connect(deployer).setCollateral(vault.address)

      expect(await depositHook.getCollateral()).to.eq(vault.address)

      await depositHook.connect(deployer).setCollateral(vault.address)

      expect(await depositHook.getCollateral()).to.eq(vault.address)
    })

    it('emits CollateralChange', async () => {
      const tx = await depositHook.connect(deployer).setCollateral(vault.address)

      await expect(tx).to.emit(depositHook, 'CollateralChange').withArgs(vault.address)
    })
  })

  describe('# setDepositRecord', () => {
    it('reverts if not role holder', async () => {
      expect(
        await depositHook.hasRole(await depositHook.SET_DEPOSIT_RECORD_ROLE(), user.address)
      ).to.eq(false)

      await expect(
        depositHook.connect(user).setDepositRecord(mockDepositRecord.address)
      ).revertedWith(
        `AccessControl: account ${user.address.toLowerCase()} is missing role ${await depositHook.SET_DEPOSIT_RECORD_ROLE()}`
      )
    })

    it('sets to non-zero address', async () => {
      await depositHook.connect(deployer).setDepositRecord(ZERO_ADDRESS)
      expect(mockDepositRecord.address).to.not.eq(ZERO_ADDRESS)
      expect(await depositHook.getDepositRecord()).to.not.eq(mockDepositRecord.address)

      await depositHook.connect(deployer).setDepositRecord(mockDepositRecord.address)

      expect(await depositHook.getDepositRecord()).to.eq(mockDepositRecord.address)
    })

    it('sets to zero address', async () => {
      await depositHook.connect(deployer).setDepositRecord(ZERO_ADDRESS)

      expect(await depositHook.getDepositRecord()).to.eq(ZERO_ADDRESS)
    })

    it('is idempotent', async () => {
      await depositHook.connect(deployer).setDepositRecord(ZERO_ADDRESS)
      expect(await depositHook.getDepositRecord()).to.not.eq(mockDepositRecord.address)

      await depositHook.connect(deployer).setDepositRecord(mockDepositRecord.address)

      expect(await depositHook.getDepositRecord()).to.eq(mockDepositRecord.address)

      await depositHook.connect(deployer).setDepositRecord(mockDepositRecord.address)

      expect(await depositHook.getDepositRecord()).to.eq(mockDepositRecord.address)
    })

    it('emits DepositRecordChange', async () => {
      const tx = await depositHook.connect(deployer).setDepositRecord(mockDepositRecord.address)

      await expect(tx)
        .to.emit(depositHook, 'DepositRecordChange')
        .withArgs(mockDepositRecord.address)
    })
  })

  describe('# setDepositsAllowed', () => {
    it('reverts if not role holder', async () => {
      expect(
        await depositHook.hasRole(await depositHook.SET_DEPOSITS_ALLOWED_ROLE(), user.address)
      ).to.eq(false)

      await expect(depositHook.connect(user).setDepositsAllowed(true)).revertedWith(
        `AccessControl: account ${user.address.toLowerCase()} is missing role ${await depositHook.SET_DEPOSITS_ALLOWED_ROLE()}`
      )
    })

    it('sets to false', async () => {
      await depositHook.connect(deployer).setDepositsAllowed(true)
      expect(await depositHook.depositsAllowed()).to.not.eq(false)

      await depositHook.connect(deployer).setDepositsAllowed(false)

      expect(await depositHook.depositsAllowed()).to.eq(false)
    })

    it('sets to true', async () => {
      expect(await depositHook.depositsAllowed()).to.not.eq(true)

      await depositHook.connect(deployer).setDepositsAllowed(true)

      expect(await depositHook.depositsAllowed()).to.eq(true)
    })

    it('is idempotent', async () => {
      expect(await depositHook.depositsAllowed()).to.not.eq(true)

      await depositHook.connect(deployer).setDepositsAllowed(true)

      expect(await depositHook.depositsAllowed()).to.eq(true)

      await depositHook.connect(deployer).setDepositsAllowed(true)

      expect(await depositHook.depositsAllowed()).to.eq(true)
    })

    it('emits DepositsAllowedChange', async () => {
      const tx = await depositHook.connect(deployer).setDepositsAllowed(true)

      await expect(tx).to.emit(depositHook, 'DepositsAllowedChange').withArgs(true)
    })
  })
})
