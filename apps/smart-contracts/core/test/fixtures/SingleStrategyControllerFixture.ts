import { ethers } from 'hardhat'
import { SingleStrategyController } from '../../typechain/SingleStrategyController'

export async function singleStrategyControllerFixture(
  token: string
): Promise<SingleStrategyController> {
  const singleStrategyController = await ethers.getContractFactory('SingleStrategyController')
  return (await singleStrategyController.deploy(token)) as unknown as SingleStrategyController
}
