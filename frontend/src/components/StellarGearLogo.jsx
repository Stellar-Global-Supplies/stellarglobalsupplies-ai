/**
 * Stellar Global Supplies Brand Logo
 * Combines a half gear (right side) with stylized "S" letter (left side)
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
        {/* Teal gradient for the "S" letter */}
        <linearGradient id="stellar-s-grad" x1="0" y1="0" x2="40" y2="40" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#00B98E" />
          <stop offset="100%" stopColor="#00d4a4" />
        </linearGradient>
        {/* Gold gradient for the gear */}
        <linearGradient id="stellar-gear-grad" x1="0" y1="0" x2="40" y2="40" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#D4AF37" />
          <stop offset="100%" stopColor="#F4D03F" />
        </linearGradient>
      </defs>

      {/* Stylized "S" letter - left side */}
      <path
        d="M12 8
           C12 8, 18 10, 18 14
           C18 17, 14 18, 14 20
           C14 22, 20 22, 20 26
           C20 30, 12 32, 12 32"
        stroke="url(#stellar-s-grad)"
        strokeWidth="3.5"
        strokeLinecap="round"
        fill="none"
      />

      {/* Half gear - right side */}
      <g transform="translate(20, 0)">
        {/* Gear outer ring - half circle */}
        <path
          d="M20 8
             L24 10
             L26 6
             L30 8
             L32 4
             L36 6
             L36 12
             L40 14
             L40 20
             L36 22
             L36 28
             L40 30
             L40 36
             L36 38
             L32 40
             L30 36
             L26 38
             L24 34
             L20 36
             L20 32
             L16 30
             L16 24
             L20 22
             L20 16
             L16 14
             L16 8
             Z"
          fill="url(#stellar-gear-grad)"
        />
        {/* Inner circle cutout */}
        <circle cx="20" cy="20" r="6" fill="#0f1115" />
        {/* Center dot */}
        <circle cx="20" cy="20" r="2.5" fill="url(#stellar-gear-grad)" />
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
        <linearGradient id="sgi-s-grad" x1="0" y1="0" x2="40" y2="40" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#00B98E" />
          <stop offset="100%" stopColor="#00d4a4" />
        </linearGradient>
        <linearGradient id="sgi-gear-grad" x1="0" y1="0" x2="40" y2="40" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#D4AF37" />
          <stop offset="100%" stopColor="#F4D03F" />
        </linearGradient>
      </defs>

      {/* Stylized "S" letter */}
      <path
        d="M12 8
           C12 8, 18 10, 18 14
           C18 17, 14 18, 14 20
           C14 22, 20 22, 20 26
           C20 30, 12 32, 12 32"
        stroke="url(#sgi-s-grad)"
        strokeWidth="3.5"
        strokeLinecap="round"
        fill="none"
      />

      {/* Half gear */}
      <g transform="translate(20, 0)">
        <path
          d="M20 8
             L24 10 L26 6 L30 8 L32 4 L36 6
             L36 12 L40 14 L40 20 L36 22
             L36 28 L40 30 L40 36 L36 38
             L32 40 L30 36 L26 38 L24 34
             L20 36 L20 32 L16 30 L16 24
             L20 22 L20 16 L16 14 L16 8 Z"
          fill="url(#sgi-gear-grad)"
        />
        <circle cx="20" cy="20" r="6" fill="#0f1115" />
        <circle cx="20" cy="20" r="2.5" fill="url(#sgi-gear-grad)" />
      </g>
    </svg>
  );
}