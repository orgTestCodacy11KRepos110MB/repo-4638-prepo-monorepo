import { BigNumber, ContractTransaction } from 'ethers'
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/dist/src/signer-with-address'
import { PrePOMarketFactory } from './generated'

export type PrePOMarketParams = {
  governance: string
  collateral: string
  floorLongPayout: BigNumber
  ceilingLongPayout: BigNumber
  floorValuation: BigNumber
  ceilingValuation: BigNumber
  expiryTime: number
}

export type CreateMarketParams = PrePOMarketParams & {
  caller: SignerWithAddress
  factory: PrePOMarketFactory
  tokenNameSuffix: string
  tokenSymbolSuffix: string
  longTokenSalt: string
  shortTokenSalt: string
}

export type CreateMarketResult = {
  tx: ContractTransaction
  market: string
  hash: string
}
