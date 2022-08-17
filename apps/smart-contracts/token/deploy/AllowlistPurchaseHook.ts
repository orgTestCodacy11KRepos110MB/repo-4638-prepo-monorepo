/* eslint-disable no-console */
import { DeployFunction } from 'hardhat-deploy/types'
import { HardhatRuntimeEnvironment } from 'hardhat/types'
import { ChainId, getPrePOAddressForNetwork } from 'prepo-constants'
import { utils } from 'prepo-hardhat'
import { getNetworkByChainId } from 'prepo-utils'
import dotenv from 'dotenv'
import { AllowlistPurchaseHook } from '../types/generated'

dotenv.config({
  path: '../.env',
})

const { assertIsTestnetChain, sendTxAndWait } = utils

const deployFunction: DeployFunction = async function deployAllowlistPurchaseHook({
  ethers,
  deployments,
  getChainId,
}: HardhatRuntimeEnvironment): Promise<void> {
  const { deploy, getOrNull } = deployments
  const deployer = (await ethers.getSigners())[0]
  console.log(
    'Running AllowlistPurchaseHook deployment script with',
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
  // Check if there is an existing PurchaseAllowlist-AccountList deployment
  const existingPurchaseAllowlist = await getOrNull('PurchaseAllowlist-AccountList')
  if (!existingPurchaseAllowlist) {
    throw new Error(
      `No existing AllowlistPurchaseHook-AccountList deployment exists for the ${currentNetwork.name} network`
    )
  }
  const governanceAddress = getPrePOAddressForNetwork(
    'GOVERNANCE',
    currentNetwork.name,
    process.env.GOVERNANCE
  )
  console.log('Governance for the current network is at:', governanceAddress)
  const {
    address: allowlistPurchaseHookAddress,
    newlyDeployed: allowlistPurchaseHookNewlyDeployed,
  } = await deploy('AllowlistPurchaseHook', {
    from: deployer.address,
    contract: 'AllowlistPurchaseHook',
    deterministicDeployment: false,
    args: [],
    skipIfAlreadyDeployed: true,
  })
  if (allowlistPurchaseHookNewlyDeployed) {
    console.log('Deployed AllowlistPurchaseHook to', allowlistPurchaseHookAddress)
  } else {
    console.log('Existing AllowlistPurchaseHook at', allowlistPurchaseHookAddress)
  }
  const allowlistPurchaseHook = (await ethers.getContract(
    'AllowlistPurchaseHook'
  )) as AllowlistPurchaseHook
  if ((await allowlistPurchaseHook.getAllowlist()) !== existingPurchaseAllowlist.address) {
    console.log(
      'Setting AllowlistPurchaseHook to use AccountList at',
      existingPurchaseAllowlist.address
    )
    await sendTxAndWait(
      await allowlistPurchaseHook.connect(deployer).setAllowlist(existingPurchaseAllowlist.address)
    )
  }
  if ((await allowlistPurchaseHook.owner()) !== governanceAddress) {
    console.log('Transferring ownership to', governanceAddress)
    await sendTxAndWait(
      await allowlistPurchaseHook.connect(deployer).transferOwnership(governanceAddress)
    )
  }
  console.log('')
}

export default deployFunction

deployFunction.tags = ['AllowlistPurchaseHook']
