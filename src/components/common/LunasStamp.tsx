import React from 'react';

interface LunasStampProps {
  className?: string;
  size?: number | string;
}

export const LunasStamp: React.FC<LunasStampProps> = ({
  className = '',
  size = 110,
}) => {
  return (
    <div
      className={`inline-flex items-center justify-center select-none ${className}`}
      style={{
        width: size,
        height: size,
        transform: 'rotate(-7deg)',
      }}
    >
      <svg
        viewBox="0 0 340 340"
        className="w-full h-full drop-shadow-xs"
        style={{ overflow: 'visible' }}
      >
        <defs>
          {/* Authentic stamp distress/rough edge filter */}
          <filter id="grungeDistress" x="-10%" y="-10%" width="120%" height="120%">
            <feTurbulence
              type="fractalNoise"
              baseFrequency="0.05"
              numOctaves="3"
              result="noise"
            />
            <feDisplacementMap
              in="SourceGraphic"
              in2="noise"
              scale="3"
              xChannelSelector="R"
              yChannelSelector="G"
              result="displaced"
            />
            <feMerge>
              <feMergeNode in="displaced" />
            </feMerge>
          </filter>

          {/* Top arc path for TERIMA */}
          <path
            id="terimaPath"
            d="M 68,170 A 102,102 0 0,1 272,170"
            fill="none"
          />

          {/* Bottom arc path for KASIH */}
          <path
            id="kasihPath"
            d="M 68,170 A 102,102 0 0,0 272,170"
            fill="none"
          />
        </defs>

        <g filter="url(#grungeDistress)">
          {/* Main outer circle */}
          <circle
            cx="170"
            cy="170"
            r="102"
            fill="none"
            stroke="#EA1E24"
            strokeWidth="7"
            strokeLinecap="round"
          />

          {/* Top text: TERIMA */}
          <text
            fill="#EA1E24"
            fontSize="31"
            fontWeight="900"
            fontFamily="'Arial Black', Impact, sans-serif"
            letterSpacing="6px"
          >
            <textPath href="#terimaPath" startOffset="50%" textAnchor="middle">
              TERIMA
            </textPath>
          </text>

          {/* Top 3 Stars */}
          <text
            x="170"
            y="108"
            textAnchor="middle"
            fill="#EA1E24"
            fontSize="14"
            fontWeight="bold"
            letterSpacing="6px"
          >
            ★ ★ ★
          </text>

          {/* Bottom 3 Stars */}
          <text
            x="170"
            y="238"
            textAnchor="middle"
            fill="#EA1E24"
            fontSize="14"
            fontWeight="bold"
            letterSpacing="6px"
          >
            ★ ★ ★
          </text>

          {/* Bottom text: KASIH */}
          <text
            fill="#EA1E24"
            fontSize="31"
            fontWeight="900"
            fontFamily="'Arial Black', Impact, sans-serif"
            letterSpacing="6px"
          >
            <textPath href="#kasihPath" startOffset="50%" textAnchor="middle">
              KASIH
            </textPath>
          </text>

          {/* Center Badge / Rounded Rectangle with white background to overlap circle */}
          <rect
            x="20"
            y="120"
            width="300"
            height="100"
            rx="30"
            ry="30"
            fill="#FFFFFF"
            stroke="#EA1E24"
            strokeWidth="7.5"
          />

          {/* Inner contour / cut line for LUNAS badge */}
          <rect
            x="24"
            y="124"
            width="292"
            height="92"
            rx="26"
            ry="26"
            fill="none"
            stroke="#EA1E24"
            strokeWidth="1.5"
            opacity="0.3"
          />

          {/* LUNAS text - bold outlined hollow style like the original stamp */}
          <text
            x="170"
            y="194"
            textAnchor="middle"
            fontSize="72"
            fontWeight="950"
            fontFamily="'Arial Black', Impact, sans-serif"
            letterSpacing="4px"
            fill="#FFFFFF"
            stroke="#EA1E24"
            strokeWidth="6.5"
            strokeLinejoin="round"
            paintOrder="stroke fill"
          >
            LUNAS
          </text>

          {/* Red fill overlay with inner stroke for crisp hollow typography */}
          <text
            x="170"
            y="194"
            textAnchor="middle"
            fontSize="72"
            fontWeight="950"
            fontFamily="'Arial Black', Impact, sans-serif"
            letterSpacing="4px"
            fill="none"
            stroke="#EA1E24"
            strokeWidth="2"
          >
            LUNAS
          </text>
        </g>
      </svg>
    </div>
  );
};
