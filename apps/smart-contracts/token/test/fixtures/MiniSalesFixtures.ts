import { ethers } from 'hardhat'
import { FakeContract, smock } from '@defi-wonderland/smock'
import { MiniSales, AllowlistPurchaseHook } from '../../types/generated'

export async function miniSalesFixture(
  saleTokenAddress: string,
  paymentTokenAddress: string,
  saleTokenDecimals: number,
  nominatedOwnerAddress: string
): Promise<MiniSales> {
  const Factory = await ethers.getContractFactory('MiniSales')
  return (await Factory.deploy(
    saleTokenAddress,
    paymentTokenAddress,
    saleTokenDecimals,
    nominatedOwnerAddress
  )) as MiniSales
}

export async function allowlistPurchaseHookFixture(
  nominatedOwnerAddress: string
): Promise<AllowlistPurchaseHook> {
  const Factory = await ethers.getContractFactory('AllowlistPurchaseHook')
  return (await Factory.deploy(nominatedOwnerAddress)) as AllowlistPurchaseHook
}

export async function fakeAllowlistPurchaseHookFixture(): Promise<FakeContract> {
  return (await smock.fake('AllowlistPurchaseHook')) as FakeContract
}

export async function fakeAccountListFixture(): Promise<FakeContract> {
  return (await smock.fake('AccountList')) as FakeContract
}
