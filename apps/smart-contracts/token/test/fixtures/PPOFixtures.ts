import { ethers, upgrades } from 'hardhat'
import { MockContract, smock } from '@defi-wonderland/smock'
import {
  PPO,
  AccountList,
  RestrictedTransferHook,
  BlocklistTransferHook,
} from '../../types/generated'

export async function ppoFixture(
  name: string,
  symbol: string,
  nominatedOwnerAddress: string
): Promise<PPO> {
  const Factory = await ethers.getContractFactory('PPO')
  return (await upgrades.deployProxy(Factory, [name, symbol, nominatedOwnerAddress])) as PPO
}

export async function accountListFixture(nominatedOwnerAddress: string): Promise<AccountList> {
  const Factory = await ethers.getContractFactory('AccountList')
  return (await Factory.deploy(nominatedOwnerAddress)) as AccountList
}

export async function restrictedTransferHookFixture(
  nominatedOwnerAddress: string
): Promise<RestrictedTransferHook> {
  const Factory = await ethers.getContractFactory('RestrictedTransferHook')
  return (await Factory.deploy(nominatedOwnerAddress)) as RestrictedTransferHook
}

export async function blocklistTransferHookFixture(
  nominatedOwnerAddress: string
): Promise<BlocklistTransferHook> {
  const Factory = await ethers.getContractFactory('BlocklistTransferHook')
  return (await Factory.deploy(nominatedOwnerAddress)) as BlocklistTransferHook
}

export async function smockAccountListFixture(
  nominatedOwnerAddress: string
): Promise<MockContract> {
  const smockAccountListFactory = await smock.mock('AccountList')
  return (await smockAccountListFactory.deploy(nominatedOwnerAddress)) as MockContract
}
