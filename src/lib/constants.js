// src/lib/constants.js
// Single source of truth for enumerations and platform configurations

export const INDUSTRIES = [
  "AgriTech",
  "FinTech",
  "HealthTech",
  "EdTech",
  "SaaS",
  "D2C",
  "CleanTech"
];

export const STAGES = [
  "Idea",
  "MVP",
  "Early traction",
  "Growth"
];

export const RANGES = [
  [500000, 2500000],      // ₹5L – ₹25L
  [2500000, 5000000],    // ₹25L – ₹50L
  [5000000, 10000000],   // ₹50L – ₹1Cr
  [10000000, 50000000]   // ₹1Cr – ₹5Cr
];

export const RANGE_LABELS = [
  "₹5L – ₹25L",
  "₹25L – ₹50L",
  "₹50L – ₹1Cr",
  "₹1Cr – ₹5Cr"
];

export const BIZ_MODELS = [
  "B2B",
  "B2C",
  "Marketplace",
  "Other"
];

export const INVESTOR_TYPES = [
  "Angel",
  "VC",
  "Seed fund",
  "Corporate",
  "Other"
];

// Token economics rules — future admin-configurable (spec §6.8, §8.4)
export const TOKENS = {
  STARTING_GRANT: 10,
  REQUEST_COST: 1,
  REFUND_ON_DECLINE: true
};

/**
 * Format an integer into Indian Rupee format (Lakhs / Crores / standard)
 * @param {number} amount
 * @param {boolean} [compact=false]
 */
export function formatINR(amount, compact = false) {
  if (amount === undefined || amount === null) return "₹0";
  if (amount === 0) return "₹0 (Not raising)";
  
  if (compact) {
    if (amount >= 10000000) {
      const cr = amount / 10000000;
      return `₹${Number.isInteger(cr) ? cr : cr.toFixed(1)}Cr`;
    }
    if (amount >= 100000) {
      const l = amount / 100000;
      return `₹${Number.isInteger(l) ? l : l.toFixed(1)}L`;
    }
    return `₹${amount.toLocaleString('en-IN')}`;
  }

  return `₹${amount.toLocaleString('en-IN')}`;
}

/**
 * Relative time formatter for human-readable timestamps
 * @param {string|Date} timestamp
 */
export function timeAgo(timestamp) {
  if (!timestamp) return "just now";
  const date = new Date(timestamp);
  const now = new Date();
  const seconds = Math.floor((now - date) / 1000);

  if (seconds < 5) return "just now";
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days}d ago`;

  return date.toLocaleDateString("en-IN", { month: "short", day: "numeric" });
}
