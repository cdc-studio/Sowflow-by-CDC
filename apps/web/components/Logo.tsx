import { cn } from "@/lib/utils";

interface LogoProps {
  className?: string;
  iconOnly?: boolean;
  size?: number;
}

export function Logo({ className, iconOnly = false, size = 28 }: LogoProps) {
  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 28 28"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
        className="shrink-0"
      >
        <defs>
          <linearGradient id="sowflow-mark-gradient" x1="0" y1="0" x2="28" y2="28" gradientUnits="userSpaceOnUse">
            <stop stopColor="#818CF8" />
            <stop offset="1" stopColor="#38BDF8" />
          </linearGradient>
          <filter id="sowflow-mark-glow" x="-75%" y="-75%" width="250%" height="250%">
            <feGaussianBlur stdDeviation="2.2" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        <rect width="28" height="28" rx="8" fill="url(#sowflow-mark-gradient)" />
        <g filter="url(#sowflow-mark-glow)">
          <path
            d="M7.5 16.5c0-2.2 1.7-3.3 3.9-3.3s3.7 1.3 5.6 1.3 3.5-1 3.5-3"
            stroke="white"
            strokeWidth="1.8"
            strokeLinecap="round"
            fill="none"
          />
          <path
            d="M7.5 11.2c0-2.2 1.7-3.3 3.9-3.3s3.7 1.3 5.6 1.3 3.5-1 3.5-3"
            stroke="white"
            strokeWidth="1.8"
            strokeLinecap="round"
            fill="none"
            opacity="0.55"
          />
        </g>
      </svg>
      {!iconOnly && <span className="text-sm font-semibold tracking-tight">SOWFlow</span>}
    </span>
  );
}
