import chai, { expect } from 'chai'
import { ethers } from 'hardhat'
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/dist/src/signer-with-address'
import { id, parseEther } from 'ethers/lib/utils'
import { Contract } from 'ethers'
import { MockContract, smock } from '@defi-wonderland/smock'
import { ZERO_ADDRESS } from 'prepo-constants'
import { depositHookFixture } from './fixtures/HookFixture'
import { smockDepositRecordFixture } from './fixtures/DepositRecordFixture'
import { testERC721Fixture } from './fixtures/TestERC721Fixture'
import { grantAndAcceptRole } from './utils'
import { DepositHook, TestERC721 } from '../typechain'

chai.use(smock.matchers)

describe('=> DepositHook', () => {
  let depositHook: DepositHook
  let deployer: SignerWithAddress
  let user: SignerWithAddress
  let vault: SignerWithAddress
  let mockDepositRecord: MockContract<Contract>
  let mockAllowlist: MockContract<Contract>
  let firstERC721: TestERC721
  let secondERC721: TestERC721
  const TEST_GLOBAL_DEPOSIT_CAP = parseEther('50000')
  const TEST_ACCOUNT_DEPOSIT_CAP = parseEther('50')
  const TEST_AMOUNT_BEFORE_FEE = parseEther('1.01')
  const TEST_AMOUNT_AFTER_FEE = parseEther('1')

  beforeEach(async () => {
    ;[deployer, user, vault] = await ethers.getSigners()
    mockDepositRecord = await smockDepositRecordFixture(
      TEST_GLOBAL_DEPOSIT_CAP,
      TEST_ACCOUNT_DEPOSIT_CAP
    )
    depositHook = await depositHookFixture()
    firstERC721 = await testERC721Fixture('NFT Collection 1', 'NFT1')
    secondERC721 = await testERC721Fixture('NFT Collection 2', 'NFT2')
    await grantAndAcceptRole(
      depositHook,
      deployer,
      deployer,
      await depositHook.SET_ALLOWLIST_ROLE()
    )
    await grantAndAcceptRole(
      depositHook,
      deployer,
      deployer,
      await depositHook.SET_COLLATERAL_ROLE()
    )
    await grantAndAcceptRole(
      depositHook,
      deployer,
      deployer,
      await depositHook.SET_DEPOSIT_RECORD_ROLE()
    )
    await grantAndAcceptRole(
      depositHook,
      deployer,
      deployer,
      await depositHook.SET_DEPOSITS_ALLOWED_ROLE()
    )
    await grantAndAcceptRole(
      depositHook,
      deployer,
      deployer,
      await depositHook.SET_REQUIRED_SCORE_ROLE()
    )
    await grantAndAcceptRole(
      depositHook,
      deployer,
      deployer,
      await depositHook.SET_COLLECTION_SCORES_ROLE()
    )
    await grantAndAcceptRole(
      depositHook,
      deployer,
      deployer,
      await depositHook.REMOVE_COLLECTIONS_ROLE()
    )
    await grantAndAcceptRole(
      mockDepositRecord,
      deployer,
      deployer,
      await mockDepositRecord.SET_ALLOWED_HOOK_ROLE()
    )
    await mockDepositRecord.connect(deployer).setAllowedHook(depositHook.address, true)
  })

  describe('initial state', () => {
    it('sets collateral to zero address', async () => {
      expect(await depositHook.getCollateral()).to.eq(ZERO_ADDRESS)
    })

    it('sets role constants to the correct hash', async () => {
      expect(await depositHook.SET_ALLOWLIST_ROLE()).to.eq(
        id('DepositHook_setAllowlist(IAccountList)')
      )
      expect(await depositHook.SET_COLLATERAL_ROLE()).to.eq(
        id('DepositHook_setCollateral(address)')
      )
      expect(await depositHook.SET_DEPOSIT_RECORD_ROLE()).to.eq(
        id('DepositHook_setDepositRecord(address)')
      )
      expect(await depositHook.SET_DEPOSITS_ALLOWED_ROLE()).to.eq(
        id('DepositHook_setDepositsAllowed(bool)')
      )
      expect(await depositHook.SET_REQUIRED_SCORE_ROLE()).to.eq(
        id('DepositHook_setRequiredScore(uint256)')
      )
      expect(await depositHook.SET_COLLECTION_SCORES_ROLE()).to.eq(
        id('DepositHook_setCollectionScores(IERC721[],uint256[])')
      )
      expect(await depositHook.REMOVE_COLLECTIONS_ROLE()).to.eq(
        id('DepositHook_removeCollections(IERC721[])')
      )
    })
  })

  describe('# hook', () => {
    /**
     * Tests below use different values for TEST_AMOUNT_BEFORE_FEE and
     * TEST_AMOUNT_AFTER_FEE to ensure TEST_AMOUNT_BEFORE_FEE is ignored.
     */
    beforeEach(async () => {
      await depositHook.connect(deployer).setCollateral(vault.address)
      await depositHook.connect(deployer).setDepositsAllowed(true)
      await depositHook.connect(deployer).setDepositRecord(mockDepositRecord.address)
    })

    it('should only usable by the vault', async () => {
      expect(await depositHook.getCollateral()).to.not.eq(user.address)

      await expect(
        depositHook.connect(user).hook(user.address, TEST_AMOUNT_BEFORE_FEE, TEST_AMOUNT_AFTER_FEE)
      ).to.revertedWith('msg.sender != collateral')
    })

    it('reverts if deposits not allowed', async () => {
      await depositHook.connect(deployer).setDepositsAllowed(false)
      expect(await depositHook.depositsAllowed()).to.eq(false)

      await expect(
        depositHook.connect(vault).hook(user.address, TEST_AMOUNT_BEFORE_FEE, TEST_AMOUNT_AFTER_FEE)
      ).to.revertedWith('deposits not allowed')
    })

    it('should call recordDeposit with the correct parameters', async () => {
      expect(TEST_AMOUNT_BEFORE_FEE).to.not.eq(TEST_AMOUNT_AFTER_FEE)
      await depositHook
        .connect(vault)
        .hook(user.address, TEST_AMOUNT_BEFORE_FEE, TEST_AMOUNT_AFTER_FEE)

      expect(mockDepositRecord.recordDeposit).to.be.calledWith(user.address, TEST_AMOUNT_AFTER_FEE)
    })
  })

  describe('# setAllowlist', () => {
    beforeEach(async () => {
      await grantAndAcceptRole(
        depositHook,
        deployer,
        deployer,
        await depositHook.SET_ALLOWLIST_ROLE()
      )
    })

    it('reverts if not role holder', async () => {
      expect(await depositHook.hasRole(await depositHook.SET_ALLOWLIST_ROLE(), user.address)).to.eq(
        false
      )

      await expect(depositHook.connect(user).setAllowlist(user.address)).revertedWith(
        `AccessControl: account ${user.address.toLowerCase()} is missing role ${await depositHook.SET_ALLOWLIST_ROLE()}`
      )
    })

    it("doesn't revert if role holder", async () => {
      expect(
        await depositHook.hasRole(await depositHook.SET_ALLOWLIST_ROLE(), deployer.address)
      ).to.eq(true)

      await expect(depositHook.connect(deployer).setAllowlist(user.address))
    })
  })

  describe('# setCollateral', () => {
    it('reverts if not role holder', async () => {
      expect(
        await depositHook.hasRole(await depositHook.SET_COLLATERAL_ROLE(), user.address)
      ).to.eq(false)

      await expect(depositHook.connect(user).setCollateral(vault.address)).revertedWith(
        `AccessControl: account ${user.address.toLowerCase()} is missing role ${await depositHook.SET_COLLATERAL_ROLE()}`
      )
    })

    it('should be settable to an address', async () => {
      expect(await depositHook.getCollateral()).to.eq(ZERO_ADDRESS)

      await depositHook.connect(deployer).setCollateral(vault.address)

      expect(await depositHook.getCollateral()).to.eq(vault.address)
    })

    it('should be settable to the zero address', async () => {
      await depositHook.connect(deployer).setCollateral(vault.address)
      expect(await depositHook.getCollateral()).to.eq(vault.address)

      await depositHook.connect(deployer).setCollateral(ZERO_ADDRESS)

      expect(await depositHook.getCollateral()).to.eq(ZERO_ADDRESS)
    })

    it('should be settable to the same value twice', async () => {
      expect(await depositHook.getCollateral()).to.eq(ZERO_ADDRESS)

      await depositHook.connect(deployer).setCollateral(vault.address)

      expect(await depositHook.getCollateral()).to.eq(vault.address)

      await depositHook.connect(deployer).setCollateral(vault.address)

      expect(await depositHook.getCollateral()).to.eq(vault.address)
    })

    it('emits CollateralChange', async () => {
      const tx = await depositHook.connect(deployer).setCollateral(vault.address)

      await expect(tx).to.emit(depositHook, 'CollateralChange').withArgs(vault.address)
    })
  })

  describe('# setDepositRecord', () => {
    it('reverts if not role holder', async () => {
      expect(
        await depositHook.hasRole(await depositHook.SET_DEPOSIT_RECORD_ROLE(), user.address)
      ).to.eq(false)

      await expect(
        depositHook.connect(user).setDepositRecord(mockDepositRecord.address)
      ).revertedWith(
        `AccessControl: account ${user.address.toLowerCase()} is missing role ${await depositHook.SET_DEPOSIT_RECORD_ROLE()}`
      )
    })

    it('sets to non-zero address', async () => {
      await depositHook.connect(deployer).setDepositRecord(ZERO_ADDRESS)
      expect(mockDepositRecord.address).to.not.eq(ZERO_ADDRESS)
      expect(await depositHook.getDepositRecord()).to.not.eq(mockDepositRecord.address)

      await depositHook.connect(deployer).setDepositRecord(mockDepositRecord.address)

      expect(await depositHook.getDepositRecord()).to.eq(mockDepositRecord.address)
    })

    it('sets to zero address', async () => {
      await depositHook.connect(deployer).setDepositRecord(ZERO_ADDRESS)

      expect(await depositHook.getDepositRecord()).to.eq(ZERO_ADDRESS)
    })

    it('is idempotent', async () => {
      await depositHook.connect(deployer).setDepositRecord(ZERO_ADDRESS)
      expect(await depositHook.getDepositRecord()).to.not.eq(mockDepositRecord.address)

      await depositHook.connect(deployer).setDepositRecord(mockDepositRecord.address)

      expect(await depositHook.getDepositRecord()).to.eq(mockDepositRecord.address)

      await depositHook.connect(deployer).setDepositRecord(mockDepositRecord.address)

      expect(await depositHook.getDepositRecord()).to.eq(mockDepositRecord.address)
    })

    it('emits DepositRecordChange', async () => {
      const tx = await depositHook.connect(deployer).setDepositRecord(mockDepositRecord.address)

      await expect(tx)
        .to.emit(depositHook, 'DepositRecordChange')
        .withArgs(mockDepositRecord.address)
    })
  })

  describe('# setDepositsAllowed', () => {
    it('reverts if not role holder', async () => {
      expect(
        await depositHook.hasRole(await depositHook.SET_DEPOSITS_ALLOWED_ROLE(), user.address)
      ).to.eq(false)

      await expect(depositHook.connect(user).setDepositsAllowed(true)).revertedWith(
        `AccessControl: account ${user.address.toLowerCase()} is missing role ${await depositHook.SET_DEPOSITS_ALLOWED_ROLE()}`
      )
    })

    it('sets to false', async () => {
      await depositHook.connect(deployer).setDepositsAllowed(true)
      expect(await depositHook.depositsAllowed()).to.not.eq(false)

      await depositHook.connect(deployer).setDepositsAllowed(false)

      expect(await depositHook.depositsAllowed()).to.eq(false)
    })

    it('sets to true', async () => {
      expect(await depositHook.depositsAllowed()).to.not.eq(true)

      await depositHook.connect(deployer).setDepositsAllowed(true)

      expect(await depositHook.depositsAllowed()).to.eq(true)
    })

    it('is idempotent', async () => {
      expect(await depositHook.depositsAllowed()).to.not.eq(true)

      await depositHook.connect(deployer).setDepositsAllowed(true)

      expect(await depositHook.depositsAllowed()).to.eq(true)

      await depositHook.connect(deployer).setDepositsAllowed(true)

      expect(await depositHook.depositsAllowed()).to.eq(true)
    })

    it('emits DepositsAllowedChange', async () => {
      const tx = await depositHook.connect(deployer).setDepositsAllowed(true)

      await expect(tx).to.emit(depositHook, 'DepositsAllowedChange').withArgs(true)
    })
  })

  describe('# setRequiredScore', () => {
    it('reverts if not role holder', async () => {
      expect(
        await depositHook.hasRole(await depositHook.SET_REQUIRED_SCORE_ROLE(), user.address)
      ).to.eq(false)

      await expect(depositHook.connect(user).setRequiredScore(0)).revertedWith(
        `AccessControl: account ${user.address.toLowerCase()} is missing role ${await depositHook.SET_REQUIRED_SCORE_ROLE()}`
      )
    })

    it('sets to > 0', async () => {
      expect(await depositHook.getRequiredScore()).to.not.be.gt(0)

      await depositHook.connect(deployer).setRequiredScore(1)

      expect(await depositHook.getRequiredScore()).to.be.gt(0)
    })

    it('sets to 0', async () => {
      await depositHook.connect(deployer).setRequiredScore(1)
      expect(await depositHook.getRequiredScore()).to.not.eq(0)

      await depositHook.connect(deployer).setRequiredScore(0)

      expect(await depositHook.getRequiredScore()).to.eq(0)
    })

    it('is idempotent', async () => {
      await depositHook.connect(deployer).setRequiredScore(1)
      expect(await depositHook.getRequiredScore()).to.eq(1)

      await depositHook.connect(deployer).setRequiredScore(1)

      expect(await depositHook.getRequiredScore()).to.eq(1)
    })

    it('emits RequiredScoreChange', async () => {
      const tx = await depositHook.connect(deployer).setRequiredScore(1)

      await expect(tx).to.emit(depositHook, 'RequiredScoreChange').withArgs(1)
    })
  })

  describe('# setCollectionScores', () => {
    it('reverts if not role holder', async () => {
      expect(
        await depositHook.hasRole(await depositHook.SET_COLLECTION_SCORES_ROLE(), user.address)
      ).to.eq(false)

      await expect(depositHook.connect(user).setCollectionScores([], [])).revertedWith(
        `AccessControl: account ${user.address.toLowerCase()} is missing role ${await depositHook.SET_COLLECTION_SCORES_ROLE()}`
      )
    })

    it('reverts if array length mismatch', async () => {
      await expect(
        depositHook.connect(deployer).setCollectionScores([firstERC721.address], [1, 2])
      ).revertedWith('collections.length != scores.length')
    })

    it('reverts if single collection with score = 0', async () => {
      await expect(
        depositHook.connect(deployer).setCollectionScores([firstERC721.address], [0])
      ).revertedWith('score == 0')
    })

    it('reverts if multiple collections and one has score = 0', async () => {
      await expect(
        depositHook
          .connect(deployer)
          .setCollectionScores([firstERC721.address, secondERC721.address], [1, 0])
      ).revertedWith('score == 0')
    })

    it('sets score for a collection', async () => {
      expect(await depositHook.getCollectionScore(firstERC721.address)).to.eq(0)

      await depositHook.connect(deployer).setCollectionScores([firstERC721.address], [1])

      expect(await depositHook.getCollectionScore(firstERC721.address)).to.eq(1)
    })

    it('sets score if multiple collections', async () => {
      expect(await depositHook.getCollectionScore(firstERC721.address)).to.eq(0)
      expect(await depositHook.getCollectionScore(secondERC721.address)).to.eq(0)

      await depositHook
        .connect(deployer)
        .setCollectionScores([firstERC721.address, secondERC721.address], [1, 2])

      expect(await depositHook.getCollectionScore(firstERC721.address)).to.eq(1)
      expect(await depositHook.getCollectionScore(secondERC721.address)).to.eq(2)
    })

    it('sets score if duplicate collections', async () => {
      expect(await depositHook.getCollectionScore(firstERC721.address)).to.eq(0)

      await depositHook
        .connect(deployer)
        .setCollectionScores([firstERC721.address, firstERC721.address], [1, 2])

      expect(await depositHook.getCollectionScore(firstERC721.address)).to.eq(2)
    })

    it('is idempotent', async () => {
      expect(await depositHook.getCollectionScore(firstERC721.address)).to.eq(0)

      await depositHook.connect(deployer).setCollectionScores([firstERC721.address], [1])
      expect(await depositHook.getCollectionScore(firstERC721.address)).to.eq(1)

      await depositHook.connect(deployer).setCollectionScores([firstERC721.address], [1])
      expect(await depositHook.getCollectionScore(firstERC721.address)).to.eq(1)
    })

    it('is idempotent for multiple collections', async () => {
      expect(await depositHook.getCollectionScore(firstERC721.address)).to.eq(0)
      expect(await depositHook.getCollectionScore(secondERC721.address)).to.eq(0)

      await depositHook
        .connect(deployer)
        .setCollectionScores([firstERC721.address, secondERC721.address], [1, 2])
      expect(await depositHook.getCollectionScore(firstERC721.address)).to.eq(1)
      expect(await depositHook.getCollectionScore(secondERC721.address)).to.eq(2)

      await depositHook
        .connect(deployer)
        .setCollectionScores([firstERC721.address, secondERC721.address], [1, 2])
      expect(await depositHook.getCollectionScore(firstERC721.address)).to.eq(1)
      expect(await depositHook.getCollectionScore(secondERC721.address)).to.eq(2)
    })

    it('is idempotent for a collection when another changes', async () => {
      expect(await depositHook.getCollectionScore(firstERC721.address)).to.eq(0)
      expect(await depositHook.getCollectionScore(secondERC721.address)).to.eq(0)

      await depositHook
        .connect(deployer)
        .setCollectionScores([firstERC721.address, secondERC721.address], [1, 2])
      expect(await depositHook.getCollectionScore(firstERC721.address)).to.eq(1)
      expect(await depositHook.getCollectionScore(secondERC721.address)).to.eq(2)

      await depositHook
        .connect(deployer)
        .setCollectionScores([firstERC721.address, secondERC721.address], [1, 3])
      expect(await depositHook.getCollectionScore(firstERC721.address)).to.eq(1)
      expect(await depositHook.getCollectionScore(secondERC721.address)).to.eq(3)
    })

    it('emits CollectionScoresChange if single collection', async () => {
      const tx = await depositHook.connect(deployer).setCollectionScores([firstERC721.address], [1])

      await expect(tx)
        .to.emit(depositHook, 'CollectionScoresChange')
        .withArgs([firstERC721.address], [1])
    })

    it('emits CollectionScoresChange if multiple collections', async () => {
      const tx = await depositHook
        .connect(deployer)
        .setCollectionScores([firstERC721.address, secondERC721.address], [1, 2])

      await expect(tx)
        .to.emit(depositHook, 'CollectionScoresChange')
        .withArgs([firstERC721.address, secondERC721.address], [1, 2])
    })
  })

  describe('# removeCollections', () => {
    it('reverts if not role holder', async () => {
      expect(
        await depositHook.hasRole(await depositHook.REMOVE_COLLECTIONS_ROLE(), user.address)
      ).to.eq(false)

      await expect(depositHook.connect(user).removeCollections([])).revertedWith(
        `AccessControl: account ${user.address.toLowerCase()} is missing role ${await depositHook.REMOVE_COLLECTIONS_ROLE()}`
      )
    })

    it('removes a collection', async () => {
      await depositHook.connect(deployer).setCollectionScores([firstERC721.address], [1])
      expect(await depositHook.getCollectionScore(firstERC721.address)).to.eq(1)

      await depositHook.connect(deployer).removeCollections([firstERC721.address])

      expect(await depositHook.getCollectionScore(firstERC721.address)).to.eq(0)
    })

    it('removes multiple collections', async () => {
      await depositHook
        .connect(deployer)
        .setCollectionScores([firstERC721.address, secondERC721.address], [1, 1])
      expect(await depositHook.getCollectionScore(firstERC721.address)).to.eq(1)
      expect(await depositHook.getCollectionScore(secondERC721.address)).to.eq(1)

      await depositHook
        .connect(deployer)
        .removeCollections([firstERC721.address, secondERC721.address])

      expect(await depositHook.getCollectionScore(firstERC721.address)).to.eq(0)
      expect(await depositHook.getCollectionScore(secondERC721.address)).to.eq(0)
    })

    it('removes specified collection only', async () => {
      await depositHook
        .connect(deployer)
        .setCollectionScores([firstERC721.address, secondERC721.address], [1, 2])
      expect(await depositHook.getCollectionScore(firstERC721.address)).to.eq(1)
      expect(await depositHook.getCollectionScore(secondERC721.address)).to.eq(2)

      await depositHook.connect(deployer).removeCollections([firstERC721.address])

      expect(await depositHook.getCollectionScore(firstERC721.address)).to.eq(0)
      expect(await depositHook.getCollectionScore(secondERC721.address)).to.eq(2)
    })

    it('is idempotent if single collection', async () => {
      await depositHook.connect(deployer).setCollectionScores([firstERC721.address], [1])
      expect(await depositHook.getCollectionScore(firstERC721.address)).to.eq(1)
      await depositHook.connect(deployer).removeCollections([firstERC721.address])
      expect(await depositHook.getCollectionScore(firstERC721.address)).to.eq(0)

      await depositHook.connect(deployer).removeCollections([firstERC721.address])

      expect(await depositHook.getCollectionScore(firstERC721.address)).to.eq(0)
    })

    it('is idempotent if multiple collections', async () => {
      await depositHook
        .connect(deployer)
        .setCollectionScores([firstERC721.address, secondERC721.address], [1, 2])
      expect(await depositHook.getCollectionScore(firstERC721.address)).to.eq(1)
      expect(await depositHook.getCollectionScore(secondERC721.address)).to.eq(2)
      await depositHook
        .connect(deployer)
        .removeCollections([firstERC721.address, secondERC721.address])
      expect(await depositHook.getCollectionScore(firstERC721.address)).to.eq(0)
      expect(await depositHook.getCollectionScore(secondERC721.address)).to.eq(0)

      await depositHook
        .connect(deployer)
        .removeCollections([firstERC721.address, secondERC721.address])

      expect(await depositHook.getCollectionScore(firstERC721.address)).to.eq(0)
      expect(await depositHook.getCollectionScore(secondERC721.address)).to.eq(0)
    })

    it('emits CollectionScoresChange if single collection', async () => {
      await depositHook.connect(deployer).setCollectionScores([firstERC721.address], [1])
      expect(await depositHook.getCollectionScore(firstERC721.address)).to.eq(1)

      const tx = await depositHook.connect(deployer).removeCollections([firstERC721.address])

      await expect(tx)
        .to.emit(depositHook, 'CollectionScoresChange')
        .withArgs([firstERC721.address], [0])
    })

    it('emits CollectionScoresChange if multiple collections', async () => {
      await depositHook
        .connect(deployer)
        .setCollectionScores([firstERC721.address, secondERC721.address], [1, 1])
      expect(await depositHook.getCollectionScore(firstERC721.address)).to.eq(1)
      expect(await depositHook.getCollectionScore(secondERC721.address)).to.eq(1)

      const tx = await depositHook
        .connect(deployer)
        .removeCollections([firstERC721.address, secondERC721.address])

      await expect(tx)
        .to.emit(depositHook, 'CollectionScoresChange')
        .withArgs([firstERC721.address, secondERC721.address], [0, 0])
    })
  })

  describe('# getAccountScore', () => {
    async function prepareNFTs(
      collection: TestERC721,
      numHeld: number,
      collectionScore: number
    ): Promise<void> {
      if (numHeld > 0) {
        const mintTxs = []
        for (let i = 0; i < numHeld; i++) {
          mintTxs.push(collection.mint(user.address))
        }
        await Promise.all(mintTxs)
      }
      expect(await collection.balanceOf(user.address)).to.eq(numHeld)

      if (collectionScore > 0) {
        await depositHook
          .connect(deployer)
          .setCollectionScores([collection.address], [collectionScore])
      }
    }

    it('returns 0 if holding 0 NFTs from collection with score = 0', async () => {
      expect(await depositHook.getAccountScore(user.address)).to.eq(0)
    })

    it('returns 0 if holding 1 NFT from collection with score = 0', async () => {
      await prepareNFTs(firstERC721, 1, 0)

      expect(await depositHook.getAccountScore(user.address)).to.eq(0)
    })

    it('returns 0 if holding multiple NFTs from collection with score = 0', async () => {
      await prepareNFTs(firstERC721, 10, 0)

      expect(await depositHook.getAccountScore(user.address)).to.eq(0)
    })

    it('returns 1 if holding 1 NFT from collection with score = 1', async () => {
      await prepareNFTs(firstERC721, 1, 1)

      expect(await depositHook.getAccountScore(user.address)).to.eq(1)
    })

    it('returns 1 if holding multiple NFTs from collection with score = 1', async () => {
      await prepareNFTs(firstERC721, 10, 1)

      expect(await depositHook.getAccountScore(user.address)).to.eq(1)
    })

    it('returns 0 if holding 0 NFTs from collection with score > 0', async () => {
      await prepareNFTs(firstERC721, 0, 10)

      expect(await depositHook.getAccountScore(user.address)).to.eq(0)
    })

    it('returns correct value if holding 1 NFT from 2 collections each with score > 0', async () => {
      await prepareNFTs(firstERC721, 1, 1)
      await prepareNFTs(secondERC721, 1, 2)

      expect(await depositHook.getAccountScore(user.address)).to.eq(3)
    })

    it('returns correct value if holding multiple NFTs from 2 collections each with score > 0', async () => {
      await prepareNFTs(firstERC721, 10, 1)
      await prepareNFTs(secondERC721, 10, 2)

      expect(await depositHook.getAccountScore(user.address)).to.eq(3)
    })

    it('returns 1 if holding 1 NFT from collection with score = 0, 1 NFT from collection with score = 1', async () => {
      await prepareNFTs(firstERC721, 1, 0)
      await prepareNFTs(secondERC721, 1, 1)

      expect(await depositHook.getAccountScore(user.address)).to.eq(1)
    })
  })
})
