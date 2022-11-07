import { expect } from 'chai'
import { ethers } from 'hardhat'
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/dist/src/signer-with-address'
import { ZERO_ADDRESS } from 'prepo-constants'
import { parseEther } from 'ethers/lib/utils'
import { fixedPriceOracleFixture } from './fixtures/FixedPriceOracleFixture'
import { FixedPriceOracle } from '../types/generated'

describe('FixedPriceOracle', () => {
  let deployer: SignerWithAddress
  let owner: SignerWithAddress
  let user1: SignerWithAddress
  let fixedPriceOracle: FixedPriceOracle

  const setupFixedPriceOracle = async (): Promise<void> => {
    ;[deployer, user1] = await ethers.getSigners()
    owner = deployer
    fixedPriceOracle = await fixedPriceOracleFixture()
  }

  describe('initial state', () => {
    beforeEach(async () => {
      await setupFixedPriceOracle()
    })

    it('sets owner to deployer', async () => {
      expect(await fixedPriceOracle.owner()).to.eq(deployer.address)
    })

    it('sets nominee to zero address', async () => {
      expect(await fixedPriceOracle.getNominee()).to.eq(ZERO_ADDRESS)
    })
  })

  describe('# setFixedPrice', () => {
    beforeEach(async () => {
      await setupFixedPriceOracle()
    })

    it('reverts if not owner', async () => {
      expect(await fixedPriceOracle.owner()).to.not.eq(user1.address)

      await expect(fixedPriceOracle.connect(user1).setFixedPrice(parseEther('1'))).revertedWith(
        'Ownable: caller is not the owner'
      )
    })

    it('sets price to non-zero value', async () => {
      expect(await fixedPriceOracle.getFixedPrice()).to.eq(0)

      await fixedPriceOracle.connect(owner).setFixedPrice(parseEther('1'))

      expect(await fixedPriceOracle.getFixedPrice()).to.eq(parseEther('1'))
    })

    it('sets price to zero', async () => {
      await fixedPriceOracle.connect(owner).setFixedPrice(parseEther('1'))
      expect(await fixedPriceOracle.getFixedPrice()).to.not.eq(0)

      await fixedPriceOracle.connect(owner).setFixedPrice(0)

      expect(await fixedPriceOracle.getFixedPrice()).to.eq(0)
    })

    it('is idempotent', async () => {
      expect(await fixedPriceOracle.getFixedPrice()).to.not.eq(parseEther('1'))

      await fixedPriceOracle.connect(owner).setFixedPrice(parseEther('1'))

      expect(await fixedPriceOracle.getFixedPrice()).to.eq(parseEther('1'))

      await fixedPriceOracle.connect(owner).setFixedPrice(parseEther('1'))

      expect(await fixedPriceOracle.getFixedPrice()).to.eq(parseEther('1'))
    })

    it('emits FixedPriceChange', async () => {
      const tx = await fixedPriceOracle.connect(owner).setFixedPrice(parseEther('1'))

      await expect(tx)
        .to.emit(fixedPriceOracle, 'FixedPriceChange(uint256)')
        .withArgs(parseEther('1'))
    })
  })
})
