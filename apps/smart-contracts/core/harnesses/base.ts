import { MockContract } from '@defi-wonderland/smock'
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers'
import { HardhatEthersHelpers } from '@nomiclabs/hardhat-ethers/types'
import {
  CollateralWithHooks,
  MockCollateralWithHooks,
  MarketWithHooks,
  MockMarketWithHooks,
} from '../types'
import {
  ERC20,
  DepositRecord,
  PrePOMarketFactory,
  TestERC20,
  TokenSender,
} from '../types/generated'

export abstract class Base {
  public ethers!: HardhatEthersHelpers
  public accounts!: SignerWithAddress[]
  public baseToken: ERC20 | MockContract<TestERC20>
  public rewardToken: ERC20 | MockContract<TestERC20>
  public collateral: CollateralWithHooks | MockCollateralWithHooks
  public depositRecord: DepositRecord | MockContract<DepositRecord>
  public tokenSender: TokenSender | MockContract<TokenSender>
  public marketFactory?: PrePOMarketFactory
  public markets?: {
    [suffix: string]: MarketWithHooks | MockMarketWithHooks
  }
}
