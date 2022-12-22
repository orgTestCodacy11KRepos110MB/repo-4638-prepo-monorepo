import { BigNumber } from 'ethers'
import { ethers } from 'hardhat'
import { FakeContract, MockContract, smock } from '@defi-wonderland/smock'
import { DepositRecord, DepositRecord__factory } from '../../types/generated'

export async function depositRecordFixture(
  globalDepositCap: BigNumber,
  userDepositCap: BigNumber
): Promise<DepositRecord> {
  const depositRecord = await ethers.getContractFactory('DepositRecord')
  return (await depositRecord.deploy(globalDepositCap, userDepositCap)) as DepositRecord
}

export async function smockDepositRecordFixture(
  globalDepositCap: BigNumber,
  userDepositCap: BigNumber
): Promise<MockContract<DepositRecord>> {
  const factory = await smock.mock<DepositRecord__factory>('DepositRecord')
  return factory.deploy(globalDepositCap, userDepositCap)
}

export async function fakeDepositRecordFixture(): Promise<FakeContract<DepositRecord>> {
  const fakeContract = await smock.fake<DepositRecord>('DepositRecord')
  return fakeContract
}
