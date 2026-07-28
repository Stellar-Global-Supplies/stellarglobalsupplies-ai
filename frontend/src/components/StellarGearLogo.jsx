/**
 * Stellar Global Supplies Brand Logo
 * Uses logo.png from public folder
 */

export default function StellarGearLogo({ size = 32, className = "" }) {
  return (
    <img
      src="/logo.png"
      alt="Stellar Global Supplies"
      width={size}
      height={size}
      className={className}
      style={{ objectFit: "contain" }}
    />
  );
}

/**
 * Compact version for avatars and small spaces
 */
export function StellarGearIcon({ size = 18, className = "" }) {
  return (
    <img
      src="/logo.png"
      alt="Stellar AI"
      width={size}
      height={size}
      className={className}
      style={{ objectFit: "contain" }}
    />
  );
}
