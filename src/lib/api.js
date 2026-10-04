// src/lib/api.js
// Complete Data-Layer API Catalog with strict validation and ApiError handling (spec §9)

import * as db from "./db/localStorageStore.js";
import { TOKENS } from "./constants.js";
import { analyzeIdea } from "./ai/completenessEngine.js";
import {
  calculateMatchPercentage,
  calculateFeedScore,
  passesHardFilter
} from "./matching.js";
import { publicTeaser, DEFAULT_VISIBILITY } from "./disclosure.js";

export class ApiError extends Error {
  constructor(code, message) {
    super(message);
    this.name = "ApiError";
    this.code = code;
  }
}

// WebCrypto SHA-256 helper for client mock password hashing
async function hashPassword(str) {
  try {
    const enc = new TextEncoder();
    const hash = await crypto.subtle.digest("SHA-256", enc.encode(str));
    return Array.from(new Uint8Array(hash))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
  } catch {
    // Fallback if subtle crypto is unavailable
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = (hash << 5) - hash + str.charCodeAt(i);
      hash |= 0;
    }
    return Math.abs(hash).toString(16);
  }
}

// Generate code for masked identity (I-1001 or A-2001)
function generateUserCode(role) {
  const meta = db.getMeta() || { counters: { users: 1000 } };
  const currentCount = (meta.counters?.users || 1000) + 1;
  db.updateMeta((m) => ({
    ...m,
    counters: { ...m.counters, users: currentCount }
  }));

  if (role === "innovator") {
    return `I-${currentCount}`;
  }
  const prefix = ["A", "B", "C"][currentCount % 3];
  return `${prefix}-${currentCount}`;
}

function computeAvatarHue(id) {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = (hash << 5) - hash + id.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash) % 8;
}

export const api = {
  // 9.1 Auth & Users
  auth: {
    async signup({ role, name, email, password }) {
      const cleanEmail = (email || "").toLowerCase().trim();
      const cleanName = (name || "").trim();

      if (!role || !["innovator", "investor"].includes(role)) {
        throw new ApiError("VALIDATION", "Invalid role selected.");
      }
      if (!cleanName || cleanName.length < 2 || cleanName.length > 60) {
        throw new ApiError("VALIDATION", "Please enter your full name (2–60 chars).");
      }
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(cleanEmail)) {
        throw new ApiError("VALIDATION", "Enter a valid email address.");
      }
      if (!password || password.length < 8 || !/[a-zA-Z]/.test(password) || !/\d/.test(password)) {
        throw new ApiError("VALIDATION", "Use at least 8 characters with a letter and a number.");
      }

      const existing = db.find("users", (u) => u.email.toLowerCase() === cleanEmail);
      if (existing.length > 0) {
        throw new ApiError("EMAIL_TAKEN", "An account with this email already exists — try logging in.");
      }

      const passwordHash = await hashPassword(password);
      const code = generateUserCode(role);
      const _id = crypto.randomUUID();
      const avatarHue = computeAvatarHue(_id);

      const newUser = {
        _id,
        role,
        name: cleanName,
        email: cleanEmail,
        passwordHash,
        code,
        avatarHue,
        createdAt: new Date().toISOString()
      };

      if (role === "investor") {
        newUser.investorType = "Angel";
        newUser.kyc = {
          status: "unverified",
          legalName: "",
          idDocName: "",
          submittedAt: null,
          verifiedAt: null
        };
        newUser.preferences = {
          industries: [],
          stages: [],
          rangeMin: 500000,
          rangeMax: 2500000,
          locations: [],
          businessModels: [],
          savedAt: null
        };
      }

      db.insert("users", newUser);

      // Set session
      localStorage.setItem("ventora:v1:session", JSON.stringify({ userId: newUser._id, createdAt: new Date().toISOString() }));

      return { user: newUser };
    },

    async login({ email, password }) {
      const cleanEmail = (email || "").toLowerCase().trim();
      const passwordHash = await hashPassword(password || "");

      const users = db.find("users", (u) => u.email.toLowerCase() === cleanEmail);
      if (users.length === 0) {
        throw new ApiError("INVALID_CREDENTIALS", "Incorrect email or password.");
      }

      const user = users[0];
      if (user.passwordHash !== passwordHash) {
        throw new ApiError("INVALID_CREDENTIALS", "Incorrect email or password.");
      }

      localStorage.setItem("ventora:v1:session", JSON.stringify({ userId: user._id, createdAt: new Date().toISOString() }));
      return { user };
    },

    async logout() {
      localStorage.removeItem("ventora:v1:session");
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("ventora:auth", { detail: { action: "logout" } }));
      }
    },

    async me() {
      try {
        const raw = localStorage.getItem("ventora:v1:session");
        if (!raw) return null;
        const session = JSON.parse(raw);
        if (!session?.userId) return null;
        const user = db.findById("users", session.userId);
        if (!user) {
          localStorage.removeItem("ventora:v1:session");
          return null;
        }
        return user;
      } catch {
        return null;
      }
    }
  },

  users: {
    async updateProfile({ name }) {
      const me = await api.auth.me();
      if (!me) throw new ApiError("UNAUTHORIZED", "Not logged in.");
      const cleanName = (name || "").trim();
      if (cleanName.length < 2 || cleanName.length > 60) {
        throw new ApiError("VALIDATION", "Name must be between 2 and 60 characters.");
      }
      const updated = db.updateOne("users", me._id, { name: cleanName });
      return { user: updated };
    },

    async changePassword({ current, next }) {
      const me = await api.auth.me();
      if (!me) throw new ApiError("UNAUTHORIZED", "Not logged in.");
      const currentHash = await hashPassword(current || "");
      if (me.passwordHash !== currentHash) {
        throw new ApiError("WRONG_PASSWORD", "Current password does not match.");
      }
      if (!next || next.length < 8 || !/[a-zA-Z]/.test(next) || !/\d/.test(next)) {
        throw new ApiError("VALIDATION", "New password must be at least 8 characters with a letter and a number.");
      }
      const nextHash = await hashPassword(next);
      db.updateOne("users", me._id, { passwordHash: nextHash });
      return true;
    },

    async savePreferences(prefs) {
      const me = await api.auth.me();
      if (!me || me.role !== "investor") {
        throw new ApiError("UNAUTHORIZED", "Only investors can set preferences.");
      }
      const updatedPrefs = {
        ...prefs,
        savedAt: new Date().toISOString()
      };
      const updated = db.updateOne("users", me._id, { preferences: updatedPrefs });
      return { user: updated };
    }
  },

  // 9.2 KYC (Mock Verification)
  kyc: {
    async submit({ legalName, investorType, idDocName }) {
      const me = await api.auth.me();
      if (!me) throw new ApiError("UNAUTHORIZED", "Not logged in.");

      if (!legalName || legalName.trim().length < 2) {
        throw new ApiError("VALIDATION", "Full legal name is required.");
      }

      const updatedKyc = {
        status: "pending",
        legalName: legalName.trim(),
        idDocName: idDocName || "government-id.pdf",
        submittedAt: new Date().toISOString(),
        verifiedAt: null
      };

      const updatedUser = db.updateOne("users", me._id, {
        investorType: investorType || "Angel",
        kyc: updatedKyc
      });

      return { user: updatedUser };
    },

    async poll() {
      const me = await api.auth.me();
      if (!me) throw new ApiError("UNAUTHORIZED", "Not logged in.");

      // If pending, mark verified after simulation and grant starting tokens
      if (me.kyc?.status === "pending") {
        const verifiedKyc = {
          ...me.kyc,
          status: "verified",
          verifiedAt: new Date().toISOString()
        };
        const updated = db.updateOne("users", me._id, { kyc: verifiedKyc });

        // Grant starting tokens (10) once
        await api.tokens.grantWelcome({ investorId: me._id });
        return { status: "verified", user: updated };
      }

      return { status: me.kyc?.status || "unverified", user: me };
    }
  },

  // 9.3 Ideas
  ideas: {
    async createDraft({ ownerId, basics }) {
      const me = await api.auth.me();
      if (!me || me._id !== ownerId) throw new ApiError("UNAUTHORIZED", "Must be logged in.");

      const initialIdea = {
        innovatorId: ownerId,
        basics: {
          title: basics?.title || "Untitled Startup",
          industry: basics?.industry || "Tech",
          stage: basics?.stage || "Idea",
          oneLinePitch: basics?.oneLinePitch || "",
          location: basics?.location || "",
          businessModel: basics?.businessModel || "B2B"
        },
        sections: {
          problem: "",
          solution: "",
          targetUsers: "",
          market: "",
          competitors: "",
          businessModel: "",
          revenueModel: "",
          fundingUse: "",
          growth: ""
        },
        funding: {
          amount: 1500000,
          currency: "INR"
        },
        documents: {
          pitchDeckUrl: "",
          notesUrl: ""
        },
        visibility: { ...DEFAULT_VISIBILITY },
        status: "draft",
        viewsCount: 0,
        publishedAt: null
      };

      initialIdea.score = analyzeIdea(initialIdea);
      const created = db.insert("ideas", initialIdea);
      return { idea: created };
    },

    async saveDraft({ ideaId, patch }) {
      const me = await api.auth.me();
      const idea = db.findById("ideas", ideaId);
      if (!idea) throw new ApiError("NOT_FOUND", "Idea not found.");
      if (!me || idea.innovatorId !== me._id) throw new ApiError("NOT_OWNER", "Unauthorized.");

      const merged = {
        ...idea,
        ...patch,
        basics: { ...idea.basics, ...(patch.basics || {}) },
        sections: { ...idea.sections, ...(patch.sections || {}) },
        funding: { ...idea.funding, ...(patch.funding || {}) },
        documents: { ...idea.documents, ...(patch.documents || {}) },
        visibility: { ...idea.visibility, ...(patch.visibility || {}) }
      };

      // Always recompute deterministic AI score
      merged.score = analyzeIdea(merged);
      const updated = db.updateOne("ideas", ideaId, merged);
      return { idea: updated };
    },

    async get({ ideaId }) {
      const idea = db.findById("ideas", ideaId);
      if (!idea) throw new ApiError("NOT_FOUND", "Idea not found.");
      return { idea };
    },

    async listMine({ innovatorId }) {
      const ideas = db.find("ideas", (i) => i.innovatorId === innovatorId);
      return ideas.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    },

    async publish({ ideaId }) {
      const me = await api.auth.me();
      const idea = db.findById("ideas", ideaId);
      if (!idea) throw new ApiError("NOT_FOUND", "Idea not found.");
      if (!me || idea.innovatorId !== me._id) throw new ApiError("NOT_OWNER", "Unauthorized.");

      const score = analyzeIdea(idea);
      if (!score.canPublish) {
        throw new ApiError(
          "BELOW_PUBLISH_GATE",
          `Publish unlocks at 50+ with no missing sections. Current score is ${score.total}.`
        );
      }

      const updated = db.updateOne("ideas", ideaId, {
        status: "published",
        score,
        publishedAt: idea.publishedAt || new Date().toISOString()
      });
      return { idea: updated };
    },

    async pause({ ideaId }) {
      const me = await api.auth.me();
      const idea = db.findById("ideas", ideaId);
      if (!idea) throw new ApiError("NOT_FOUND", "Idea not found.");
      if (!me || idea.innovatorId !== me._id) throw new ApiError("NOT_OWNER", "Unauthorized.");

      const updated = db.updateOne("ideas", ideaId, { status: "paused" });
      return { idea: updated };
    },

    async resume({ ideaId }) {
      const me = await api.auth.me();
      const idea = db.findById("ideas", ideaId);
      if (!idea) throw new ApiError("NOT_FOUND", "Idea not found.");
      if (!me || idea.innovatorId !== me._id) throw new ApiError("NOT_OWNER", "Unauthorized.");

      const updated = db.updateOne("ideas", ideaId, { status: "published" });
      return { idea: updated };
    },

    async deleteDraft({ ideaId }) {
      const me = await api.auth.me();
      const idea = db.findById("ideas", ideaId);
      if (!idea) throw new ApiError("NOT_FOUND", "Idea not found.");
      if (!me || idea.innovatorId !== me._id) throw new ApiError("NOT_OWNER", "Unauthorized.");

      // Check if idea has requests
      const requests = db.find("connectionRequests", (r) => r.ideaId === ideaId);
      if (requests.length > 0) {
        throw new ApiError("HAS_REQUESTS", "Cannot delete an idea that has received connection requests.");
      }

      db.remove("ideas", ideaId);
      return true;
    },

    async publicTeaser({ ideaId, viewerId }) {
      const idea = db.findById("ideas", ideaId);
      if (!idea) throw new ApiError("NOT_FOUND", "Idea not found.");
      if (idea.status !== "published" && idea.innovatorId !== viewerId) {
        throw new ApiError("NOT_FOUND", "Idea is not available.");
      }

      const innovator = db.findById("users", idea.innovatorId);
      const allPublished = db.find("ideas", (i) => i.innovatorId === idea.innovatorId && i.status === "published");
      const teaser = publicTeaser(idea, innovator, allPublished.length);

      // Compute viewer match if investor
      let matchPercent = 100;
      if (viewerId) {
        const viewer = db.findById("users", viewerId);
        if (viewer?.role === "investor" && viewer.preferences?.industries?.length > 0) {
          matchPercent = calculateMatchPercentage(idea, viewer.preferences);
        }
      }
      teaser.matchPercent = matchPercent;

      return { teaser };
    },

    async registerView({ ideaId, viewerId }) {
      if (!viewerId) return;
      const viewer = db.findById("users", viewerId);
      if (!viewer || viewer.role !== "investor" || viewer.kyc?.status !== "verified") return;

      const idea = db.findById("ideas", ideaId);
      if (!idea || idea.innovatorId === viewerId) return;

      // Session deduplication
      const viewKey = `ventora:viewed:${viewerId}:${ideaId}`;
      if (sessionStorage.getItem(viewKey)) return;
      sessionStorage.setItem(viewKey, "1");

      db.updateOne("ideas", ideaId, {
        viewsCount: (idea.viewsCount || 0) + 1
      });
    }
  },

  // 9.4 Feed
  feed: {
    async list({ investorId, sort = "match", filters = {}, nearMatch = false }) {
      const investor = db.findById("users", investorId);
      const prefs = investor?.preferences || {};

      const publishedIdeas = db.find("ideas", (i) => i.status === "published");
      const teasers = [];

      for (const idea of publishedIdeas) {
        const innovator = db.findById("users", idea.innovatorId);
        const count = db.find("ideas", (i) => i.innovatorId === idea.innovatorId && i.status === "published").length;
        const teaser = publicTeaser(idea, innovator, count);

        // Apply external UI filter overrides if provided
        if (filters.industry && filters.industry !== "All" && teaser.industry !== filters.industry) {
          continue;
        }
        if (filters.stage && filters.stage !== "All" && teaser.stage !== filters.stage) {
          continue;
        }
        if (filters.range && filters.range !== "All") {
          const [min, max] = filters.range;
          if (teaser.fundingAmount > 0 && (teaser.fundingAmount < min || teaser.fundingAmount > max)) {
            continue;
          }
        }

        const matchPercent = prefs.industries?.length > 0 ? calculateMatchPercentage(idea, prefs) : 100;
        const feedScore = calculateFeedScore(matchPercent, teaser.scoreTotal);

        teaser.matchPercent = matchPercent;
        teaser.feedScore = feedScore;

        const passes = passesHardFilter(idea, prefs);
        if (!passes) {
          if (nearMatch) {
            teaser.outsidePrefs = true;
            teasers.push(teaser);
          }
        } else {
          teaser.outsidePrefs = false;
          teasers.push(teaser);
        }
      }

      // Sort teasers
      teasers.sort((a, b) => {
        // Items outside prefs sort at the end in near match
        if (a.outsidePrefs !== b.outsidePrefs) {
          return a.outsidePrefs ? 1 : -1;
        }

        if (sort === "newest") {
          return new Date(b.publishedAt) - new Date(a.publishedAt);
        }
        if (sort === "score") {
          return b.scoreTotal - a.scoreTotal;
        }
        // default "match"
        return b.feedScore - a.feedScore;
      });

      return teasers.slice(0, 50);
    }
  },

  // 9.5 Tokens
  tokens: {
    async balance({ investorId }) {
      const ledger = db.find("tokenLedger", (t) => t.investorId === investorId);
      const balance = ledger.reduce((sum, row) => {
        return row.type === "spend" ? sum - row.amount : sum + row.amount;
      }, 0);
      return { balance: Math.max(0, balance) };
    },

    async ledger({ investorId }) {
      const rows = db.find("tokenLedger", (t) => t.investorId === investorId);
      return rows.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    },

    async grantWelcome({ investorId }) {
      const existing = db.find("tokenLedger", (t) => t.investorId === investorId && t.type === "grant");
      if (existing.length > 0) return; // Idempotent

      const current = await api.tokens.balance({ investorId });
      const newBal = current.balance + TOKENS.STARTING_GRANT;

      db.insert("tokenLedger", {
        investorId,
        type: "grant",
        amount: TOKENS.STARTING_GRANT,
        reason: "Welcome grant (KYC verified)",
        balanceAfter: newBal
      });
    }
  },

  // 9.6 Requests
  requests: {
    async send({ investorId, ideaId, message }) {
      const investor = db.findById("users", investorId);
      if (!investor || investor.role !== "investor" || investor.kyc?.status !== "verified") {
        throw new ApiError("UNAUTHORIZED", "Only verified investors can send requests.");
      }

      const idea = db.findById("ideas", ideaId);
      if (!idea || idea.status !== "published") {
        throw new ApiError("NOT_FOUND", "Idea is not available.");
      }
      if (idea.innovatorId === investorId) {
        throw new ApiError("VALIDATION", "You cannot request your own idea.");
      }

      // Check duplicate
      const existing = db.find(
        "connectionRequests",
        (r) => r.investorId === investorId && r.ideaId === ideaId
      );
      if (existing.length > 0) {
        throw new ApiError("DUPLICATE_REQUEST", "You have already submitted a request for this idea.");
      }

      // Check balance
      const { balance } = await api.tokens.balance({ investorId });
      if (balance < TOKENS.REQUEST_COST) {
        throw new ApiError("INSUFFICIENT_TOKENS", "You do not have enough tokens to send a request.");
      }

      const balanceAfter = balance - TOKENS.REQUEST_COST;
      const spendRow = db.insert("tokenLedger", {
        investorId,
        type: "spend",
        amount: TOKENS.REQUEST_COST,
        reason: `Connection request — “${idea.basics?.title || "Startup Idea"}”`,
        balanceAfter
      });

      const request = db.insert("connectionRequests", {
        ideaId,
        investorId,
        innovatorId: idea.innovatorId,
        status: "pending",
        message: (message || "").trim().slice(0, 500),
        tokenTxId: spendRow._id,
        respondedAt: null
      });

      // Update spend ref
      db.updateOne("tokenLedger", spendRow._id, { refRequestId: request._id });

      return { request };
    },

    async listForInnovator({ innovatorId }) {
      const requests = db.find("connectionRequests", (r) => r.innovatorId === innovatorId);
      const enriched = [];

      for (const req of requests) {
        const investor = db.findById("users", req.investorId);
        const idea = db.findById("ideas", req.ideaId);
        const acceptedCount = db.find(
          "connectionRequests",
          (r) => r.investorId === req.investorId && r.status === "accepted"
        ).length;

        enriched.push({
          ...req,
          investor: investor
            ? {
                _id: investor._id,
                name: investor.name,
                code: investor.code,
                avatarHue: investor.avatarHue,
                investorType: investor.investorType || "Angel",
                preferences: investor.preferences || {},
                connectionsMade: acceptedCount
              }
            : null,
          idea: idea ? { _id: idea._id, title: idea.basics?.title } : null
        });
      }

      return enriched.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    },

    async listForInvestor({ investorId }) {
      const requests = db.find("connectionRequests", (r) => r.investorId === investorId);
      const enriched = [];

      for (const req of requests) {
        const innovator = db.findById("users", req.innovatorId);
        const idea = db.findById("ideas", req.ideaId);

        enriched.push({
          ...req,
          innovator: innovator
            ? {
                _id: innovator._id,
                name: innovator.name,
                code: innovator.code,
                avatarHue: innovator.avatarHue
              }
            : null,
          idea: idea ? { _id: idea._id, title: idea.basics?.title, industry: idea.basics?.industry } : null
        });
      }

      return enriched.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    },

    async accept({ requestId }) {
      const me = await api.auth.me();
      const req = db.findById("connectionRequests", requestId);
      if (!req) throw new ApiError("NOT_FOUND", "Request not found.");
      if (req.innovatorId !== me._id) throw new ApiError("UNAUTHORIZED", "Not your request.");
      if (req.status !== "pending") throw new ApiError("ALREADY_RESOLVED", "Request already resolved.");

      const updated = db.updateOne("connectionRequests", requestId, {
        status: "accepted",
        respondedAt: new Date().toISOString()
      });

      // Create conversation
      let conversation = db.find("conversations", (c) => c.requestId === requestId)[0];
      if (!conversation) {
        conversation = db.insert("conversations", {
          requestId,
          ideaId: req.ideaId,
          investorId: req.investorId,
          innovatorId: req.innovatorId,
          lastMessageAt: new Date().toISOString(),
          lastMessagePreview: "— Connection accepted · chat unlocked —"
        });

        // Insert pinned system message
        db.insert("messages", {
          conversationId: conversation._id,
          senderId: "system",
          type: "system",
          body: "— Connection accepted · chat unlocked —",
          readBy: [req.investorId, req.innovatorId]
        });
      }

      return { request: updated, conversation };
    },

    async decline({ requestId }) {
      const me = await api.auth.me();
      const req = db.findById("connectionRequests", requestId);
      if (!req) throw new ApiError("NOT_FOUND", "Request not found.");
      if (req.innovatorId !== me._id) throw new ApiError("UNAUTHORIZED", "Not your request.");
      if (req.status !== "pending") throw new ApiError("ALREADY_RESOLVED", "Request already resolved.");

      const updated = db.updateOne("connectionRequests", requestId, {
        status: "declined",
        respondedAt: new Date().toISOString()
      });

      // Refund 1 token to investor
      const { balance } = await api.tokens.balance({ investorId: req.investorId });
      db.insert("tokenLedger", {
        investorId: req.investorId,
        type: "refund",
        amount: TOKENS.REQUEST_COST,
        reason: "Refund — request declined by innovator",
        refRequestId: requestId,
        balanceAfter: balance + TOKENS.REQUEST_COST
      });

      return { request: updated };
    },

    async withdraw({ requestId }) {
      const me = await api.auth.me();
      const req = db.findById("connectionRequests", requestId);
      if (!req) throw new ApiError("NOT_FOUND", "Request not found.");
      if (req.investorId !== me._id) throw new ApiError("UNAUTHORIZED", "Not your request.");
      if (req.status !== "pending") throw new ApiError("ALREADY_RESOLVED", "Request already resolved.");

      const updated = db.updateOne("connectionRequests", requestId, {
        status: "withdrawn",
        respondedAt: new Date().toISOString()
      });

      // Refund 1 token
      const { balance } = await api.tokens.balance({ investorId: req.investorId });
      db.insert("tokenLedger", {
        investorId: req.investorId,
        type: "refund",
        amount: TOKENS.REQUEST_COST,
        reason: "Refund — request withdrawn",
        refRequestId: requestId,
        balanceAfter: balance + TOKENS.REQUEST_COST
      });

      return { request: updated };
    }
  },

  // 9.7 Conversations & Messages
  conversations: {
    async listMine({ userId }) {
      const convs = db.find(
        "conversations",
        (c) => c.investorId === userId || c.innovatorId === userId
      );

      const enriched = [];
      for (const conv of convs) {
        const counterpartId = conv.investorId === userId ? conv.innovatorId : conv.investorId;
        const counterpart = db.findById("users", counterpartId);
        const idea = db.findById("ideas", conv.ideaId);

        const unreadCount = db.find(
          "messages",
          (m) =>
            m.conversationId === conv._id &&
            m.senderId !== userId &&
            (!m.readBy || !m.readBy.includes(userId))
        ).length;

        enriched.push({
          ...conv,
          counterpart,
          idea,
          unreadCount
        });
      }

      return enriched.sort((a, b) => new Date(b.lastMessageAt) - new Date(a.lastMessageAt));
    },

    async get({ conversationId, userId }) {
      const conv = db.findById("conversations", conversationId);
      if (!conv) throw new ApiError("NOT_FOUND", "Conversation not found.");
      if (conv.investorId !== userId && conv.innovatorId !== userId) {
        throw new ApiError("UNAUTHORIZED", "Access denied.");
      }
      const counterpartId = conv.investorId === userId ? conv.innovatorId : conv.investorId;
      const counterpart = db.findById("users", counterpartId);
      const idea = db.findById("ideas", conv.ideaId);
      return { conversation: conv, counterpart, idea };
    }
  },

  messages: {
    async list({ conversationId }) {
      const msgs = db.find("messages", (m) => m.conversationId === conversationId);
      return msgs.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
    },

    async send({ conversationId, senderId, type = "text", body }) {
      const cleanBody = (body || "").trim();
      if (!cleanBody) throw new ApiError("VALIDATION", "Message cannot be empty.");
      if (cleanBody.length > 2000) throw new ApiError("VALIDATION", "Message exceeds 2000 characters.");

      const conv = db.findById("conversations", conversationId);
      if (!conv) throw new ApiError("NOT_FOUND", "Conversation not found.");

      const msg = db.insert("messages", {
        conversationId,
        senderId,
        type,
        body: cleanBody,
        readBy: [senderId]
      });

      db.updateOne("conversations", conversationId, {
        lastMessageAt: new Date().toISOString(),
        lastMessagePreview: type === "link" ? `🔗 ${cleanBody}` : cleanBody.slice(0, 60)
      });

      return { message: msg };
    },

    async markRead({ conversationId, userId }) {
      const msgs = db.find("messages", (m) => m.conversationId === conversationId);
      let changed = false;

      for (const m of msgs) {
        if (!m.readBy) m.readBy = [];
        if (!m.readBy.includes(userId)) {
          m.readBy.push(userId);
          changed = true;
        }
      }

      if (changed) {
        db.write("messages", msgs);
      }
    }
  },

  // 9.8 Saved Ideas
  saved: {
    async toggle({ investorId, ideaId }) {
      const existing = db.find(
        "savedIdeas",
        (s) => s.investorId === investorId && s.ideaId === ideaId
      );

      if (existing.length > 0) {
        db.remove("savedIdeas", existing[0]._id);
        return { saved: false };
      }

      db.insert("savedIdeas", {
        investorId,
        ideaId
      });
      return { saved: true };
    },

    async list({ investorId }) {
      const saved = db.find("savedIdeas", (s) => s.investorId === investorId);
      const results = [];

      for (const s of saved) {
        const idea = db.findById("ideas", s.ideaId);
        if (idea && idea.status === "published") {
          const innovator = db.findById("users", idea.innovatorId);
          const teaser = publicTeaser(idea, innovator);
          teaser.savedAt = s.createdAt;
          teaser.savedId = s._id;
          results.push(teaser);
        }
      }

      return results.sort((a, b) => new Date(b.savedAt) - new Date(a.savedAt));
    }
  }
};
