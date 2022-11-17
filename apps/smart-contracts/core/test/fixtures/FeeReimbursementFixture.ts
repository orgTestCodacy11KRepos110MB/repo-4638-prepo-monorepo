import { ethers } from 'hardhat'
import { MockContract, smock } from '@defi-wonderland/smock'
import { FeeReimbursement } from '../../typechain'

export async function feeReimbursementFixture(): Promise<FeeReimbursement> {
  const feeReimbursement = await ethers.getContractFactory('FeeReimbursement')
  return (await feeReimbursement.deploy()) as FeeReimbursement
}

export async function smockFeeReimbursementFixture(): Promise<MockContract> {
  const smockFeeReimbursement = await smock.mock('FeeReimbursement')
  return (await smockFeeReimbursement.deploy()) as MockContract
}
