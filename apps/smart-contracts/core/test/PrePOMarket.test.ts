import { expect } from 'chai'
import { ethers } from 'hardhat'
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/dist/src/signer-with-address'
import { BigNumber } from 'ethers'
import { ZERO_ADDRESS } from 'prepo-constants'
import { utils } from 'prepo-hardhat'
import { testERC20Fixture } from './fixtures/TestERC20Fixture'
import { LongShortTokenAttachFixture } from './fixtures/LongShortTokenFixture'
import { prePOMarketAttachFixture } from './fixtures/PrePOMarketFixture'
import {
  CreateMarketParams,
  prePOMarketFactoryFixture,
  createMarketFixture,
  CreateMarketResult,
} from './fixtures/PrePOMarketFactoryFixture'
import { getMarketCreatedEvent } from './events'
import { MAX_PAYOUT, calculateFee, FEE_LIMIT, FEE_DENOMINATOR, getLastTimestamp } from './utils'
import { PrePOMarketFactory } from '../typechain/PrePOMarketFactory'
import { PrePOMarket } from '../typechain/PrePOMarket'
import { LongShortToken } from '../typechain/LongShortToken'
import { TestERC20 } from '../typechain/TestERC20'

const { nowPlusMonths, revertReason } = utils

describe('=> prePOMarket', () => {
  let collateralToken: TestERC20
  let prePOMarket: PrePOMarket
  let prePOMarketFactory: PrePOMarketFactory
  let deployer: SignerWithAddress
  let user: SignerWithAddress
  let user2: SignerWithAddress
  let treasury: SignerWithAddress
  let defaultParams: CreateMarketParams
  let createMarket: (marketParams: CreateMarketParams) => Promise<CreateMarketResult>
  const TEST_NAME_SUFFIX = 'preSTRIPE 100-200 30-September-2021'
  const TEST_SYMBOL_SUFFIX = 'preSTRIPE_100-200_30SEP21'
  const TEST_FLOOR_VAL = ethers.utils.parseEther('100')
  const TEST_CEILING_VAL = ethers.utils.parseEther('200')
  const TEST_REDEMPTION_FEE = 20
  const TEST_EXPIRY = nowPlusMonths(2)
  const TEST_FLOOR_PAYOUT = ethers.utils.parseEther('0.2')
  const TEST_CEILING_PAYOUT = ethers.utils.parseEther('0.8')
  const TEST_MINT_AMOUNT = ethers.utils.parseEther('1000')
  const TEST_FINAL_LONG_PAYOUT = TEST_FLOOR_PAYOUT.add(TEST_CEILING_PAYOUT).div(2)
  const MOCK_COLLATERAL_SUPPLY = ethers.utils.parseEther('1000000000')

  beforeEach(async () => {
    ;[deployer, user, user2, treasury] = await ethers.getSigners()
    collateralToken = await testERC20Fixture('prePO USDC Collateral', 'preUSD', 18)
    await collateralToken.mint(deployer.address, MOCK_COLLATERAL_SUPPLY)
    prePOMarketFactory = await prePOMarketFactoryFixture()
    await prePOMarketFactory.setCollateralValidity(collateralToken.address, true)
    defaultParams = {
      caller: deployer,
      factory: prePOMarketFactory,
      tokenNameSuffix: TEST_NAME_SUFFIX,
      tokenSymbolSuffix: TEST_SYMBOL_SUFFIX,
      governance: treasury.address,
      collateral: collateralToken.address,
      floorLongPayout: TEST_FLOOR_PAYOUT,
      ceilingLongPayout: TEST_CEILING_PAYOUT,
      floorValuation: TEST_FLOOR_VAL,
      ceilingValuation: TEST_CEILING_VAL,
      redemptionFee: TEST_REDEMPTION_FEE,
      expiryTime: TEST_EXPIRY,
    }

    createMarket = async (marketParams): Promise<CreateMarketResult> => {
      const createMarketResult = await createMarketFixture(marketParams)
      return createMarketResult
    }
  })

  describe('# initialize', () => {
    it('should be initialized with correct values', async () => {
      prePOMarket = await prePOMarketAttachFixture(await createMarket(defaultParams))
      const longToken = await LongShortTokenAttachFixture(await prePOMarket.getLongToken())
      const shortToken = await LongShortTokenAttachFixture(await prePOMarket.getShortToken())

      expect(await prePOMarket.getTreasury()).to.eq(treasury.address)
      expect(await prePOMarket.getCollateral()).to.eq(collateralToken.address)
      expect(await longToken.owner()).to.eq(prePOMarket.address)
      expect(await shortToken.owner()).to.eq(prePOMarket.address)
      expect(await prePOMarket.getFloorLongPayout()).to.eq(TEST_FLOOR_PAYOUT)
      expect(await prePOMarket.getCeilingLongPayout()).to.eq(TEST_CEILING_PAYOUT)
      expect(await prePOMarket.getFinalLongPayout()).to.eq(MAX_PAYOUT.add(1))
      expect(await prePOMarket.getFloorValuation()).to.eq(TEST_FLOOR_VAL)
      expect(await prePOMarket.getCeilingValuation()).to.eq(TEST_CEILING_VAL)
      expect(await prePOMarket.getRedemptionFee()).to.eq(TEST_REDEMPTION_FEE)
      expect(await prePOMarket.getExpiryTime()).to.eq(TEST_EXPIRY)
      expect(await prePOMarket.getMaxPayout()).to.eq(MAX_PAYOUT)
      expect(await prePOMarket.getFeeDenominator()).to.eq(FEE_DENOMINATOR)
      expect(await prePOMarket.getFeeLimit()).to.eq(FEE_LIMIT)
    })

    it('should set owner to governance', async () => {
      prePOMarket = await prePOMarketAttachFixture(await createMarket(defaultParams))

      expect(await prePOMarket.owner()).to.eq(treasury.address)
    })

    it('should not allow floor = ceiling', async () => {
      await expect(
        createMarket({
          ...defaultParams,
          ceilingLongPayout: TEST_FLOOR_PAYOUT,
        })
      ).revertedWith(revertReason('Ceiling must exceed floor'))
    })

    it('should not allow floor > ceiling', async () => {
      await expect(
        createMarket({
          ...defaultParams,
          floorLongPayout: TEST_CEILING_PAYOUT,
          ceilingLongPayout: TEST_FLOOR_PAYOUT,
        })
      ).revertedWith(revertReason('Ceiling must exceed floor'))
    })

    it('should not allow ceiling >  1', async () => {
      await expect(
        createMarket({
          ...defaultParams,
          ceilingLongPayout: MAX_PAYOUT.add(1),
        })
      ).revertedWith(revertReason('Ceiling cannot exceed 1'))
    })

    it('should not allow expiry before current time', async () => {
      const lastTimestamp = await getLastTimestamp()

      await expect(
        createMarket({
          ...defaultParams,
          expiryTime: lastTimestamp - 1,
        })
      ).revertedWith(revertReason('Invalid expiry'))
    })

    it('should not allow expiry at current time', async () => {
      const lastTimestamp = await getLastTimestamp()

      await expect(
        createMarket({
          ...defaultParams,
          expiryTime: lastTimestamp,
        })
      ).revertedWith(revertReason('Invalid expiry'))
    })

    it('should not allow setting redemption fee above FEE_LIMIT ', async () => {
      const aboveFeeLimit = FEE_LIMIT + 1

      await expect(
        createMarket({
          ...defaultParams,
          redemptionFee: aboveFeeLimit,
        })
      ).revertedWith(revertReason('Exceeds fee limit'))
    })

    it('should allow setting redemption fee to FEE_LIMIT ', async () => {
      prePOMarket = await prePOMarketAttachFixture(
        await createMarket({
          ...defaultParams,
          redemptionFee: FEE_LIMIT,
        })
      )

      expect(await prePOMarket.getRedemptionFee()).to.eq(FEE_LIMIT)
    })

    it('should emit MarketCreated event', async () => {
      const createMarketResult = await createMarket(defaultParams)
      prePOMarket = await prePOMarketAttachFixture(createMarketResult)

      await expect(createMarketResult.tx)
        .to.emit(prePOMarket, 'MarketCreated')
        .withArgs(
          await prePOMarket.getLongToken(),
          await prePOMarket.getShortToken(),
          await prePOMarket.getFloorLongPayout(),
          await prePOMarket.getCeilingLongPayout(),
          TEST_FLOOR_VAL,
          TEST_CEILING_VAL,
          await prePOMarket.getRedemptionFee(),
          TEST_EXPIRY
        )
    })
  })

  describe('# setFinalLongPayout', () => {
    beforeEach(async () => {
      prePOMarket = await prePOMarketAttachFixture(await createMarket(defaultParams))
    })

    it('should only be usable by the owner', async () => {
      await expect(prePOMarket.connect(user).setFinalLongPayout(MAX_PAYOUT)).to.revertedWith(
        revertReason('Ownable: caller is not the owner')
      )
    })

    it('should not be settable beyond ceiling', async () => {
      await expect(
        prePOMarket.connect(treasury).setFinalLongPayout(TEST_CEILING_PAYOUT.add(1))
      ).to.revertedWith(revertReason('Payout cannot exceed ceiling'))
    })

    it('should not be settable below floor', async () => {
      await expect(
        prePOMarket.connect(treasury).setFinalLongPayout(TEST_FLOOR_PAYOUT.sub(1))
      ).to.revertedWith(revertReason('Payout cannot be below floor'))
    })

    it('should be settable to value between payout and ceiling', async () => {
      await prePOMarket.connect(treasury).setFinalLongPayout(TEST_CEILING_PAYOUT.sub(1))

      expect(await prePOMarket.getFinalLongPayout()).to.eq(TEST_CEILING_PAYOUT.sub(1))
    })

    it('should correctly set the same value twice', async () => {
      await prePOMarket.connect(treasury).setFinalLongPayout(TEST_CEILING_PAYOUT.sub(1))

      expect(await prePOMarket.getFinalLongPayout()).to.eq(TEST_CEILING_PAYOUT.sub(1))

      await prePOMarket.connect(treasury).setFinalLongPayout(TEST_CEILING_PAYOUT.sub(1))

      expect(await prePOMarket.getFinalLongPayout()).to.eq(TEST_CEILING_PAYOUT.sub(1))
    })

    it('should emit a FinalLongPayoutSet event', async () => {
      const tx = await prePOMarket.connect(treasury).setFinalLongPayout(TEST_CEILING_PAYOUT.sub(1))
      await expect(tx)
        .to.emit(prePOMarket, 'FinalLongPayoutSet')
        .withArgs(TEST_CEILING_PAYOUT.sub(1))
    })
  })

  describe('# setTreasury', () => {
    beforeEach(async () => {
      prePOMarket = await prePOMarketAttachFixture(await createMarket(defaultParams))
    })

    it('should only be usable by the owner', async () => {
      await expect(prePOMarket.connect(user).setTreasury(user.address)).to.revertedWith(
        revertReason('Ownable: caller is not the owner')
      )
    })

    it('should be settable to a non-zero address', async () => {
      expect(await prePOMarket.getTreasury()).to.not.eq(user.address)

      await prePOMarket.connect(treasury).setTreasury(user.address)

      expect(await prePOMarket.getTreasury()).to.eq(user.address)
    })

    it('should be settable to the zero address', async () => {
      expect(await prePOMarket.getTreasury()).to.not.eq(ZERO_ADDRESS)

      await prePOMarket.connect(treasury).setTreasury(ZERO_ADDRESS)

      expect(await prePOMarket.getTreasury()).to.eq(ZERO_ADDRESS)
    })

    it('should be settable to the same value twice', async () => {
      expect(await prePOMarket.getTreasury()).to.not.eq(user.address)

      await prePOMarket.connect(treasury).setTreasury(user.address)

      expect(await prePOMarket.getTreasury()).to.eq(user.address)

      await prePOMarket.connect(treasury).setTreasury(user.address)

      expect(await prePOMarket.getTreasury()).to.eq(user.address)
    })

    it('should emit a TreasuryChange event', async () => {
      const tx = await prePOMarket.connect(treasury).setTreasury(user.address)
      await expect(tx).to.emit(prePOMarket, 'TreasuryChange').withArgs(user.address)
    })
  })

  describe('# setRedemptionFee', () => {
    beforeEach(async () => {
      prePOMarket = await prePOMarketAttachFixture(await createMarket(defaultParams))
    })

    it('should only be usable by the owner', async () => {
      await expect(prePOMarket.connect(user).setRedemptionFee(FEE_LIMIT - 1)).to.revertedWith(
        revertReason('Ownable: caller is not the owner')
      )
    })

    it('should not be settable beyond FEE_LIMIT', async () => {
      await expect(prePOMarket.connect(treasury).setRedemptionFee(FEE_LIMIT + 1)).to.revertedWith(
        revertReason('Exceeds fee limit')
      )
    })

    it('should be settable to FEE_LIMIT', async () => {
      await prePOMarket.connect(treasury).setRedemptionFee(FEE_LIMIT)
      expect(await prePOMarket.getRedemptionFee()).to.eq(FEE_LIMIT)
    })

    it('should be settable below FEE_LIMIT', async () => {
      await prePOMarket.connect(treasury).setRedemptionFee(FEE_LIMIT - 1)
      expect(await prePOMarket.getRedemptionFee()).to.eq(FEE_LIMIT - 1)
    })

    it('should be settable to zero', async () => {
      await prePOMarket.connect(treasury).setRedemptionFee(0)
      expect(await prePOMarket.getRedemptionFee()).to.eq(0)
    })

    it('should emit a RedemptionFeeChange event', async () => {
      const tx = await prePOMarket.connect(treasury).setRedemptionFee(FEE_LIMIT)
      await expect(tx).to.emit(prePOMarket, 'RedemptionFeeChange').withArgs(FEE_LIMIT)
    })
  })

  describe('# mint', () => {
    it('prevents minting if market ended', async () => {
      prePOMarket = await prePOMarketAttachFixture(await createMarket(defaultParams))
      await collateralToken.connect(deployer).transfer(user.address, TEST_MINT_AMOUNT)
      await collateralToken.connect(user).approve(prePOMarket.address, TEST_MINT_AMOUNT)
      await prePOMarket.connect(treasury).setFinalLongPayout(TEST_FINAL_LONG_PAYOUT)

      await expect(prePOMarket.connect(user).mint(TEST_MINT_AMOUNT)).revertedWith(
        revertReason('Market ended')
      )
    })

    it('should not allow minting an amount exceeding owned collateral', async () => {
      prePOMarket = await prePOMarketAttachFixture(await createMarket(defaultParams))
      await collateralToken.connect(deployer).transfer(user.address, TEST_MINT_AMOUNT.sub(1))
      await collateralToken.connect(user).approve(prePOMarket.address, TEST_MINT_AMOUNT.sub(1))

      await expect(prePOMarket.connect(user).mint(TEST_MINT_AMOUNT)).revertedWith(
        revertReason('Insufficient collateral')
      )
    })

    it('transfers collateral from sender', async () => {
      prePOMarket = await prePOMarketAttachFixture(await createMarket(defaultParams))
      await collateralToken.connect(deployer).transfer(user.address, TEST_MINT_AMOUNT)
      await collateralToken.connect(user).approve(prePOMarket.address, TEST_MINT_AMOUNT)

      await prePOMarket.connect(user).mint(TEST_MINT_AMOUNT)

      expect(await collateralToken.balanceOf(prePOMarket.address)).to.eq(TEST_MINT_AMOUNT)
    })

    it('mints long and short tokens in equal amounts', async () => {
      prePOMarket = await prePOMarketAttachFixture(await createMarket(defaultParams))
      const longToken = await LongShortTokenAttachFixture(await prePOMarket.getLongToken())
      const shortToken = await LongShortTokenAttachFixture(await prePOMarket.getShortToken())
      await collateralToken.connect(deployer).transfer(user.address, TEST_MINT_AMOUNT)
      await collateralToken.connect(user).approve(prePOMarket.address, TEST_MINT_AMOUNT)

      await prePOMarket.connect(user).mint(TEST_MINT_AMOUNT)

      expect(await longToken.balanceOf(user.address)).to.eq(TEST_MINT_AMOUNT)
      expect(await shortToken.balanceOf(user.address)).to.eq(TEST_MINT_AMOUNT)
    })

    it('emits Mint', async () => {
      prePOMarket = await prePOMarketAttachFixture(await createMarket(defaultParams))
      await collateralToken.connect(deployer).transfer(user.address, TEST_MINT_AMOUNT)
      await collateralToken.connect(user).approve(prePOMarket.address, TEST_MINT_AMOUNT)
      await prePOMarket.connect(user).mint(TEST_MINT_AMOUNT)

      const mintFilter = {
        address: prePOMarket.address,
        topics: [
          ethers.utils.id('Mint(address,uint256)'),
          ethers.utils.hexZeroPad(user.address, 32),
        ],
      }
      const mintEvents = await prePOMarket.queryFilter(mintFilter)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const mintEvent = mintEvents[0].args as any

      expect(await mintEvent.minter).to.eq(user.address)
      expect(await mintEvent.amount).to.eq(TEST_MINT_AMOUNT)
    })

    it('returns long short tokens minted', async () => {
      prePOMarket = await prePOMarketAttachFixture(await createMarket(defaultParams))
      await collateralToken.connect(deployer).transfer(user.address, TEST_MINT_AMOUNT)
      await collateralToken.connect(user).approve(prePOMarket.address, TEST_MINT_AMOUNT)

      expect(await prePOMarket.connect(user).callStatic.mint(TEST_MINT_AMOUNT)).to.eq(
        TEST_MINT_AMOUNT
      )
    })
  })

  describe('# redeem', () => {
    let calculateTotalOwed: (
      longToRedeem: BigNumber,
      shortToRedeem: BigNumber,
      finalPayoutSet: boolean
    ) => Promise<BigNumber>
    let mintTestPosition: () => Promise<BigNumber>
    let approveTokensForRedemption: (owner: SignerWithAddress, amount: BigNumber) => Promise<void>
    let setupMarket: () => Promise<BigNumber>
    let setupMarketToEnd: (finalLongPayout: BigNumber) => Promise<BigNumber>
    let longToken: LongShortToken
    let shortToken: LongShortToken

    beforeEach(() => {
      mintTestPosition = async (): Promise<BigNumber> => {
        await collateralToken.connect(deployer).transfer(user.address, TEST_MINT_AMOUNT)
        await collateralToken.connect(user).approve(prePOMarket.address, TEST_MINT_AMOUNT)
        await prePOMarket.connect(user).mint(TEST_MINT_AMOUNT)
        return TEST_MINT_AMOUNT
      }

      // TODO: need to implement a way to remove the need for approval calls, perhaps using permit signatures?
      approveTokensForRedemption = async (
        owner: SignerWithAddress,
        amount: BigNumber
      ): Promise<void> => {
        longToken = await LongShortTokenAttachFixture(await prePOMarket.getLongToken())
        shortToken = await LongShortTokenAttachFixture(await prePOMarket.getShortToken())
        await longToken.connect(owner).approve(prePOMarket.address, amount)
        await shortToken.connect(owner).approve(prePOMarket.address, amount)
      }

      setupMarket = async (): Promise<BigNumber> => {
        prePOMarket = await prePOMarketAttachFixture(await createMarket(defaultParams))
        const amountMinted = await mintTestPosition()
        await approveTokensForRedemption(user, amountMinted)
        return amountMinted
      }

      setupMarketToEnd = async (finalLongPayout: BigNumber): Promise<BigNumber> => {
        prePOMarket = await prePOMarketAttachFixture(await createMarket(defaultParams))
        const amountMinted = await mintTestPosition()
        await approveTokensForRedemption(user, amountMinted)
        await prePOMarket.connect(treasury).setFinalLongPayout(finalLongPayout)
        return amountMinted
      }

      calculateTotalOwed = async (
        longToRedeem: BigNumber,
        shortToRedeem: BigNumber,
        finalPayoutSet: boolean
      ): Promise<BigNumber> => {
        let totalOwed: BigNumber
        if (finalPayoutSet) {
          totalOwed = longToRedeem
        } else {
          const owedForLongs = longToRedeem
            .mul(await prePOMarket.getFinalLongPayout())
            .div(MAX_PAYOUT)
          const owedForShort = shortToRedeem
            .mul(MAX_PAYOUT.sub(await prePOMarket.getFinalLongPayout()))
            .div(MAX_PAYOUT)
          totalOwed = owedForLongs.add(owedForShort)
        }
        return totalOwed
      }
    })

    it('should not allow long token redemption exceeding long token balance', async () => {
      prePOMarket = await prePOMarketAttachFixture(await createMarket(defaultParams))
      const amountMinted = await mintTestPosition()

      await expect(
        prePOMarket.connect(user).redeem(amountMinted.add(1), amountMinted)
      ).revertedWith(revertReason('Insufficient long tokens'))
    })

    it('should not allow short token redemption exceeding short token balance', async () => {
      prePOMarket = await prePOMarketAttachFixture(await createMarket(defaultParams))
      const amountMinted = await mintTestPosition()

      await expect(
        prePOMarket.connect(user).redeem(amountMinted, amountMinted.add(1))
      ).revertedWith(revertReason('Insufficient short tokens'))
    })

    it('should only allow token redemption in equal parts before expiry', async () => {
      prePOMarket = await prePOMarketAttachFixture(await createMarket(defaultParams))
      const amountMinted = await mintTestPosition()

      await expect(
        prePOMarket.connect(user).redeem(amountMinted, amountMinted.sub(1))
      ).revertedWith(revertReason('Long and Short must be equal'))
    })

    it('should correctly settle equal non-zero redemption amounts before market end', async () => {
      const amountMinted = await setupMarket()
      const longToRedeem = amountMinted
      const shortToRedeem = amountMinted
      const totalOwed = await calculateTotalOwed(longToRedeem, shortToRedeem, false)
      const redeemFee = calculateFee(totalOwed, await prePOMarket.getRedemptionFee())
      const treasuryBefore = await collateralToken.balanceOf(treasury.address)

      await prePOMarket.connect(user).redeem(longToRedeem, shortToRedeem)

      expect(await longToken.balanceOf(user.address)).to.eq(amountMinted.sub(longToRedeem))
      expect(await shortToken.balanceOf(user.address)).to.eq(amountMinted.sub(shortToRedeem))
      expect(await collateralToken.balanceOf(treasury.address)).to.eq(treasuryBefore.add(redeemFee))
      expect(await collateralToken.balanceOf(user.address)).to.eq(totalOwed.sub(redeemFee))
    })

    it('should correctly settle non-equal non-zero redemption amounts after market end', async () => {
      const amountMinted = await setupMarketToEnd(TEST_FINAL_LONG_PAYOUT)
      const longToRedeem = amountMinted
      const shortToRedeem = amountMinted.sub(1)
      const totalOwed = await calculateTotalOwed(longToRedeem, shortToRedeem, false)
      const redeemFee = calculateFee(totalOwed, await prePOMarket.getRedemptionFee())
      const treasuryBefore = await collateralToken.balanceOf(treasury.address)

      await prePOMarket.connect(user).redeem(longToRedeem, shortToRedeem)

      expect(await longToken.balanceOf(user.address)).to.eq(amountMinted.sub(longToRedeem))
      expect(await shortToken.balanceOf(user.address)).to.eq(amountMinted.sub(shortToRedeem))
      expect(await collateralToken.balanceOf(treasury.address)).to.eq(treasuryBefore.add(redeemFee))
      expect(await collateralToken.balanceOf(user.address)).to.eq(totalOwed.sub(redeemFee))
    })

    it('should correctly settle redemption done with only long tokens after market end', async () => {
      const amountMinted = await setupMarketToEnd(TEST_FINAL_LONG_PAYOUT)
      const longToRedeem = amountMinted
      const shortToRedeem = ethers.utils.parseEther('0')
      const totalOwed = await calculateTotalOwed(longToRedeem, shortToRedeem, false)
      const redeemFee = calculateFee(totalOwed, await prePOMarket.getRedemptionFee())
      const treasuryBefore = await collateralToken.balanceOf(treasury.address)

      await prePOMarket.connect(user).redeem(longToRedeem, shortToRedeem)

      expect(await longToken.balanceOf(user.address)).to.eq(amountMinted.sub(longToRedeem))
      expect(await shortToken.balanceOf(user.address)).to.eq(amountMinted.sub(shortToRedeem))
      expect(await collateralToken.balanceOf(treasury.address)).to.eq(treasuryBefore.add(redeemFee))
      expect(await collateralToken.balanceOf(user.address)).to.eq(totalOwed.sub(redeemFee))
    })

    it('should correctly settle redemption done with only short tokens after market end', async () => {
      const amountMinted = await setupMarketToEnd(TEST_FINAL_LONG_PAYOUT)
      const longToRedeem = ethers.utils.parseEther('0')
      const shortToRedeem = amountMinted
      const totalOwed = await calculateTotalOwed(longToRedeem, shortToRedeem, false)
      const redeemFee = calculateFee(totalOwed, await prePOMarket.getRedemptionFee())
      const treasuryBefore = await collateralToken.balanceOf(treasury.address)

      await prePOMarket.connect(user).redeem(longToRedeem, shortToRedeem)

      expect(await longToken.balanceOf(user.address)).to.eq(amountMinted.sub(longToRedeem))
      expect(await shortToken.balanceOf(user.address)).to.eq(amountMinted.sub(shortToRedeem))
      expect(await collateralToken.balanceOf(treasury.address)).to.eq(treasuryBefore.add(redeemFee))
      expect(await collateralToken.balanceOf(user.address)).to.eq(totalOwed.sub(redeemFee))
    })

    it('should not allow redemption amounts too small for a fee before market end', async () => {
      const amountMinted = await setupMarket()
      const longToRedeem = ethers.utils.parseEther('0')
      const shortToRedeem = ethers.utils.parseEther('0')

      await expect(prePOMarket.connect(user).redeem(longToRedeem, shortToRedeem)).revertedWith(
        revertReason('Redemption amount too small')
      )
    })

    it('should not allow redemption amounts too small for a fee after market end', async () => {
      const amountMinted = await setupMarketToEnd(TEST_FINAL_LONG_PAYOUT)
      const longToRedeem = ethers.utils.parseEther('0')
      const shortToRedeem = ethers.utils.parseEther('0')

      await expect(prePOMarket.connect(user).redeem(longToRedeem, shortToRedeem)).revertedWith(
        revertReason('Redemption amount too small')
      )
    })

    it('should emit a Redemption event indexed by redeemer', async () => {
      prePOMarket = await prePOMarketAttachFixture(await createMarket(defaultParams))
      const amountMinted = await mintTestPosition()
      await approveTokensForRedemption(user, amountMinted)
      const redeemFee = calculateFee(amountMinted, await prePOMarket.getRedemptionFee())

      await prePOMarket.connect(user).redeem(amountMinted, amountMinted)

      const filter = {
        address: prePOMarket.address,
        topics: [
          ethers.utils.id('Redemption(address,uint256)'),
          ethers.utils.hexZeroPad(user.address, 32),
        ],
      }
      const events = await prePOMarket.queryFilter(filter)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const event = events[0].args as any
      expect(await event.redeemer).to.eq(user.address)
      expect(await event.amount).to.eq(amountMinted.sub(redeemFee))
    })
  })
})
