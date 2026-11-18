interface OmniCorpLogoProps {
  className?: string;
}

/** OmniCorp brand mark: an "O" ring with an orbiting spark. */
export function OmniCorpLogo({ className = 'h-9 w-9' }: OmniCorpLogoProps) {
  return (
    <svg viewBox="0 0 64 64" className={className} role="img" aria-label="OmniCorp logo">
      <defs>
        <linearGradient id="omnicorp-gradient" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#4f46e5" />
          <stop offset="1" stopColor="#06b6d4" />
        </linearGradient>
      </defs>
      <rect width="64" height="64" rx="14" fill="url(#omnicorp-gradient)" />
      <circle cx="32" cy="32" r="15" fill="none" stroke="#fff" strokeWidth="6" />
      <circle cx="43" cy="21" r="5" fill="#fff" />
    </svg>
  );
}
