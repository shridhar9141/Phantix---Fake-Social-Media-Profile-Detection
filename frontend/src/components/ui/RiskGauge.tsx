import React from 'react';

interface RiskGaugeProps {
  score: number; // 0 to 100
  size?: number; // width/height in px
  strokeWidth?: number;
  showLabel?: boolean;
}

export const RiskGauge: React.FC<RiskGaugeProps> = ({
  score,
  size = 140,
  strokeWidth = 10,
  showLabel = true,
}) => {
  const normalizedScore = Math.min(Math.max(score, 0), 100);
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (normalizedScore / 100) * circumference;

  // Determine color theme based on score
  let strokeColor = '#10b981'; // LOW - Emerald
  let riskText = 'LOW RISK';
  let glowColor = 'rgba(16, 185, 129, 0.4)';

  if (normalizedScore >= 85) {
    strokeColor = '#ef4444'; // CRITICAL - Crimson
    riskText = 'CRITICAL RISK';
    glowColor = 'rgba(239, 68, 68, 0.5)';
  } else if (normalizedScore >= 65) {
    strokeColor = '#f59e0b'; // HIGH - Amber
    riskText = 'HIGH RISK';
    glowColor = 'rgba(245, 158, 11, 0.5)';
  } else if (normalizedScore >= 40) {
    strokeColor = '#3b82f6'; // MEDIUM - Blue
    riskText = 'ELEVATED RISK';
    glowColor = 'rgba(59, 130, 246, 0.4)';
  }

  return (
    <div className="relative inline-flex flex-col items-center justify-center">
      <svg width={size} height={size} className="transform -rotate-90">
        {/* Background Track Circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="#1e293b"
          strokeWidth={strokeWidth}
          fill="transparent"
        />
        {/* Animated Score Arc */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={strokeColor}
          strokeWidth={strokeWidth}
          fill="transparent"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          style={{
            transition: 'stroke-dashoffset 1s ease-in-out',
            filter: `drop-shadow(0 0 8px ${glowColor})`,
          }}
        />
      </svg>

      {/* Inner Score Label */}
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        <span className="text-3xl font-black tracking-tight text-slate-100 font-mono">
          {normalizedScore}
        </span>
        {showLabel && (
          <span
            className="text-[9px] font-bold tracking-wider uppercase mt-0.5"
            style={{ color: strokeColor }}
          >
            {riskText}
          </span>
        )}
      </div>
    </div>
  );
};
