import chai, { expect } from 'chai'
import { ethers } from 'hardhat'
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/dist/src/signer-with-address'
import { smock } from '@defi-wonderland/smock'
import { allowedCallersFixture } from './fixtures/AllowedCallersFixture'
import { AllowedCallers } from '../typechain'

chai.use(smock.matchers)

describe('=> AllowedCallers', () => {
  let allowedCallers: AllowedCallers
  let deployer: SignerWithAddress
  let user: SignerWithAddress

  beforeEach(async () => {
    ;[deployer, user] = await ethers.getSigners()
    allowedCallers = await allowedCallersFixture()
  })

  describe('initial state', () => {
    it('has no allowed accounts', async () => {})
  })

  describe('# setAllowedCallers', () => {
    it('reverts if array length mismatch', async () => {})

    it('sets single account as allowed', async () => {})

    it('sets multiple accounts as allowed', async () => {})

    it('sets single account as disallowed', async () => {})

    it('sets multiple accounts as disallowed', async () => {})

    it('unsets previously allowed account and sets new account', async () => {})

    it('is idempotent for single account', async () => {})

    it('is idempotent for multiple accounts', async () => {})

    it('is idempotent for allowed account and disallowed account', async () => {})

    it('emits AllowedCallersChange once for single account', async () => {})

    it('emits AllowedCallersChange once for multiple accounts', async () => {})
  })
})
