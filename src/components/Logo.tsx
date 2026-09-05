export function Logo({ size = 34 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="fm-logo-grad" x1="0" y1="0" x2="40" y2="40">
          <stop offset="0%" stopColor="#5b8dee" />
          <stop offset="100%" stopColor="#7c5cfc" />
        </linearGradient>
      </defs>
      <path
        d="M20 2 L36 9 V20 C36 30 29 36 20 38 C11 36 4 30 4 20 V9 Z"
        fill="url(#fm-logo-grad)"
      />
      <path
        d="M14 20 L18.5 24.5 L27 15"
        stroke="white"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
  )
}
