import { MockContract } from '@defi-wonderland/smock'
import {
  AccountList,
  Collateral,
  DepositHook,
  ERC20,
  LongShortToken,
  ManagerWithdrawHook,
  MintHook,
  PrePOMarket,
  RedeemHook,
  WithdrawHook,
} from './generated'

export type DepositHookWithAllowlist = DepositHook & {
  allowlist?: AccountList
}

export type MockDepositHookWithAllowlist = MockContract<DepositHook> & {
  allowlist?: MockContract<AccountList>
}

export type CollateralWithHooks = Collateral & {
  depositHook?: DepositHookWithAllowlist
  withdrawHook?: WithdrawHook
  managerWithdrawHook?: ManagerWithdrawHook
}

export type MockCollateralWithHooks = MockContract<Collateral> & {
  depositHook?: MockDepositHookWithAllowlist
  withdrawHook?: MockContract<WithdrawHook>
  managerWithdrawHook?: MockContract<ManagerWithdrawHook>
}

export type MarketWithHooks = PrePOMarket & {
  longToken?: ERC20
  shortToken?: ERC20
  hash?: string
  mintHook?: MintHook
  redeemHook?: RedeemHook
}

// No hash because smock PrePOMarkets are not created using factories
export type MockMarketWithHooks = MockContract<PrePOMarket> & {
  longToken?: LongShortToken
  shortToken?: LongShortToken
  mintHook?: MockContract<MintHook>
  redeemHook?: MockContract<RedeemHook>
}
