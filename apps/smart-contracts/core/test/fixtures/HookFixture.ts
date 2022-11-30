import { ethers } from 'hardhat'
import { MockContract, smock } from '@defi-wonderland/smock'
import { DepositHook, WithdrawHook, ManagerWithdrawHook, AllowlistHook } from '../../typechain'

export async function depositHookFixture(): Promise<DepositHook> {
  const depositHook = await ethers.getContractFactory('DepositHook')
  return (await depositHook.deploy()) as unknown as DepositHook
}

export async function withdrawHookFixture(): Promise<WithdrawHook> {
  const withdrawHook = await ethers.getContractFactory('WithdrawHook')
  return (await withdrawHook.deploy()) as unknown as WithdrawHook
}

export async function managerWithdrawHookFixture(): Promise<ManagerWithdrawHook> {
  const managerWithdrawHook = await ethers.getContractFactory('ManagerWithdrawHook')
  return (await managerWithdrawHook.deploy()) as ManagerWithdrawHook
}

export async function allowlistHookFixture(): Promise<AllowlistHook> {
  const factory = await ethers.getContractFactory('AllowlistHook')
  return (await factory.deploy()) as AllowlistHook
}

export async function smockDepositHookFixture(): Promise<MockContract> {
  const smockDepositHookFactory = await smock.mock('DepositHook')
  return smockDepositHookFactory.deploy()
}

export async function smockWithdrawHookFixture(): Promise<MockContract> {
  const smockWithdrawHookFactory = await smock.mock('WithdrawHook')
  return smockWithdrawHookFactory.deploy()
}

export async function smockManagerWithdrawHookFixture(): Promise<MockContract> {
  const smockManagerWithdrawHookFactory = await smock.mock('ManagerWithdrawHook')
  return smockManagerWithdrawHookFactory.deploy()
}

export async function smockAccountListFixture(): Promise<MockContract> {
  const smockAccountListFactory = await smock.mock('AccountList')
  return smockAccountListFactory.deploy()
}
