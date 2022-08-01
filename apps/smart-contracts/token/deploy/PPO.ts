/* eslint-disable no-console */
import { DeployFunction } from 'hardhat-deploy/types'
import { HardhatRuntimeEnvironment } from 'hardhat/types'
import { ChainId, getPrePOAddressForNetwork } from 'prepo-constants'
import { utils } from 'prepo-hardhat'
import { getNetworkByChainId } from 'prepo-utils'
import { HardhatUpgrades } from '@openzeppelin/hardhat-upgrades'
import dotenv from 'dotenv'

dotenv.config({
  path: '../.env',
})

const { assertIsTestnetChain } = utils

async function ensureProxyOwnedByGovernance(
  upgrades: HardhatUpgrades,
  governanceAddress: string
): Promise<void> {
  const manifestAdmin = await upgrades.admin.getInstance()
  console.log('ProxyAdmin exists at:', manifestAdmin.address)
  const adminOwner = await manifestAdmin.owner()
  console.log('Current ProxyAdmin owned by:', adminOwner)
  if (adminOwner !== governanceAddress) {
    console.log('ProxyAdmin not owned by governance, transferring ownership to', governanceAddress)
    await upgrades.admin.transferProxyAdminOwnership(governanceAddress)
  }
}

const deployFunction: DeployFunction = async function deployPPO({
  deployments,
  getChainId,
  ethers,
  upgrades,
  defender,
}: HardhatRuntimeEnvironment): Promise<void> {
  const { save, getOrNull, getArtifact } = deployments
  const deployer = (await ethers.getSigners())[0]
  console.log('Running PPO deployment script with', deployer.address, 'as the deployer')
  /**
   * getChainId returns a string, and because an enum can exist as both a
   * string and number, this will cause a problem with getNetworkByChainId
   * which performs a `===` exact equivalence check against ChainIds using
   * the `number` type. Thus, you must explicitly convert the ChainId into a
   * number for `getNetworkByChainId` to work.
   */
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
  const ppoTokenFactory = await ethers.getContractFactory('PPO')
  const existingDeployment = await getOrNull('PPO')
  if (!existingDeployment) {
    console.log('Existing deployment not detected, deploying new contract')
    const newDeployment = await upgrades.deployProxy(ppoTokenFactory, [
      'prePO Token',
      'PPO',
      governanceAddress,
    ])
    console.log('Deployed PPO at', newDeployment.address)
    const deploymentReceipt = await newDeployment.deployTransaction.wait()
    await save('PPO', {
      abi: newDeployment.abi,
      address: newDeployment.address,
      receipt: deploymentReceipt,
    })
    await ensureProxyOwnedByGovernance(upgrades, governanceAddress)
  } else {
    console.log('Existing deployment detected, upgrading contract')
    await ensureProxyOwnedByGovernance(upgrades, governanceAddress)
    const upgradeProposal = await defender.proposeUpgrade(
      existingDeployment.address,
      ppoTokenFactory,
      {
        description: 'PPO Upgrade Proposal',
      }
    )
    const upgradeProposalReceipt = await upgradeProposal.txResponse.wait()
    console.log('PPO Upgrade Proposal Receipt:', upgradeProposalReceipt)
    /**
     * Because this is only a proposal and not an actual deployment, a
     * contract instance is not returned for us to fetch a `hardhat-deploy`
     * readable ABI. Instead, we must fetch the artifact locally using
     * `getArtifact` from `hardhat-deploy` which contains a `hardhat-deploy`
     * compatible ABI.
     *
     * Since we don't actually know if the upgrade proposal will pass this,
     * script assumes the upgrade happened and overwrites the existing
     * deployment with the new ABI.
     */
    const ppoArtifact = await getArtifact('PPO')
    await save('PPO', {
      abi: ppoArtifact.abi,
      address: upgradeProposal.contract.address,
      receipt: upgradeProposalReceipt,
    })
  }
  console.log('')
}

export default deployFunction

deployFunction.tags = ['PPO']
