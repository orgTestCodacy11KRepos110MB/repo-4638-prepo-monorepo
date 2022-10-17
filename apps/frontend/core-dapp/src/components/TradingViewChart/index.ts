import dynamic from 'next/dynamic'

export default dynamic(() => import('./TradingViewChart'), {
  ssr: false,
})
