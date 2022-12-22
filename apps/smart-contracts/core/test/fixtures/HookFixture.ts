import { ethers } from 'hardhat'
import { MockContract, FakeContract, smock } from '@defi-wonderland/smock'
import {
  DepositHook,
  WithdrawHook,
  ManagerWithdrawHook,
  MintHook,
  RedeemHook,
  AccountList,
  DepositHook__factory,
  WithdrawHook__factory,
  ManagerWithdrawHook__factory,
  MintHook__factory,
  RedeemHook__factory,
  AccountList__factory,
} from '../../types/generated'

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

export async function mintHookFixture(): Promise<MintHook> {
  const factory = await ethers.getContractFactory('MintHook')
  return (await factory.deploy()) as MintHook
}

export async function redeemHookFixture(): Promise<RedeemHook> {
  const factory = await ethers.getContractFactory('RedeemHook')
  return (await factory.deploy()) as RedeemHook
}

export async function smockDepositHookFixture(): Promise<MockContract<DepositHook>> {
  const smockDepositHookFactory = await smock.mock<DepositHook__factory>('DepositHook')
  return smockDepositHookFactory.deploy()
}

export async function smockWithdrawHookFixture(): Promise<MockContract<WithdrawHook>> {
  const smockWithdrawHookFactory = await smock.mock<WithdrawHook__factory>('WithdrawHook')
  return smockWithdrawHookFactory.deploy()
}

export async function smockManagerWithdrawHookFixture(): Promise<
  MockContract<ManagerWithdrawHook>
> {
  const smockManagerWithdrawHookFactory = await smock.mock<ManagerWithdrawHook__factory>(
    'ManagerWithdrawHook'
  )
  return smockManagerWithdrawHookFactory.deploy()
}

export async function smockMintHookFixture(): Promise<MockContract<MintHook>> {
  const smockFactory = await smock.mock<MintHook__factory>('MintHook')
  return smockFactory.deploy()
}

export async function smockRedeemHookFixture(): Promise<MockContract<RedeemHook>> {
  const smockFactory = await smock.mock<RedeemHook__factory>('RedeemHook')
  return smockFactory.deploy()
}

export async function smockAccountListFixture(): Promise<MockContract<AccountList>> {
  const smockAccountListFactory = await smock.mock<AccountList__factory>('AccountList')
  return smockAccountListFactory.deploy()
}

export async function fakeAccountListFixture(): Promise<FakeContract<AccountList>> {
  const fakeContract = await smock.fake<AccountList>('AccountList')
  return fakeContract
}

export async function fakeDepositHookFixture(): Promise<FakeContract<DepositHook>> {
  const fakeContract = await smock.fake<DepositHook>('DepositHook')
  return fakeContract
}

export async function fakeManagerWithdrawHookFixture(): Promise<FakeContract<ManagerWithdrawHook>> {
  const fakeContract = await smock.fake<ManagerWithdrawHook>('ManagerWithdrawHook')
  return fakeContract
}

export async function fakeMintHookFixture(): Promise<FakeContract> {
  const fakeContract = await smock.fake('MintHook')
  return fakeContract
}

export async function fakeRedeemHookFixture(): Promise<FakeContract> {
  const fakeContract = await smock.fake('RedeemHook')
  return fakeContract
}

export async function fakeWithdrawHookFixture(): Promise<FakeContract<WithdrawHook>> {
  const fakeContract = await smock.fake<WithdrawHook>('WithdrawHook')
  return fakeContract
}
