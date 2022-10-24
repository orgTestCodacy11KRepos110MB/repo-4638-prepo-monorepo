import { BigNumber } from 'ethers'
import { ethers } from 'hardhat'
import { MockContract, smock } from '@defi-wonderland/smock'
import { CollateralDepositRecord } from '../../typechain'

export async function collateralDepositRecordFixture(
  globalDepositCap: BigNumber,
  userDepositCap: BigNumber
): Promise<CollateralDepositRecord> {
  const collateralDepositRecord = await ethers.getContractFactory('CollateralDepositRecord')
  return (await collateralDepositRecord.deploy(
    globalDepositCap,
    userDepositCap
  )) as CollateralDepositRecord
}

export async function smockCollateralDepositRecordFixture(
  globalDepositCap: BigNumber,
  userDepositCap: BigNumber
): Promise<MockContract> {
  const smockCollateralDepositRecord = await smock.mock('CollateralDepositRecord')
  return (await smockCollateralDepositRecord.deploy(
    globalDepositCap,
    userDepositCap
  )) as MockContract
}
