import { expect } from 'chai'
import { ethers } from 'hardhat'
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/dist/src/signer-with-address'
import { ZERO_ADDRESS } from 'prepo-constants'
import { withdrawERC20Fixture } from './fixtures/WithdrawERC20Fixture'
import { WithdrawERC20 } from '../types/generated'
import { MockContract, smock } from '@defi-wonderland/smock'
import { parseEther } from 'ethers/lib/utils'
import { Contract } from 'ethers'

describe('WithdrawERC20', () => {
  let deployer: SignerWithAddress
  let owner: SignerWithAddress
  let user1: SignerWithAddress
  let user2: SignerWithAddress
  let withdrawERC20: WithdrawERC20
  let firstMockERC20: MockContract<Contract>
  let secondMockERC20: MockContract<Contract>
  const ERC20AmountArray = [parseEther('1'), parseEther('2')]

  const setupWithdrawERC20 = async (): Promise<void> => {
    ;[deployer, user1, user2] = await ethers.getSigners()
    owner = deployer
    withdrawERC20 = await withdrawERC20Fixture()
  }

  const setupWithdrawERC20AndMockERC20 = async (): Promise<void> => {
    await setupWithdrawERC20()
    const mockERC20Factory = await smock.mock('ERC20Mintable')
    firstMockERC20 = await mockERC20Factory.deploy('firstMockERC20', 'MERC20F')
    await firstMockERC20.connect(owner).mint(withdrawERC20.address, ERC20AmountArray[0])
    secondMockERC20 = await mockERC20Factory.deploy('secondMockERC20', 'MERC20S')
    await secondMockERC20.connect(owner).mint(withdrawERC20.address, ERC20AmountArray[1])
  }

  describe('initial state', () => {
    beforeEach(async () => {
      await setupWithdrawERC20()
    })

    it('sets owner to deployer', async () => {
      expect(await withdrawERC20.owner()).to.eq(deployer.address)
    })

    it('sets nominee to zero address', async () => {
      expect(await withdrawERC20.getNominee()).to.eq(ZERO_ADDRESS)
    })
  })

  describe('# withdrawERC20', async () => {
    let ERC20ContractArray: string[]

    beforeEach(async () => {
      await setupWithdrawERC20AndMockERC20()
      ERC20ContractArray = [firstMockERC20.address, secondMockERC20.address]
    })

    it('reverts if not owner', async () => {
      expect(await withdrawERC20.owner()).to.not.eq(user1.address)

      await expect(
        withdrawERC20.connect(user1).withdrawERC20(ERC20ContractArray, ERC20AmountArray)
      ).revertedWith('Ownable: caller is not the owner')
    })

    it('reverts if array length mismatch', async () => {
      expect([firstMockERC20].length).to.not.eq(ERC20AmountArray.length)

      await expect(
        withdrawERC20.connect(owner).withdrawERC20([firstMockERC20.address], ERC20AmountArray)
      ).revertedWith('Array length mismatch')
    })

    it('reverts if amount > contract balance', async () => {
      const contractFirstERC20BalanceBefore = await firstMockERC20.balanceOf(withdrawERC20.address)

      await expect(
        withdrawERC20
          .connect(owner)
          .withdrawERC20([firstMockERC20.address], [contractFirstERC20BalanceBefore.add(1)])
      ).revertedWith('ERC20: transfer amount exceeds balance')
    })

    it('succeeds if amount = 0', async () => {
      const contractFirstERC20BalanceBefore = await firstMockERC20.balanceOf(withdrawERC20.address)
      const ownerFirstERC20BalanceBefore = await firstMockERC20.balanceOf(owner.address)

      await withdrawERC20.connect(owner).withdrawERC20([firstMockERC20.address], [0])

      expect(await firstMockERC20.balanceOf(withdrawERC20.address)).to.eq(
        contractFirstERC20BalanceBefore
      )
      expect(await firstMockERC20.balanceOf(owner.address)).to.eq(ownerFirstERC20BalanceBefore)
    })

    it('withdraws if amount = contract balance', async () => {
      const contractFirstERC20BalanceBefore = await firstMockERC20.balanceOf(withdrawERC20.address)
      const ownerFirstERC20BalanceBefore = await firstMockERC20.balanceOf(owner.address)
      expect(contractFirstERC20BalanceBefore).to.be.gt(0)

      await withdrawERC20
        .connect(owner)
        .withdrawERC20([firstMockERC20.address], [contractFirstERC20BalanceBefore])

      expect(await firstMockERC20.balanceOf(withdrawERC20.address)).to.eq(0)
      expect(await firstMockERC20.balanceOf(owner.address)).to.eq(
        ownerFirstERC20BalanceBefore.add(contractFirstERC20BalanceBefore)
      )
    })

    it('withdraws if amount < contract balance', async () => {
      const contractFirstERC20BalanceBefore = await firstMockERC20.balanceOf(withdrawERC20.address)
      const ownerFirstERC20BalanceBefore = await firstMockERC20.balanceOf(owner.address)

      await withdrawERC20
        .connect(owner)
        .withdrawERC20([firstMockERC20.address], [contractFirstERC20BalanceBefore.sub(1)])

      expect(await firstMockERC20.balanceOf(withdrawERC20.address)).to.eq(1)
      expect(await firstMockERC20.balanceOf(owner.address)).to.eq(
        ownerFirstERC20BalanceBefore.add(contractFirstERC20BalanceBefore.sub(1))
      )
    })

    it('withdraws different amounts of same ERC20 token', async () => {
      // Since ERC20AmountArray[0] amount of first ERC20 is already minted
      await firstMockERC20.connect(owner).mint(withdrawERC20.address, ERC20AmountArray[1])
      const contractFirstERC20BalanceBefore = await firstMockERC20.balanceOf(withdrawERC20.address)
      const ownerFirstERC20BalanceBefore = await firstMockERC20.balanceOf(owner.address)
      expect(ERC20AmountArray[0]).to.not.eq(ERC20AmountArray[1])

      await withdrawERC20
        .connect(owner)
        .withdrawERC20([firstMockERC20.address, firstMockERC20.address], ERC20AmountArray)

      expect(await firstMockERC20.balanceOf(withdrawERC20.address)).to.eq(
        contractFirstERC20BalanceBefore.sub(ERC20AmountArray[0].add(ERC20AmountArray[1]))
      )
      expect(await firstMockERC20.balanceOf(owner.address)).to.eq(
        ownerFirstERC20BalanceBefore.add(ERC20AmountArray[0].add(ERC20AmountArray[1]))
      )
    })

    it('withdraws different amounts of multiple ERC20 tokens', async () => {
      const contractFirstERC20BalanceBefore = await firstMockERC20.balanceOf(withdrawERC20.address)
      const ownerFirstERC20BalanceBefore = await firstMockERC20.balanceOf(owner.address)
      const contractSecondERC20BalanceBefore = await secondMockERC20.balanceOf(
        withdrawERC20.address
      )
      const ownerSecondERC20BalanceBefore = await secondMockERC20.balanceOf(owner.address)
      expect(ERC20AmountArray[0]).to.not.eq(ERC20AmountArray[1])

      await withdrawERC20.connect(owner).withdrawERC20(ERC20ContractArray, ERC20AmountArray)

      expect(await firstMockERC20.balanceOf(withdrawERC20.address)).to.eq(
        contractFirstERC20BalanceBefore.sub(ERC20AmountArray[0])
      )
      expect(await firstMockERC20.balanceOf(owner.address)).to.eq(
        ownerFirstERC20BalanceBefore.add(ERC20AmountArray[0])
      )
      expect(await secondMockERC20.balanceOf(withdrawERC20.address)).to.eq(
        contractSecondERC20BalanceBefore.sub(ERC20AmountArray[1])
      )
      expect(await secondMockERC20.balanceOf(owner.address)).to.eq(
        ownerSecondERC20BalanceBefore.add(ERC20AmountArray[1])
      )
    })
  })
})
