/* eslint-disable no-console */
import { DeployFunction } from 'hardhat-deploy/types'
import { HardhatRuntimeEnvironment } from 'hardhat/types'
import { ChainId, getPrePOAddressForNetwork } from 'prepo-constants'
import { utils } from 'prepo-hardhat'
import { getNetworkByChainId } from 'prepo-utils'
import dotenv from 'dotenv'
import { FixedPriceOracle } from '../types/generated'

dotenv.config({
  path: '../.env',
})

const { assertIsTestnetChain, sendTxAndWait } = utils

const deployFunction: DeployFunction = async function deployFixedPriceOracle({
  ethers,
  deployments,
  getChainId,
}: HardhatRuntimeEnvironment): Promise<void> {
  const { deploy } = deployments
  const deployer = (await ethers.getSigners())[0]
  console.log(
    'Running FixedPriceOracle deployment script with',
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

  const { address: fixedPriceOracleAddress, newlyDeployed: fixedPriceOracleNewlyDeployed } =
    await deploy('FixedPriceOracle', {
      from: deployer.address,
      contract: 'FixedPriceOracle',
      deterministicDeployment: false,
      args: [],
      skipIfAlreadyDeployed: true,
    })
  if (fixedPriceOracleNewlyDeployed) {
    console.log('Deployed FixedPriceOracle to', fixedPriceOracleAddress)
  } else {
    console.log('Existing FixedPriceOracle at', fixedPriceOracleAddress)
  }
  const governanceAddress = getPrePOAddressForNetwork(
    'GOVERNANCE',
    currentNetwork.name,
    process.env.GOVERNANCE
  )
  console.log('Governance for the current network is at:', governanceAddress)
  const fixedPriceOracle = (await ethers.getContract('FixedPriceOracle')) as FixedPriceOracle
  if ((await fixedPriceOracle.owner()) !== governanceAddress) {
    console.log('Transferring ownership to', governanceAddress)
    await sendTxAndWait(
      await fixedPriceOracle.connect(deployer).transferOwnership(governanceAddress)
    )
  }
  console.log('')
}

export default deployFunction

deployFunction.tags = ['FixedPriceOracle']
