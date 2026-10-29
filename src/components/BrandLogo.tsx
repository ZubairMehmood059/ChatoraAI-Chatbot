import React from 'react';

export const BrandLogo: React.FC<{ size?: number; className?: string }> = ({ size = 28, className = '' }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 32 32"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    aria-hidden="true"
  >
    {/* Speech Bubble in Primary Green */}
    <path
      fill="var(--primary)"
      d="M8 3h16a5 5 0 0 1 5 5v11a5 5 0 0 1-5 5H17l-6 5v-5H8a5 5 0 0 1-5-5V8a5 5 0 0 1 5-5z"
    />
    {/* Four-Point Spark in On-Primary */}
    <path
      fill="var(--on-primary)"
      d="M16 7.5l1.7 4.3 4.3 1.7-4.3 1.7L16 19.5l-1.7-4.3L10 13.5l4.3-1.7z"
    />
  </svg>
);
