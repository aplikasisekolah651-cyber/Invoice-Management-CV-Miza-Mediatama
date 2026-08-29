import React from 'react';

interface MizaLogoIconProps {
  className?: string;
  size?: number | string;
}

/**
 * High-definition vector rendition of the CV. MIZA MEDIATAMA circuit-M logo mark
 */
export const MizaLogoIcon: React.FC<MizaLogoIconProps> = ({ className = 'h-10 w-auto', size }) => {
  return (
    <svg
      viewBox="0 0 110 95"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={size ? { height: size, width: 'auto' } : undefined}
    >
      {/* Black lower circuit path with circular terminal nodes */}
      <circle cx="12" cy="38" r="7" fill="#000000" />
      <circle cx="12" cy="38" r="3.2" fill="#FFFFFF" />
      
      <circle cx="98" cy="38" r="7" fill="#00AEEF" />
      <circle cx="98" cy="38" r="3.2" fill="#FFFFFF" />

      {/* Black angled base stroke */}
      <path
        d="M12 38 L38 78 L55 52 L72 78 L98 38"
        stroke="#000000"
        strokeWidth="11"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Cyan vibrant upper chevron stroke */}
      <path
        d="M26 48 L48 14 L65 42 L82 14 L98 38"
        stroke="#00AEEF"
        strokeWidth="11"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};

interface MizaBrandHeaderProps {
  logoUrl?: string;
  companyName?: string;
  tagline?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  showTagline?: boolean;
}

export const MizaBrandHeader: React.FC<MizaBrandHeaderProps> = ({
  logoUrl,
  companyName = 'CV. MIZA MEDIATAMA',
  tagline = 'KOMPUTER – ELEKTRONIK – FURNITUR – PERDAGANGAN UMUM',
  size = 'md',
  className = '',
  showTagline = true,
}) => {
  const isDefaultMiza =
    !companyName ||
    companyName.toUpperCase().includes('MIZA MEDIATAMA') ||
    companyName.toUpperCase().includes('MIZA');

  const logoHeight = size === 'sm' ? 'h-8' : size === 'lg' ? 'h-14' : 'h-11';
  const titleSize =
    size === 'sm'
      ? 'text-sm'
      : size === 'lg'
      ? 'text-2xl'
      : 'text-lg';

  const sloganText = (tagline || 'KOMPUTER – ELEKTRONIK – FURNITUR – PERDAGANGAN UMUM').toUpperCase();

  return (
    <div className={`flex flex-col ${className}`}>
      {/* Brand Lockup: Logo on left, Name on right */}
      <div className="flex items-center gap-2.5 mb-1.5">
        {logoUrl ? (
          <img
            src={logoUrl}
            alt={companyName}
            className={`${logoHeight} max-w-[140px] w-auto object-contain shrink-0`}
          />
        ) : (
          <MizaLogoIcon className={`${logoHeight} shrink-0`} />
        )}

        <div className="min-w-0">
          {isDefaultMiza ? (
            <h1 className={`${titleSize} font-black tracking-tight leading-none uppercase font-sans`}>
              <span className="text-black">CV.</span>
              <span className="text-[#00AEEF]">MIZA</span>{' '}
              <span className="text-black">MEDIATAMA</span>
            </h1>
          ) : (
            <h1 className={`${titleSize} font-black tracking-tight text-slate-900 leading-none`}>
              {companyName}
            </h1>
          )}

          {showTagline && sloganText && (
            <p className="text-[9.5px] font-bold text-slate-800 tracking-wide uppercase leading-tight mt-1 truncate">
              {sloganText}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
