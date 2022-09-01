export const DEPLOYMENT_NAMES = {
  ppo: {
    name: 'PPO',
    restrictedTransferHook: {
      name: 'PPO-RestrictedTransferHook',
      blocklist: {
        name: 'PPO-RestrictedTransferHook-Blocklist',
      },
      sourceAllowlist: {
        name: 'PPO-RestrictedTransferHook-SourceAllowlist',
      },
      destinationAllowlist: {
        name: 'PPO-RestrictedTransferHook-DestinationAllowlist',
      },
    },
  },
  miniSales_A: {
    name: 'MiniSales_A',
    allowlistPurchaseHook: {
      name: 'MiniSales_A-AllowlistPurchaseHook',
      allowlist: {
        name: 'MiniSales_A-AllowlistPurchaseHook-Allowlist',
      },
    },
  },
  vesting: {
    name: 'Vesting',
  },
} as const

export type DeploymentNames = typeof DEPLOYMENT_NAMES
