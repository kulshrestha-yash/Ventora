// src/lib/disclosure.js
// Controlled disclosure and identity masking module (spec §6.9, §8.3)

/**
 * Returns strictly the whitelisted teaser fields for public/feed display.
 * Feed and teaser cards must consume ONLY this data.
 */
export function publicTeaser(idea, innovatorUser = null, publishedCount = 1) {
  if (!idea) return null;

  const memberYear = innovatorUser?.createdAt
    ? new Date(innovatorUser.createdAt).getFullYear()
    : new Date().getFullYear();

  return {
    _id: idea._id,
    innovatorId: idea.innovatorId,
    title: idea.basics?.title || "Untitled Startup",
    oneLinePitch: idea.basics?.oneLinePitch || "",
    industry: idea.basics?.industry || "Tech",
    stage: idea.basics?.stage || "Idea",
    location: idea.basics?.location || "India",
    businessModel: idea.basics?.businessModel || "B2B",
    fundingAmount: idea.funding?.amount || 0,
    currency: idea.funding?.currency || "INR",
    scoreTotal: idea.score?.total || 0,
    scoreBand: idea.score?.band || "developing",
    viewsCount: idea.viewsCount || 0,
    publishedAt: idea.publishedAt || idea.createdAt,
    status: idea.status,
    innovator: {
      code: innovatorUser?.code || "I-0000",
      avatarHue: innovatorUser?.avatarHue || 0,
      memberSinceYear: memberYear,
      publishedIdeaCount: publishedCount
    }
  };
}

/**
 * Resolves display name for a user based on whether an accepted connection exists.
 * Until acceptance, names are masked as 'Innovator #I-XXXX' or 'Investor #A-XXXX'.
 */
export function displayNameFor(targetUser, viewerId, hasAcceptedRelation = false) {
  if (!targetUser) return "Anonymous";

  // Self always sees real name
  if (targetUser._id === viewerId) {
    return targetUser.name;
  }

  // After mutual acceptance, real name is unlocked
  if (hasAcceptedRelation) {
    return targetUser.name;
  }

  // Otherwise return masked identity code
  const code = targetUser.code || (targetUser.role === "innovator" ? "I-1001" : "A-2001");
  const prefix = targetUser.role === "innovator" ? "Innovator" : "Investor";
  return `${prefix} #${code}`;
}

/**
 * Section visibility defaults per spec §8.3.2
 */
export const DEFAULT_VISIBILITY = {
  problem: "public",
  solution: "public",
  targetUsers: "accepted",
  market: "accepted",
  competitors: "accepted",
  businessModel: "accepted",
  revenueModel: "accepted",
  fundingUse: "accepted",
  growth: "accepted"
};
