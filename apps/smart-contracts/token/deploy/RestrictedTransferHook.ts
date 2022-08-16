/* eslint-disable no-console */
import { DeployFunction } from 'hardhat-deploy/types'
import { HardhatRuntimeEnvironment } from 'hardhat/types'
import { ChainId, getPrePOAddressForNetwork } from 'prepo-constants'
import { utils } from 'prepo-hardhat'
import { getNetworkByChainId } from 'prepo-utils'
import dotenv from 'dotenv'
import { RestrictedTransferHook } from '../types/generated'

dotenv.config({
  path: '../.env',
})

const { assertIsTestnetChain, sendTxAndWait } = utils

const deployFunction: DeployFunction = async function deployRestrictedTransferHook({
  ethers,
  deployments,
  getChainId,
}: HardhatRuntimeEnvironment): Promise<void> {
  const { deploy, getOrNull } = deployments
  const deployer = (await ethers.getSigners())[0]
  console.log(
    'Running RestrictedTransferHook deployment script with',
    deployer.address,
    'as the deployer'
  )
  const currentChain = Number(await getChainId()) as ChainId
  const currentNetwork = getNetworkByChainId(currentChain)
  /**
   * Make sure this script is not accidentally targeted towards a production environment.
   * This can be temporarily removed if deploying to prod.
   */
  assertIsTestnetChain(currentChain)
  // Check if there is an existing SourceAllowlist-AccountList deployment
  const existingSourceAllowlist = await getOrNull('SourceAllowlist-AccountList')
  if (!existingSourceAllowlist) {
    throw new Error(
      `No existing SourceAllowlist-AccountList deployment exists for the ${currentNetwork.name} network`
    )
  }
  // Check if there is an existing DestinationAllowlist-AccountList deployment
  const existingDestinationAllowlist = await getOrNull('DestinationAllowlist-AccountList')
  if (!existingDestinationAllowlist) {
    throw new Error(
      `No existing DestinationAllowlist-AccountList deployment exists for the ${currentNetwork.name} network`
    )
  }
  const governanceAddress = getPrePOAddressForNetwork(
    'GOVERNANCE',
    currentNetwork.name,
    process.env.GOVERNANCE
  )
  console.log('Governance for the current network is at:', governanceAddress)
  const {
    address: restrictedTransferHookAddress,
    newlyDeployed: restrictedTransferHookNewlyDeployed,
  } = await deploy('RestrictedTransferHook', {
    from: deployer.address,
    contract: 'RestrictedTransferHook',
    deterministicDeployment: false,
    args: [],
    skipIfAlreadyDeployed: true,
  })
  if (restrictedTransferHookNewlyDeployed) {
    console.log('Deployed RestrictedTransferHook to', restrictedTransferHookAddress)
  } else {
    console.log('Existing RestrictedTransferHook at', restrictedTransferHookAddress)
  }
  const restrictedTransferHook = (await ethers.getContract(
    'RestrictedTransferHook'
  )) as RestrictedTransferHook
  if ((await restrictedTransferHook.getSourceAllowlist()) !== existingSourceAllowlist.address) {
    console.log(
      'Setting RestrictedTransferHook to use SourceAllowlist at',
      existingSourceAllowlist.address
    )
    await sendTxAndWait(
      await restrictedTransferHook
        .connect(deployer)
        .setSourceAllowlist(existingSourceAllowlist.address)
    )
  }
  if (
    (await restrictedTransferHook.getDestinationAllowlist()) !==
    existingDestinationAllowlist.address
  ) {
    console.log(
      'Setting RestrictedTransferHook to use DestinationAllowlist at',
      existingDestinationAllowlist.address
    )
    await sendTxAndWait(
      await restrictedTransferHook
        .connect(deployer)
        .setDestinationAllowlist(existingDestinationAllowlist.address)
    )
  }
  if ((await restrictedTransferHook.owner()) !== governanceAddress) {
    console.log('Transferring ownership to', governanceAddress)
    await sendTxAndWait(
      await restrictedTransferHook.connect(deployer).transferOwnership(governanceAddress)
    )
  }
  console.log('')
}

export default deployFunction

deployFunction.tags = ['RestrictedTransferHook']
