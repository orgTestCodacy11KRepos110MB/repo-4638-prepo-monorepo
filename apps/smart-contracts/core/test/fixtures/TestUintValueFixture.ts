import { ethers } from 'hardhat'
import { FakeContract, MockContract, smock } from '@defi-wonderland/smock'
import { TestUintValue } from '../../types/generated'

export async function testUintValueFixture(): Promise<TestUintValue> {
  const factory = await ethers.getContractFactory('TestUintValue')
  return (await factory.deploy()) as TestUintValue
}

export async function smockTestUintValueFixture(): Promise<MockContract> {
  const smockFactory = await smock.mock('TestUintValue')
  return (await smockFactory.deploy()) as MockContract
}

export async function fakeTestUintValueFixture(): Promise<FakeContract<TestUintValue>> {
  const fakeContract = await smock.fake<TestUintValue>('TestUintValue')
  return fakeContract
}
