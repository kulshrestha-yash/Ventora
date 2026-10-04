// src/components/ui/CardsAndBadges.jsx
import React from "react";
import { Coins, Sparkles, CheckCircle2 } from "lucide-react";

export function Card({
  children,
  variant = "default",
  className = "",
  onClick,
  ...props
}) {
  const isInteractive = variant === "interactive" || !!onClick;

  return (
    <div
      onClick={onClick}
      className={`bg-surface border border-line rounded-xl p-5 shadow-card ${
        isInteractive
          ? "cursor-pointer transition-all duration-200 hover:shadow-pop hover:-translate-y-0.5 hover:border-line-strong"
          : ""
      } ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

export function Badge({
  children,
  tone = "neutral",
  size = "md",
  className = ""
}) {
  const tones = {
    "primary-soft": "bg-primary-soft text-primary border-primary/20",
    "success-soft": "bg-success-soft text-success border-success/20",
    "warning-soft": "bg-warning-soft text-warning border-warning/20",
    "danger-soft": "bg-danger-soft text-danger border-danger/20",
    "neutral": "bg-surface-subtle text-ink-secondary border-line"
  };

  const sizes = {
    sm: "text-[11px] px-2 py-0.5",
    md: "text-xs px-2.5 py-0.5"
  };

  return (
    <span
      className={`inline-flex items-center gap-1 font-medium rounded-full border ${tones[tone] || tones.neutral} ${sizes[size] || sizes.md} ${className}`}
    >
      {children}
    </span>
  );
}

export function Tag({
  children,
  className = ""
}) {
  return (
    <span
      className={`inline-flex items-center text-xs font-medium px-2 py-0.5 rounded-md bg-surface-subtle text-ink-secondary border border-line ${className}`}
    >
      {children}
    </span>
  );
}

export function ScoreChip({
  score = 0,
  band = "developing",
  className = ""
}) {
  const dots = {
    strong: "bg-success",
    developing: "bg-warning",
    weak: "bg-danger"
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full bg-surface border border-line shadow-sm text-ink ${className}`}
    >
      <span className={`w-2 h-2 rounded-full ${dots[band] || "bg-warning"}`} />
      <span>AI score {score}</span>
    </span>
  );
}

export function TokenChip({
  balance = 0,
  className = ""
}) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full bg-warning-soft text-amber-900 border border-warning/30 shadow-sm ${className}`}
    >
      <Coins className="w-3.5 h-3.5 text-warning shrink-0" />
      <span className="tabular-nums font-mono">{balance} Tokens</span>
    </span>
  );
}

export function MatchRing({
  percent = 100,
  className = ""
}) {
  return (
    <span
      className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-md bg-primary-soft text-primary border border-primary/20 ${className}`}
    >
      <Sparkles className="w-3 h-3 text-primary shrink-0" />
      <span>Match: {percent}%</span>
    </span>
  );
}

export function StatCard({
  label,
  value,
  subtext,
  icon: Icon,
  onClick,
  className = ""
}) {
  return (
    <Card
      variant={onClick ? "interactive" : "default"}
      onClick={onClick}
      className={`flex flex-col justify-between ${className}`}
    >
      <div className="flex items-center justify-between text-ink-muted mb-2">
        <span className="text-xs font-semibold uppercase tracking-wider">{label}</span>
        {Icon && <Icon className="w-4 h-4 text-ink-muted" />}
      </div>
      <div className="text-3xl font-bold tracking-tight text-ink tabular-nums">
        {value}
      </div>
      {subtext && (
        <div className="text-xs text-ink-muted mt-1.5">{subtext}</div>
      )}
    </Card>
  );
}
