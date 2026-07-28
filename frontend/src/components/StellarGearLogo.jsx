/**
 * Stellar Global Supplies Brand Logo
 * Half gear with "C" shape and sparkle effects
 */

export default function StellarGearLogo({ size = 32, className = "" }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      fill="none"
      className={className}
    >
      <defs>
        {/* Gold gradient for gear */}
        <linearGradient id="stellar-gear-grad" x1="0" y1="0" x2="40" y2="40" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#D4AF37" />
          <stop offset="50%" stopColor="#F4D03F" />
          <stop offset="100%" stopColor="#D4AF37" />
        </linearGradient>
        {/* Light blue/purple gradient for sparkles */}
        <linearGradient id="stellar-sparkle-grad" x1="0" y1="0" x2="100%" y2="100%" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#B8D4E8" />
          <stop offset="100%" stopColor="#C4B5E8" />
        </linearGradient>
      </defs>

      {/* Half gear - left side */}
      <g transform="translate(0, 0)">
        {/* Gear teeth - left semicircle */}
        <path
          d="M8 8
             L6 4
             L10 2
             L12 6
             L16 4
             L18 8
             L22 6
             L24 10
             L26 8
             L28 12
             L28 16
             L32 18
             L32 22
             L28 24
             L28 28
             L26 32
             L24 30
             L22 34
             L18 32
             L16 36
             L12 34
             L10 38
             L6 36
             L4 32
             L8 30
             L4 28
             L2 24
             L2 20
             L4 16
             L2 12
             L4 8
             Z"
          fill="url(#stellar-gear-grad)"
        />
        {/* Inner white ring */}
        <path
          d="M8 12
             A 12 12 0 0 0 8 28
             A 12 12 0 0 0 8 12"
          stroke="white"
          strokeWidth="2.5"
          fill="none"
        />
        {/* Inner dark circle */}
        <circle cx="8" cy="20" r="7" fill="#0f1115" />
      </g>

      {/* Sparkle effects */}
      <g transform="translate(22, 14)">
        {/* Large sparkle */}
        <path
          d="M0 0 L1.5 3 L4 4.5 L1.5 6 L0 9 L-1.5 6 L-4 4.5 L-1.5 3 Z"
          fill="url(#stellar-sparkle-grad)"
          opacity="0.9"
        />
      </g>
      <g transform="translate(30, 10) scale(0.6)">
        {/* Small sparkle */}
        <path
          d="M0 0 L1.5 3 L4 4.5 L1.5 6 L0 9 L-1.5 6 L-4 4.5 L-1.5 3 Z"
          fill="url(#stellar-sparkle-grad)"
          opacity="0.7"
        />
      </g>
    </svg>
  );
}

/**
 * Compact version for avatars and small spaces
 */
export function StellarGearIcon({ size = 18, className = "" }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      fill="none"
      className={className}
    >
      <defs>
        <linearGradient id="sgi-gear-grad" x1="0" y1="0" x2="40" y2="40" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#D4AF37" />
          <stop offset="50%" stopColor="#F4D03F" />
          <stop offset="100%" stopColor="#D4AF37" />
        </linearGradient>
        <linearGradient id="sgi-sparkle-grad" x1="0" y1="0" x2="100%" y2="100%" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#B8D4E8" />
          <stop offset="100%" stopColor="#C4B5E8" />
        </linearGradient>
      </defs>

      {/* Half gear */}
      <g transform="translate(0, 0)">
        <path
          d="M8 8
             L6 4 L10 2 L12 6 L16 4 L18 8
             L22 6 L24 10 L26 8 L28 12 L28 16
             L32 18 L32 22 L28 24 L28 28
             L26 32 L24 30 L22 34 L18 32
             L16 36 L12 34 L10 38 L6 36
             L4 32 L8 30 L4 28 L2 24 L2 20
             L4 16 L2 12 L4 8 Z"
          fill="url(#sgi-gear-grad)"
        />
        <path
          d="M8 12 A 12 12 0 0 0 8 28 A 12 12 0 0 0 8 12"
          stroke="white"
          strokeWidth="2.5"
          fill="none"
        />
        <circle cx="8" cy="20" r="7" fill="#0f1115" />
      </g>

      {/* Sparkle */}
      <g transform="translate(22, 14) scale(0.8)">
        <path
          d="M0 0 L1.5 3 L4 4.5 L1.5 6 L0 9 L-1.5 6 L-4 4.5 L-1.5 3 Z"
          fill="url(#sgi-sparkle-grad)"
          opacity="0.9"
        />
      </g>
    </svg>
  );
}
