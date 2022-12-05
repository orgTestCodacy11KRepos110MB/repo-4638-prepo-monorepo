import chai, { expect } from 'chai'
import { ethers } from 'hardhat'
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/dist/src/signer-with-address'
import { parseEther } from 'ethers/lib/utils'
import { BigNumber, Contract } from 'ethers'
import { MockContract, FakeContract, smock } from '@defi-wonderland/smock'
import { ZERO_ADDRESS } from 'prepo-constants'
import { utils } from 'prepo-hardhat'
import { getSignerForContract } from './utils'
import { fakeCollateralFixture } from './fixtures/CollateralFixture'
import { redeemHookFixture, smockAccountListFixture } from './fixtures/HookFixture'
import { fakeTokenSenderFixture } from './fixtures/TokenSenderFixture'
import { smockTestERC20Fixture } from './fixtures/TestERC20Fixture'
import { fakePrePOMarketFixture } from './fixtures/PrePOMarketFixture'
import { RedeemHook } from '../typechain'

chai.use(smock.matchers)

const { nowPlusMonths } = utils

describe('=> RedeemHook', () => {
  let deployer: SignerWithAddress
  let user: SignerWithAddress
  let treasury: SignerWithAddress
  let redeemHook: RedeemHook
  let allowlist: MockContract<Contract>
  let baseToken: MockContract<Contract>
  let tokenSender: FakeContract<Contract>
  let collateral: FakeContract<Contract>
  let market: FakeContract<Contract>
  let marketSigner: SignerWithAddress

  beforeEach(async () => {
    ;[deployer, user, treasury] = await ethers.getSigners()
    redeemHook = await redeemHookFixture()
    allowlist = await smockAccountListFixture()
    baseToken = await smockTestERC20Fixture('Test Token', 'TEST', 18)
    tokenSender = await fakeTokenSenderFixture(baseToken.address)
  })

  describe('initial state', () => {
    it('sets deployer to owner', async () => {
      expect(await redeemHook.owner()).to.eq(deployer.address)
    })

    it('sets nominee to zero address', async () => {
      expect(await redeemHook.getNominee()).to.eq(ZERO_ADDRESS)
    })
  })

  describe('# setAllowlist', () => {
    it('reverts if not owner', async () => {
      expect(await redeemHook.owner()).to.not.eq(user.address)

      await expect(redeemHook.connect(user).setAllowlist(allowlist.address)).to.be.revertedWith(
        'Ownable: caller is not the owner'
      )
    })

    it('succeeds if owner', async () => {
      expect(await redeemHook.owner()).to.eq(deployer.address)

      await redeemHook.connect(deployer).setAllowlist(allowlist.address)
    })
  })

  describe('# setAllowedCallers', () => {
    it('reverts if not owner', async () => {
      expect(await redeemHook.owner()).to.not.eq(user.address)

      await expect(
        redeemHook.connect(user).setAllowedCallers([user.address], [true])
      ).to.be.revertedWith('Ownable: caller is not the owner')
    })

    it('succeeds if owner', async () => {
      expect(await redeemHook.owner()).to.eq(deployer.address)

      await redeemHook.connect(deployer).setAllowedCallers([user.address], [true])
    })
  })

  describe('# setTreasury', () => {
    it('reverts if not owner', async () => {
      expect(await redeemHook.owner()).to.not.eq(user.address)

      await expect(redeemHook.connect(user).setTreasury(treasury.address)).to.be.revertedWith(
        'Ownable: caller is not the owner'
      )
    })

    it('succeeds if owner', async () => {
      expect(await redeemHook.owner()).to.eq(deployer.address)

      await redeemHook.connect(deployer).setTreasury(treasury.address)
    })
  })

  describe('# setTokenSender', () => {
    it('reverts if not owner', async () => {
      expect(await redeemHook.owner()).to.not.eq(user.address)

      await expect(redeemHook.connect(user).setTokenSender(tokenSender.address)).to.be.revertedWith(
        'Ownable: caller is not the owner'
      )
    })

    it('succeeds if owner', async () => {
      expect(await redeemHook.owner()).to.eq(deployer.address)

      await redeemHook.connect(deployer).setTokenSender(tokenSender.address)
    })
  })

  describe('# hook', () => {
    beforeEach(async () => {
      await redeemHook.setAllowlist(allowlist.address)
    })

    it('reverts if caller not allowed', async () => {
      expect(await redeemHook.isCallerAllowed(user.address)).to.eq(false)

      await expect(redeemHook.connect(user).hook(user.address, 1, 1)).to.be.revertedWith(
        'msg.sender not allowed'
      )
    })

    it('reverts if sender not allowed', async () => {
      await redeemHook.setAllowedCallers([deployer.address], [true])
      expect(await allowlist.isIncluded(user.address)).to.eq(false)

      await expect(redeemHook.connect(deployer).hook(user.address, 1, 1)).to.be.revertedWith(
        'redeemer not allowed'
      )
    })

    describe('fee reimbursement', () => {
      beforeEach(async () => {
        await allowlist.set([user.address], [true])
        collateral = await fakeCollateralFixture()
        market = await fakePrePOMarketFixture()
        market.getCollateral.returns(collateral.address)
        marketSigner = await getSignerForContract(market)
        await redeemHook.setAllowedCallers([market.address], [true])
        await redeemHook.setTreasury(treasury.address)
        await redeemHook.setTokenSender(tokenSender.address)
      })

      it('transfers fee to treasury if fee > 0', async () => {
        await redeemHook.connect(marketSigner).hook(user.address, 2, 1)

        expect(collateral.transferFrom).to.be.calledWith(market.address, treasury.address, 1)
      })

      it('calls tokenSender.send() if fee > 0', async () => {
        await redeemHook.connect(marketSigner).hook(user.address, 2, 1)

        expect(tokenSender.send).to.be.calledWith(user.address, 1)
      })

      it("doesn't transfer fee to treasury if fee = 0", async () => {
        await redeemHook.connect(marketSigner).hook(user.address, 1, 1)

        expect(collateral.transferFrom).to.not.be.called
      })

      it("doesn't call tokenSender.send() if fee = 0", async () => {
        await redeemHook.connect(marketSigner).hook(user.address, 1, 1)

        expect(tokenSender.send).to.not.be.called
      })
    })
  })
})
