// src/lib/ai/scoringConfig.js
// Configuration for the 9 AI idea completeness dimensions

export const SCORING_SECTIONS = [
  { key: "problem", step: 2, weight: 12, minWords: 25, goodWords: 60, name: "Problem Statement" },
  { key: "solution", step: 3, weight: 14, minWords: 25, goodWords: 60, name: "Proposed Solution" },
  { key: "targetUsers", step: 4, weight: 10, minWords: 15, goodWords: 40, name: "Target Users" },
  { key: "market", step: 5, weight: 12, minWords: 20, goodWords: 50, name: "Market & Opportunity" },
  { key: "competitors", step: 5, weight: 10, minWords: 15, goodWords: 40, name: "Competitors & Alternatives" },
  { key: "businessModel", step: 6, weight: 12, minWords: 20, goodWords: 50, name: "Business Model" },
  { key: "revenueModel", step: 6, weight: 12, minWords: 15, goodWords: 40, name: "Revenue Model" },
  { key: "fundingUse", step: 7, weight: 10, minWords: 12, goodWords: 30, name: "Funding Allocation" },
  { key: "growth", step: 7, weight: 8, minWords: 12, goodWords: 30, name: "Growth Potential" }
];
