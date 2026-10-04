// src/components/ui/LayoutPrimitives.jsx
import React, { useEffect } from "react";
import { Check, ShieldCheck, X } from "lucide-react";
import { Button } from "./Button.jsx";

// Fixed 8-color pastel palette for deterministic avatar hues
const PASTEL_HUES = [
  "bg-indigo-100 text-indigo-700 border-indigo-200",
  "bg-emerald-100 text-emerald-700 border-emerald-200",
  "bg-amber-100 text-amber-800 border-amber-200",
  "bg-rose-100 text-rose-700 border-rose-200",
  "bg-purple-100 text-purple-700 border-purple-200",
  "bg-cyan-100 text-cyan-700 border-cyan-200",
  "bg-teal-100 text-teal-700 border-teal-200",
  "bg-orange-100 text-orange-800 border-orange-200"
];

export function Avatar({
  name = "User",
  code,
  hue = 0,
  size = "md",
  verified = false,
  className = ""
}) {
  const initials = (name || "U")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join("");

  const sizes = {
    sm: "w-8 h-8 text-xs",
    md: "w-10 h-10 text-sm",
    lg: "w-14 h-14 text-lg font-bold"
  };

  const hueClass = PASTEL_HUES[Math.abs(hue) % PASTEL_HUES.length];

  return (
    <div className={`relative inline-flex shrink-0 ${className}`}>
      <div
        className={`rounded-full border flex items-center justify-center font-semibold select-none ${sizes[size] || sizes.md} ${hueClass}`}
        title={name}
      >
        {initials}
      </div>
      {verified && (
        <span
          className="absolute -bottom-0.5 -right-0.5 bg-success text-white rounded-full p-0.5 border-2 border-surface"
          title="KYC Verified"
        >
          <ShieldCheck className="w-3 h-3" />
        </span>
      )}
    </div>
  );
}

export function Stepper({
  steps = [],
  currentStep = 1,
  onStepClick,
  variant = "horizontal",
  className = ""
}) {
  if (variant === "vertical") {
    return (
      <nav aria-label="Progress" className={`flex flex-col gap-2 ${className}`}>
        {steps.map((step, idx) => {
          const stepNumber = idx + 1;
          const isDone = stepNumber < currentStep;
          const isCurrent = stepNumber === currentStep;

          return (
            <button
              key={step.id || idx}
              type="button"
              disabled={!onStepClick}
              onClick={() => onStepClick && onStepClick(stepNumber)}
              className={`flex items-start gap-3 p-2.5 rounded-lg text-left transition-colors ${
                isCurrent
                  ? "bg-primary-soft text-primary font-medium"
                  : "text-ink-secondary hover:bg-surface-subtle"
              }`}
            >
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center text-xs shrink-0 mt-0.5 transition-colors ${
                  isDone
                    ? "bg-primary text-white"
                    : isCurrent
                    ? "border-2 border-primary text-primary font-bold"
                    : "border border-line text-ink-muted bg-surface"
                }`}
              >
                {isDone ? <Check className="w-3.5 h-3.5" /> : stepNumber}
              </div>
              <div className="flex-1 min-w-0">
                <div className={`text-xs font-semibold ${isCurrent ? "text-primary" : "text-ink"}`}>
                  {step.title}
                </div>
                {step.subtitle && (
                  <div className="text-[11px] text-ink-muted truncate">
                    {step.subtitle}
                  </div>
                )}
              </div>
            </button>
          );
        })}
      </nav>
    );
  }

  // Horizontal stepper
  return (
    <div className={`flex items-center gap-2 overflow-x-auto pb-2 ${className}`}>
      {steps.map((step, idx) => {
        const stepNumber = idx + 1;
        const isDone = stepNumber < currentStep;
        const isCurrent = stepNumber === currentStep;

        return (
          <React.Fragment key={step.id || idx}>
            <div
              className={`flex items-center gap-2 shrink-0 ${
                isCurrent ? "text-primary font-semibold" : "text-ink-muted"
              }`}
            >
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${
                  isDone
                    ? "bg-primary text-white"
                    : isCurrent
                    ? "bg-primary-soft border border-primary text-primary font-bold"
                    : "border border-line bg-surface text-ink-faint"
                }`}
              >
                {isDone ? <Check className="w-3.5 h-3.5" /> : stepNumber}
              </div>
              <span className="text-xs">{step.title}</span>
            </div>
            {idx < steps.length - 1 && (
              <div className="w-8 h-px bg-line shrink-0" />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}

export function Tabs({
  tabs = [],
  activeTab,
  onChange,
  className = ""
}) {
  return (
    <div className={`flex items-center gap-6 border-b border-line ${className}`}>
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onChange(tab.id)}
            className={`pb-3 text-sm font-medium transition-colors relative flex items-center gap-2 ${
              isActive
                ? "text-primary border-b-2 border-primary"
                : "text-ink-muted hover:text-ink"
            }`}
          >
            <span>{tab.label}</span>
            {tab.count !== undefined && (
              <span
                className={`text-xs px-1.5 py-0.2 rounded-full font-mono ${
                  isActive
                    ? "bg-primary-soft text-primary font-semibold"
                    : "bg-surface-subtle text-ink-muted"
                }`}
              >
                {tab.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className = ""
}) {
  return (
    <div
      className={`flex flex-col items-center justify-center text-center p-8 rounded-xl border border-line bg-surface ${className}`}
    >
      {Icon && (
        <div className="w-12 h-12 rounded-full bg-primary-soft flex items-center justify-center text-primary mb-3">
          <Icon className="w-6 h-6" />
        </div>
      )}
      <h3 className="text-base font-semibold text-ink mb-1">{title}</h3>
      <p className="text-xs text-ink-muted max-w-sm leading-relaxed mb-4">
        {description}
      </p>
      {action && (
        <Button
          variant={action.variant || "primary"}
          size="sm"
          onClick={action.onClick}
        >
          {action.label}
        </Button>
      )}
    </div>
  );
}

export function Skeleton({ className = "" }) {
  return <div className={`animate-pulse bg-surface-subtle rounded-lg ${className}`} />;
}

export function Modal({
  isOpen,
  onClose,
  title,
  children,
  footer,
  persistent = false,
  maxWidth = "max-w-md"
}) {
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === "Escape" && !persistent && onClose) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, persistent, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/40 backdrop-blur-sm animate-in fade-in duration-150">
      <div
        className={`w-full ${maxWidth} bg-surface rounded-xl shadow-pop border border-line flex flex-col max-h-[90vh] overflow-hidden`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-line">
          <h2 className="text-base font-semibold text-ink">{title}</h2>
          {!persistent && onClose && (
            <button
              type="button"
              onClick={onClose}
              className="text-ink-faint hover:text-ink p-1 rounded-md"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
        <div className="p-5 overflow-y-auto flex-1">{children}</div>
        {footer && (
          <div className="flex items-center justify-end gap-2.5 px-5 py-3.5 border-t border-line bg-surface-subtle">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}

export function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  isDestructive = false,
  loading = false
}) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      footer={
        <>
          <Button variant="secondary" size="sm" onClick={onClose} disabled={loading}>
            {cancelLabel}
          </Button>
          <Button
            variant={isDestructive ? "danger" : "primary"}
            size="sm"
            onClick={onConfirm}
            loading={loading}
          >
            {confirmLabel}
          </Button>
        </>
      }
    >
      <p className="text-sm text-ink-secondary leading-relaxed">{message}</p>
    </Modal>
  );
}
