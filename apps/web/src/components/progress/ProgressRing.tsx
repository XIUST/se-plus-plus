import React from "react";

interface ProgressRingProps {
  percentage: number;
  size?: number;
  strokeWidth?: number;
  color?: string;
}

export function ProgressRing({
  percentage,
  size = 120,
  strokeWidth = 10,
  color = "url(#ring-gradient)"
}: ProgressRingProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (percentage / 100) * circumference;

  return (
    <div className="score-ring-container">
      <svg className="progress-ring" width={size} height={size}>
        <defs>
          <linearGradient id="ring-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="hsl(265, 85%, 65%)" />
            <stop offset="100%" stopColor="hsl(185, 75%, 55%)" />
          </linearGradient>
        </defs>
        <circle
          className="progress-ring-bg"
          strokeWidth={strokeWidth}
          r={radius}
          cx={size / 2}
          cy={size / 2}
        />
        <circle
          className="progress-ring-fill"
          strokeWidth={strokeWidth}
          stroke={color}
          strokeDasharray={`${circumference} ${circumference}`}
          strokeDashoffset={offset}
          r={radius}
          cx={size / 2}
          cy={size / 2}
        />
        <text
          className="progress-ring-text"
          x={size / 2}
          y={size / 2}
          textAnchor="middle"
          dominantBaseline="middle"
          fontSize={`${size * 0.25}px`}
        >
          {Math.round(percentage)}%
        </text>
      </svg>
    </div>
  );
}
