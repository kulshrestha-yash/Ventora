// src/lib/matching.js
// Personalized Investor Feed matching and ranking algorithm (spec §8.2)

/**
 * Calculates match percentage between an idea and an investor's preferences.
 * 
 * @param {object} idea
 * @param {object} prefs
 * @returns {number} 0 - 100
 */
export function calculateMatchPercentage(idea, prefs) {
  if (!prefs || !prefs.industries || prefs.industries.length === 0) {
    return 100; // Unranked/neutral if preferences skipped
  }

  const industry = idea?.basics?.industry || "";
  const stage = idea?.basics?.stage || "";
  const location = (idea?.basics?.location || "").toLowerCase().trim();
  const businessModel = idea?.basics?.businessModel || "";
  const amount = idea?.funding?.amount || 0;

  // 1. Industry match (weight 0.30)
  const industryMatch = prefs.industries.includes(industry) ? 1 : 0;

  // 2. Stage match (weight 0.20)
  const stageMatch = prefs.stages && prefs.stages.includes(stage) ? 1 : 0;

  // 3. Range match (weight 0.25)
  let rangeMatch = 0;
  if (amount === 0) {
    rangeMatch = 1; // "Not raising" qualifies universally
  } else if (prefs.rangeMin !== undefined && prefs.rangeMax !== undefined) {
    const min = prefs.rangeMin;
    const max = prefs.rangeMax;
    const width = Math.max(1, max - min);

    if (amount >= min && amount <= max) {
      rangeMatch = 1;
    } else {
      const distance = amount < min ? min - amount : amount - max;
      rangeMatch = Math.max(0, Math.min(1, 1 - distance / width));
    }
  } else {
    rangeMatch = 1;
  }

  // 4. Location match (weight 0.15)
  let locationMatch = 0.5; // neutral
  if (prefs.locations && prefs.locations.length > 0 && location) {
    const matchesLoc = prefs.locations.some((prefLoc) =>
      location.includes(prefLoc.toLowerCase().trim())
    );
    locationMatch = matchesLoc ? 1 : 0.2;
  }

  // 5. Business model match (weight 0.10)
  let modelMatch = 1;
  if (prefs.businessModels && prefs.businessModels.length > 0) {
    if (prefs.businessModels.includes("Any") || prefs.businessModels.includes(businessModel)) {
      modelMatch = 1;
    } else {
      modelMatch = 0;
    }
  }

  const raw =
    0.30 * industryMatch +
    0.20 * stageMatch +
    0.25 * rangeMatch +
    0.15 * locationMatch +
    0.10 * modelMatch;

  return Math.round(raw * 100);
}

/**
 * Calculates feed ranking score combining match percentage and AI completeness score.
 * feedScore = 0.8 * match% + 0.2 * idea.score.total
 */
export function calculateFeedScore(matchPercent, ideaAiScore) {
  const score = ideaAiScore || 0;
  return 0.8 * matchPercent + 0.2 * score;
}

/**
 * Checks whether an idea passes the strict hard filter against preferences.
 */
export function passesHardFilter(idea, prefs) {
  if (!prefs || !prefs.industries || prefs.industries.length === 0) {
    return true; // No preferences set -> passes
  }

  const industry = idea?.basics?.industry;
  const stage = idea?.basics?.stage;
  const amount = idea?.funding?.amount || 0;

  // Industry must match
  if (!prefs.industries.includes(industry)) return false;

  // Stage must match if stages specified
  if (prefs.stages && prefs.stages.length > 0 && !prefs.stages.includes(stage)) {
    return false;
  }

  // Range check: amount within range or amount = 0
  if (amount > 0 && prefs.rangeMin !== undefined && prefs.rangeMax !== undefined) {
    if (amount < prefs.rangeMin || amount > prefs.rangeMax) {
      return false;
    }
  }

  return true;
}
