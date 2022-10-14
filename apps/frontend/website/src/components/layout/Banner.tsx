import { ROUTES } from '../../lib/constants'
import { Button } from '../Button'

const Banner: React.FC = () => (
  <div className="py-[6px] px-2 text-white bg-prepo">
    <p className="text-center leading-4">
      The PPO Token Public Sale starts October 18!{' '}
      <Button
        className="underline cursor-pointer !p-0 font-normal text-base hover:!bg-transparent leading-4"
        iconClassName="!ml-1"
        href={ROUTES.PUBLIC_SALE_BLOG}
        target="_blank"
        iconSize={16}
      >
        Learn More
      </Button>
    </p>
  </div>
)

export default Banner
