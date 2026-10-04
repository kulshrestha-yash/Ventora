// src/lib/ai/feedbackTips.js
// Rule-based feedback tips library per section for missing and weak states

export const FEEDBACK_TIPS = {
  problem: {
    missing: "Describe the problem: who feels it, how often, and what it costs them today.",
    weak: "Add specifics — the user, the frequency, and the current workaround's cost."
  },
  solution: {
    missing: "Explain your product's approach in plain words. No confidential implementation details needed.",
    weak: "Clarify the core mechanism — what happens when a user uses your product?"
  },
  targetUsers: {
    missing: "Define your first 100 users: role, context, and where to find them.",
    weak: "Narrow it down: a specific segment beats 'everyone'."
  },
  market: {
    missing: "Estimate market size and growth — even a top-down estimate with sources.",
    weak: "Add a concrete market size or growth figure (a number)."
  },
  competitors: {
    missing: "List 2–3 alternatives (including 'doing it manually') and your differentiator.",
    weak: "Name at least 2 competitors or alternatives."
  },
  businessModel: {
    missing: "Explain who pays and through which channel.",
    weak: "State whether you are B2B, B2C, a marketplace, or another model."
  },
  revenueModel: {
    missing: "Quantify revenue: price point, billing frequency, expected margin.",
    weak: "Quantify pricing — who pays, how much, how often."
  },
  fundingUse: {
    missing: "Break the raise into rough allocation buckets.",
    weak: "Add numbers — e.g. 40% product, 30% growth, 30% ops."
  },
  growth: {
    missing: "Sketch the expansion path: new segments, geographies, or product lines.",
    weak: "Name one concrete expansion trigger (e.g. 'after 50 paying clinics')."
  }
};
