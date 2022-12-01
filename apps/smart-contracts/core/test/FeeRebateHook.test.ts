import chai, { expect } from 'chai'
import { ethers } from 'hardhat'
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/dist/src/signer-with-address'
import { id } from 'ethers/lib/utils'
import { smock } from '@defi-wonderland/smock'
import { feeRebateHookFixture } from './fixtures/HookFixture'
import { grantAndAcceptRole } from './utils'
import { FeeRebateHook } from '../typechain'

chai.use(smock.matchers)

describe('=> FeeRebateHook', () => {
  let feeRebateHook: FeeRebateHook
  let deployer: SignerWithAddress
  let user: SignerWithAddress

  beforeEach(async () => {
    ;[deployer, user] = await ethers.getSigners()
    feeRebateHook = await feeRebateHookFixture()
    await grantAndAcceptRole(
      feeRebateHook,
      deployer,
      deployer,
      await feeRebateHook.SET_TREASURY_ROLE()
    )
    await grantAndAcceptRole(
      feeRebateHook,
      deployer,
      deployer,
      await feeRebateHook.SET_TOKEN_SENDER_ROLE()
    )
  })

  describe('initial state', () => {
    it('sets role constants', async () => {
      expect(await feeRebateHook.SET_TREASURY_ROLE()).to.eq(
        id('FeeRebateHook_setTreasury(address)')
      )
      expect(await feeRebateHook.SET_TOKEN_SENDER_ROLE()).to.eq(
        id('FeeRebateHook_setTokenSender(ITokenSender)')
      )
    })
  })
})
