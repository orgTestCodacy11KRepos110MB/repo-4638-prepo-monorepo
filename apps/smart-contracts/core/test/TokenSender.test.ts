import { ethers } from 'hardhat'
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/dist/src/signer-with-address'
import { tokenSenderFixture } from './fixtures/TokenSenderFixture'
import { TokenSender } from '../typechain/TokenSender'

describe('=> TokenSender', () => {
  let tokenSender: TokenSender
  let deployer: SignerWithAddress
  let user: SignerWithAddress

  beforeEach(async () => {
    ;[deployer, user] = await ethers.getSigners()
    tokenSender = await tokenSenderFixture()
  })

  describe('# initialize', () => {})
})
