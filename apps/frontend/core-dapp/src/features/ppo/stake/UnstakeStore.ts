import { CheckboxChangeEvent } from 'antd/lib/checkbox'
import { makeAutoObservable } from 'mobx'
import { TRANSACTION_SETTING } from '../../../lib/constants'
import { RootStore } from '../../../stores/RootStore'
import { validateNumber } from '../../../utils/number-utils'

const FEE_MOCK = 7.5

export class UnstakeStore {
  confirm = false
  currentUnstakingValue = TRANSACTION_SETTING.DEFAULT_AMOUNT
  fee = FEE_MOCK

  get isCurrentUnstakingValueValid(): boolean {
    const stakedPPO = this.root.ppoStakingStore.balanceData?.raw

    if (!stakedPPO) return false
    return (
      // TODO: parseEther with real SC
      stakedPPO.gte(this.currentUnstakingValue) && this.currentUnstakingValue !== 0
    )
  }

  constructor(private root: RootStore) {
    makeAutoObservable(this, {}, { autoBind: true })
  }

  setConfirm({ target: { checked } }: CheckboxChangeEvent): void {
    this.confirm = checked
  }

  setCurrentUnstakingValue(value: number | string): void {
    this.currentUnstakingValue = validateNumber(+value)
  }

  startCooldown(): Promise<{
    success: boolean
    error?: string | undefined
  }> {
    const { balanceData } = this.root.ppoStakingStore
    if (balanceData === undefined || balanceData.raw.lt(this.currentUnstakingValue)) {
      return Promise.resolve({ success: false })
    }
    return this.root.ppoStakingStore.startCooldown(this.currentUnstakingValue)
  }
}
