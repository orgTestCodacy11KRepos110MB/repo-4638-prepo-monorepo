import { IconProps } from '../icon.types'

type Props = Omit<IconProps, 'name'>

const Phone: React.FC<Props> = ({ color = 'white', width = '60', height = '60' }) => (
  <svg
    width={width}
    height={height}
    viewBox="0 0 72 72"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M3.35637 11.3767L12.6621 2.07961C13.3185 1.42028 14.0987 0.897151 14.9579 0.540266C15.8171 0.183381 16.7384 -0.000222987 17.6688 2.03239e-07C19.5649 2.03239e-07 21.3474 0.742719 22.6842 2.07961L32.6977 12.0932C33.357 12.7496 33.8801 13.5299 34.237 14.3891C34.5939 15.2483 34.7775 16.1696 34.7773 17.1C34.7773 18.9961 34.0345 20.7786 32.6977 22.1155L25.3755 29.4379C27.0894 33.2158 29.4724 36.6526 32.4093 39.5825C35.3389 42.5267 38.7754 44.9183 42.5538 46.6427L49.8761 39.3204C50.5325 38.6611 51.3127 38.1379 52.1719 37.781C53.0311 37.4242 53.9524 37.2406 54.8828 37.2408C56.7789 37.2408 58.5614 37.9835 59.8982 39.3204L69.9204 49.3252C70.5805 49.9829 71.1041 50.7646 71.461 51.6254C71.8179 52.4861 72.0011 53.409 72 54.3408C72 56.2369 71.2573 58.0194 69.9204 59.3563L60.6322 68.6447C58.5002 70.7854 55.5556 72 52.5323 72C51.8945 72 51.2828 71.9476 50.6799 71.8427C38.9015 69.9029 27.2191 63.6379 17.7911 54.2184C8.37182 44.8078 2.11561 33.134 0.149622 21.3204C-0.444544 17.7117 0.752526 13.9981 3.35637 11.3767V11.3767Z"
      fill={color}
    />
  </svg>
)

export default Phone
