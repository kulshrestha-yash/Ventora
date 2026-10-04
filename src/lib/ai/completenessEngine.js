// src/lib/ai/completenessEngine.js
// Pure, deterministic AI Idea Completeness Engine (spec §8.1)

import { SCORING_SECTIONS } from "./scoringConfig.js";
import { FEEDBACK_TIPS } from "./feedbackTips.js";

/**
 * Deterministically analyzes a startup idea and computes a completeness score.
 * Pure function: same input ALWAYS produces the exact same score.
 *
 * @param {object} idea
 * @returns {object} { total, band, sections, flags, suggestions, canPublish, engine: "rules", scoredAt }
 */
export function analyzeIdea(idea) {
  const sectionsContent = idea?.sections || {};
  const funding = idea?.funding || { amount: 0 };
  const notRaising = funding.amount === 0;

  const sectionResults = {};
  const flags = [];
  const weakOrMissingKeys = [];

  let totalWeightedScore = 0;

  for (const config of SCORING_SECTIONS) {
    const { key, weight, minWords, goodWords, name } = config;
    const rawText = (sectionsContent[key] || "").trim();
    const words = rawText ? rawText.split(/\s+/).filter(Boolean).length : 0;

    let points = 0;
    let status = "missing";

    if (words === 0) {
      points = 0;
      status = "missing";
    } else if (words < minWords) {
      points = 30;
      status = "weak";
    } else if (words < goodWords) {
      points = 65;
      status = "partial";
    } else {
      points = 100;
      status = "strong";
    }

    let penalty = 0;
    let sectionFlag = null;

    // Apply deterministic section-specific checks
    if (words > 0) {
      if (key === "market") {
        if (!/\d/.test(rawText)) {
          penalty = 15;
          sectionFlag = "Add a concrete market size or growth figure (a number).";
        }
      } else if (key === "competitors") {
        const lines = rawText.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
        if (lines.length < 2) {
          penalty = 20;
          sectionFlag = "Name at least 2 competitors or alternatives (one per line).";
        }
      } else if (key === "revenueModel") {
        if (!/\d/.test(rawText)) {
          penalty = 15;
          sectionFlag = "Quantify pricing — who pays, how much, how often.";
        }
      } else if (key === "businessModel") {
        const tokens = ["b2b", "b2c", "marketplace", "subscription", "commission"];
        const lower = rawText.toLowerCase();
        const hasToken = tokens.some((t) => lower.includes(t));
        if (!hasToken) {
          penalty = 10;
          sectionFlag = "State whether you are B2B, B2C, a marketplace, or another model.";
        }
      } else if (key === "fundingUse") {
        if (notRaising) {
          // Spec §8.1.2: if funding.amount === 0 (not raising), score strong if >= minWords, else partial
          points = words >= minWords ? 100 : 65;
          penalty = 0;
        } else if (!/\d/.test(rawText)) {
          penalty = 15;
          sectionFlag = "Break down the raise into rough allocation buckets with numbers.";
        }
      }

      // Subtract penalty, floored at partial (65) if initially strong
      if (penalty > 0) {
        if (points >= 100) {
          points = Math.max(65, points - penalty);
        } else {
          points = Math.max(30, points - penalty);
        }
      }

      // Re-evaluate status based on final points
      if (points >= 85) {
        status = "strong";
      } else if (points >= 55) {
        status = "partial";
      } else if (points > 0) {
        status = "weak";
      }
    }

    if (sectionFlag) {
      flags.push({ section: key, name, message: sectionFlag });
    }

    // Determine tip
    let tip = null;
    if (status === "missing") {
      tip = FEEDBACK_TIPS[key]?.missing || "This section is required for scoring.";
      weakOrMissingKeys.push(key);
    } else if (status === "weak") {
      tip = sectionFlag || FEEDBACK_TIPS[key]?.weak || "Add more details to strengthen this section.";
      weakOrMissingKeys.push(key);
    } else if (sectionFlag) {
      tip = sectionFlag;
    }

    sectionResults[key] = {
      name,
      points,
      weight,
      status,
      words,
      tip
    };

    totalWeightedScore += (points / 100) * weight;
  }

  const total = Math.round(totalWeightedScore);

  let band = "weak";
  if (total >= 70) {
    band = "strong";
  } else if (total >= 40) {
    band = "developing";
  } else {
    band = "weak";
  }

  // Publish gate: total >= 50 and no section has status "missing"
  const hasMissing = Object.values(sectionResults).some((s) => s.status === "missing");
  const canPublish = total >= 50 && !hasMissing;

  // Assembly of suggestions
  const suggestions = [];
  for (const k of weakOrMissingKeys) {
    const sr = sectionResults[k];
    if (sr?.tip) {
      suggestions.push({
        key: k,
        name: sr.name,
        status: sr.status,
        tip: sr.tip
      });
    }
  }

  return {
    total,
    band,
    sections: sectionResults,
    flags,
    suggestions,
    weakOrMissingKeys,
    canPublish,
    engine: "rules",
    scoredAt: new Date().toISOString()
  };
}
