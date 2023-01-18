import { IconProps } from '../../icon.types'

type Props = Omit<IconProps, 'name'>

// Brand logo will only have two color modes, linear gradient in light mode or white color in dark mode
// White is shown when color is white, and linear gradient is used otherwise.
const BrandLogoIcon: React.FC<Props> = ({ width = '25', height = '25', onClick, color }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={width}
    height={height}
    onClick={onClick}
    viewBox="0 0 686 231"
    fill="none"
  >
    <g clipPath="url(#clip0_203_2)">
      <path
        d="M128.75 93.1601L119 103.16C118.74 103.427 118.429 103.64 118.086 103.785C117.742 103.93 117.373 104.005 117 104.005C116.627 104.005 116.258 103.93 115.914 103.785C115.571 103.64 115.26 103.427 115 103.16L102.4 90.24C102.14 89.9727 101.829 89.7603 101.486 89.6152C101.142 89.4701 100.773 89.3953 100.4 89.3953C100.027 89.3953 99.658 89.4701 99.3145 89.6152C98.971 89.7603 98.66 89.9727 98.4 90.24L84 105.1L74.29 115.1L60.7 129.1L50.99 139.1L35.47 155.1L25.47 165.43L13 178.4C12.5667 178.846 11.9968 179.135 11.3808 179.22C10.7648 179.305 10.1381 179.182 9.60001 178.87L3.87001 175.55L1.41001 174.12C0.983993 173.878 0.629369 173.527 0.38184 173.104C0.134311 172.681 0.00261429 172.2 8.52311e-06 171.71V166C-0.00252678 164.549 0.560645 163.153 1.57001 162.11L19.57 143.58L33.57 129.18L37.45 125.18L47.16 115.18L60.78 101.18L70.49 91.18L96.39 64.43C96.91 63.8954 97.5319 63.4705 98.2189 63.1803C98.906 62.8901 99.6442 62.7406 100.39 62.7406C101.136 62.7406 101.874 62.8901 102.561 63.1803C103.248 63.4705 103.87 63.8954 104.39 64.43L128.81 89.43C129.262 89.9496 129.506 90.6179 129.495 91.3066C129.484 91.9952 129.219 92.6554 128.75 93.1601V93.1601Z"
        fill={color === '#FFFFFF' ? color : 'url(#paint0_linear_203_2)'}
      />
      <path
        d="M201.64 89.64V168.5C201.64 169.973 201.252 171.419 200.515 172.694C199.778 173.969 198.717 175.026 197.44 175.76L104.54 229.13C103.268 229.865 101.824 230.251 100.355 230.251C98.8858 230.251 97.4424 229.865 96.17 229.13L25.6 188.18C25.3968 188.063 25.2232 187.9 25.0924 187.705C24.9616 187.511 24.877 187.288 24.8452 187.056C24.8133 186.823 24.835 186.587 24.9087 186.364C24.9823 186.141 25.1059 185.938 25.27 185.77L36.39 174.3C36.8233 173.854 37.3932 173.565 38.0092 173.48C38.6252 173.395 39.252 173.518 39.79 173.83L99 208.18C99.4241 208.425 99.9053 208.554 100.395 208.554C100.885 208.554 101.366 208.425 101.79 208.18L180.69 162.84C181.116 162.595 181.469 162.243 181.715 161.818C181.961 161.393 182.09 160.911 182.09 160.42V107.64C182.084 107.27 182.152 106.903 182.289 106.56C182.427 106.216 182.631 105.904 182.89 105.64L199.45 88.7C199.629 88.5115 199.861 88.3823 200.115 88.3299C200.37 88.2774 200.634 88.3042 200.873 88.4067C201.111 88.5091 201.313 88.6823 201.45 88.9028C201.587 89.1234 201.654 89.3807 201.64 89.64V89.64Z"
        fill={color === '#FFFFFF' ? color : 'url(#paint1_linear_203_2)'}
      />
      <path
        d="M176.3 44.56L165.1 56C164.667 56.4437 164.099 56.7308 163.486 56.8159C162.872 56.901 162.247 56.7793 161.71 56.47L101.8 22.06C101.376 21.8152 100.895 21.6862 100.405 21.6862C99.9153 21.6862 99.4341 21.8152 99.01 22.06L20.93 67.37C20.5077 67.615 20.1571 67.9665 19.9132 68.3894C19.6693 68.8123 19.5406 69.2918 19.54 69.78V122.36C19.5386 123.085 19.2553 123.781 18.75 124.3L2.19001 141.42C2.01416 141.605 1.78672 141.732 1.53732 141.786C1.28792 141.84 1.02813 141.817 0.791781 141.721C0.555436 141.625 0.353496 141.46 0.212269 141.248C0.071043 141.035 -0.00292293 140.785 7.53124e-06 140.53V61.75C-9.37736e-07 60.2837 0.385197 58.8431 1.11703 57.5725C1.84887 56.3019 2.90167 55.2458 4.17001 54.51L96.17 1.13003C97.4424 0.395413 98.8858 0.00866699 100.355 0.00866699C101.824 0.00866699 103.268 0.395413 104.54 1.13003L175.97 42.13C176.177 42.2469 176.353 42.4101 176.487 42.6066C176.62 42.8032 176.706 43.0279 176.738 43.2632C176.77 43.4985 176.747 43.7379 176.671 43.9629C176.595 44.1879 176.468 44.3922 176.3 44.56Z"
        fill={color === '#FFFFFF' ? color : 'url(#paint2_linear_203_2)'}
      />
      <path
        d="M201.64 58.5101V64.2501C201.629 65.7184 201.04 67.1233 200 68.1601L182.1 86.4901L168.1 100.75L163.83 105.13L154.03 115.13L140.38 129.13L130.61 139.13L104.33 166C103.81 166.535 103.188 166.96 102.501 167.25C101.814 167.54 101.076 167.69 100.33 167.69C99.5842 167.69 98.846 167.54 98.1589 167.25C97.4719 166.96 96.85 166.535 96.33 166L72.33 141.19C71.8266 140.67 71.5451 139.974 71.5451 139.25C71.5451 138.526 71.8266 137.83 72.33 137.31L82.04 127.31C82.3 127.043 82.611 126.83 82.9545 126.685C83.298 126.54 83.6671 126.465 84.04 126.465C84.4129 126.465 84.782 126.54 85.1255 126.685C85.4691 126.83 85.78 127.043 86.04 127.31L98.4 140C98.66 140.267 98.971 140.48 99.3145 140.625C99.658 140.77 100.027 140.845 100.4 140.845C100.773 140.845 101.142 140.77 101.486 140.625C101.829 140.48 102.14 140.267 102.4 140L117 125.09L126.77 115.09L140.42 101.09L150.19 91.0901L166 75.0001L176.08 64.7001L188.69 51.8101C189.123 51.3664 189.691 51.0793 190.304 50.9942C190.918 50.9091 191.543 51.0308 192.08 51.3401L197.83 54.6401L200.26 56.0401C200.689 56.2913 201.044 56.6529 201.286 57.0871C201.529 57.5214 201.651 58.0127 201.64 58.5101Z"
        fill={color === '#FFFFFF' ? color : 'url(#paint3_linear_203_2)'}
      />
      <path
        d="M319.82 94.7501C325.244 97.7243 329.716 102.172 332.72 107.58C335.921 113.432 337.535 120.021 337.4 126.69C337.53 133.381 335.918 139.991 332.72 145.87C329.734 151.309 325.259 155.784 319.82 158.77C314.096 161.86 307.673 163.423 301.17 163.31C291.55 163.31 283.93 160.103 278.31 153.69V180C278.31 182.215 277.43 184.338 275.864 185.904C274.298 187.47 272.175 188.35 269.96 188.35C268.863 188.35 267.778 188.134 266.765 187.714C265.752 187.295 264.831 186.68 264.056 185.904C263.28 185.129 262.665 184.209 262.246 183.195C261.826 182.182 261.61 181.097 261.61 180V99.0001C261.61 96.8783 262.453 94.8435 263.953 93.3432C265.453 91.8429 267.488 91.0001 269.61 91.0001C271.732 91.0001 273.767 91.8429 275.267 93.3432C276.767 94.8435 277.61 96.8783 277.61 99.0001V100.41C280.329 97.0548 283.847 94.4349 287.84 92.7901C292.103 91.057 296.669 90.1934 301.27 90.2501C307.736 90.1429 314.122 91.6921 319.82 94.7501V94.7501ZM314.47 142.87C318.437 138.77 320.42 133.38 320.42 126.7C320.42 120.02 318.437 114.63 314.47 110.53C312.511 108.503 310.149 106.909 307.536 105.85C304.923 104.79 302.118 104.29 299.3 104.38C295.512 104.323 291.775 105.268 288.47 107.12C285.247 108.961 282.607 111.671 280.85 114.94C279.002 118.585 278.038 122.614 278.038 126.7C278.038 130.787 279.002 134.816 280.85 138.46C282.606 141.73 285.247 144.44 288.47 146.28C291.777 148.127 295.513 149.065 299.3 149C302.118 149.095 304.925 148.598 307.539 147.543C310.154 146.487 312.518 144.895 314.48 142.87H314.47Z"
        fill={color === '#FFFFFF' ? color : '#454699'}
      />
      <path
        d="M394.6 98.2001C394.573 100.081 393.837 101.882 392.539 103.243C391.241 104.604 389.477 105.424 387.6 105.54C382.982 105.957 378.672 108.036 375.47 111.39C371.823 115.177 370 120.633 370 127.76V154C370 156.215 369.12 158.338 367.554 159.904C365.988 161.47 363.865 162.35 361.65 162.35V162.35C359.435 162.35 357.312 161.47 355.746 159.904C354.18 158.338 353.3 156.215 353.3 154V99.0001C353.3 96.8784 354.143 94.8435 355.643 93.3432C357.143 91.8429 359.178 91.0001 361.3 91.0001C363.422 91.0001 365.457 91.8429 366.957 93.3432C368.457 94.8435 369.3 96.8784 369.3 99.0001V101.47C372.827 95.9834 378.313 92.5068 385.76 91.0401C386.825 90.8306 387.922 90.8574 388.975 91.1188C390.029 91.3801 391.011 91.8695 391.855 92.5525C392.698 93.2354 393.381 94.0952 393.855 95.0711C394.33 96.047 394.584 97.1151 394.6 98.2001V98.2001Z"
        fill={color === '#FFFFFF' ? color : '#454699'}
      />
      <path
        d="M463 132H420.17C420.018 131.996 419.867 132.027 419.729 132.091C419.59 132.154 419.468 132.248 419.372 132.366C419.276 132.483 419.207 132.621 419.172 132.77C419.137 132.918 419.137 133.072 419.17 133.22C420.202 137.749 422.837 141.752 426.59 144.49C430.73 147.563 435.877 149.1 442.03 149.1C447.197 149.215 452.289 147.844 456.7 145.15C458.129 144.237 459.837 143.866 461.516 144.104C463.195 144.343 464.732 145.175 465.85 146.45V146.45C466.51 147.217 466.999 148.116 467.285 149.086C467.571 150.057 467.647 151.077 467.509 152.079C467.371 153.081 467.022 154.043 466.484 154.9C465.946 155.757 465.232 156.49 464.39 157.05C462.452 158.363 460.377 159.46 458.2 160.32C452.181 162.524 445.783 163.505 439.38 163.207C432.977 162.908 426.698 161.335 420.91 158.58C415.149 155.662 410.348 151.15 407.08 145.58C403.779 139.831 402.093 133.298 402.2 126.67C402.123 120.103 403.779 113.633 407 107.91C410.09 102.432 414.652 97.9286 420.17 94.91C425.993 91.7363 432.539 90.124 439.17 90.23C445.682 90.1184 452.11 91.7074 457.82 94.84C463.246 97.8649 467.697 102.375 470.65 107.84C472.764 111.34 474.062 115.27 474.45 119.34C474.622 120.942 474.453 122.563 473.955 124.096C473.457 125.628 472.641 127.039 471.56 128.234C470.479 129.429 469.157 130.383 467.682 131.032C466.207 131.681 464.612 132.011 463 132ZM425.52 108.27C422.089 111.231 419.786 115.286 419 119.75C418.97 119.897 418.973 120.049 419.01 120.194C419.047 120.34 419.116 120.475 419.212 120.59C419.308 120.706 419.428 120.798 419.565 120.86C419.701 120.922 419.85 120.953 420 120.95H458.11C458.258 120.952 458.405 120.922 458.539 120.861C458.674 120.8 458.794 120.71 458.889 120.597C458.985 120.484 459.054 120.351 459.092 120.208C459.131 120.065 459.137 119.916 459.11 119.77C458.361 115.358 456.115 111.339 452.75 108.39C448.969 105.137 444.105 103.42 439.12 103.58C434.166 103.434 429.331 105.118 425.54 108.31L425.52 108.27Z"
        fill={color === '#FFFFFF' ? color : '#454699'}
      />
      <path
        d="M553.45 73C559.277 75.4408 564.22 79.6037 567.615 84.9314C571.011 90.2591 572.698 96.4971 572.45 102.81C572.596 109.165 570.875 115.423 567.5 120.81C564.072 126.043 559.164 130.137 553.4 132.57C547.293 135.29 540.097 136.65 531.81 136.65H514.18C513.872 136.65 513.577 136.772 513.36 136.99C513.142 137.207 513.02 137.502 513.02 137.81V151.62C513.02 154.492 511.879 157.247 509.848 159.278C507.817 161.309 505.062 162.45 502.19 162.45V162.45C499.318 162.45 496.563 161.309 494.532 159.278C492.501 157.247 491.36 154.492 491.36 151.62V82.77C491.36 79.057 492.835 75.496 495.461 72.8705C498.086 70.245 501.647 68.77 505.36 68.77H531.9C540.167 68.8034 547.35 70.2134 553.45 73ZM545.45 114.77C548.837 111.963 550.53 107.963 550.53 102.77C550.53 97.5767 548.853 93.5434 545.5 90.67C542.113 87.8634 537.167 86.46 530.66 86.46H514.18C514.026 86.4574 513.873 86.4854 513.73 86.5425C513.587 86.5996 513.457 86.6846 513.347 86.7926C513.237 86.9006 513.15 87.0294 513.09 87.1714C513.031 87.3135 513 87.466 513 87.62V117.78C513 118.088 513.122 118.383 513.34 118.6C513.557 118.818 513.852 118.94 514.16 118.94H530.64C537.16 118.94 542.113 117.537 545.5 114.73L545.45 114.77Z"
        fill={color === '#FFFFFF' ? color : '#454699'}
      />
      <path
        d="M608.25 157.7C600.673 153.72 594.338 147.732 589.94 140.39C585.489 132.895 583.198 124.316 583.32 115.6C583.198 106.884 585.489 98.3047 589.94 90.81C594.339 83.4691 600.674 77.4804 608.25 73.5C616.377 69.3702 625.364 67.2178 634.48 67.2178C643.596 67.2178 652.583 69.3702 660.71 73.5C668.339 77.5711 674.718 83.6384 679.165 91.0536C683.613 98.4688 685.963 106.953 685.963 115.6C685.963 124.247 683.613 132.731 679.165 140.146C674.718 147.562 668.339 153.629 660.71 157.7C652.583 161.828 643.596 163.98 634.48 163.98C625.364 163.98 616.377 161.828 608.25 157.7V157.7ZM649.48 141.7C653.902 139.211 657.545 135.541 660 131.1C662.501 126.316 663.807 120.998 663.807 115.6C663.807 110.202 662.501 104.884 660 100.1C657.558 95.6515 653.926 91.9707 649.51 89.47C644.916 86.9712 639.77 85.6621 634.54 85.6621C629.31 85.6621 624.164 86.9712 619.57 89.47C615.154 91.9703 611.522 95.6511 609.08 100.1C606.579 104.884 605.273 110.202 605.273 115.6C605.273 120.998 606.579 126.316 609.08 131.1C611.522 135.548 615.154 139.229 619.57 141.73C624.163 144.231 629.31 145.541 634.54 145.541C639.77 145.541 644.917 144.231 649.51 141.73L649.48 141.7Z"
        fill={color === '#FFFFFF' ? color : '#454699'}
      />
    </g>
    <defs>
      <linearGradient
        id="paint0_linear_203_2"
        x1="64.77"
        y1="238.11"
        x2="64.77"
        y2="-6.87995"
        gradientUnits="userSpaceOnUse"
      >
        <stop stopColor="#454699" />
        <stop offset="1" stopColor="#6264D9" />
      </linearGradient>
      <linearGradient
        id="paint1_linear_203_2"
        x1="113.23"
        y1="238.11"
        x2="113.23"
        y2="-6.87998"
        gradientUnits="userSpaceOnUse"
      >
        <stop stopColor="#454699" />
        <stop offset="1" stopColor="#6264D9" />
      </linearGradient>
      <linearGradient
        id="paint2_linear_203_2"
        x1="88.37"
        y1="238.11"
        x2="88.37"
        y2="-6.87997"
        gradientUnits="userSpaceOnUse"
      >
        <stop stopColor="#454699" />
        <stop offset="1" stopColor="#6264D9" />
      </linearGradient>
      <linearGradient
        id="paint3_linear_203_2"
        x1="136.58"
        y1="238.11"
        x2="136.58"
        y2="-6.87995"
        gradientUnits="userSpaceOnUse"
      >
        <stop stopColor="#454699" />
        <stop offset="1" stopColor="#6264D9" />
      </linearGradient>
      <clipPath id="clip0_203_2">
        <rect width="685.71" height="230.25" fill="white" />
      </clipPath>
    </defs>
  </svg>
)

export default BrandLogoIcon
