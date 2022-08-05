/* eslint-disable no-console */
import { DeployFunction } from 'hardhat-deploy/types'
import { HardhatRuntimeEnvironment } from 'hardhat/types'
import { ChainId, getPrePOAddressForNetwork } from 'prepo-constants'
import { utils } from 'prepo-hardhat'
import { getNetworkByChainId } from 'prepo-utils'
import dotenv from 'dotenv'
import { Vesting } from '../types/generated'

dotenv.config({
  path: '../.env',
})

const { assertIsTestnetChain, sendTxAndWait } = utils

const deployFunction: DeployFunction = async function deployVesting({
  ethers,
  deployments,
  getChainId,
}: HardhatRuntimeEnvironment): Promise<void> {
  const { deploy, getOrNull } = deployments
  const deployer = (await ethers.getSigners())[0]
  console.log('Running Vesting deployment script with', deployer.address, 'as the deployer')
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
  console.log('Governance for the current network is at:', governanceAddress)
  // Check if there is an existing PPO deployment
  const existingPPO = await getOrNull('PPO')
  if (!existingPPO) {
    throw new Error(`No existing PPO deployment exists for the ${currentNetwork.name} network`)
  }
  const { address: vestingAddress, newlyDeployed: vestingNewlyDeployed } = await deploy('Vesting', {
    from: deployer.address,
    contract: 'Vesting',
    deterministicDeployment: false,
    args: [governanceAddress],
    skipIfAlreadyDeployed: true,
  })
  if (vestingNewlyDeployed) {
    console.log('Deployed Vesting to', vestingAddress)
  } else {
    console.log('Existing Vesting at', vestingAddress)
  }
  const vesting = (await ethers.getContract('Vesting')) as Vesting
  if ((await vesting.getToken()) !== existingPPO.address) {
    console.log('Setting Vesting contract to use PPO token at', existingPPO.address)
    await sendTxAndWait(await vesting.connect(deployer).setToken(existingPPO.address))
  }
  console.log('')
}

export default deployFunction

deployFunction.tags = ['Vesting']
