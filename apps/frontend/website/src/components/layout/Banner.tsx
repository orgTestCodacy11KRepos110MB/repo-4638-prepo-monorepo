import { ROUTES } from '../../lib/constants'
import { Button } from '../Button'

const Banner: React.FC = () => (
  <div className="py-[6px] px-2 text-white bg-prepo">
    <p className="text-center leading-4">
      The PPO Yield program starts soon!{' '}
      <Button
        className="underline cursor-pointer !p-0 font-normal text-base hover:!bg-transparent leading-4"
        iconClassName="!ml-1"
        href={ROUTES.PPO_YIELD_BLOG}
        target="_blank"
        iconSize={16}
      >
        Learn more
      </Button>
    </p>
  </div>
)

export default Banner
