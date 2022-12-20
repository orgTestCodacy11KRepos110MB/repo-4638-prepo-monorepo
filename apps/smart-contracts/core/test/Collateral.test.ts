import chai, { expect } from 'chai'
import { ethers, network, upgrades } from 'hardhat'
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/dist/src/signer-with-address'
import { id, parseEther, parseUnits } from 'ethers/lib/utils'
import { BigNumber, Contract } from 'ethers'
import { MockContract, FakeContract, smock } from '@defi-wonderland/smock'
import { DEFAULT_ADMIN_ROLE, ZERO_ADDRESS } from 'prepo-constants'
import {
  smockDepositHookFixture,
  smockWithdrawHookFixture,
  smockManagerWithdrawHookFixture,
  fakeAccountListFixture,
} from './fixtures/HookFixture'
import { collateralFixture } from './fixtures/CollateralFixture'
import { smockDepositRecordFixture } from './fixtures/DepositRecordFixture'
import { testERC20Fixture } from './fixtures/TestERC20Fixture'
import { fakeTokenSenderFixture } from './fixtures/TokenSenderFixture'
import {
  FEE_DENOMINATOR,
  COLLATERAL_FEE_LIMIT,
  grantAndAcceptRole,
  PERCENT_DENOMINATOR,
  batchGrantAndAcceptRoles,
} from './utils'
import { Snapshotter } from './snapshots'
import { AccountList, Collateral, TestERC20, TokenSender } from '../types/generated'

chai.use(smock.matchers)
const snapshotter = new Snapshotter()

describe('=> Collateral', () => {
  snapshotter.setupSnapshotContext('Collateral')
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
  let allowlist: FakeContract<AccountList>
  let tokenSender: FakeContract<TokenSender>
  const TEST_DEPOSIT_FEE = 1000 // 0.1%
  const TEST_WITHDRAW_FEE = 2000 // 0.2%
  const TEST_GLOBAL_DEPOSIT_CAP = parseEther('50000')
  const TEST_USER_DEPOSIT_CAP = parseEther('50')
  const TEST_MIN_RESERVE_PERCENTAGE = 250000 // 25%
  const USDC_DECIMALS = 6
  const USDC_DENOMINATOR = 10 ** USDC_DECIMALS

  const getSignersAndDeployContracts = async (
    baseTokenDecimals: number = USDC_DECIMALS
  ): Promise<void> => {
    ;[deployer, manager, user1, user2] = await ethers.getSigners()
    baseToken = await testERC20Fixture('Test Coin', 'TST', baseTokenDecimals)
    collateral = await collateralFixture(
      'prePO USDC Collateral',
      'preUSDC',
      baseToken.address,
      baseTokenDecimals
    )
    depositRecord = await smockDepositRecordFixture(TEST_GLOBAL_DEPOSIT_CAP, TEST_USER_DEPOSIT_CAP)
    depositHook = await smockDepositHookFixture()
    withdrawHook = await smockWithdrawHookFixture()
    managerWithdrawHook = await smockManagerWithdrawHookFixture()
    allowlist = await fakeAccountListFixture()
    tokenSender = await fakeTokenSenderFixture()
    await grantAndAcceptRole(
      depositRecord,
      deployer,
      deployer,
      await depositRecord.SET_ALLOWED_HOOK_ROLE()
    )
  }

  const setupDepositHook = async (): Promise<void> => {
    await depositRecord.connect(deployer).setAllowedHook(depositHook.address, true)
    await batchGrantAndAcceptRoles(depositHook, deployer, deployer, [
      depositHook.SET_COLLATERAL_ROLE(),
      depositHook.SET_DEPOSIT_RECORD_ROLE(),
      depositHook.SET_DEPOSITS_ALLOWED_ROLE(),
      depositHook.SET_ACCOUNT_LIST_ROLE(),
      depositHook.SET_TREASURY_ROLE(),
      depositHook.SET_TOKEN_SENDER_ROLE(),
    ])
    await depositHook.connect(deployer).setCollateral(collateral.address)
    await depositHook.connect(deployer).setDepositRecord(depositRecord.address)
    await depositHook.connect(deployer).setDepositsAllowed(true)
    await depositHook.connect(deployer).setAccountList(allowlist.address)
    await depositHook.connect(deployer).setTreasury(manager.address)
    await depositHook.connect(deployer).setTokenSender(tokenSender.address)
  }

  const setupWithdrawHook = async (): Promise<void> => {
    await depositRecord.connect(deployer).setAllowedHook(withdrawHook.address, true)
    await batchGrantAndAcceptRoles(withdrawHook, deployer, deployer, [
      withdrawHook.SET_TREASURY_ROLE(),
      withdrawHook.SET_TOKEN_SENDER_ROLE(),
      withdrawHook.SET_COLLATERAL_ROLE(),
      withdrawHook.SET_DEPOSIT_RECORD_ROLE(),
      withdrawHook.SET_WITHDRAWALS_ALLOWED_ROLE(),
    ])
    await withdrawHook.connect(deployer).setCollateral(collateral.address)
    await withdrawHook.connect(deployer).setDepositRecord(depositRecord.address)
    await withdrawHook.connect(deployer).setWithdrawalsAllowed(true)
    await withdrawHook.connect(deployer).setTreasury(manager.address)
    await withdrawHook.connect(deployer).setTokenSender(tokenSender.address)
  }

  const setupManagerWithdrawHook = async (): Promise<void> => {
    await batchGrantAndAcceptRoles(managerWithdrawHook, deployer, deployer, [
      managerWithdrawHook.SET_COLLATERAL_ROLE(),
      managerWithdrawHook.SET_DEPOSIT_RECORD_ROLE(),
      managerWithdrawHook.SET_MIN_RESERVE_PERCENTAGE_ROLE(),
    ])
    await managerWithdrawHook.connect(deployer).setCollateral(collateral.address)
    await managerWithdrawHook.connect(deployer).setDepositRecord(depositRecord.address)
    await managerWithdrawHook.connect(deployer).setMinReservePercentage(TEST_MIN_RESERVE_PERCENTAGE)
  }

  const setupCollateralRoles = async (): Promise<void> => {
    await batchGrantAndAcceptRoles(collateral, deployer, deployer, [
      collateral.MANAGER_WITHDRAW_ROLE(),
      collateral.SET_MANAGER_ROLE(),
      collateral.SET_DEPOSIT_FEE_ROLE(),
      collateral.SET_WITHDRAW_FEE_ROLE(),
      collateral.SET_DEPOSIT_HOOK_ROLE(),
      collateral.SET_WITHDRAW_HOOK_ROLE(),
      collateral.SET_MANAGER_WITHDRAW_HOOK_ROLE(),
    ])
    await collateral.connect(deployer).setManager(manager.address)
  }

  const setupCollateralStackForDeposits = async (
    baseTokenDecimals: number = USDC_DECIMALS
  ): Promise<void> => {
    await getSignersAndDeployContracts(baseTokenDecimals)
    await setupCollateralRoles()
    await setupDepositHook()
  }

  before(async () => {
    upgrades.silenceWarnings()
    await getSignersAndDeployContracts()
    snapshotter.saveSnapshot()
  })

  describe('initial state', () => {
    it('sets base token from constructor', async () => {
      expect(await collateral.getBaseToken()).to.eq(baseToken.address)
    })

    it('sets name from initialize', async () => {
      expect(await collateral.name()).to.eq('prePO USDC Collateral')
    })

    it('sets symbol from initialize', async () => {
      expect(await collateral.symbol()).to.eq('preUSDC')
    })

    it('sets DEFAULT_ADMIN_ROLE holder to deployer', async () => {
      expect(await collateral.hasRole(DEFAULT_ADMIN_ROLE, deployer.address)).to.eq(true)
    })

    it('sets FEE_LIMIT constant', async () => {
      expect(await collateral.FEE_LIMIT()).to.eq(COLLATERAL_FEE_LIMIT)
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
    snapshotter.setupSnapshotContext('Collateral-setManager')
    before(async () => {
      await getSignersAndDeployContracts()
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
    snapshotter.setupSnapshotContext('Collateral-setDepositFee')
    before(async () => {
      await getSignersAndDeployContracts()
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

    it('reverts if > FEE_LIMIT', async () => {
      await expect(
        collateral.connect(deployer).setDepositFee(COLLATERAL_FEE_LIMIT + 1)
      ).revertedWith('Exceeds fee limit')
    })

    it('sets to FEE_LIMIT', async () => {
      expect(await collateral.getDepositFee()).to.not.eq(COLLATERAL_FEE_LIMIT)

      await collateral.connect(deployer).setDepositFee(COLLATERAL_FEE_LIMIT)

      expect(await collateral.getDepositFee()).to.eq(COLLATERAL_FEE_LIMIT)
    })

    it('sets to < FEE_LIMIT', async () => {
      expect(await collateral.getDepositFee()).to.not.eq(COLLATERAL_FEE_LIMIT - 1)

      await collateral.connect(deployer).setDepositFee(COLLATERAL_FEE_LIMIT - 1)

      expect(await collateral.getDepositFee()).to.eq(COLLATERAL_FEE_LIMIT - 1)
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
    snapshotter.setupSnapshotContext('Collateral-setWithdrawFee')
    before(async () => {
      await getSignersAndDeployContracts()
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

    it('reverts if > FEE_LIMIT', async () => {
      await expect(
        collateral.connect(deployer).setWithdrawFee(COLLATERAL_FEE_LIMIT + 1)
      ).revertedWith('Exceeds fee limit')
    })

    it('sets to FEE_LIMIT', async () => {
      expect(await collateral.getWithdrawFee()).to.not.eq(COLLATERAL_FEE_LIMIT)

      await collateral.connect(deployer).setWithdrawFee(COLLATERAL_FEE_LIMIT)

      expect(await collateral.getWithdrawFee()).to.eq(COLLATERAL_FEE_LIMIT)
    })

    it('sets to < FEE_LIMIT', async () => {
      expect(await collateral.getWithdrawFee()).to.not.eq(COLLATERAL_FEE_LIMIT - 1)

      await collateral.connect(deployer).setWithdrawFee(COLLATERAL_FEE_LIMIT - 1)

      expect(await collateral.getWithdrawFee()).to.eq(COLLATERAL_FEE_LIMIT - 1)
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
    snapshotter.setupSnapshotContext('Collateral-setDepositHook')
    before(async () => {
      await getSignersAndDeployContracts()
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
    snapshotter.setupSnapshotContext('Collateral-setWithdrawHook')
    before(async () => {
      await getSignersAndDeployContracts()
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
    snapshotter.setupSnapshotContext('Collateral-setManagerWithdrawHook')
    before(async () => {
      await getSignersAndDeployContracts()
      await grantAndAcceptRole(
        collateral,
        deployer,
        deployer,
        await collateral.SET_MANAGER_WITHDRAW_HOOK_ROLE()
      )
      await snapshotter.saveSnapshot()
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
    before(async () => {
      await getSignersAndDeployContracts()
    })

    it("returns contract's base token balance", async () => {
      await baseToken.connect(deployer).mint(collateral.address, parseEther('1'))
      const contractBalance = await baseToken.balanceOf(collateral.address)
      expect(contractBalance).to.be.eq(parseEther('1'))
      expect(await collateral.getReserve()).to.eq(contractBalance)
    })
  })

  describe('# managerWithdraw', () => {
    snapshotter.setupSnapshotContext('Collateral-managerWithdraw')
    before(async () => {
      await getSignersAndDeployContracts()
      await setupCollateralRoles()
      await setupManagerWithdrawHook()
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

      expect(managerWithdrawHook.hook).calledWith(
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

    afterEach(() => {
      managerWithdrawHook.hook.reset()
    })
  })

  describe('# deposit', () => {
    snapshotter.setupSnapshotContext('Collateral-deposit')
    let sender: SignerWithAddress
    let recipient: SignerWithAddress

    async function setupDeposit(baseTokenDecimals?: number): Promise<void> {
      if (!baseTokenDecimals) {
        await setupCollateralStackForDeposits(USDC_DECIMALS)
      } else {
        await setupCollateralStackForDeposits(baseTokenDecimals)
      }
      sender = user1
      recipient = user2
      await baseToken.mint(sender.address, parseUnits('1', await baseToken.decimals()))
      await baseToken
        .connect(sender)
        .approve(collateral.address, parseUnits('1', await baseToken.decimals()))
      await collateral.connect(deployer).setDepositFee(TEST_DEPOSIT_FEE)
      await collateral.connect(deployer).setDepositHook(depositHook.address)
    }

    before(async function () {
      await setupDeposit()
      await snapshotter.saveSnapshot()
    })

    it('reverts if deposit = 0 and deposit fee = 0%', async () => {
      await collateral.connect(deployer).setDepositFee(0)

      await expect(collateral.connect(sender).deposit(recipient.address, 0)).revertedWith(
        'amount = 0'
      )
    })

    it('reverts if deposit = 0 and deposit fee > 0%', async () => {
      expect(await collateral.getDepositFee()).to.be.gt(0)

      await expect(collateral.connect(sender).deposit(recipient.address, 0)).revertedWith('fee = 0')
    })

    it('reverts if deposit > 0, fee = 0, and deposit fee > 0%', async () => {
      expect(await collateral.getDepositFee()).to.be.gt(0)
      const amountToDeposit = BigNumber.from(1)
      // expect fee to be zero
      expect(amountToDeposit.mul(await collateral.getDepositFee()).div(FEE_DENOMINATOR)).to.eq(0)

      await expect(
        collateral.connect(sender).deposit(recipient.address, amountToDeposit)
      ).revertedWith('fee = 0')
    })

    it('reverts if insufficient approval', async () => {
      const amountToDeposit = await baseToken.balanceOf(sender.address)
      expect(amountToDeposit).to.be.gt(0)
      await baseToken.connect(sender).approve(collateral.address, amountToDeposit.sub(1))
      expect(await baseToken.allowance(sender.address, collateral.address)).to.be.lt(
        amountToDeposit
      )

      await expect(
        collateral.connect(sender).deposit(recipient.address, amountToDeposit)
      ).revertedWith('ERC20: insufficient allowance')
    })

    it('reverts if insufficient balance', async () => {
      const amountToDeposit = (await baseToken.balanceOf(sender.address)).add(1)
      expect(amountToDeposit).to.be.gt(0)
      await baseToken.connect(sender).approve(collateral.address, amountToDeposit)
      expect(await baseToken.allowance(sender.address, collateral.address)).to.be.eq(
        amountToDeposit
      )

      await expect(
        collateral.connect(sender).deposit(recipient.address, amountToDeposit)
      ).revertedWith('ERC20: transfer amount exceeds balance')
    })

    it('reverts if hook reverts', async () => {
      const amountToDeposit = await baseToken.balanceOf(sender.address)
      expect(amountToDeposit).to.be.gt(0)
      expect(await baseToken.allowance(sender.address, collateral.address)).to.be.eq(
        amountToDeposit
      )
      await depositHook.connect(deployer).setDepositsAllowed(false)

      await expect(collateral.connect(sender).deposit(recipient.address, amountToDeposit)).to.be
        .reverted
    })

    it('transfers amount from sender to contract', async () => {
      const senderBTBefore = await baseToken.balanceOf(sender.address)
      const amountToDeposit = senderBTBefore
      expect(amountToDeposit).to.be.gt(0)
      expect(await baseToken.allowance(sender.address, collateral.address)).to.be.eq(
        amountToDeposit
      )

      const tx = await collateral.connect(sender).deposit(recipient.address, amountToDeposit)

      expect(await baseToken.balanceOf(sender.address)).to.eq(senderBTBefore.sub(amountToDeposit))
      await expect(tx)
        .to.emit(baseToken, 'Transfer')
        .withArgs(sender.address, collateral.address, amountToDeposit)
    })

    it('approves fee for hook to use', async () => {
      const amountToDeposit = await baseToken.balanceOf(sender.address)
      expect(amountToDeposit).to.be.gt(0)
      expect(await baseToken.allowance(sender.address, collateral.address)).to.be.eq(
        amountToDeposit
      )
      expect(await baseToken.allowance(collateral.address, depositHook.address)).to.eq(0)
      const fee = amountToDeposit.mul(await collateral.getDepositFee()).div(FEE_DENOMINATOR)

      const tx = await collateral.connect(sender).deposit(recipient.address, amountToDeposit)

      await expect(tx)
        .to.emit(baseToken, 'Approval')
        .withArgs(collateral.address, depositHook.address, fee)
    })

    it('sets hook approval back to 0', async () => {
      const amountToDeposit = await baseToken.balanceOf(sender.address)
      expect(amountToDeposit).to.be.gt(0)
      expect(await baseToken.allowance(sender.address, collateral.address)).to.be.eq(
        amountToDeposit
      )
      expect(await baseToken.allowance(collateral.address, depositHook.address)).to.eq(0)
      const fee = amountToDeposit.mul(await collateral.getDepositFee()).div(FEE_DENOMINATOR)

      const tx = await collateral.connect(sender).deposit(recipient.address, amountToDeposit)

      await expect(tx)
        .to.emit(baseToken, 'Approval')
        .withArgs(collateral.address, depositHook.address, fee)
      await expect(tx)
        .to.emit(baseToken, 'Approval')
        .withArgs(collateral.address, depositHook.address, 0)
      expect(await baseToken.allowance(collateral.address, depositHook.address)).to.eq(0)
    })

    describe("mints decimal-adjusted amount to recipient's balance", () => {
      after(async () => {
        await setupDeposit()
        await snapshotter.saveSnapshot()
      })

      it('if decimals > base token decimals', async () => {
        await setupDeposit()
        expect(await collateral.decimals()).to.be.gt(await baseToken.decimals())
        const recipientCTBefore = await collateral.balanceOf(recipient.address)
        const amountToDeposit = await baseToken.balanceOf(sender.address)
        expect(amountToDeposit).to.be.gt(0)
        expect(await baseToken.allowance(sender.address, collateral.address)).to.be.eq(
          amountToDeposit
        )
        const fee = amountToDeposit.mul(await collateral.getDepositFee()).div(FEE_DENOMINATOR)
        const expectedCT = amountToDeposit.sub(fee).mul(parseEther('1')).div(USDC_DENOMINATOR)

        await collateral.connect(sender).deposit(recipient.address, amountToDeposit)

        expect(await collateral.balanceOf(recipient.address)).to.eq(
          recipientCTBefore.add(expectedCT)
        )
        expect(await collateral.balanceOf(sender.address)).to.eq(0)
      })

      it('if decimals = base token decimals', async () => {
        // Setup 18 decimal base token
        await setupDeposit(18)
        expect(await collateral.decimals()).to.eq(await baseToken.decimals())
        const recipientCTBefore = await collateral.balanceOf(recipient.address)
        const amountToDeposit = await baseToken.balanceOf(sender.address)
        expect(amountToDeposit).to.be.gt(0)
        expect(await baseToken.allowance(sender.address, collateral.address)).to.be.eq(
          amountToDeposit
        )
        const fee = amountToDeposit.mul(await collateral.getDepositFee()).div(FEE_DENOMINATOR)
        const expectedCT = amountToDeposit.sub(fee)

        await collateral.connect(sender).deposit(recipient.address, amountToDeposit)

        expect(await collateral.balanceOf(recipient.address)).to.eq(
          recipientCTBefore.add(expectedCT)
        )
        expect(await collateral.balanceOf(sender.address)).to.eq(0)
      })

      it('if decimals < base token decimals', async () => {
        // Setup 19 decimal base token
        await setupDeposit(19)
        expect(await collateral.decimals()).to.be.lt(await baseToken.decimals())
        const recipientCTBefore = await collateral.balanceOf(recipient.address)
        const amountToDeposit = await baseToken.balanceOf(sender.address)
        expect(amountToDeposit).to.be.gt(0)
        expect(await baseToken.allowance(sender.address, collateral.address)).to.be.eq(
          amountToDeposit
        )
        const fee = amountToDeposit.mul(await collateral.getDepositFee()).div(FEE_DENOMINATOR)
        const GREATER_DECIMAL_DENOMINATOR = parseUnits('1', (await collateral.decimals()) + 1)
        const expectedCT = amountToDeposit
          .sub(fee)
          .mul(parseEther('1'))
          .div(GREATER_DECIMAL_DENOMINATOR)

        await collateral.connect(sender).deposit(recipient.address, amountToDeposit)

        expect(await collateral.balanceOf(recipient.address)).to.eq(
          recipientCTBefore.add(expectedCT)
        )
        expect(await collateral.balanceOf(sender.address)).to.eq(0)
      })
    })

    it('mints to sender if sender = recipient', async () => {
      recipient = sender
      const recipientCTBefore = await collateral.balanceOf(recipient.address)
      const amountToDeposit = await baseToken.balanceOf(sender.address)
      expect(amountToDeposit).to.be.gt(0)
      expect(await baseToken.allowance(sender.address, collateral.address)).to.be.eq(
        amountToDeposit
      )
      const fee = amountToDeposit.mul(await collateral.getDepositFee()).div(FEE_DENOMINATOR)
      const expectedCT = amountToDeposit.sub(fee).mul(parseEther('1')).div(USDC_DENOMINATOR)

      await collateral.connect(sender).deposit(recipient.address, amountToDeposit)

      expect(await collateral.balanceOf(recipient.address)).to.eq(recipientCTBefore.add(expectedCT))
    })

    it('allows a deposit > 0 if deposit fee = 0%', async () => {
      await collateral.connect(deployer).setDepositFee(0)
      const senderBTBefore = await baseToken.balanceOf(sender.address)
      const contractBTBefore = await baseToken.balanceOf(collateral.address)
      const recipientCTBefore = await collateral.balanceOf(recipient.address)
      const amountToDeposit = senderBTBefore
      const feeAmount = amountToDeposit.mul(await collateral.getDepositFee()).div(FEE_DENOMINATOR)
      expect(feeAmount).to.eq(0)
      const expectedCT = amountToDeposit.mul(parseEther('1')).div(USDC_DENOMINATOR)

      await collateral.connect(sender).deposit(recipient.address, amountToDeposit)

      expect(await baseToken.balanceOf(sender.address)).to.eq(senderBTBefore.sub(amountToDeposit))
      expect(await baseToken.balanceOf(collateral.address)).to.eq(
        contractBTBefore.add(amountToDeposit)
      )
      expect(await baseToken.allowance(collateral.address, depositHook.address)).to.eq(0)
      expect(await collateral.balanceOf(recipient.address)).to.eq(recipientCTBefore.add(expectedCT))
    })

    it('ignores hook if hook not set', async () => {
      const amountToDeposit = await baseToken.balanceOf(sender.address)
      expect(amountToDeposit).to.be.gt(0)
      expect(await baseToken.allowance(sender.address, collateral.address)).to.be.eq(
        amountToDeposit
      )
      await collateral.connect(deployer).setDepositHook(ZERO_ADDRESS)

      await collateral.connect(sender).deposit(recipient.address, amountToDeposit)

      expect(depositHook.hook).callCount(0)
    })

    it("doesn't give fee approval if hook not set", async () => {
      const amountToDeposit = await baseToken.balanceOf(sender.address)
      expect(amountToDeposit).to.be.gt(0)
      const fee = amountToDeposit.mul(await collateral.getDepositFee()).div(FEE_DENOMINATOR)
      expect(fee).to.be.gt(0)
      expect(await baseToken.allowance(collateral.address, depositHook.address)).to.eq(0)
      await collateral.connect(deployer).setDepositHook(ZERO_ADDRESS)

      await collateral.connect(sender).deposit(recipient.address, amountToDeposit)

      expect(await baseToken.allowance(collateral.address, depositHook.address)).to.eq(0)
    })

    it('calls deposit hook with correct parameters', async () => {
      const amountToDeposit = await baseToken.balanceOf(sender.address)
      expect(amountToDeposit).to.be.gt(0)
      expect(await baseToken.allowance(sender.address, collateral.address)).to.be.eq(
        amountToDeposit
      )
      const fee = amountToDeposit.mul(await collateral.getDepositFee()).div(FEE_DENOMINATOR)

      await collateral.connect(sender).deposit(recipient.address, amountToDeposit)

      expect(depositHook.hook).calledWith(
        recipient.address,
        amountToDeposit,
        amountToDeposit.sub(fee)
      )
    })

    it('emits Deposit', async () => {
      const amountToDeposit = await baseToken.balanceOf(sender.address)
      expect(amountToDeposit).to.be.gt(0)
      expect(await baseToken.allowance(sender.address, collateral.address)).to.be.eq(
        amountToDeposit
      )
      const fee = amountToDeposit.mul(await collateral.getDepositFee()).div(FEE_DENOMINATOR)

      const tx = await collateral.connect(sender).deposit(recipient.address, amountToDeposit)

      await expect(tx)
        .to.emit(collateral, 'Deposit')
        .withArgs(recipient.address, amountToDeposit.sub(fee), fee)
    })

    it('returns collateral minted', async () => {
      const amountToDeposit = await baseToken.balanceOf(sender.address)
      expect(amountToDeposit).to.be.gt(0)
      expect(await baseToken.allowance(sender.address, collateral.address)).to.be.eq(
        amountToDeposit
      )
      const fee = amountToDeposit.mul(await collateral.getDepositFee()).div(FEE_DENOMINATOR)
      const expectedCT = amountToDeposit.sub(fee).mul(parseEther('1')).div(USDC_DENOMINATOR)
      expect(expectedCT).to.be.gt(0)

      expect(
        await collateral.connect(sender).callStatic.deposit(recipient.address, amountToDeposit)
      ).to.eq(expectedCT)
    })

    afterEach(() => {
      depositHook.hook.reset()
    })
  })

  describe('# withdraw', () => {
    snapshotter.setupSnapshotContext('Collateral-withdraw')

    async function setupWithdraw(baseTokenDecimals?: number): Promise<void> {
      if (!baseTokenDecimals) {
        await setupCollateralStackForDeposits(USDC_DECIMALS)
      } else {
        await setupCollateralStackForDeposits(baseTokenDecimals)
      }
      await setupWithdrawHook()
      await baseToken.mint(user1.address, parseUnits('1', await baseToken.decimals()))
      await baseToken
        .connect(user1)
        .approve(collateral.address, parseUnits('1', await baseToken.decimals()))
      await collateral
        .connect(user1)
        .deposit(user1.address, parseUnits('1', await baseToken.decimals()))
      await collateral.connect(deployer).setWithdrawFee(TEST_WITHDRAW_FEE)
      await collateral.connect(deployer).setWithdrawHook(withdrawHook.address)
    }

    before(async function () {
      await setupWithdraw()
      snapshotter.saveSnapshot()
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

    describe('when decimals > base token decimals', () => {
      snapshotter.setupSnapshotContext()
      before(async () => {
        await setupWithdraw()
      })

      it('approves fee to hook', async () => {
        expect(await collateral.decimals()).to.be.gt(await baseToken.decimals())
        const amountToWithdraw = await collateral.balanceOf(user1.address)
        expect(amountToWithdraw).to.be.gt(0)
        const expectedBT = amountToWithdraw.mul(USDC_DENOMINATOR).div(parseEther('1'))
        const fee = expectedBT.mul(await collateral.getWithdrawFee()).div(FEE_DENOMINATOR)
        expect(await baseToken.allowance(collateral.address, withdrawHook.address)).to.be.eq(0)

        const tx = await collateral.connect(user1).withdraw(amountToWithdraw)

        await expect(tx)
          .to.emit(baseToken, 'Approval')
          .withArgs(collateral.address, withdrawHook.address, fee)
      })

      it('transfers base tokens to user', async () => {
        expect(await collateral.decimals()).to.be.gt(await baseToken.decimals())
        const userBTBefore = await baseToken.balanceOf(user1.address)
        const amountToWithdraw = await collateral.balanceOf(user1.address)
        expect(amountToWithdraw).to.be.gt(0)
        const expectedBT = amountToWithdraw.mul(USDC_DENOMINATOR).div(parseEther('1'))
        const fee = expectedBT.mul(await collateral.getWithdrawFee()).div(FEE_DENOMINATOR)

        await collateral.connect(user1).withdraw(amountToWithdraw)

        expect(await baseToken.balanceOf(user1.address)).to.eq(
          userBTBefore.add(expectedBT.sub(fee))
        )
      })
    })

    describe('when decimals = base token decimals', () => {
      snapshotter.setupSnapshotContext()
      before(async () => {
        await setupWithdraw(18)
      })

      it('approves fee to hook', async () => {
        expect(await collateral.decimals()).to.eq(await baseToken.decimals())
        const amountToWithdraw = await collateral.balanceOf(user1.address)
        expect(amountToWithdraw).to.be.gt(0)
        const expectedBT = amountToWithdraw
        const fee = expectedBT.mul(await collateral.getWithdrawFee()).div(FEE_DENOMINATOR)
        expect(await baseToken.allowance(collateral.address, withdrawHook.address)).to.be.eq(0)

        const tx = await collateral.connect(user1).withdraw(amountToWithdraw)

        await expect(tx)
          .to.emit(baseToken, 'Approval')
          .withArgs(collateral.address, withdrawHook.address, fee)
      })

      it('transfers base tokens to user', async () => {
        expect(await collateral.decimals()).to.eq(await baseToken.decimals())
        const userBTBefore = await baseToken.balanceOf(user1.address)
        const amountToWithdraw = await collateral.balanceOf(user1.address)
        expect(amountToWithdraw).to.be.gt(0)
        const expectedBT = amountToWithdraw
        const fee = expectedBT.mul(await collateral.getWithdrawFee()).div(FEE_DENOMINATOR)

        await collateral.connect(user1).withdraw(amountToWithdraw)

        expect(await baseToken.balanceOf(user1.address)).to.eq(
          userBTBefore.add(expectedBT.sub(fee))
        )
      })
    })

    describe('when decimals < base token decimals', () => {
      snapshotter.setupSnapshotContext()
      before(async () => {
        await setupWithdraw(19)
      })

      it('approves fee to hook', async () => {
        expect(await collateral.decimals()).to.be.lt(await baseToken.decimals())
        const amountToWithdraw = await collateral.balanceOf(user1.address)
        expect(amountToWithdraw).to.be.gt(0)
        const GREATER_DECIMAL_DENOMINATOR = parseUnits('1', (await collateral.decimals()) + 1)
        const expectedBT = amountToWithdraw.mul(GREATER_DECIMAL_DENOMINATOR).div(parseEther('1'))
        const fee = expectedBT.mul(await collateral.getWithdrawFee()).div(FEE_DENOMINATOR)
        expect(await baseToken.allowance(collateral.address, withdrawHook.address)).to.be.eq(0)

        const tx = await collateral.connect(user1).withdraw(amountToWithdraw)

        await expect(tx)
          .to.emit(baseToken, 'Approval')
          .withArgs(collateral.address, withdrawHook.address, fee)
      })

      it('transfers base tokens to user', async () => {
        expect(await collateral.decimals()).to.be.lt(await baseToken.decimals())
        const userBTBefore = await baseToken.balanceOf(user1.address)
        const amountToWithdraw = await collateral.balanceOf(user1.address)
        expect(amountToWithdraw).to.be.gt(0)
        const GREATER_DECIMAL_DENOMINATOR = parseUnits('1', (await collateral.decimals()) + 1)
        const expectedBT = amountToWithdraw.mul(GREATER_DECIMAL_DENOMINATOR).div(parseEther('1'))
        const fee = expectedBT.mul(await collateral.getWithdrawFee()).div(FEE_DENOMINATOR)

        await collateral.connect(user1).withdraw(amountToWithdraw)

        expect(await baseToken.balanceOf(user1.address)).to.eq(
          userBTBefore.add(expectedBT.sub(fee))
        )
      })
    })

    it('sets hook approval back to 0', async () => {
      const amountToWithdraw = await collateral.balanceOf(user1.address)
      const expectedBT = amountToWithdraw.mul(USDC_DENOMINATOR).div(parseEther('1'))
      const fee = expectedBT.mul(await collateral.getWithdrawFee()).div(FEE_DENOMINATOR)
      expect(fee).to.be.gt(0)

      const tx = await collateral.connect(user1).withdraw(amountToWithdraw)

      await expect(tx)
        .to.emit(baseToken, 'Approval')
        .withArgs(collateral.address, withdrawHook.address, fee)
      await expect(tx)
        .to.emit(baseToken, 'Approval')
        .withArgs(collateral.address, withdrawHook.address, 0)
      expect(await baseToken.allowance(collateral.address, withdrawHook.address)).to.eq(0)
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

      const tx = await collateral.connect(user1).withdraw(amountToWithdraw)

      await expect(tx).to.not.emit(baseToken, 'Approval')
      expect(await baseToken.allowance(collateral.address, withdrawHook.address)).to.eq(0)
    })

    it('calls withdraw hook with correct parameters', async () => {
      const amountToWithdraw = await collateral.balanceOf(user1.address)
      expect(amountToWithdraw).to.be.gt(0)
      const expectedBT = amountToWithdraw.mul(USDC_DENOMINATOR).div(parseEther('1'))
      const fee = expectedBT.mul(await collateral.getWithdrawFee()).div(FEE_DENOMINATOR)

      await collateral.connect(user1).withdraw(amountToWithdraw)

      expect(withdrawHook.hook).calledWith(user1.address, expectedBT, expectedBT.sub(fee))
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

    afterEach(() => {
      withdrawHook.hook.reset()
    })
  })
})
