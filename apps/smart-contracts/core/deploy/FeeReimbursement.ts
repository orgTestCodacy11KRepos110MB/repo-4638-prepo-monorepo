// eslint-disable no-console
import { DeployFunction } from 'hardhat-deploy/types'
import { HardhatRuntimeEnvironment } from 'hardhat/types'
import { ChainId } from 'prepo-constants'
import { utils } from 'prepo-hardhat'

const { assertIsTestnetChain } = utils

const deployFunction: DeployFunction = async function ({
  deployments,
  getNamedAccounts,
  getChainId,
}: HardhatRuntimeEnvironment) {
  const { deploy } = deployments
  const { deployer } = await getNamedAccounts()
  console.log('Running FeeReimbursement deployment script with', deployer, 'as the deployer')
  const currentChain = await getChainId()
  /**
   * Make sure this script is not accidentally targeted towards a production environment.
   * This can be temporarily removed if deploying to prod.
   */
  assertIsTestnetChain(currentChain as unknown as ChainId)
  const { address: feeReimbursementAddress, newlyDeployed } = await deploy('FeeReimbursement', {
    from: deployer,
    contract: 'FeeReimbursement',
    deterministicDeployment: false,
    args: [],
    skipIfAlreadyDeployed: true,
  })
  if (newlyDeployed) {
    console.log('Deployed FeeReimbursement to', feeReimbursementAddress)
  } else {
    console.log('Existing FeeReimbursement at', feeReimbursementAddress)
  }
  console.log('')
}

export default deployFunction

deployFunction.tags = ['FeeReimbursement']
