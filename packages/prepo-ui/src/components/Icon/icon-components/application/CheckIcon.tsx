import { IconProps } from '../../icon.types'

type Props = Omit<IconProps, 'name'>

const CheckIcon: React.FC<Props> = ({ width = '13', height = '10' }) => (
  <svg
    width={width}
    height={height}
    viewBox="0 0 13 10"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M1.98315 4.44498C1.63541 4.09724 1.07162 4.09724 0.723885 4.44498C0.376149 4.79271 0.376149 5.35651 0.723885 5.70424L1.98315 4.44498ZM4.47003 8.19112L3.8404 8.82076C4.00739 8.98774 4.23387 9.08156 4.47003 9.08156C4.70619 9.08156 4.93267 8.98774 5.09966 8.82076L4.47003 8.19112ZM11.7779 2.14251C12.1256 1.79477 12.1256 1.23098 11.7779 0.883247C11.4302 0.535512 10.8664 0.535512 10.5186 0.883247L11.7779 2.14251ZM0.723885 5.70424L3.8404 8.82076L5.09966 7.56149L1.98315 4.44498L0.723885 5.70424ZM5.09966 8.82076L11.7779 2.14251L10.5186 0.883247L3.8404 7.56149L5.09966 8.82076Z"
      fill="currentColor"
    />
  </svg>
)

export default CheckIcon
