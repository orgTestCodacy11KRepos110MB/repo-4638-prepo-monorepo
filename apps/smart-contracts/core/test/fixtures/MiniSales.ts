import { ethers } from 'hardhat'
import { MockContract, smock } from '@defi-wonderland/smock'
import { BigNumber } from 'ethers'

export async function smockMiniSalesFixture(
  saleToken: string,
  paymentToken: string,
  saleTokenDecimals: BigNumber
): Promise<MockContract> {
  const smockMiniSalesFactory = await smock.mock('TestMiniSales')
  const smockMiniSales = await smockMiniSalesFactory.deploy(
    saleToken,
    paymentToken,
    saleTokenDecimals
  )
  return smockMiniSales
}
