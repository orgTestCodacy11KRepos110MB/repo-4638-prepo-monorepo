import { expect } from 'chai'
import { ethers } from 'hardhat'
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/dist/src/signer-with-address'
import { parseEther } from 'ethers/lib/utils'
import { collateralDepositRecordFixture } from './fixtures/CollateralDepositRecordFixture'
import { CollateralDepositRecord } from '../typechain'

describe('=> CollateralDepositRecord', () => {
  let depositRecord: CollateralDepositRecord
  let deployer: SignerWithAddress
  let user: SignerWithAddress
  let user2: SignerWithAddress
  const TEST_GLOBAL_DEPOSIT_CAP = parseEther('50000')
  const TEST_ACCOUNT_DEPOSIT_CAP = parseEther('10000')
  const TEST_AMOUNT_ONE = parseEther('1')
  const TEST_AMOUNT_TWO = parseEther('2')

  beforeEach(async () => {
    ;[deployer, user, user2] = await ethers.getSigners()
    depositRecord = await collateralDepositRecordFixture(
      TEST_GLOBAL_DEPOSIT_CAP,
      TEST_ACCOUNT_DEPOSIT_CAP
    )
    await depositRecord.connect(deployer).setAllowedHook(user.address, true)
  })

  describe('initial state', () => {
    it('sets global deposit cap from constructor', async () => {
      expect(await depositRecord.getGlobalNetDepositCap()).to.eq(TEST_GLOBAL_DEPOSIT_CAP)
    })

    it('sets user deposit cap from constructor', async () => {
      expect(await depositRecord.getUserDepositCap()).to.eq(TEST_ACCOUNT_DEPOSIT_CAP)
    })

    it('sets owner to deployer', async () => {
      expect(await depositRecord.owner()).to.eq(deployer.address)
    })
  })

  describe('# recordDeposit', () => {
    it('should only be callable by allowed contracts', async () => {
      expect(await depositRecord.isHookAllowed(user2.address)).to.eq(false)

      await expect(
        depositRecord.connect(user2).recordDeposit(user.address, TEST_AMOUNT_TWO)
      ).to.be.revertedWith('msg.sender != allowed hook')
    })

    it("should correctly add 'amount' to both deposited totals when starting from zero", async () => {
      expect(await depositRecord.getGlobalNetDepositAmount()).to.eq(0)
      expect(await depositRecord.getUserDepositAmount(user.address)).to.eq(0)

      await depositRecord.connect(user).recordDeposit(user.address, TEST_AMOUNT_TWO)

      expect(await depositRecord.getGlobalNetDepositAmount()).to.eq(TEST_AMOUNT_TWO)
      expect(await depositRecord.getUserDepositAmount(user.address)).to.eq(TEST_AMOUNT_TWO)
    })

    it("should correctly add 'amount' to both deposited totals when starting from a non-zero value", async () => {
      await depositRecord.connect(user).recordDeposit(user.address, TEST_AMOUNT_TWO)
      const globalDepositsBefore = await depositRecord.getGlobalNetDepositAmount()
      const accountDepositsBefore = await depositRecord.getUserDepositAmount(user.address)

      await depositRecord.connect(user).recordDeposit(user.address, TEST_AMOUNT_ONE)

      expect(await depositRecord.getGlobalNetDepositAmount()).to.eq(
        globalDepositsBefore.add(TEST_AMOUNT_ONE)
      )
      expect(await depositRecord.getUserDepositAmount(user.address)).to.eq(
        accountDepositsBefore.add(TEST_AMOUNT_ONE)
      )
    })

    it('should revert if per-account deposit cap is exceeded', async () => {
      await depositRecord.connect(user).recordDeposit(user.address, TEST_ACCOUNT_DEPOSIT_CAP)
      expect(await depositRecord.getGlobalNetDepositAmount()).to.eq(TEST_ACCOUNT_DEPOSIT_CAP)
      expect(await depositRecord.getUserDepositAmount(user.address)).to.eq(TEST_ACCOUNT_DEPOSIT_CAP)

      await expect(depositRecord.connect(user).recordDeposit(user.address, 1)).to.be.revertedWith(
        'User deposit cap exceeded'
      )
    })

    it('should revert if global deposit cap is exceeded', async () => {
      const accountsToReachCap = TEST_GLOBAL_DEPOSIT_CAP.div(TEST_ACCOUNT_DEPOSIT_CAP).toNumber()
      const allSigners = await ethers.getSigners()
      for (let i = 0; i < accountsToReachCap; i++) {
        const currentAccountAddress = allSigners[i].address
        // eslint-disable-next-line no-await-in-loop
        await depositRecord
          .connect(user)
          .recordDeposit(currentAccountAddress, TEST_ACCOUNT_DEPOSIT_CAP)
        // eslint-disable-next-line no-await-in-loop
        expect(await depositRecord.getUserDepositAmount(currentAccountAddress)).to.eq(
          TEST_ACCOUNT_DEPOSIT_CAP
        )
      }
      expect(await depositRecord.getGlobalNetDepositAmount()).to.eq(TEST_GLOBAL_DEPOSIT_CAP)
      const lastAccountAddress = allSigners[accountsToReachCap].address

      await expect(
        depositRecord.connect(user).recordDeposit(lastAccountAddress, 1)
      ).to.be.revertedWith('Global deposit cap exceeded')
    })
  })

  describe('# recordWithdrawal', () => {
    const testDepositToWithdrawFrom = parseEther('5')
    beforeEach(async () => {
      await depositRecord.connect(user).recordDeposit(user.address, testDepositToWithdrawFrom)
    })

    it('should only be callable by allowed contracts', async () => {
      expect(await depositRecord.isHookAllowed(user2.address)).to.eq(false)

      await expect(
        depositRecord.connect(user2).recordWithdrawal(user.address, TEST_AMOUNT_TWO)
      ).to.be.revertedWith('msg.sender != allowed hook')
    })

    it("should correctly subtract 'amount' from both deposited totals when starting from a non-zero value", async () => {
      expect(await depositRecord.getGlobalNetDepositAmount()).to.be.gt(0)
      expect(await depositRecord.getUserDepositAmount(user.address)).to.be.gt(0)
      const globalDepositsBefore = await depositRecord.getGlobalNetDepositAmount()
      const accountDepositsBefore = await depositRecord.getUserDepositAmount(user.address)

      await depositRecord.connect(user).recordWithdrawal(user.address, TEST_AMOUNT_TWO)

      expect(await depositRecord.getGlobalNetDepositAmount()).to.eq(
        globalDepositsBefore.sub(TEST_AMOUNT_TWO)
      )
      expect(await depositRecord.getUserDepositAmount(user.address)).to.eq(
        accountDepositsBefore.sub(TEST_AMOUNT_TWO)
      )
    })

    it("should correctly subtract 'amount' from both deposited totals when called again", async () => {
      await depositRecord.connect(user).recordWithdrawal(user.address, TEST_AMOUNT_TWO)
      const globalDepositsBeforeSecondWithdrawal = await depositRecord.getGlobalNetDepositAmount()
      const accountDepositsBeforeSecondWithdrawal = await depositRecord.getUserDepositAmount(
        user.address
      )

      await depositRecord.connect(user).recordWithdrawal(user.address, TEST_AMOUNT_ONE)

      expect(await depositRecord.getGlobalNetDepositAmount()).to.eq(
        globalDepositsBeforeSecondWithdrawal.sub(TEST_AMOUNT_ONE)
      )
      expect(await depositRecord.getUserDepositAmount(user.address)).to.eq(
        accountDepositsBeforeSecondWithdrawal.sub(TEST_AMOUNT_ONE)
      )
    })

    it('should set the deposit total to zero instead of underflowing if withdrawal amount is greater than the existing total', async () => {
      expect(await depositRecord.getGlobalNetDepositAmount()).to.be.eq(testDepositToWithdrawFrom)
      expect(await depositRecord.getUserDepositAmount(user.address)).to.be.eq(
        testDepositToWithdrawFrom
      )

      await depositRecord
        .connect(user)
        .recordWithdrawal(user.address, testDepositToWithdrawFrom.add(1))

      expect(await depositRecord.getGlobalNetDepositAmount()).to.eq(0)
      expect(await depositRecord.getUserDepositAmount(user.address)).to.eq(0)
    })
  })

  describe('# setGlobalNetDepositCap', () => {
    const differentCapToTestWith = TEST_GLOBAL_DEPOSIT_CAP.add(1)
    it('should only be callable by the owner', async () => {
      expect(await depositRecord.owner()).to.not.eq(user.address)

      await expect(
        depositRecord.connect(user).setGlobalNetDepositCap(differentCapToTestWith)
      ).to.revertedWith('Ownable: caller is not the owner')
    })

    it('should be settable to a non-zero value', async () => {
      expect(await depositRecord.owner()).to.eq(deployer.address)
      expect(await depositRecord.getGlobalNetDepositCap()).to.not.eq(differentCapToTestWith)

      await depositRecord.connect(deployer).setGlobalNetDepositCap(differentCapToTestWith)

      expect(await depositRecord.getGlobalNetDepositCap()).to.eq(differentCapToTestWith)
    })

    it('should be settable to zero', async () => {
      expect(await depositRecord.owner()).to.eq(deployer.address)
      expect(await depositRecord.getGlobalNetDepositCap()).to.not.eq(0)

      await depositRecord.connect(deployer).setGlobalNetDepositCap(0)

      expect(await depositRecord.getGlobalNetDepositCap()).to.eq(0)
    })

    it('should correctly set the same value twice', async () => {
      expect(await depositRecord.owner()).to.eq(deployer.address)
      expect(await depositRecord.getGlobalNetDepositCap()).to.not.eq(differentCapToTestWith)
      await depositRecord.connect(deployer).setGlobalNetDepositCap(differentCapToTestWith)
      expect(await depositRecord.getGlobalNetDepositCap()).to.eq(differentCapToTestWith)

      await depositRecord.connect(deployer).setGlobalNetDepositCap(differentCapToTestWith)

      expect(await depositRecord.getGlobalNetDepositCap()).to.eq(differentCapToTestWith)
    })

    it('should emit a GlobalNetDepositCapChange event', async () => {
      const tx = await depositRecord
        .connect(deployer)
        .setGlobalNetDepositCap(differentCapToTestWith)

      await expect(tx)
        .to.emit(depositRecord, 'GlobalNetDepositCapChange')
        .withArgs(differentCapToTestWith)
    })
  })

  describe('# setUserDepositCap', () => {
    const differentCapToTestWith = TEST_ACCOUNT_DEPOSIT_CAP.add(1)
    it('should only be callable by the owner', async () => {
      expect(await depositRecord.owner()).to.not.eq(user.address)

      await expect(
        depositRecord.connect(user).setUserDepositCap(differentCapToTestWith)
      ).to.revertedWith('Ownable: caller is not the owner')
    })

    it('should be settable to a non-zero value', async () => {
      expect(await depositRecord.owner()).to.eq(deployer.address)
      expect(await depositRecord.getUserDepositCap()).to.not.eq(differentCapToTestWith)

      await depositRecord.connect(deployer).setUserDepositCap(differentCapToTestWith)

      expect(await depositRecord.getUserDepositCap()).to.eq(differentCapToTestWith)
    })

    it('should be settable to zero', async () => {
      expect(await depositRecord.owner()).to.eq(deployer.address)
      expect(await depositRecord.getUserDepositCap()).to.not.eq(0)

      await depositRecord.connect(deployer).setUserDepositCap(0)

      expect(await depositRecord.getUserDepositCap()).to.eq(0)
    })

    it('should correctly set the same value twice', async () => {
      expect(await depositRecord.owner()).to.eq(deployer.address)
      await depositRecord.connect(deployer).setUserDepositCap(differentCapToTestWith)
      expect(await depositRecord.getUserDepositCap()).to.eq(differentCapToTestWith)

      await depositRecord.connect(deployer).setUserDepositCap(differentCapToTestWith)

      expect(await depositRecord.getUserDepositCap()).to.eq(differentCapToTestWith)
    })

    it('should emit a UserDepositCapChange event', async () => {
      const tx = await depositRecord.connect(deployer).setUserDepositCap(differentCapToTestWith)

      await expect(tx)
        .to.emit(depositRecord, 'UserDepositCapChange')
        .withArgs(differentCapToTestWith)
    })
  })

  describe('# setAllowedHook', () => {
    it('should only be callable by the owner', async () => {
      expect(await depositRecord.owner()).to.not.eq(user.address)

      await expect(
        depositRecord.connect(user).setAllowedHook(deployer.address, true)
      ).to.revertedWith('Ownable: caller is not the owner')
    })

    it('should be able to set the allowed status of an account to true', async () => {
      expect(await depositRecord.owner()).to.eq(deployer.address)
      expect(await depositRecord.isHookAllowed(deployer.address)).to.eq(false)

      await depositRecord.connect(deployer).setAllowedHook(deployer.address, true)

      expect(await depositRecord.isHookAllowed(deployer.address)).to.eq(true)
    })

    it('should be able to set the allowed status of an account to false', async () => {
      expect(await depositRecord.owner()).to.eq(deployer.address)
      await depositRecord.connect(deployer).setAllowedHook(deployer.address, true)
      expect(await depositRecord.isHookAllowed(deployer.address)).to.eq(true)

      await depositRecord.connect(deployer).setAllowedHook(deployer.address, false)

      expect(await depositRecord.isHookAllowed(deployer.address)).to.eq(false)
    })

    it('should be able to set the allowed status of an account to true more than once', async () => {
      expect(await depositRecord.owner()).to.eq(deployer.address)
      await depositRecord.connect(deployer).setAllowedHook(deployer.address, true)
      expect(await depositRecord.isHookAllowed(deployer.address)).to.eq(true)

      await depositRecord.connect(deployer).setAllowedHook(deployer.address, true)

      expect(await depositRecord.isHookAllowed(deployer.address)).to.eq(true)
    })

    it('should be able to set the allowed status of an account to false more than once', async () => {
      expect(await depositRecord.owner()).to.eq(deployer.address)
      await depositRecord.connect(deployer).setAllowedHook(deployer.address, false)
      expect(await depositRecord.isHookAllowed(deployer.address)).to.eq(false)

      await depositRecord.connect(deployer).setAllowedHook(deployer.address, false)

      expect(await depositRecord.isHookAllowed(deployer.address)).to.eq(false)
    })

    it('should emit a AllowedHooksChange event', async () => {
      const tx = await depositRecord.connect(deployer).setAllowedHook(deployer.address, true)

      await expect(tx).to.emit(depositRecord, 'AllowedHooksChange').withArgs(deployer.address, true)
    })
  })
})
