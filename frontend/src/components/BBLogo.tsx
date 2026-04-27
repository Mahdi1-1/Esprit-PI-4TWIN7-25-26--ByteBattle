interface BBLogoProps {
  className?: string;
}

export function BBLogo({ className = 'h-12 w-auto' }: BBLogoProps) {
  return (
    <svg
      viewBox="0 0 420 470"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="BB League Logo"
      className={className}
    >
      <defs>
        <linearGradient id="shieldFill" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#232c39" />
          <stop offset="45%" stopColor="#2d3746" />
          <stop offset="100%" stopColor="#171d27" />
        </linearGradient>

        <linearGradient id="outerStroke" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#6f7988" />
          <stop offset="50%" stopColor="#475160" />
          <stop offset="100%" stopColor="#252d39" />
        </linearGradient>

        <linearGradient id="frameGlow" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#f4a12f" />
          <stop offset="45%" stopColor="#eb7737" />
          <stop offset="100%" stopColor="#ff4f59" />
        </linearGradient>

        <linearGradient id="frameHot" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#ffd66d" />
          <stop offset="50%" stopColor="#ff8b3c" />
          <stop offset="100%" stopColor="#ff5d64" />
        </linearGradient>

        <linearGradient id="panelFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#151c27" />
          <stop offset="100%" stopColor="#0f141d" />
        </linearGradient>

        <linearGradient id="monoFill" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#ffc342" />
          <stop offset="45%" stopColor="#f07b37" />
          <stop offset="100%" stopColor="#ff4e5c" />
        </linearGradient>

        <linearGradient id="bannerFill" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#293240" />
          <stop offset="100%" stopColor="#151c24" />
        </linearGradient>

        <linearGradient id="bannerStroke" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#6c7786" />
          <stop offset="100%" stopColor="#2d3542" />
        </linearGradient>

        <linearGradient id="bottomGlow" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#ff7c47" />
          <stop offset="50%" stopColor="#ff4a58" />
          <stop offset="100%" stopColor="#ff7c47" />
        </linearGradient>
      </defs>

      <path
        d="M210 34 C286 34 337 57 349 86 V205 C349 301 292 369 210 428 C128 369 71 301 71 205 V86 C83 57 134 34 210 34 Z"
        fill="url(#shieldFill)"
        stroke="url(#outerStroke)"
        strokeWidth="3"
      />

      <path
        d="M210 53 C276 53 320 72 331 96 V203 C331 289 280 351 210 404 C140 351 89 289 89 203 V96 C100 72 144 53 210 53 Z"
        fill="none"
        stroke="url(#frameGlow)"
        strokeWidth="13"
        strokeLinejoin="round"
      />

      <path
        d="M210 60 C272 60 313 77 323 99 V202 C323 284 276 342 210 394 C144 342 97 284 97 202 V99 C107 77 148 60 210 60 Z"
        fill="none"
        stroke="url(#frameHot)"
        strokeWidth="2.5"
        opacity="0.95"
      />

      <path
        d="M210 71 C269 71 307 86 317 108 V202 C317 277 269 333 210 383 C151 333 103 277 103 202 V108 C113 86 151 71 210 71 Z"
        fill="url(#panelFill)"
      />

      <text x="116" y="193" fontSize="112" fontFamily="Impact, Arial Black, sans-serif" fontWeight="900" letterSpacing="-5" fill="url(#monoFill)" stroke="#1a1113" strokeWidth="4" paintOrder="stroke fill">[B</text>
      <text x="177" y="222" fontSize="108" fontFamily="Impact, Arial Black, sans-serif" fontWeight="900" letterSpacing="-5" fill="url(#monoFill)" stroke="#1a1113" strokeWidth="4" paintOrder="stroke fill">B]</text>

      <path
        d="M76 218 H126 L137 206 H283 L294 218 H344 L334 268 H86 Z"
        fill="url(#bannerFill)"
        stroke="url(#bannerStroke)"
        strokeWidth="2.2"
      />

      <text
        x="210"
        y="252"
        fontSize="29"
        fontFamily="Impact, Arial Black, sans-serif"
        fontWeight="900"
        letterSpacing="1.3"
        textAnchor="middle"
        fill="#f7efe4"
      >
        BB LEAGUE
      </text>

      <path
        d="M142 301 Q210 352 278 301"
        fill="none"
        stroke="url(#bottomGlow)"
        strokeWidth="9"
        strokeLinecap="round"
        opacity="0.95"
      />
    </svg>
  );
}
