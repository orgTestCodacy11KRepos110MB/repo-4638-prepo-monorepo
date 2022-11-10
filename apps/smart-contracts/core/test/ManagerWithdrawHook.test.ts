import chai, { expect } from 'chai'
import { ethers } from 'hardhat'
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/dist/src/signer-with-address'
import { id, parseEther } from 'ethers/lib/utils'
import { Contract } from 'ethers'
import { MockContract, smock } from '@defi-wonderland/smock'
import { ZERO_ADDRESS } from 'prepo-constants'
import { managerWithdrawHookFixture } from './fixtures/HookFixture'
import { smockCollateralDepositRecordFixture } from './fixtures/CollateralDepositRecordFixture'
import { grantAndAcceptRole, PERCENT_DENOMINATOR } from './utils'
import { smockCollateralFixture } from './fixtures/CollateralFixture'
import { ManagerWithdrawHook } from '../typechain'

chai.use(smock.matchers)

describe('=> ManagerWithdrawHook', () => {
  let deployer: SignerWithAddress
  let user: SignerWithAddress
  let managerWithdrawHook: ManagerWithdrawHook
  let depositRecord: MockContract<Contract>
  let collateral: MockContract<Contract>
  const TEST_GLOBAL_DEPOSIT_CAP = parseEther('50000')
  const TEST_USER_DEPOSIT_CAP = parseEther('50')
  const TEST_MIN_RESERVE_PERCENTAGE = 250000 // 25%

  const getSignersAndDeployHook = async (): Promise<void> => {
    ;[deployer, user] = await ethers.getSigners()
    depositRecord = await smockCollateralDepositRecordFixture(
      TEST_GLOBAL_DEPOSIT_CAP,
      TEST_USER_DEPOSIT_CAP
    )
    collateral = await smockCollateralFixture()
    managerWithdrawHook = await managerWithdrawHookFixture(depositRecord.address)
  }

  describe('initial state', () => {
    beforeEach(async () => {
      await getSignersAndDeployHook()
    })

    it('sets collateral to zero address', async () => {
      expect(await managerWithdrawHook.getCollateral()).to.eq(ZERO_ADDRESS)
    })

    it('sets min reserve percentage to 0', async () => {
      expect(await managerWithdrawHook.getMinReservePercentage()).to.eq(0)
    })

    it('sets percent denominator', async () => {
      expect(await managerWithdrawHook.PERCENT_DENOMINATOR()).to.eq(PERCENT_DENOMINATOR)
    })

    it('sets role constants to the correct hash', async () => {
      expect(await managerWithdrawHook.SET_COLLATERAL_ROLE()).to.eq(
        id('ManagerWithdrawHook_setCollateral(address)')
      )
      expect(await managerWithdrawHook.SET_DEPOSIT_RECORD_ROLE()).to.eq(
        id('ManagerWithdrawHook_setDepositRecord(address)')
      )
      expect(await managerWithdrawHook.SET_MIN_RESERVE_PERCENTAGE_ROLE()).to.eq(
        id('ManagerWithdrawHook_setMinReservePercentage(uint256)')
      )
    })

    it('sets deposit record from constructor', async () => {
      expect(await managerWithdrawHook.getDepositRecord()).to.eq(depositRecord.address)
    })
  })
})
