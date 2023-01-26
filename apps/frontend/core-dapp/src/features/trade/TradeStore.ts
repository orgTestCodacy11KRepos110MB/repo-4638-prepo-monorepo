import { BigNumber, ethers } from 'ethers'
import { makeAutoObservable, reaction, runInAction } from 'mobx'
import { validateStringToBN } from 'prepo-utils'
import QuoterABI from '../../../abi/uniswapV3Quoter.abi.json'
import { UNISWAP_QUOTER_ADDRESS } from '../../lib/external-contracts'
import { Erc20Store } from '../../stores/entities/Erc20.entity'
import { MarketEntity } from '../../stores/entities/MarketEntity'
import { RootStore } from '../../stores/RootStore'
import { TradeType } from '../../stores/SwapStore'
import { ChartTimeframe } from '../../types/market.types'
import { debounce } from '../../utils/debounce'
import { makeQueryString } from '../../utils/makeQueryString'
import { calculateValuation } from '../../utils/market-utils'

export type Direction = 'long' | 'short'
export type TradeAction = 'open' | 'close'
type SlideUpContent = 'OpenMarket' | 'OpenCurrency' | 'ClosePosition' | 'CloseCurrency'

const DEFAULT_DIRECTION = 'long'

export class TradeStore {
  action: TradeAction = 'open'
  approving = false
  closeTradeHash?: string
  direction: Direction = DEFAULT_DIRECTION
  openTradeAmount = ''
  openTradeAmountOutBN?: BigNumber
  openTradeHash?: string
  openingTrade = false
  selectedMarket?: MarketEntity
  slideUpContent?: SlideUpContent = undefined
  showChart = false
  selectedTimeframe: ChartTimeframe = ChartTimeframe.DAY
  showSettings = false

  constructor(public root: RootStore) {
    makeAutoObservable(this, {}, { autoBind: true })
    this.subscribeOpenTradeAmountOut()
  }

  subscribeOpenTradeAmountOut(): void {
    reaction(
      () => ({
        selectedMarket: this.selectedMarket,
        openTradeAmountBN: this.openTradeAmountBN,
        direction: this.direction,
        marketValuation: this.selectedMarket?.estimatedValuation,
      }),
      async ({ openTradeAmountBN, selectedMarket }) => {
        if (!selectedMarket || openTradeAmountBN === undefined) {
          this.openTradeAmountOutBN = undefined
          return
        }
        if (openTradeAmountBN.eq(0)) {
          this.openTradeAmountOutBN = BigNumber.from(0)
          return
        }

        this.openTradeAmountOutBN = undefined // clean up while new amountOut gets loaded
        const openTradeAmountOutBN = await this.quoteExactInput(selectedMarket)
        runInAction(() => {
          if (openTradeAmountOutBN !== undefined) this.openTradeAmountOutBN = openTradeAmountOutBN
        })
      }
    )
  }

  get insufficientBalanceForOpenTrade(): boolean | undefined {
    if (!this.root.web3Store.connected) return false
    const { balanceOfSigner } = this.root.preCTTokenStore
    if (balanceOfSigner === undefined || this.openTradeAmountBN === undefined) return undefined
    return this.openTradeAmountBN.gt(balanceOfSigner)
  }

  // initial loading states can only be true if user has interacted with input
  get openTradeButtonInitialLoading(): boolean {
    if (this.openTradeAmount === '') return false
    return (
      this.needApproval === undefined ||
      this.openTradeAmountBN === undefined ||
      this.insufficientBalanceForOpenTrade === undefined
    )
  }

  get openTradeButtonLoading(): boolean {
    // user triggered actions that forces button to show spinner
    if (this.approving || this.openingTrade) return true

    // Don't need to show spinner, even if data is being loaded in the background, when:
    // - allowance is required (button will show "Approve")
    // - no market is selected (button will show "Select a Market")
    // - insufficient balance
    if (
      this.needApproval ||
      this.selectedMarket === undefined ||
      this.insufficientBalanceForOpenTrade
    )
      return false

    // initial loading states, not affected by user's interaction
    return this.openTradeButtonInitialLoading
  }

  setAction(action: TradeAction): string {
    this.action = action
    return this.tradeUrl
  }

  setCloseTradeHash(hash?: string): void {
    this.closeTradeHash = hash
  }

  setShowChart(showChart: boolean): void {
    if (!showChart) this.setSelectedTimeframe(ChartTimeframe.DAY)
    this.showChart = showChart
  }

  setSlideUpContent(slideUpContent?: SlideUpContent): void {
    this.slideUpContent = slideUpContent
  }

  setDirection(direction: Direction, selectedMarket?: MarketEntity): string {
    this.direction = direction
    selectedMarket?.setSelectedPool(direction)
    return this.tradeUrl
  }

  setSelectedMarket(marketUrlId?: string): string {
    if (!marketUrlId) {
      this.selectedMarket = undefined
      return this.tradeUrl
    }
    const market = this.root.marketStore.markets[marketUrlId]
    this.selectedMarket = market
    return this.tradeUrl
  }

  setSelectedTimeframe(timeframe: ChartTimeframe): void {
    this.selectedTimeframe = timeframe
  }

  setShowSettings(show: boolean): void {
    this.showSettings = show
  }

  setOpenTradeAmount(amount: string): void {
    if (validateStringToBN(amount, this.root.preCTTokenStore.decimalsNumber))
      this.openTradeAmount = amount
  }

  setOpenTradeHash(hash?: string): void {
    this.openTradeHash = hash
  }

  get needApproval(): boolean | undefined {
    if (!this.root.web3Store.connected) return false
    return this.root.preCTTokenStore.needToAllowFor(this.openTradeAmount, 'UNISWAP_SWAP_ROUTER')
  }

  get openTradeAmountOut(): string | undefined {
    // amountOut will always be 0 if input is 0
    if (this.openTradeAmountBN?.eq(0)) return '0'
    if (!this.selectedMarket || this.openTradeAmountOutBN === undefined) return undefined
    const token = this.selectedMarket[`${this.direction}Token`]
    return token?.formatUnits(this.openTradeAmountOutBN)
  }

  get openTradeAmountBN(): BigNumber | undefined {
    return this.root.preCTTokenStore.parseUnits(this.openTradeAmount)
  }

  get tradeUrl(): string {
    return makeQueryString({
      marketId: this.selectedMarket?.urlId,
      direction: this.direction,
      action: this.action,
    })
  }

  get tradingLongPriceAfterSlippage(): number | undefined {
    if (this.openTradeAmountOut === undefined) return undefined

    const { slippage } = this.root.advancedSettingsStore
    const amountOutAfterSlippage = +this.openTradeAmountOut * (1 - slippage)
    const priceAfterSlippage = +this.openTradeAmount / amountOutAfterSlippage

    const longTokenPriceAfterSlippage =
      this.direction === 'long' ? priceAfterSlippage : 1 - priceAfterSlippage
    return longTokenPriceAfterSlippage
  }

  get tradingValuation(): number | undefined {
    if (this.selectedMarket === undefined || this.tradingLongPriceAfterSlippage === undefined)
      return undefined
    const { payoutRange, valuationRange } = this.selectedMarket
    if (!valuationRange || !payoutRange) return undefined

    return calculateValuation({
      longTokenPrice: this.tradingLongPriceAfterSlippage,
      payoutRange,
      valuationRange,
    })
  }

  get withinBounds(): boolean | undefined {
    if (
      this.selectedMarket === undefined ||
      this.tradingLongPriceAfterSlippage === undefined ||
      this.openTradeAmountBN === undefined ||
      this.selectedMarket.payoutRange === undefined
    )
      return undefined

    const { payoutRange } = this.selectedMarket
    const [lowerBound, upperBound] = payoutRange

    const inRange =
      this.tradingLongPriceAfterSlippage > lowerBound &&
      this.tradingLongPriceAfterSlippage < upperBound

    return inRange || this.openTradeAmountBN.eq(0)
  }

  quoteExactInput = debounce(
    async (selectedMarket: MarketEntity): Promise<BigNumber | undefined> => {
      const selectedToken = selectedMarket[`${this.direction}Token`]
      const pool = selectedMarket[`${this.direction}Pool`]
      const state = pool?.poolState
      const fee = pool?.poolImmutables?.fee
      if (
        !fee ||
        !selectedToken ||
        !state ||
        !this.openTradeAmountBN ||
        this.openTradeAmountBN.eq(0) ||
        !selectedToken.address
      ) {
        return undefined
      }
      const tokenAddressFrom = this.root.preCTTokenStore.uniswapToken.address
      const tokenAddressTo = selectedToken.address
      const quoterContract = new ethers.Contract(
        UNISWAP_QUOTER_ADDRESS.mainnet ?? '', // all uniswap contracts has same address on all chains
        QuoterABI,
        this.root.web3Store.coreProvider
      )

      try {
        const cachedOpenAmountBN = this.openTradeAmountBN // cache amount at time when check is fired
        const sqrtPriceLimitX96 = 0 // The price limit of the pool that cannot be exceeded by the swap
        const output = await quoterContract.callStatic.quoteExactInputSingle(
          tokenAddressFrom,
          tokenAddressTo,
          fee,
          this.openTradeAmountBN,
          sqrtPriceLimitX96
        )
        // only update openTradeAmountOutBN if amount hasn't changed since last check was fired
        return cachedOpenAmountBN.eq(this.openTradeAmountBN) ? output : undefined
      } catch (e) {
        this.root.toastStore.errorToast('Error calculating output amount', e)
        return undefined
      }
    },
    400
  )

  async approve(): Promise<void> {
    this.approving = true
    await this.root.preCTTokenStore.unlockPermanently('UNISWAP_SWAP_ROUTER')
    runInAction(() => {
      this.approving = false
    })
  }

  // eslint-disable-next-line require-await
  async openTrade(): Promise<void> {
    if (!this.selectedMarket) return

    const selectedToken = this.selectedMarket[`${this.direction}Token`]
    const price = this.selectedMarket[`${this.direction}TokenPrice`]
    const fee = this.selectedMarket[`${this.direction}Pool`]?.poolImmutables?.fee
    const { swap } = this.root.swapStore
    const { uniswapToken } = this.root.preCTTokenStore

    if (
      !selectedToken?.address ||
      price === undefined ||
      fee === undefined ||
      this.openTradeAmountBN === undefined ||
      this.openTradeAmountOutBN === undefined
    )
      return

    this.setOpenTradeHash(undefined)
    this.openingTrade = true
    const { error } = await swap({
      fee,
      fromAmount: this.openTradeAmountBN,
      fromTokenAddress: uniswapToken.address,
      toAmount: this.openTradeAmountOutBN,
      toTokenAddress: selectedToken.address,
      type: TradeType.EXACT_INPUT,
      onHash: (hash) => this.setOpenTradeHash(hash),
    })

    if (error) {
      this.root.toastStore.errorToast('Trade failed', error)
    } else {
      this.root.toastStore.successToast('Trade was successful 🎉')
    }

    runInAction(() => {
      this.openingTrade = false
      // reset input amount if trade was successful
      if (!error) this.openTradeAmount = ''
    })
  }

  // eslint-disable-next-line require-await
  async closeTrade(
    token: Erc20Store,
    amount: BigNumber,
    tokensReceivable: BigNumber,
    selectedMarket: MarketEntity
  ): Promise<{ success: boolean; error?: string }> {
    this.setCloseTradeHash(undefined)

    const fee = selectedMarket[`${this.direction}Pool`]?.poolImmutables?.fee
    const { swap } = this.root.swapStore
    const { uniswapToken } = this.root.preCTTokenStore
    if (!token.address || !uniswapToken.address || fee === undefined)
      return { success: false, error: 'Please try again later.' }

    return swap({
      fee,
      fromAmount: amount,
      fromTokenAddress: token.address,
      toTokenAddress: uniswapToken.address,
      toAmount: tokensReceivable,
      type: TradeType.EXACT_INPUT,
      onHash: (hash) => this.setCloseTradeHash(hash),
    })
  }

  get tradeDisabled(): boolean {
    // only if input is greater than 0
    const loadingValuationPrice =
      Boolean(this.openTradeAmountBN?.gt(0)) && this.openTradeAmountOutBN === undefined

    return Boolean(
      !this.selectedMarket ||
        this.openTradeAmountBN === undefined ||
        this.openTradeAmountBN.eq(0) ||
        !this.withinBounds ||
        this.insufficientBalanceForOpenTrade ||
        loadingValuationPrice
    )
  }
}
