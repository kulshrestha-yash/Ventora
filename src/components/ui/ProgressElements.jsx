// src/components/ui/ProgressElements.jsx
import React, { useEffect, useState } from "react";
import { Lock } from "lucide-react";
import { Badge } from "./CardsAndBadges.jsx";

export function ProgressRing({
  score = 0,
  band = "developing",
  size = 140,
  stroke = 10,
  label = "Completeness score / 100"
}) {
  const [animatedScore, setAnimatedScore] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => {
      setAnimatedScore(score);
    }, 50);
    return () => clearTimeout(timer);
  }, [score]);

  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (animatedScore / 100) * circumference;

  const bandColors = {
    strong: "#059669",     // success
    developing: "#D97706", // warning
    weak: "#DC2626"        // danger
  };

  const strokeColor = bandColors[band] || bandColors.developing;

  return (
    <div className="flex flex-col items-center justify-center text-center">
      <div className="relative inline-flex items-center justify-center">
        <svg width={size} height={size} className="transform -rotate-90">
          {/* Background circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="#E5E7EB"
            strokeWidth={stroke}
            fill="transparent"
          />
          {/* Animated stroke */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={strokeColor}
            strokeWidth={stroke}
            fill="transparent"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            className="transition-all duration-700 ease-out"
          />
        </svg>
        <div className="absolute flex flex-col items-center justify-center">
          <span className="text-4xl font-extrabold text-ink tabular-nums tracking-tight">
            {score}
          </span>
          <span className="text-[11px] font-semibold text-ink-muted uppercase tracking-wider">
            / 100
          </span>
        </div>
      </div>
      {label && (
        <span className="text-xs font-medium text-ink-muted mt-3">
          {label}
        </span>
      )}
    </div>
  );
}

export function ProgressBar({
  value = 0,
  max = 100,
  tone = "primary",
  className = ""
}) {
  const percent = Math.min(100, Math.max(0, (value / max) * 100));

  const tones = {
    primary: "bg-primary",
    success: "bg-success",
    warning: "bg-warning",
    danger: "bg-danger",
    violet: "bg-violet"
  };

  return (
    <div className={`w-full h-2 bg-line rounded-full overflow-hidden ${className}`}>
      <div
        className={`h-full rounded-full transition-all duration-300 ease-out ${tones[tone] || tones.primary}`}
        style={{ width: `${percent}%` }}
      />
    </div>
  );
}

export function LockedRow({
  title,
  subtitle,
  reason = "Requires accepted connection request",
  className = ""
}) {
  return (
    <div
      className={`flex items-center justify-between p-3.5 rounded-lg border border-dashed border-line bg-surface-subtle/80 ${className}`}
    >
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-surface border border-line flex items-center justify-center text-ink-muted shrink-0">
          <Lock className="w-4 h-4" />
        </div>
        <div>
          <div className="text-sm font-medium text-ink select-none filter blur-[0.5px]">
            {title}
          </div>
          {subtitle ? (
            <div className="text-xs text-ink-muted select-none filter blur-[0.5px]">
              {subtitle}
            </div>
          ) : (
            <div className="text-xs text-ink-muted">{reason}</div>
          )}
        </div>
      </div>
      <Badge tone="neutral" size="sm">
        <Lock className="w-3 h-3 mr-1 text-ink-muted" />
        LOCKED
      </Badge>
    </div>
  );
}
