import { ethers } from 'hardhat'
import { FakeContract, MockContract, smock } from '@defi-wonderland/smock'
import { TestUintValue } from '../../types/generated'

export async function testUintValueFixture(): Promise<TestUintValue> {
  const factory = await ethers.getContractFactory('TestUintValue')
  return (await factory.deploy()) as TestUintValue
}

export async function smockTestUintValueFixture(): Promise<MockContract> {
  const mockFactory = await smock.mock('TestUintValue')
  return (await mockFactory.deploy()) as MockContract
}

export function fakeTestUintValueFixture(): Promise<FakeContract<TestUintValue>> {
  return smock.fake<TestUintValue>('TestUintValue')
}
