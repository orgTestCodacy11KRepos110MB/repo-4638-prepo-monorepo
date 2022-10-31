import { ethers } from 'ethers'
import { formatUnits } from 'ethers/lib/utils'
import { NextApiRequest, NextApiResponse } from 'next'
import { NETWORKS } from 'prepo-constants'

const ORACLE_ABI = ['function getFixedPrice() view returns (uint256)']
const ORACLE_ADDRESS = '0x503aef858e26C136C29e40483EA0297160d2BDC0'
const PRICE_DECIMALS = 6

const handler = async (_: NextApiRequest, res: NextApiResponse): Promise<void> => {
  try {
    const { rpcUrls, chainId } = NETWORKS.arbitrumOne

    const provider = new ethers.providers.JsonRpcProvider(rpcUrls[0], chainId)

    const fixedPriceContract = new ethers.Contract(ORACLE_ADDRESS, ORACLE_ABI, provider)

    const priceBN = await fixedPriceContract.getFixedPrice()

    if (priceBN) {
      res.status(200).send(formatUnits(priceBN, PRICE_DECIMALS))
      res.end()
      return
    }

    throw new Error()
  } catch (e) {
    res.status(500).send('Internal server error')
  }
}

export default handler
