import { IconProps } from '../../icon.types'

type Props = Omit<IconProps, 'name'>

const CopyIcon: React.FC<Props> = ({ width = '16', height = '16' }) => (
  <svg
    width={width}
    height={height}
    viewBox="0 0 16 16"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <g clipPath="url(#clip0_14945_13845)">
      <path
        d="M13.3333 6H7.33333C6.59695 6 6 6.59695 6 7.33333V13.3333C6 14.0697 6.59695 14.6667 7.33333 14.6667H13.3333C14.0697 14.6667 14.6667 14.0697 14.6667 13.3333V7.33333C14.6667 6.59695 14.0697 6 13.3333 6Z"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M3.33301 10H2.66634C2.31272 10 1.97358 9.85952 1.72353 9.60947C1.47348 9.35942 1.33301 9.02028 1.33301 8.66666V2.66666C1.33301 2.31304 1.47348 1.9739 1.72353 1.72385C1.97358 1.4738 2.31272 1.33333 2.66634 1.33333H8.66634C9.01996 1.33333 9.3591 1.4738 9.60915 1.72385C9.8592 1.9739 9.99967 2.31304 9.99967 2.66666V3.33333"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </g>
    <defs>
      <clipPath id="clip0_14945_13845">
        <rect width="16" height="16" fill="white" />
      </clipPath>
    </defs>
  </svg>
)

export default CopyIcon
