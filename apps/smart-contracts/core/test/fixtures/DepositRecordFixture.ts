import { BigNumber } from 'ethers'
import { ethers } from 'hardhat'
import { FakeContract, MockContract, smock } from '@defi-wonderland/smock'
import { DepositRecord, DepositRecord__factory } from '../../types/generated'

export async function depositRecordFixture(): Promise<DepositRecord> {
  const depositRecord = await ethers.getContractFactory('DepositRecord')
  return (await depositRecord.deploy()) as DepositRecord
}

export async function smockDepositRecordFixture(): Promise<MockContract<DepositRecord>> {
  const factory = await smock.mock<DepositRecord__factory>('DepositRecord')
  return factory.deploy()
}

export async function fakeDepositRecordFixture(): Promise<FakeContract<DepositRecord>> {
  const fakeContract = await smock.fake<DepositRecord>('DepositRecord')
  return fakeContract
}
