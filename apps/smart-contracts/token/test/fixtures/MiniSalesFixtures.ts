import { ethers, upgrades } from 'hardhat'
import { FakeContract, smock } from '@defi-wonderland/smock'
import { MiniSales, AllowlistPurchaseHook } from '../../types/generated'
import { PurchaseHook } from '../../types/generated/contracts/mini-sales/PurchaseHook'

export async function miniSalesFixture(
  saleTokenAddress: string,
  paymentTokenAddress: string,
  nominatedOwnerAddress: string
): Promise<MiniSales> {
  const Factory = await ethers.getContractFactory('MiniSales')
  return (await upgrades.deployProxy(Factory, [nominatedOwnerAddress], {
    unsafeAllow: ['state-variable-immutable', 'constructor'],
    constructorArgs: [saleTokenAddress, paymentTokenAddress],
  })) as MiniSales
}

export async function purchaseHookFixture(): Promise<PurchaseHook> {
  const Factory = await ethers.getContractFactory(
    'contracts/mini-sales/PurchaseHook.sol:PurchaseHook'
  )
  return (await Factory.deploy()) as unknown as PurchaseHook
}

export async function fakePurchaseHookFixture(): Promise<FakeContract> {
  return (await smock.fake('contracts/mini-sales/PurchaseHook.sol:PurchaseHook')) as FakeContract
}

export async function allowlistPurchaseHookFixture(
  nominatedOwnerAddress: string
): Promise<AllowlistPurchaseHook> {
  const Factory = await ethers.getContractFactory('AllowlistPurchaseHook')
  return (await Factory.deploy(nominatedOwnerAddress)) as AllowlistPurchaseHook
}

export async function fakeAccountListFixture(): Promise<FakeContract> {
  return (await smock.fake('AccountList')) as FakeContract
}
