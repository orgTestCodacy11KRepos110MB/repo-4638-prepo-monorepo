import { makeAutoObservable, reaction, runInAction } from 'mobx'
import { TRANSACTION_SETTING } from '../../../lib/constants'
import { RootStore } from '../../../stores/RootStore'
import { validateNumber } from '../../../utils/number-utils'

export class StakeStore {
  currentStakingValue = TRANSACTION_SETTING.DEFAULT_AMOUNT
  showDelegate = true

  constructor(private root: RootStore) {
    makeAutoObservable(this, {}, { autoBind: true })
    this.subscribe()
  }

  get isCurrentStakingValueValid(): boolean {
    const { tokenBalanceRaw } = this.root.ppoTokenStore
    // TODO: parseEther(`${this.currentStakingValue}`) when SC
    return (
      tokenBalanceRaw !== undefined &&
      this.currentStakingValue > 0 &&
      tokenBalanceRaw.gte(this.currentStakingValue)
    )
  }

  setCurrentStakingValue(value?: number | string): void {
    this.currentStakingValue = validateNumber(value)
  }

  onDelegateShowChange(show: boolean): void {
    this.showDelegate = show
  }

  stake(): Promise<{
    success: boolean
    error?: string | undefined
  }> {
    if (!this.isCurrentStakingValueValid) {
      return Promise.resolve({ success: false })
    }
    return this.root.ppoStakingStore.stake(this.currentStakingValue)
  }

  private subscribe(): void {
    reaction(
      () => this.root.delegateStore.selectedDelegate,
      (delegate) => {
        runInAction(() => {
          if (!delegate) {
            this.showDelegate = false
          }
        })
      }
    )
  }
}
