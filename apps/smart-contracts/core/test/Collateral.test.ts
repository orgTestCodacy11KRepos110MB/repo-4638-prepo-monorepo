import chai, { expect } from 'chai'
import { ethers, upgrades } from 'hardhat'
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/dist/src/signer-with-address'
import { id, parseEther, parseUnits } from 'ethers/lib/utils'
import { BigNumber, Contract } from 'ethers'
import { MockContract, smock } from '@defi-wonderland/smock'
import { DEFAULT_ADMIN_ROLE, ZERO_ADDRESS } from 'prepo-constants'
import {
  smockDepositHookFixture,
  smockWithdrawHookFixture,
  smockManagerWithdrawHookFixture,
} from './fixtures/HookFixture'
import { collateralFixture } from './fixtures/CollateralFixture'
import { smockDepositRecordFixture } from './fixtures/DepositRecordFixture'
import { testERC20Fixture } from './fixtures/TestERC20Fixture'
import { FEE_DENOMINATOR, grantAndAcceptRole, PERCENT_DENOMINATOR } from './utils'
import { Collateral, TestERC20 } from '../typechain'

chai.use(smock.matchers)

describe('=> Collateral', () => {
  let deployer: SignerWithAddress
  let user1: SignerWithAddress
  let user2: SignerWithAddress
  let manager: SignerWithAddress
  let baseToken: TestERC20
  let collateral: Collateral
  let depositRecord: MockContract<Contract>
  let depositHook: MockContract<Contract>
  let withdrawHook: MockContract<Contract>
  let managerWithdrawHook: MockContract<Contract>
  const TEST_DEPOSIT_FEE = 1000 // 0.1%
  const TEST_WITHDRAW_FEE = 2000 // 0.2%
  const TEST_GLOBAL_DEPOSIT_CAP = parseEther('50000')
  const TEST_USER_DEPOSIT_CAP = parseEther('50')
  const TEST_MIN_RESERVE_PERCENTAGE = 250000 // 25%
  const USDC_DECIMALS = 6
  const USDC_DENOMINATOR = 10 ** USDC_DECIMALS

  const getSignersAndDeployCollateral = async (
    baseTokenDecimals: number = USDC_DECIMALS
  ): Promise<void> => {
    ;[deployer, manager, user1, user2] = await ethers.getSigners()
    baseToken = await testERC20Fixture('Test Coin', 'TST', baseTokenDecimals)
    collateral = await collateralFixture(
      'prePO USDC Collateral',
      'preUSD',
      baseToken.address,
      baseTokenDecimals
    )
    depositRecord = await smockDepositRecordFixture(TEST_GLOBAL_DEPOSIT_CAP, TEST_USER_DEPOSIT_CAP)
    depositHook = await smockDepositHookFixture(depositRecord.address)
    withdrawHook = await smockWithdrawHookFixture(depositRecord.address)
    await grantAndAcceptRole(
      depositRecord,
      deployer,
      deployer,
      await depositRecord.SET_ALLOWED_HOOK_ROLE()
    )
    await depositRecord.connect(deployer).setAllowedHook(depositHook.address, true)
    await depositRecord.connect(deployer).setAllowedHook(withdrawHook.address, true)
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
      await depositHook.SET_DEPOSITS_ALLOWED_ROLE()
    )
    await depositHook.connect(deployer).setCollateral(collateral.address)
    await depositHook.connect(deployer).setDepositsAllowed(true)
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
      await withdrawHook.SET_WITHDRAWALS_ALLOWED_ROLE()
    )
    await withdrawHook.connect(deployer).setCollateral(collateral.address)
    await withdrawHook.connect(deployer).setWithdrawalsAllowed(true)
    managerWithdrawHook = await smockManagerWithdrawHookFixture(depositRecord.address)
    await grantAndAcceptRole(
      managerWithdrawHook,
      deployer,
      deployer,
      await managerWithdrawHook.SET_COLLATERAL_ROLE()
    )
    await grantAndAcceptRole(
      managerWithdrawHook,
      deployer,
      deployer,
      await managerWithdrawHook.SET_MIN_RESERVE_PERCENTAGE_ROLE()
    )
    await managerWithdrawHook.connect(deployer).setCollateral(collateral.address)
    await managerWithdrawHook.connect(deployer).setMinReservePercentage(TEST_MIN_RESERVE_PERCENTAGE)
  }

  const setupCollateral = async (baseTokenDecimals: number = USDC_DECIMALS): Promise<void> => {
    await getSignersAndDeployCollateral(baseTokenDecimals)
    await grantAndAcceptRole(
      collateral,
      deployer,
      deployer,
      await collateral.MANAGER_WITHDRAW_ROLE()
    )
    await grantAndAcceptRole(collateral, deployer, deployer, await collateral.SET_MANAGER_ROLE())
    await grantAndAcceptRole(
      collateral,
      deployer,
      deployer,
      await collateral.SET_DEPOSIT_FEE_ROLE()
    )
    await grantAndAcceptRole(
      collateral,
      deployer,
      deployer,
      await collateral.SET_WITHDRAW_FEE_ROLE()
    )
    await grantAndAcceptRole(
      collateral,
      deployer,
      deployer,
      await collateral.SET_DEPOSIT_HOOK_ROLE()
    )
    await grantAndAcceptRole(
      collateral,
      deployer,
      deployer,
      await collateral.SET_WITHDRAW_HOOK_ROLE()
    )
    await grantAndAcceptRole(
      collateral,
      deployer,
      deployer,
      await collateral.SET_MANAGER_WITHDRAW_HOOK_ROLE()
    )
    await collateral.connect(deployer).setManager(manager.address)
  }

  before(() => {
    upgrades.silenceWarnings()
  })

  describe('initial state', () => {
    beforeEach(async () => {
      await getSignersAndDeployCollateral()
    })

    it('sets base token from constructor', async () => {
      expect(await collateral.getBaseToken()).to.eq(baseToken.address)
    })

    it('sets name from initialize', async () => {
      expect(await collateral.name()).to.eq('prePO USDC Collateral')
    })

    it('sets symbol from initialize', async () => {
      expect(await collateral.symbol()).to.eq('preUSD')
    })

    it('sets DEFAULT_ADMIN_ROLE holder to deployer', async () => {
      expect(await collateral.hasRole(DEFAULT_ADMIN_ROLE, deployer.address)).to.eq(true)
    })

    it('sets role constants to the correct hash', async () => {
      expect(await collateral.MANAGER_WITHDRAW_ROLE()).to.eq(
        id('Collateral_managerWithdraw(uint256)')
      )
      expect(await collateral.SET_MANAGER_ROLE()).to.eq(id('Collateral_setManager(address)'))
      expect(await collateral.SET_DEPOSIT_FEE_ROLE()).to.eq(id('Collateral_setDepositFee(uint256)'))
      expect(await collateral.SET_WITHDRAW_FEE_ROLE()).to.eq(
        id('Collateral_setWithdrawFee(uint256)')
      )
      expect(await collateral.SET_DEPOSIT_HOOK_ROLE()).to.eq(id('Collateral_setDepositHook(IHook)'))
      expect(await collateral.SET_WITHDRAW_HOOK_ROLE()).to.eq(
        id('Collateral_setWithdrawHook(IHook)')
      )
      expect(await collateral.SET_MANAGER_WITHDRAW_HOOK_ROLE()).to.eq(
        id('Collateral_setManagerWithdrawHook(IHook)')
      )
    })
  })

  describe('# setManager ', () => {
    beforeEach(async () => {
      await getSignersAndDeployCollateral()
      await grantAndAcceptRole(collateral, deployer, deployer, await collateral.SET_MANAGER_ROLE())
    })

    it('reverts if not role holder', async () => {
      expect(await collateral.hasRole(await collateral.SET_MANAGER_ROLE(), user1.address)).to.eq(
        false
      )

      await expect(collateral.connect(user1).setManager(manager.address)).revertedWith(
        `AccessControl: account ${user1.address.toLowerCase()} is missing role ${await collateral.SET_MANAGER_ROLE()}`
      )
    })

    it('sets to non-zero address', async () => {
      expect(await collateral.getManager()).to.not.eq(manager.address)

      await collateral.connect(deployer).setManager(manager.address)

      expect(await collateral.getManager()).to.eq(manager.address)
    })

    it('sets to zero address', async () => {
      await collateral.connect(deployer).setManager(manager.address)
      expect(await collateral.getManager()).to.not.eq(ZERO_ADDRESS)

      await collateral.connect(deployer).setManager(ZERO_ADDRESS)

      expect(await collateral.getManager()).to.eq(ZERO_ADDRESS)
    })

    it('is idempotent', async () => {
      expect(await collateral.getManager()).to.not.eq(manager.address)

      await collateral.connect(deployer).setManager(manager.address)

      expect(await collateral.getManager()).to.eq(manager.address)

      await collateral.connect(deployer).setManager(manager.address)

      expect(await collateral.getManager()).to.eq(manager.address)
    })

    it('emits ManagerChange', async () => {
      const tx = await collateral.connect(deployer).setManager(manager.address)

      await expect(tx).to.emit(collateral, 'ManagerChange').withArgs(manager.address)
    })
  })

  describe('# setDepositFee', () => {
    beforeEach(async () => {
      await getSignersAndDeployCollateral()
      await grantAndAcceptRole(
        collateral,
        deployer,
        deployer,
        await collateral.SET_DEPOSIT_FEE_ROLE()
      )
    })

    it('reverts if not role holder', async () => {
      expect(
        await collateral.hasRole(await collateral.SET_DEPOSIT_FEE_ROLE(), user1.address)
      ).to.eq(false)

      await expect(collateral.connect(user1).setDepositFee(TEST_DEPOSIT_FEE)).revertedWith(
        `AccessControl: account ${user1.address.toLowerCase()} is missing role ${await collateral.SET_DEPOSIT_FEE_ROLE()}`
      )
    })

    it('sets to non-zero value', async () => {
      expect(TEST_DEPOSIT_FEE).to.not.eq(0)
      expect(await collateral.getDepositFee()).to.not.eq(TEST_DEPOSIT_FEE)

      await collateral.connect(deployer).setDepositFee(TEST_DEPOSIT_FEE)

      expect(await collateral.getDepositFee()).to.eq(TEST_DEPOSIT_FEE)
    })

    it('sets to zero', async () => {
      await collateral.connect(deployer).setDepositFee(TEST_DEPOSIT_FEE)
      expect(await collateral.getDepositFee()).to.not.eq(0)

      await collateral.connect(deployer).setDepositFee(0)

      expect(await collateral.getDepositFee()).to.eq(0)
    })

    it('is idempotent', async () => {
      expect(await collateral.getDepositFee()).to.not.eq(TEST_DEPOSIT_FEE)

      await collateral.connect(deployer).setDepositFee(TEST_DEPOSIT_FEE)

      expect(await collateral.getDepositFee()).to.eq(TEST_DEPOSIT_FEE)

      await collateral.connect(deployer).setDepositFee(TEST_DEPOSIT_FEE)

      expect(await collateral.getDepositFee()).to.eq(TEST_DEPOSIT_FEE)
    })

    it('emits DepositFeeChange', async () => {
      const tx = await collateral.connect(deployer).setDepositFee(TEST_DEPOSIT_FEE)

      await expect(tx).to.emit(collateral, 'DepositFeeChange').withArgs(TEST_DEPOSIT_FEE)
    })
  })

  describe('# setWithdrawFee', () => {
    beforeEach(async () => {
      await getSignersAndDeployCollateral()
      await grantAndAcceptRole(
        collateral,
        deployer,
        deployer,
        await collateral.SET_WITHDRAW_FEE_ROLE()
      )
    })

    it('reverts if not role holder', async () => {
      expect(
        await collateral.hasRole(await collateral.SET_WITHDRAW_FEE_ROLE(), user1.address)
      ).to.eq(false)

      await expect(collateral.connect(user1).setWithdrawFee(TEST_WITHDRAW_FEE)).revertedWith(
        `AccessControl: account ${user1.address.toLowerCase()} is missing role ${await collateral.SET_WITHDRAW_FEE_ROLE()}`
      )
    })

    it('sets to non-zero value', async () => {
      expect(TEST_WITHDRAW_FEE).to.not.eq(0)
      expect(await collateral.getWithdrawFee()).to.not.eq(TEST_WITHDRAW_FEE)

      await collateral.connect(deployer).setWithdrawFee(TEST_WITHDRAW_FEE)

      expect(await collateral.getWithdrawFee()).to.eq(TEST_WITHDRAW_FEE)
    })

    it('sets to zero', async () => {
      await collateral.connect(deployer).setWithdrawFee(TEST_WITHDRAW_FEE)
      expect(await collateral.getWithdrawFee()).to.not.eq(0)

      await collateral.connect(deployer).setWithdrawFee(0)

      expect(await collateral.getWithdrawFee()).to.eq(0)
    })

    it('is idempotent', async () => {
      expect(await collateral.getWithdrawFee()).to.not.eq(TEST_WITHDRAW_FEE)

      await collateral.connect(deployer).setWithdrawFee(TEST_WITHDRAW_FEE)

      expect(await collateral.getWithdrawFee()).to.eq(TEST_WITHDRAW_FEE)

      await collateral.connect(deployer).setWithdrawFee(TEST_WITHDRAW_FEE)

      expect(await collateral.getWithdrawFee()).to.eq(TEST_WITHDRAW_FEE)
    })

    it('emits WithdrawFeeChange', async () => {
      const tx = await collateral.connect(deployer).setWithdrawFee(TEST_WITHDRAW_FEE)

      await expect(tx).to.emit(collateral, 'WithdrawFeeChange').withArgs(TEST_WITHDRAW_FEE)
    })
  })

  describe('# setDepositHook', () => {
    beforeEach(async () => {
      await getSignersAndDeployCollateral()
      await grantAndAcceptRole(
        collateral,
        deployer,
        deployer,
        await collateral.SET_DEPOSIT_HOOK_ROLE()
      )
    })

    it('reverts if not role holder', async () => {
      expect(
        await collateral.hasRole(await collateral.SET_DEPOSIT_HOOK_ROLE(), user1.address)
      ).to.eq(false)

      await expect(collateral.connect(user1).setDepositHook(user1.address)).revertedWith(
        `AccessControl: account ${user1.address.toLowerCase()} is missing role ${await collateral.SET_DEPOSIT_HOOK_ROLE()}`
      )
    })

    it('sets to non-zero address', async () => {
      expect(await collateral.getDepositHook()).to.not.eq(user1.address)

      await collateral.connect(deployer).setDepositHook(user1.address)

      expect(await collateral.getDepositHook()).to.eq(user1.address)
    })

    it('sets to zero address', async () => {
      await collateral.connect(deployer).setDepositHook(user1.address)
      expect(await collateral.getDepositHook()).to.not.eq(ZERO_ADDRESS)

      await collateral.connect(deployer).setDepositHook(ZERO_ADDRESS)

      expect(await collateral.getDepositHook()).to.eq(ZERO_ADDRESS)
    })

    it('is idempotent', async () => {
      expect(await collateral.getDepositHook()).to.not.eq(user1.address)

      await collateral.connect(deployer).setDepositHook(user1.address)

      expect(await collateral.getDepositHook()).to.eq(user1.address)

      await collateral.connect(deployer).setDepositHook(user1.address)

      expect(await collateral.getDepositHook()).to.eq(user1.address)
    })

    it('emits DepositHookChange', async () => {
      const tx = await collateral.connect(deployer).setDepositHook(user1.address)

      await expect(tx).to.emit(collateral, 'DepositHookChange').withArgs(user1.address)
    })
  })

  describe('# setWithdrawHook', () => {
    beforeEach(async () => {
      await getSignersAndDeployCollateral()
      await grantAndAcceptRole(
        collateral,
        deployer,
        deployer,
        await collateral.SET_WITHDRAW_HOOK_ROLE()
      )
    })

    it('reverts if not role holder', async () => {
      expect(
        await collateral.hasRole(await collateral.SET_WITHDRAW_HOOK_ROLE(), user1.address)
      ).to.eq(false)

      await expect(collateral.connect(user1).setWithdrawHook(user1.address)).revertedWith(
        `AccessControl: account ${user1.address.toLowerCase()} is missing role ${await collateral.SET_WITHDRAW_HOOK_ROLE()}`
      )
    })

    it('sets to non-zero address', async () => {
      expect(await collateral.getWithdrawHook()).to.not.eq(user1.address)

      await collateral.connect(deployer).setWithdrawHook(user1.address)

      expect(await collateral.getWithdrawHook()).to.eq(user1.address)
    })

    it('sets to zero address', async () => {
      await collateral.connect(deployer).setWithdrawHook(user1.address)
      expect(await collateral.getWithdrawHook()).to.not.eq(ZERO_ADDRESS)

      await collateral.connect(deployer).setWithdrawHook(ZERO_ADDRESS)

      expect(await collateral.getWithdrawHook()).to.eq(ZERO_ADDRESS)
    })

    it('is idempotent', async () => {
      expect(await collateral.getWithdrawHook()).to.not.eq(user1.address)

      await collateral.connect(deployer).setWithdrawHook(user1.address)

      expect(await collateral.getWithdrawHook()).to.eq(user1.address)

      await collateral.connect(deployer).setWithdrawHook(user1.address)

      expect(await collateral.getWithdrawHook()).to.eq(user1.address)
    })

    it('emits WithdrawHookChange', async () => {
      const tx = await collateral.connect(deployer).setWithdrawHook(user1.address)

      await expect(tx).to.emit(collateral, 'WithdrawHookChange').withArgs(user1.address)
    })
  })

  describe('# setManagerWithdrawHook', () => {
    beforeEach(async () => {
      await getSignersAndDeployCollateral()
      await grantAndAcceptRole(
        collateral,
        deployer,
        deployer,
        await collateral.SET_MANAGER_WITHDRAW_HOOK_ROLE()
      )
    })

    it('reverts if not role holder', async () => {
      expect(
        await collateral.hasRole(await collateral.SET_MANAGER_WITHDRAW_HOOK_ROLE(), user1.address)
      ).to.eq(false)

      await expect(collateral.connect(user1).setManagerWithdrawHook(user1.address)).revertedWith(
        `AccessControl: account ${user1.address.toLowerCase()} is missing role ${await collateral.SET_MANAGER_WITHDRAW_HOOK_ROLE()}`
      )
    })

    it('sets to non-zero address', async () => {
      expect(await collateral.getManagerWithdrawHook()).to.not.eq(user1.address)

      await collateral.connect(deployer).setManagerWithdrawHook(user1.address)

      expect(await collateral.getManagerWithdrawHook()).to.eq(user1.address)
    })

    it('sets to zero address', async () => {
      await collateral.connect(deployer).setManagerWithdrawHook(user1.address)
      expect(await collateral.getManagerWithdrawHook()).to.not.eq(ZERO_ADDRESS)

      await collateral.connect(deployer).setManagerWithdrawHook(ZERO_ADDRESS)

      expect(await collateral.getManagerWithdrawHook()).to.eq(ZERO_ADDRESS)
    })

    it('is idempotent', async () => {
      expect(await collateral.getManagerWithdrawHook()).to.not.eq(user1.address)

      await collateral.connect(deployer).setManagerWithdrawHook(user1.address)

      expect(await collateral.getManagerWithdrawHook()).to.eq(user1.address)

      await collateral.connect(deployer).setManagerWithdrawHook(user1.address)

      expect(await collateral.getManagerWithdrawHook()).to.eq(user1.address)
    })

    it('emits ManagerWithdrawHookChange', async () => {
      const tx = await collateral.connect(deployer).setManagerWithdrawHook(user1.address)

      await expect(tx).to.emit(collateral, 'ManagerWithdrawHookChange').withArgs(user1.address)
    })
  })

  describe('# getReserve', () => {
    beforeEach(async () => {
      await setupCollateral()
    })

    it("returns contract's base token balance", async () => {
      await baseToken.connect(deployer).mint(collateral.address, parseEther('1'))
      const contractBalance = await baseToken.balanceOf(collateral.address)
      expect(contractBalance).to.be.eq(parseEther('1'))

      expect(await collateral.getReserve()).to.eq(contractBalance)
    })
  })

  describe('# managerWithdraw', () => {
    beforeEach(async () => {
      await setupCollateral()
      await baseToken.mint(collateral.address, parseUnits('1', 6))
      await collateral.connect(deployer).setManagerWithdrawHook(managerWithdrawHook.address)
    })

    it('reverts if not role holder', async () => {
      expect(
        await collateral.hasRole(await collateral.MANAGER_WITHDRAW_ROLE(), user1.address)
      ).to.eq(false)

      await expect(collateral.connect(user1).managerWithdraw(1)).revertedWith(
        `AccessControl: account ${user1.address.toLowerCase()} is missing role ${await collateral.MANAGER_WITHDRAW_ROLE()}`
      )
    })

    it('reverts if hook reverts', async () => {
      /**
       * Still providing valid inputs to ensure withdrawals are only reverting due to smock
       * since we cannot verify revert by message.
       */
      const contractBT = await baseToken.balanceOf(collateral.address)
      const baseTokenManagerCanWithdraw = contractBT
        .mul(TEST_MIN_RESERVE_PERCENTAGE)
        .div(PERCENT_DENOMINATOR)
      const amountToWithdraw = baseTokenManagerCanWithdraw
      expect(amountToWithdraw).to.be.gt(0)
      managerWithdrawHook.hook.reverts()

      await expect(collateral.connect(deployer).managerWithdraw(amountToWithdraw)).reverted
    })

    it('calls manager withdraw hook with correct parameters', async () => {
      const contractBT = await baseToken.balanceOf(collateral.address)
      const baseTokenManagerCanWithdraw = contractBT
        .mul(TEST_MIN_RESERVE_PERCENTAGE)
        .div(PERCENT_DENOMINATOR)
      const amountToWithdraw = baseTokenManagerCanWithdraw
      expect(amountToWithdraw).to.be.gt(0)

      await collateral.connect(deployer).managerWithdraw(amountToWithdraw)

      expect(managerWithdrawHook.hook).to.be.calledWith(
        deployer.address,
        amountToWithdraw,
        amountToWithdraw
      )
    })

    it('transfers base tokens to manager', async () => {
      const contractBTBefore = await baseToken.balanceOf(collateral.address)
      const baseTokenManagerCanWithdraw = contractBTBefore
        .mul(TEST_MIN_RESERVE_PERCENTAGE)
        .div(PERCENT_DENOMINATOR)
      const managerBTBefore = await baseToken.balanceOf(manager.address)
      const amountToWithdraw = baseTokenManagerCanWithdraw
      expect(amountToWithdraw).to.be.gt(0)

      await collateral.connect(deployer).managerWithdraw(amountToWithdraw)

      expect(await baseToken.balanceOf(collateral.address)).to.eq(
        contractBTBefore.sub(amountToWithdraw)
      )
      expect(await baseToken.balanceOf(manager.address)).to.eq(
        managerBTBefore.add(amountToWithdraw)
      )
    })
  })

  describe('# deposit', () => {
    beforeEach(async () => {
      await setupCollateral()
      await baseToken.mint(user1.address, parseUnits('1', USDC_DECIMALS))
      await baseToken.connect(user1).approve(collateral.address, parseUnits('1', USDC_DECIMALS))
      await collateral.connect(deployer).setDepositFee(TEST_DEPOSIT_FEE)
      await collateral.connect(deployer).setDepositHook(depositHook.address)
    })

    it('reverts if deposit = 0 and deposit fee = 0%', async () => {
      await collateral.connect(deployer).setDepositFee(0)

      await expect(collateral.connect(user1).deposit(0)).to.be.revertedWith('amount = 0')
    })

    it('reverts if deposit = 0 and deposit fee > 0%', async () => {
      expect(await collateral.getDepositFee()).to.be.gt(0)

      await expect(collateral.connect(user1).deposit(0)).to.be.revertedWith('fee = 0')
    })

    it('reverts if deposit > 0, fee = 0, and deposit fee > 0%', async () => {
      expect(await collateral.getDepositFee()).to.be.gt(0)
      const amountToDeposit = BigNumber.from(1)
      // expect fee to be zero
      expect(amountToDeposit.mul(await collateral.getDepositFee()).div(FEE_DENOMINATOR)).to.eq(0)

      await expect(collateral.connect(user1).deposit(amountToDeposit)).to.be.revertedWith('fee = 0')
    })

    it('reverts if insufficient approval', async () => {
      const amountToDeposit = await baseToken.balanceOf(user1.address)
      expect(amountToDeposit).to.be.gt(0)
      await baseToken.connect(user1).approve(collateral.address, amountToDeposit.sub(1))
      expect(await baseToken.allowance(user1.address, collateral.address)).to.be.lt(amountToDeposit)

      await expect(collateral.connect(user1).deposit(amountToDeposit)).to.be.revertedWith(
        'ERC20: insufficient allowance'
      )
    })

    it('reverts if insufficient balance', async () => {
      const amountToDeposit = (await baseToken.balanceOf(user1.address)).add(1)
      expect(amountToDeposit).to.be.gt(0)
      await baseToken.connect(user1).approve(collateral.address, amountToDeposit)
      expect(await baseToken.allowance(user1.address, collateral.address)).to.be.eq(amountToDeposit)

      await expect(collateral.connect(user1).deposit(amountToDeposit)).to.be.revertedWith(
        'ERC20: transfer amount exceeds balance'
      )
    })

    it('reverts if hook reverts', async () => {
      const amountToDeposit = await baseToken.balanceOf(user1.address)
      expect(amountToDeposit).to.be.gt(0)
      expect(await baseToken.allowance(user1.address, collateral.address)).to.be.eq(amountToDeposit)
      depositHook.hook.reverts()

      await expect(collateral.connect(user1).deposit(amountToDeposit)).to.be.reverted
    })

    it('transfers amount from depositor to contract', async () => {
      const userBTBefore = await baseToken.balanceOf(user1.address)
      const amountToDeposit = userBTBefore
      expect(amountToDeposit).to.be.gt(0)
      expect(await baseToken.allowance(user1.address, collateral.address)).to.be.eq(amountToDeposit)

      const tx = await collateral.connect(user1).deposit(amountToDeposit)

      expect(await baseToken.balanceOf(user1.address)).to.eq(userBTBefore.sub(amountToDeposit))
      await expect(tx)
        .to.emit(baseToken, 'Transfer')
        .withArgs(user1.address, collateral.address, amountToDeposit)
    })

    it('approves fee for hook to use', async () => {
      const amountToDeposit = await baseToken.balanceOf(user1.address)
      expect(amountToDeposit).to.be.gt(0)
      expect(await baseToken.allowance(user1.address, collateral.address)).to.be.eq(amountToDeposit)
      expect(await baseToken.allowance(collateral.address, depositHook.address)).to.eq(0)
      const fee = amountToDeposit.mul(await collateral.getDepositFee()).div(FEE_DENOMINATOR)

      await collateral.connect(user1).deposit(amountToDeposit)

      expect(await baseToken.allowance(collateral.address, depositHook.address)).to.eq(fee)
      expect(await baseToken.balanceOf(collateral.address)).to.eq(amountToDeposit)
    })

    it('replaces previous fee approval', async () => {
      const firstAmountToDeposit = await baseToken.balanceOf(user1.address)
      const firstFee = firstAmountToDeposit
        .mul(await collateral.getDepositFee())
        .div(FEE_DENOMINATOR)
      await collateral.connect(user1).deposit(firstAmountToDeposit)
      const secondAmountToDeposit = parseUnits('0.5', USDC_DECIMALS)
      const secondFee = secondAmountToDeposit
        .mul(await collateral.getDepositFee())
        .div(FEE_DENOMINATOR)
      expect(secondFee).to.not.eq(firstFee)
      await baseToken.mint(user1.address, secondAmountToDeposit)
      await baseToken.connect(user1).approve(collateral.address, secondAmountToDeposit)

      await collateral.connect(user1).deposit(secondAmountToDeposit)

      expect(await baseToken.allowance(collateral.address, depositHook.address)).to.eq(secondFee)
    })

    it('mints decimal-adjusted amount to depositor if decimals > base token decimals', async () => {
      expect(await collateral.decimals()).to.be.gt(await baseToken.decimals())
      const userCTBefore = await collateral.balanceOf(user1.address)
      const amountToDeposit = await baseToken.balanceOf(user1.address)
      expect(amountToDeposit).to.be.gt(0)
      expect(await baseToken.allowance(user1.address, collateral.address)).to.be.eq(amountToDeposit)
      const fee = amountToDeposit.mul(await collateral.getDepositFee()).div(FEE_DENOMINATOR)
      const expectedCT = amountToDeposit.sub(fee).mul(parseEther('1')).div(USDC_DENOMINATOR)

      await collateral.connect(user1).deposit(amountToDeposit)

      expect(await collateral.balanceOf(user1.address)).to.eq(userCTBefore.add(expectedCT))
    })

    it('mints decimal-adjusted amount to depositor if decimals = base token decimals', async () => {
      // Setup 18 decimal base token
      await setupCollateral(await collateral.decimals())
      expect(await collateral.decimals()).to.eq(await baseToken.decimals())
      await baseToken.mint(user1.address, parseEther('1'))
      const userCTBefore = await collateral.balanceOf(user1.address)
      const amountToDeposit = await baseToken.balanceOf(user1.address)
      expect(amountToDeposit).to.be.gt(0)
      await baseToken.connect(user1).approve(collateral.address, amountToDeposit)
      expect(await baseToken.allowance(user1.address, collateral.address)).to.be.eq(amountToDeposit)
      const fee = amountToDeposit.mul(await collateral.getDepositFee()).div(FEE_DENOMINATOR)
      const expectedCT = amountToDeposit.sub(fee)

      await collateral.connect(user1).deposit(amountToDeposit)

      expect(await collateral.balanceOf(user1.address)).to.eq(userCTBefore.add(expectedCT))
    })

    it('mints decimal-adjusted amount to depositor if decimals < base token decimals', async () => {
      // Setup 19 decimal base token
      await setupCollateral((await collateral.decimals()) + 1)
      expect(await collateral.decimals()).to.be.lt(await baseToken.decimals())
      await baseToken.mint(user1.address, parseUnits('1', (await collateral.decimals()) + 1))
      const userCTBefore = await collateral.balanceOf(user1.address)
      const amountToDeposit = await baseToken.balanceOf(user1.address)
      expect(amountToDeposit).to.be.gt(0)
      await baseToken.connect(user1).approve(collateral.address, amountToDeposit)
      expect(await baseToken.allowance(user1.address, collateral.address)).to.be.eq(amountToDeposit)
      const fee = amountToDeposit.mul(await collateral.getDepositFee()).div(FEE_DENOMINATOR)
      const GREATER_DECIMAL_DENOMINATOR = parseUnits('1', (await collateral.decimals()) + 1)
      const expectedCT = amountToDeposit
        .sub(fee)
        .mul(parseEther('1'))
        .div(GREATER_DECIMAL_DENOMINATOR)

      await collateral.connect(user1).deposit(amountToDeposit)

      expect(await collateral.balanceOf(user1.address)).to.eq(userCTBefore.add(expectedCT))
    })

    it('allows a deposit > 0 if deposit fee = 0%', async () => {
      await collateral.connect(deployer).setDepositFee(0)
      const userBTBefore = await baseToken.balanceOf(user1.address)
      const contractBTBefore = await baseToken.balanceOf(collateral.address)
      const userCTBefore = await collateral.balanceOf(user1.address)
      const amountToDeposit = userBTBefore
      const feeAmount = amountToDeposit.mul(await collateral.getDepositFee()).div(FEE_DENOMINATOR)
      expect(feeAmount).to.eq(0)
      const expectedCT = amountToDeposit.mul(parseEther('1')).div(USDC_DENOMINATOR)

      await collateral.connect(user1).deposit(amountToDeposit)

      expect(await baseToken.balanceOf(user1.address)).to.eq(userBTBefore.sub(amountToDeposit))
      expect(await baseToken.balanceOf(collateral.address)).to.eq(
        contractBTBefore.add(amountToDeposit)
      )
      expect(await baseToken.allowance(collateral.address, depositHook.address)).to.eq(0)
      expect(await collateral.balanceOf(user1.address)).to.eq(userCTBefore.add(expectedCT))
    })

    it('ignores hook if hook not set', async () => {
      const amountToDeposit = await baseToken.balanceOf(user1.address)
      expect(amountToDeposit).to.be.gt(0)
      expect(await baseToken.allowance(user1.address, collateral.address)).to.be.eq(amountToDeposit)
      await collateral.connect(deployer).setDepositHook(ZERO_ADDRESS)

      await collateral.connect(user1).deposit(amountToDeposit)

      expect(depositHook.hook).callCount(0)
    })

    it("doesn't give fee approval if hook not set", async () => {
      const amountToDeposit = await baseToken.balanceOf(user1.address)
      expect(amountToDeposit).to.be.gt(0)
      const fee = amountToDeposit.mul(await collateral.getDepositFee()).div(FEE_DENOMINATOR)
      expect(fee).to.be.gt(0)
      expect(await baseToken.allowance(collateral.address, depositHook.address)).to.eq(0)
      await collateral.connect(deployer).setDepositHook(ZERO_ADDRESS)

      await collateral.connect(user1).deposit(amountToDeposit)

      expect(await baseToken.allowance(collateral.address, depositHook.address)).to.eq(0)
    })

    it('calls deposit hook with correct parameters', async () => {
      const amountToDeposit = await baseToken.balanceOf(user1.address)
      expect(amountToDeposit).to.be.gt(0)
      expect(await baseToken.allowance(user1.address, collateral.address)).to.be.eq(amountToDeposit)
      const fee = amountToDeposit.mul(await collateral.getDepositFee()).div(FEE_DENOMINATOR)

      await collateral.connect(user1).deposit(amountToDeposit)

      expect(depositHook.hook).to.be.calledWith(
        user1.address,
        amountToDeposit,
        amountToDeposit.sub(fee)
      )
    })

    it('emits Deposit', async () => {
      const amountToDeposit = await baseToken.balanceOf(user1.address)
      expect(amountToDeposit).to.be.gt(0)
      expect(await baseToken.allowance(user1.address, collateral.address)).to.be.eq(amountToDeposit)
      const fee = amountToDeposit.mul(await collateral.getDepositFee()).div(FEE_DENOMINATOR)

      const tx = await collateral.connect(user1).deposit(amountToDeposit)

      await expect(tx)
        .to.emit(collateral, 'Deposit')
        .withArgs(user1.address, amountToDeposit.sub(fee), fee)
    })
  })

  describe('# withdraw', () => {
    beforeEach(async () => {
      await setupCollateral()
      await baseToken.mint(user1.address, parseUnits('1', USDC_DECIMALS))
      await baseToken.connect(user1).approve(collateral.address, parseUnits('1', USDC_DECIMALS))
      await collateral.connect(user1).deposit(parseUnits('1', USDC_DECIMALS))
      await collateral.connect(deployer).setWithdrawFee(TEST_WITHDRAW_FEE)
      await collateral.connect(deployer).setWithdrawHook(withdrawHook.address)
    })

    it('reverts if withdrawal = 0 and withdraw fee = 0%', async () => {
      await collateral.connect(deployer).setWithdrawFee(0)

      await expect(collateral.connect(user1).withdraw(0)).revertedWith('amount = 0')
    })

    it('reverts if withdrawal = 0 and withdraw fee > 0%', async () => {
      expect(await collateral.getWithdrawFee()).to.be.gt(0)

      await expect(collateral.connect(user1).withdraw(0)).revertedWith('fee = 0')
    })

    it('reverts if withdrawal > 0, fee = 0, and withdraw fee > 0%', async () => {
      /**
       * Given USDC precision is 6, and Collateral is 18, 1e12 will result in 0.000001 USDC
       * (the smallest amount) before fees, resulting in a fee of 0.
       */
      const amountToWithdraw = parseUnits('1', 12)
      const baseTokenToReceive = amountToWithdraw.mul(USDC_DENOMINATOR).div(parseEther('1'))
      const feeAmount = baseTokenToReceive
        .mul(await collateral.getWithdrawFee())
        .div(FEE_DENOMINATOR)
      expect(feeAmount).to.eq(0)
      expect(await collateral.getWithdrawFee()).to.be.gt(0)

      await expect(collateral.connect(user1).withdraw(amountToWithdraw)).revertedWith('fee = 0')
    })

    it('reverts if base token returned is 0 and withdraw fee = 0%', async () => {
      await collateral.connect(deployer).setWithdrawFee(0)
      // Given USDC precision is 6, and Collateral is 18, anything below 1e12 will result in 0
      const amountToWithdraw = parseUnits('1', 12).sub(1)
      const baseTokenToReceive = amountToWithdraw.mul(USDC_DENOMINATOR).div(parseEther('1'))
      expect(baseTokenToReceive).to.eq(0)

      await expect(collateral.connect(user1).withdraw(amountToWithdraw)).revertedWith('amount = 0')
    })

    it('reverts if insufficient balance', async () => {
      const amountToWithdraw = (await collateral.balanceOf(user1.address)).add(1)
      expect(amountToWithdraw).to.be.gt(0)

      await expect(collateral.connect(user1).withdraw(amountToWithdraw)).revertedWith(
        'ERC20: burn amount exceeds balance'
      )
    })

    it('reverts if hook reverts', async () => {
      // Still providing valid inputs to ensure withdrawals are only reverting due to smock
      const amountToWithdraw = await collateral.balanceOf(user1.address)
      expect(amountToWithdraw).to.be.gt(0)
      withdrawHook.hook.reverts()

      await expect(collateral.connect(user1).withdraw(amountToWithdraw)).reverted
      expect(withdrawHook.hook).callCount(1)
    })

    it("burns caller's collateral without approval", async () => {
      const totalSupplyBefore = await collateral.totalSupply()
      expect(totalSupplyBefore).to.be.gt(0)
      const userCTBefore = await collateral.balanceOf(user1.address)
      const amountToWithdraw = userCTBefore
      expect(amountToWithdraw).to.be.gt(0)
      expect(await collateral.allowance(user1.address, collateral.address)).to.be.eq(0)

      const tx = await collateral.connect(user1).withdraw(amountToWithdraw)

      expect(await collateral.totalSupply()).to.eq(totalSupplyBefore.sub(amountToWithdraw))
      expect(await collateral.balanceOf(user1.address)).to.eq(userCTBefore.sub(amountToWithdraw))
      await expect(tx)
        .to.emit(collateral, 'Transfer')
        .withArgs(user1.address, ZERO_ADDRESS, amountToWithdraw)
    })

    it('approves fee to hook adjusting for when decimals > base token decimals', async () => {
      expect(await collateral.decimals()).to.be.gt(await baseToken.decimals())
      const amountToWithdraw = await collateral.balanceOf(user1.address)
      expect(amountToWithdraw).to.be.gt(0)
      const expectedBT = amountToWithdraw.mul(USDC_DENOMINATOR).div(parseEther('1'))
      const fee = expectedBT.mul(await collateral.getWithdrawFee()).div(FEE_DENOMINATOR)
      expect(await baseToken.allowance(collateral.address, withdrawHook.address)).to.be.eq(0)

      await collateral.connect(user1).withdraw(amountToWithdraw)

      expect(await baseToken.allowance(collateral.address, withdrawHook.address)).to.be.eq(fee)
      expect(await baseToken.balanceOf(collateral.address)).to.eq(fee)
    })

    it('transfers base tokens to user adjusting for when decimals > base token decimal', async () => {
      expect(await collateral.decimals()).to.be.gt(await baseToken.decimals())
      const userBTBefore = await baseToken.balanceOf(user1.address)
      const amountToWithdraw = await collateral.balanceOf(user1.address)
      expect(amountToWithdraw).to.be.gt(0)
      const expectedBT = amountToWithdraw.mul(USDC_DENOMINATOR).div(parseEther('1'))
      const fee = expectedBT.mul(await collateral.getWithdrawFee()).div(FEE_DENOMINATOR)

      await collateral.connect(user1).withdraw(amountToWithdraw)

      expect(await baseToken.balanceOf(user1.address)).to.eq(userBTBefore.add(expectedBT.sub(fee)))
    })

    it('approves fee to hook adjusting for when decimals = base token decimals', async () => {
      // Setup 18 decimal base token
      await setupCollateral(await collateral.decimals())
      expect(await collateral.decimals()).to.eq(await baseToken.decimals())
      await baseToken.mint(user1.address, parseEther('1'))
      await baseToken.connect(user1).approve(collateral.address, parseEther('1'))
      await collateral.connect(user1).deposit(parseEther('1'))
      const amountToWithdraw = await collateral.balanceOf(user1.address)
      expect(amountToWithdraw).to.be.gt(0)
      const expectedBT = amountToWithdraw
      const fee = expectedBT.mul(await collateral.getWithdrawFee()).div(FEE_DENOMINATOR)
      expect(await baseToken.allowance(collateral.address, withdrawHook.address)).to.be.eq(0)

      await collateral.connect(user1).withdraw(amountToWithdraw)

      expect(await baseToken.allowance(collateral.address, withdrawHook.address)).to.be.eq(fee)
      expect(await baseToken.balanceOf(collateral.address)).to.eq(fee)
    })

    it('transfers base tokens to user adjusting for when decimals = base token decimal', async () => {
      // Setup 18 decimal base token
      await setupCollateral(await collateral.decimals())
      expect(await collateral.decimals()).to.eq(await baseToken.decimals())
      await baseToken.mint(user1.address, parseEther('1'))
      await baseToken.connect(user1).approve(collateral.address, parseEther('1'))
      await collateral.connect(user1).deposit(parseEther('1'))
      const userBTBefore = await baseToken.balanceOf(user1.address)
      const amountToWithdraw = await collateral.balanceOf(user1.address)
      expect(amountToWithdraw).to.be.gt(0)
      const expectedBT = amountToWithdraw
      const fee = expectedBT.mul(await collateral.getWithdrawFee()).div(FEE_DENOMINATOR)

      await collateral.connect(user1).withdraw(amountToWithdraw)

      expect(await baseToken.balanceOf(user1.address)).to.eq(userBTBefore.add(expectedBT.sub(fee)))
    })

    it('approves fee to hook adjusting for when decimals < base token decimals', async () => {
      // Setup 19 decimal base token
      await setupCollateral((await collateral.decimals()) + 1)
      expect(await collateral.decimals()).to.be.lt(await baseToken.decimals())
      await baseToken.mint(user1.address, parseUnits('1', await baseToken.decimals()))
      await baseToken
        .connect(user1)
        .approve(collateral.address, parseUnits('1', await baseToken.decimals()))
      await collateral.connect(user1).deposit(parseUnits('1', await baseToken.decimals()))
      const amountToWithdraw = await collateral.balanceOf(user1.address)
      expect(amountToWithdraw).to.be.gt(0)
      const GREATER_DECIMAL_DENOMINATOR = parseUnits('1', (await collateral.decimals()) + 1)
      const expectedBT = amountToWithdraw.mul(GREATER_DECIMAL_DENOMINATOR).div(parseEther('1'))
      const fee = expectedBT.mul(await collateral.getWithdrawFee()).div(FEE_DENOMINATOR)
      expect(await baseToken.allowance(collateral.address, withdrawHook.address)).to.be.eq(0)

      await collateral.connect(user1).withdraw(amountToWithdraw)

      expect(await baseToken.allowance(collateral.address, withdrawHook.address)).to.be.eq(fee)
      expect(await baseToken.balanceOf(collateral.address)).to.eq(fee)
    })

    it('transfers base tokens to user adjusting for when decimals < base token decimal', async () => {
      // Setup 19 decimal base token
      await setupCollateral((await collateral.decimals()) + 1)
      expect(await collateral.decimals()).to.be.lt(await baseToken.decimals())
      await baseToken.mint(user1.address, parseUnits('1', await baseToken.decimals()))
      await baseToken
        .connect(user1)
        .approve(collateral.address, parseUnits('1', await baseToken.decimals()))
      await collateral.connect(user1).deposit(parseUnits('1', await baseToken.decimals()))
      const userBTBefore = await baseToken.balanceOf(user1.address)
      const amountToWithdraw = await collateral.balanceOf(user1.address)
      expect(amountToWithdraw).to.be.gt(0)
      const GREATER_DECIMAL_DENOMINATOR = parseUnits('1', (await collateral.decimals()) + 1)
      const expectedBT = amountToWithdraw.mul(GREATER_DECIMAL_DENOMINATOR).div(parseEther('1'))
      const fee = expectedBT.mul(await collateral.getWithdrawFee()).div(FEE_DENOMINATOR)

      await collateral.connect(user1).withdraw(amountToWithdraw)

      expect(await baseToken.balanceOf(user1.address)).to.eq(userBTBefore.add(expectedBT.sub(fee)))
    })

    it('replaces previous fee approval', async () => {
      const firstAmountToWithdraw = await collateral.balanceOf(user1.address)
      const firstExpectedBT = firstAmountToWithdraw.mul(USDC_DENOMINATOR).div(parseEther('1'))
      const firstFee = firstExpectedBT.mul(await collateral.getWithdrawFee()).div(FEE_DENOMINATOR)
      await collateral.connect(user1).withdraw(firstAmountToWithdraw)
      // Mint different amount of base token to ensure fees approvals are different
      await baseToken.mint(user1.address, parseUnits('0.5', USDC_DECIMALS))
      await baseToken.connect(user1).approve(collateral.address, parseUnits('0.5', USDC_DECIMALS))
      await collateral.connect(user1).deposit(parseUnits('0.5', USDC_DECIMALS))
      const secondAmountToWithdraw = await collateral.balanceOf(user1.address)
      const secondExpectedBT = secondAmountToWithdraw.mul(USDC_DENOMINATOR).div(parseEther('1'))
      const secondFee = secondExpectedBT.mul(await collateral.getWithdrawFee()).div(FEE_DENOMINATOR)
      expect(secondFee).to.not.eq(firstFee)

      await collateral.connect(user1).withdraw(secondAmountToWithdraw)

      expect(await baseToken.allowance(collateral.address, withdrawHook.address)).to.eq(secondFee)
    })

    it('allows withdrawals if withdraw fee = 0%', async () => {
      await collateral.connect(deployer).setWithdrawFee(0)
      const userBTBefore = await baseToken.balanceOf(user1.address)
      const contractBTBefore = await baseToken.balanceOf(collateral.address)
      const userCTBefore = await collateral.balanceOf(user1.address)
      const amountToWithdraw = userCTBefore
      const expectedBT = amountToWithdraw.mul(USDC_DENOMINATOR).div(parseEther('1'))
      expect(await baseToken.allowance(collateral.address, withdrawHook.address)).to.be.eq(0)

      await collateral.connect(user1).withdraw(amountToWithdraw)

      expect(await baseToken.balanceOf(user1.address)).to.eq(userBTBefore.add(expectedBT))
      expect(await baseToken.balanceOf(collateral.address)).to.eq(contractBTBefore.sub(expectedBT))
      expect(await collateral.balanceOf(user1.address)).to.eq(userCTBefore.sub(amountToWithdraw))
      expect(await baseToken.allowance(collateral.address, withdrawHook.address)).to.be.eq(0)
    })

    it('ignores hook if hook not set', async () => {
      const amountToWithdraw = await collateral.balanceOf(user1.address)
      expect(amountToWithdraw).to.be.gt(0)
      await collateral.connect(deployer).setWithdrawHook(ZERO_ADDRESS)

      await collateral.connect(user1).withdraw(amountToWithdraw)

      expect(withdrawHook.hook).callCount(0)
    })

    it("doesn't give fee approval if hook not set", async () => {
      const amountToWithdraw = await collateral.balanceOf(user1.address)
      const expectedBT = amountToWithdraw.mul(USDC_DENOMINATOR).div(parseEther('1'))
      const fee = expectedBT.mul(await collateral.getWithdrawFee()).div(FEE_DENOMINATOR)
      expect(fee).to.be.gt(0)
      await collateral.connect(deployer).setWithdrawHook(ZERO_ADDRESS)
      expect(await baseToken.allowance(collateral.address, withdrawHook.address)).to.eq(0)

      await collateral.connect(user1).withdraw(amountToWithdraw)

      expect(await baseToken.allowance(collateral.address, withdrawHook.address)).to.eq(0)
    })

    it('calls withdraw hook with correct parameters', async () => {
      const amountToWithdraw = await collateral.balanceOf(user1.address)
      expect(amountToWithdraw).to.be.gt(0)
      const expectedBT = amountToWithdraw.mul(USDC_DENOMINATOR).div(parseEther('1'))
      const fee = expectedBT.mul(await collateral.getWithdrawFee()).div(FEE_DENOMINATOR)

      await collateral.connect(user1).withdraw(amountToWithdraw)

      expect(withdrawHook.hook).to.be.calledWith(user1.address, expectedBT, expectedBT.sub(fee))
    })

    it('emits Withdraw', async () => {
      const amountToWithdraw = await collateral.balanceOf(user1.address)
      expect(amountToWithdraw).to.be.gt(0)
      const expectedBT = amountToWithdraw.mul(USDC_DENOMINATOR).div(parseEther('1'))
      const fee = expectedBT.mul(await collateral.getWithdrawFee()).div(FEE_DENOMINATOR)

      const tx = await collateral.connect(user1).withdraw(amountToWithdraw)

      await expect(tx)
        .to.emit(collateral, 'Withdraw')
        .withArgs(user1.address, expectedBT.sub(fee), fee)
    })
  })
})
