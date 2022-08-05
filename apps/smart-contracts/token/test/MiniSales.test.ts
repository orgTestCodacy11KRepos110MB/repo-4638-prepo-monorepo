import { expect } from 'chai'
import { ethers } from 'hardhat'
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/dist/src/signer-with-address'
import { ZERO_ADDRESS, JUNK_ADDRESS } from 'prepo-constants'
import { parseEther } from 'ethers/lib/utils'
import { miniSalesFixture } from './fixtures/MiniSalesFixtures'
import { mockERC20Fixture } from './fixtures/MockERC20Fixtures'
import { MiniSales, MockERC20 } from '../types/generated'

describe('=> MiniSales', () => {
  let deployer: SignerWithAddress
  let owner: SignerWithAddress
  let user1: SignerWithAddress
  let user2: SignerWithAddress
  let miniSales: MiniSales
  let paymentToken: MockERC20
  let saleToken: MockERC20

  const deployMiniSales = async (): Promise<void> => {
    ;[deployer, owner, user1, user2] = await ethers.getSigners()
    const mockERC20Recipient = owner.address
    const mockERC20Decimals = 18
    const mockERC20InitialSupply = parseEther('100')
    saleToken = await mockERC20Fixture(
      'Sale Token',
      'ST',
      mockERC20Decimals,
      mockERC20Recipient,
      mockERC20InitialSupply
    )
    paymentToken = await mockERC20Fixture(
      'Payment Token',
      'PT',
      mockERC20Decimals,
      mockERC20Recipient,
      mockERC20InitialSupply
    )
    miniSales = await miniSalesFixture(saleToken.address, paymentToken.address, owner.address)
  }

  const setupMiniSales = async (): Promise<void> => {
    await deployMiniSales()
    await miniSales.connect(owner).acceptOwnership()
  }

  describe('initial state', () => {
    beforeEach(async () => {
      await deployMiniSales()
    })

    it('sets nominee from initialize', async () => {
      expect(await miniSales.getNominee()).to.not.eq(deployer.address)
      expect(await miniSales.getNominee()).to.eq(owner.address)
    })

    it('sets owner to deployer', async () => {
      expect(await miniSales.owner()).to.eq(deployer.address)
    })

    it('sets sale token from initialize', async () => {
      expect(await miniSales.getSaleToken()).to.eq(saleToken.address)
    })

    it('sets payment token from initialize', async () => {
      expect(await miniSales.getPaymentToken()).to.eq(paymentToken.address)
    })

    it('sets price to zero', async () => {
      expect(await miniSales.getPrice()).to.eq(0)
    })

    it('sets purchase hook to zero address', async () => {
      expect(await miniSales.getPurchaseHook()).to.eq(ZERO_ADDRESS)
    })
  })

  describe('# setPrice', () => {
    beforeEach(async () => {
      await setupMiniSales()
    })

    it('reverts if not owner', async () => {
      expect(await miniSales.owner()).to.not.eq(user1.address)

      await expect(miniSales.connect(user1).setPrice(0)).revertedWith(
        'Ownable: caller is not the owner'
      )
    })

    it('sets to non-zero', async () => {
      expect(await miniSales.getPrice()).to.not.eq(1)

      await miniSales.connect(owner).setPrice(1)

      expect(await miniSales.getPrice()).to.eq(1)
    })

    it('sets to zero', async () => {
      await miniSales.connect(owner).setPrice(1)
      expect(await miniSales.getPrice()).to.not.eq(0)

      await miniSales.connect(owner).setPrice(0)

      expect(await miniSales.getPrice()).to.eq(0)
    })

    it('is idempotent', async () => {
      expect(await miniSales.getPrice()).to.not.eq(1)

      await miniSales.connect(owner).setPrice(1)

      expect(await miniSales.getPrice()).to.eq(1)

      await miniSales.connect(owner).setPrice(1)

      expect(await miniSales.getPrice()).to.eq(1)
    })
  })

  describe('# setPurchaseHook', () => {
    beforeEach(async () => {
      await setupMiniSales()
    })

    it('reverts if not owner', async () => {
      expect(await miniSales.owner()).to.not.eq(user1.address)

      await expect(miniSales.connect(user1).setPurchaseHook(JUNK_ADDRESS)).revertedWith(
        'Ownable: caller is not the owner'
      )
    })

    it('sets to non-zero address', async () => {
      expect(await miniSales.getPurchaseHook()).to.not.eq(JUNK_ADDRESS)
      expect(JUNK_ADDRESS).to.not.equal(ZERO_ADDRESS)

      await miniSales.connect(owner).setPurchaseHook(JUNK_ADDRESS)

      expect(await miniSales.getPurchaseHook()).to.eq(JUNK_ADDRESS)
    })

    it('sets to zero address', async () => {
      await miniSales.connect(owner).setPurchaseHook(JUNK_ADDRESS)
      expect(await miniSales.getPurchaseHook()).to.not.eq(ZERO_ADDRESS)

      await miniSales.connect(owner).setPurchaseHook(ZERO_ADDRESS)

      expect(await miniSales.getPurchaseHook()).to.eq(ZERO_ADDRESS)
    })

    it('is idempotent', async () => {
      expect(await miniSales.getPurchaseHook()).to.not.eq(JUNK_ADDRESS)

      await miniSales.connect(owner).setPurchaseHook(JUNK_ADDRESS)

      expect(await miniSales.getPurchaseHook()).to.eq(JUNK_ADDRESS)

      await miniSales.connect(owner).setPurchaseHook(JUNK_ADDRESS)

      expect(await miniSales.getPurchaseHook()).to.eq(JUNK_ADDRESS)
    })
  })
})
