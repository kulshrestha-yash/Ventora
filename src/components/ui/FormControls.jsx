// src/components/ui/FormControls.jsx
import React, { forwardRef } from "react";

export const Input = forwardRef(function Input(
  { error, className = "", ...props },
  ref
) {
  return (
    <input
      ref={ref}
      className={`w-full h-10 px-3 py-2 text-sm bg-surface border rounded-lg transition-colors placeholder:text-ink-faint focus:outline-none focus:ring-2 focus:ring-primary/20 ${
        error
          ? "border-danger focus:border-danger focus:ring-danger/20"
          : "border-line focus:border-primary"
      } ${className}`}
      {...props}
    />
  );
});

export const Textarea = forwardRef(function Textarea(
  { error, className = "", ...props },
  ref
) {
  return (
    <textarea
      ref={ref}
      className={`w-full p-3 text-sm bg-surface border rounded-lg transition-colors placeholder:text-ink-faint focus:outline-none focus:ring-2 focus:ring-primary/20 leading-relaxed ${
        error
          ? "border-danger focus:border-danger focus:ring-danger/20"
          : "border-line focus:border-primary"
      } ${className}`}
      {...props}
    />
  );
});

export const Select = forwardRef(function Select(
  { children, error, className = "", ...props },
  ref
) {
  return (
    <select
      ref={ref}
      className={`w-full h-10 px-3 py-2 text-sm bg-surface border rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer ${
        error
          ? "border-danger focus:border-danger focus:ring-danger/20"
          : "border-line focus:border-primary"
      } ${className}`}
      {...props}
    >
      {children}
    </select>
  );
});

export function Field({
  label,
  helper,
  error,
  required = false,
  counter,
  children,
  className = "",
  id
}) {
  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      {label && (
        <div className="flex items-center justify-between">
          <label htmlFor={id} className="text-sm font-medium text-ink">
            {label}
            {required && <span className="text-danger ml-1">*</span>}
          </label>
        </div>
      )}
      {children}
      <div className="flex items-center justify-between gap-2 min-h-[18px]">
        {error ? (
          <p className="text-xs text-danger font-medium">{error}</p>
        ) : helper ? (
          <p className="text-xs text-ink-muted">{helper}</p>
        ) : (
          <span />
        )}
        {counter && (
          <span className="text-xs text-ink-muted font-mono shrink-0 ml-auto">
            {counter}
          </span>
        )}
      </div>
    </div>
  );
}
