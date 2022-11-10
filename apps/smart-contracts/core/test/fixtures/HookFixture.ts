import { ethers } from 'hardhat'
import { MockContract, smock } from '@defi-wonderland/smock'
import { DepositHook, WithdrawHook, ManagerWithdrawHook } from '../../typechain'

export async function depositHookFixture(depositRecordAddress: string): Promise<DepositHook> {
  const depositHook = await ethers.getContractFactory('DepositHook')
  return (await depositHook.deploy(depositRecordAddress)) as unknown as DepositHook
}

export async function withdrawHookFixture(depositRecordAddress: string): Promise<WithdrawHook> {
  const withdrawHook = await ethers.getContractFactory('WithdrawHook')
  return (await withdrawHook.deploy(depositRecordAddress)) as unknown as WithdrawHook
}

export async function managerWithdrawHookFixture(
  depositRecordAddress: string
): Promise<ManagerWithdrawHook> {
  const managerWithdrawHook = await ethers.getContractFactory('ManagerWithdrawHook')
  return (await managerWithdrawHook.deploy(depositRecordAddress)) as ManagerWithdrawHook
}

export async function smockDepositHookFixture(depositRecordAddress: string): Promise<MockContract> {
  const smockDepositHookFactory = await smock.mock('DepositHook')
  return smockDepositHookFactory.deploy(depositRecordAddress)
}

export async function smockWithdrawHookFixture(
  depositRecordAddress: string
): Promise<MockContract> {
  const smockWithdrawHookFactory = await smock.mock('WithdrawHook')
  return smockWithdrawHookFactory.deploy(depositRecordAddress)
}
