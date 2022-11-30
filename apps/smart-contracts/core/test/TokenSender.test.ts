import { ethers } from 'hardhat'
import { expect } from 'chai'
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/dist/src/signer-with-address'
import { tokenSenderFixture } from './fixtures/TokenSenderFixture'
import { testERC20Fixture } from './fixtures/TestERC20Fixture'
import { TokenSender } from '../typechain/TokenSender'
import { TestERC20 } from '../typechain'

describe('=> TokenSender', () => {
  let tokenSender: TokenSender
  let deployer: SignerWithAddress
  let user: SignerWithAddress
  let outputToken: TestERC20

  beforeEach(async () => {
    ;[deployer, user] = await ethers.getSigners()
    outputToken = await testERC20Fixture('Output Token', 'OUT', 18)
    tokenSender = await tokenSenderFixture(outputToken.address)
  })

  describe('# initialize', () => {
    it('sets output token from constructor', async () => {
      expect(await tokenSender.getOutputToken()).to.eq(outputToken.address)
    })
  })
})
