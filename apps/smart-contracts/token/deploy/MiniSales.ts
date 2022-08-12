/* eslint-disable no-console */
import { DeployFunction } from 'hardhat-deploy/types'
import { HardhatRuntimeEnvironment } from 'hardhat/types'
import { ChainId, getPrePOAddressForNetwork } from 'prepo-constants'
import { utils } from 'prepo-hardhat'
import { getNetworkByChainId } from 'prepo-utils'
import dotenv from 'dotenv'
import { parseEther } from 'ethers/lib/utils'

dotenv.config({
  path: '../.env',
})

const { assertIsTestnetChain } = utils

const deployFunction: DeployFunction = async function deployMiniSales({
  ethers,
  deployments,
  getChainId,
}: HardhatRuntimeEnvironment): Promise<void> {
  const { deploy, getOrNull } = deployments
  const deployer = (await ethers.getSigners())[0]
  console.log('Running MiniSales deployment script with', deployer.address, 'as the deployer')
  const currentChain = Number(await getChainId()) as ChainId
  const currentNetwork = getNetworkByChainId(currentChain)
  /**
   * Make sure this script is not accidentally targeted towards a production environment.
   * This can be temporarily removed if deploying to prod.
   */
  assertIsTestnetChain(currentChain)
  const governanceAddress = getPrePOAddressForNetwork(
    'GOVERNANCE',
    currentNetwork.name,
    process.env.GOVERNANCE
  )
  const usdcAddress = getPrePOAddressForNetwork('USDC', currentNetwork.name, process.env.USDC)
  console.log('Governance for the current network is at:', governanceAddress)
  // Check if there is an existing PPO deployment
  const existingPPO = await getOrNull('PPO')
  if (!existingPPO) {
    throw new Error(`No existing PPO deployment exists for the ${currentNetwork.name} network`)
  }
  const { address: miniSalesAddress, newlyDeployed: miniSalesNewlyDeployed } = await deploy(
    'MiniSales',
    {
      from: deployer.address,
      contract: 'MiniSales',
      deterministicDeployment: false,
      args: [existingPPO.address, usdcAddress, 18, governanceAddress],
      skipIfAlreadyDeployed: true,
    }
  )
  if (miniSalesNewlyDeployed) {
    console.log('Deployed MiniSales to', miniSalesAddress)
  } else {
    console.log('Existing MiniSales at', miniSalesAddress)
  }
  console.log('')
}

export default deployFunction

deployFunction.tags = ['MiniSales']
