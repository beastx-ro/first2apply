type IconProps = React.HTMLAttributes<SVGElement>

export const Icons = {
  logo: (props: IconProps) => (
    <svg
      version="1.0"
      xmlns="http://www.w3.org/2000/svg"
      width="752.000000pt"
      height="752.000000pt"
      viewBox="150 150 472 452"
      preserveAspectRatio="xMidYMid meet"
      fill="currentColor"
      {...props}
    >
      <g
        transform="translate(0.000000,752.000000) scale(0.100000,-0.100000)"
        stroke="none"
      >
        <path
          d="M5799 5751 c-520 -299 -4122 -2430 -4144 -2452 -24 -24 -28 -32 -19
-47 6 -9 24 -20 40 -23 16 -4 306 -7 644 -8 l615 -1 355 -744 c370 -777 372
-782 420 -756 18 9 727 1008 732 1031 2 7 -146 46 -402 105 -223 51 -406 94
-407 94 -2 0 -4 -207 -5 -459 l-3 -459 -293 615 c-241 505 -291 618 -280 628
60 55 2788 2483 2802 2495 21 16 22 17 -1272 -1605 -491 -616 -889 -1121 -885
-1122 54 -17 1637 -375 1660 -376 39 -1 85 29 96 64 9 27 438 3061 434 3066
-2 1 -41 -19 -88 -46z"
        />
      </g>
    </svg>
  ),
  spinner: (props: IconProps) => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
    </svg>
  ),
  spinner2: (props: IconProps) => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      {...props}
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      ></circle>
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      ></path>
    </svg>
  ),
}
