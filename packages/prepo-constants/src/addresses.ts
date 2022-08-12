import { getAddress } from 'ethers/lib/utils'
import { SupportedNetworks } from './networks'

export type ImportantAddress = {
  [key in SupportedNetworks]?: string
}

export type ImportantKeywords = 'GOVERNANCE' | 'USDC'

export type ImportantAddresses = {
  [key in ImportantKeywords]?: ImportantAddress
}

export const PREPO_ADDRESSES: ImportantAddresses = {
  GOVERNANCE: {
    arbitrumTestnet: '0x054CcD68A2aC152fCFB93a15b6F75Eea53DCD9E0',
    // TODO replace this with our production multisig address
    arbitrumOne: '0x596e5940a47169f244fDD2DC269bCeA735635b53',
  },
  USDC: {
    arbitrumOne: '0xFF970A61A04b1cA14834A43f5dE4533eBDDB5CC8',
  },
}

export function getPrePOAddressForNetwork(
  keyword: keyof ImportantAddresses,
  network: SupportedNetworks,
  localAddress?: string
): string {
  // Handle local network
  if (network === 'hardhat' || network === 'ganache') {
    if (!localAddress) throw new Error('Local network detected, but no localAddress was provided')
    return getAddress(localAddress)
  }
  /**
   * Handle remote network
   *
   * Store each entry because TS compiler does not recognize check for
   * PREPO_ADDRESSES[keyword] or PREPO_ADDRESSES[keyword][network] being
   * undefined unless explicitly stored before the conditional statement.
   * While technically TS should, if using &&, should evaluate if
   * PREPO_ADDRESSES[keyword] is undefined before accessing [network] it
   * doesn't seem to work unless we use `.` notation.
   */
  const entryForKeyword = PREPO_ADDRESSES[keyword]
  if (entryForKeyword && entryForKeyword[network]) {
    const entryForKeywordAndNetwork = entryForKeyword[network]
    if (entryForKeywordAndNetwork) {
      return getAddress(entryForKeywordAndNetwork)
    }
  }
  throw new Error(`${keyword} not defined for the ${network} network`)
}
