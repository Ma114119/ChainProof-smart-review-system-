// ChainProof Logo - Glowing blockchain-inspired logo (shield + chain + check)
import React from 'react';

const ChainProofLogo = ({ size = 32, className = '', style = {} }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 48 48"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    style={{
      filter: 'drop-shadow(0 0 8px rgba(34, 211, 238, 0.8))',
      ...style,
    }}
  >
    <defs>
      <linearGradient id="chainproof-shield-fill" x1="8" y1="4" x2="40" y2="36" gradientUnits="userSpaceOnUse">
        <stop stopColor="#0f172a" />
        <stop offset="0.5" stopColor="#1e293b" />
        <stop offset="1" stopColor="#0f172a" />
      </linearGradient>
      <linearGradient id="chainproof-stroke" x1="8" y1="4" x2="40" y2="36" gradientUnits="userSpaceOnUse">
        <stop stopColor="#22d3ee" />
        <stop offset="0.5" stopColor="#3b82f6" />
        <stop offset="1" stopColor="#8b5cf6" />
      </linearGradient>
      <linearGradient id="chainproof-cyan" x1="18" y1="22" x2="30" y2="30" gradientUnits="userSpaceOnUse">
        <stop stopColor="#22d3ee" />
        <stop offset="1" stopColor="#67e8f9" />
      </linearGradient>
    </defs>
    {/* Shield base */}
    <path
      d="M24 4L8 10v12c0 11 8 18 16 22 8-4 16-11 16-22V10L24 4z"
      fill="url(#chainproof-shield-fill)"
      stroke="url(#chainproof-stroke)"
      strokeWidth="1.5"
      strokeLinejoin="round"
    />
    {/* Chain links + check */}
    <path
      d="M18 22h4v4h-4zM26 22h4v4h-4zM18 26l4 4 8-8"
      fill="none"
      stroke="url(#chainproof-cyan)"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export default ChainProofLogo;
