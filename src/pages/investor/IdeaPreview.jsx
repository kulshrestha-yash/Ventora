// src/pages/investor/IdeaPreview.jsx
import React, { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { AppShell } from "../../components/layout/AppShell.jsx";
import {
  Card,
  Button,
  Badge,
  Tag,
  ScoreChip,
  LockedRow,
  Avatar,
  Modal,
  Textarea,
  Field,
  Skeleton
} from "../../components/ui/index.js";
import { useAuth } from "../../context/AuthContext.jsx";
import { useData } from "../../context/DataContext.jsx";
import { useToast } from "../../context/ToastContext.jsx";
import { api } from "../../lib/api.js";
import * as db from "../../lib/db/localStorageStore.js";
import { formatINR } from "../../lib/constants.js";
import {
  ShieldCheck,
  Lock,
  Heart,
  Send,
  Coins,
  CheckCircle2,
  Clock,
  XCircle,
  FileText,
  ArrowLeft,
  MessageSquare
} from "lucide-react";

export function IdeaPreview() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { tokenBalance, refreshData } = useData();
  const toast = useToast();

  const [idea, setIdea] = useState(null);
  const [innovator, setInnovator] = useState(null);
  const [publishedCount, setPublishedCount] = useState(1);
  const [existingRequest, setExistingRequest] = useState(null);
  const [isSaved, setIsSaved] = useState(false);
  const [loading, setLoading] = useState(true);

  // Send Request Modal State
  const [requestModalOpen, setRequestModalOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [sendingRequest, setSendingRequest] = useState(false);

  const loadIdea = useCallback(async () => {
    try {
      const { idea: fullIdea } = await api.ideas.get({ ideaId: id });

      // If innovator owns this idea, redirect to edit
      if (fullIdea.innovatorId === user?._id) {
        navigate(`/ideas/${id}/edit`);
        return;
      }

      // Check if published
      if (fullIdea.status !== "published") {
        setIdea(null);
        setLoading(false);
        return;
      }

      // Register view count once
      await api.ideas.registerView({ ideaId: id, viewerId: user?._id });

      const innovatorUser = db.findById("users", fullIdea.innovatorId);
      const allPub = db.find(
        "ideas",
        (i) => i.innovatorId === fullIdea.innovatorId && i.status === "published"
      );

      // Check existing connection request
      const reqs = db.find(
        "connectionRequests",
        (r) => r.investorId === user?._id && r.ideaId === id
      );

      // Check saved
      const savedList = await api.saved.list({ investorId: user?._id });
      const saved = savedList.some((s) => s._id === id);

      setIdea(fullIdea);
      setInnovator(innovatorUser);
      setPublishedCount(allPub.length);
      setExistingRequest(reqs.length > 0 ? reqs[0] : null);
      setIsSaved(saved);
    } catch (err) {
      setIdea(null);
    } finally {
      setLoading(false);
    }
  }, [id, user?._id, navigate]);

  useEffect(() => {
    loadIdea();

    const handleSync = () => loadIdea();
    window.addEventListener("ventora:db", handleSync);
    window.addEventListener("storage", handleSync);
    return () => {
      window.removeEventListener("ventora:db", handleSync);
      window.removeEventListener("storage", handleSync);
    };
  }, [loadIdea]);

  const handleToggleSave = async () => {
    try {
      const res = await api.saved.toggle({ investorId: user?._id, ideaId: id });
      setIsSaved(res.saved);
      toast.success(res.saved ? "Idea saved to shortlist!" : "Removed from saved.");
    } catch (err) {
      toast.error("Could not update saved status.");
    }
  };

  const handleSendRequest = async () => {
    if (tokenBalance < 1) {
      toast.error("Insufficient tokens.");
      return;
    }

    setSendingRequest(true);
    try {
      const { request } = await api.requests.send({
        investorId: user._id,
        ideaId: id,
        message
      });

      setExistingRequest(request);
      setRequestModalOpen(false);
      setMessage("");
      await refreshData();
      toast.success("Connection request sent! 1 token committed to escrow.");
    } catch (err) {
      toast.error(err.message || "Failed to send request.");
    } finally {
      setSendingRequest(false);
    }
  };

  if (loading) {
    return (
      <AppShell title="Loading Idea Preview..." subtitle="Retrieving startup details">
        <div className="max-w-4xl mx-auto space-y-4">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      </AppShell>
    );
  }

  if (!idea) {
    return (
      <AppShell title="Idea Unavailable" subtitle="This idea is either unlisted or removed">
        <div className="max-w-md mx-auto py-16 text-center space-y-4">
          <div className="w-12 h-12 rounded-full bg-surface border border-line flex items-center justify-center mx-auto text-ink-muted">
            <Lock className="w-6 h-6" />
          </div>
          <h2 className="text-lg font-bold text-ink">Idea Not Available</h2>
          <p className="text-xs text-ink-muted leading-relaxed">
            This startup idea is currently in draft mode or paused by its founder.
          </p>
          <Link to="/feed">
            <Button variant="primary" size="sm">
              <ArrowLeft className="w-4 h-4 mr-1.5" />
              Return to Feed
            </Button>
          </Link>
        </div>
      </AppShell>
    );
  }

  const hasAccepted = existingRequest?.status === "accepted";
  const hasPending = existingRequest?.status === "pending";
  const hasDeclined = existingRequest?.status === "declined";

  const memberYear = innovator?.createdAt
    ? new Date(innovator.createdAt).getFullYear()
    : 2026;

  return (
    <AppShell
      title="Startup Idea Preview"
      subtitle="Public teaser details and controlled disclosure summary"
      actions={
        <Link to="/feed">
          <Button variant="secondary" size="sm">
            <ArrowLeft className="w-3.5 h-3.5 mr-1" />
            Back to Feed
          </Button>
        </Link>
      }
    >
      <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 pb-16">
        {/* Left Column: Idea Details & Sections */}
        <div className="lg:col-span-8 space-y-6">
          {/* Header Card */}
          <Card className="p-6 space-y-4 bg-surface shadow-card">
            <div className="flex items-center justify-between">
              <div className="flex flex-wrap items-center gap-2">
                <Tag>{idea.basics?.industry}</Tag>
                <Tag>{idea.basics?.stage} stage</Tag>
                <ScoreChip
                  score={idea.score?.total || 0}
                  band={idea.score?.band || "developing"}
                />
              </div>

              <button
                type="button"
                onClick={handleToggleSave}
                className={`p-2 rounded-lg border transition-colors ${
                  isSaved
                    ? "bg-rose-50 border-rose-200 text-rose-600"
                    : "bg-surface border-line text-ink-muted hover:text-ink"
                }`}
                title={isSaved ? "Saved to shortlist" : "Save idea"}
              >
                <Heart className={`w-4 h-4 ${isSaved ? "fill-rose-600" : ""}`} />
              </button>
            </div>

            <div>
              <h1 className="text-2xl font-bold text-ink tracking-tight">
                {idea.basics?.title}
              </h1>
              <p className="text-sm text-ink-secondary mt-1.5 leading-relaxed font-medium">
                {idea.basics?.oneLinePitch}
              </p>
            </div>

            <div className="pt-3 border-t border-line flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-ink-muted">
              <span>Location: <strong className="text-ink">{idea.basics?.location || "India"}</strong></span>
              <span>Model: <strong className="text-ink">{idea.basics?.businessModel || "B2B"}</strong></span>
              <span>Published: <strong className="text-ink">{new Date(idea.publishedAt || idea.createdAt).toLocaleDateString()}</strong></span>
            </div>
          </Card>

          {/* 1. Public Sections */}
          <div className="space-y-4">
            <h2 className="text-xs font-bold uppercase tracking-wider text-ink-muted">
              Public Whitelist Overview
            </h2>

            {/* The Problem */}
            <Card className="p-5 space-y-2 bg-surface">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-ink uppercase tracking-wider">The Problem</span>
                <Badge tone="primary-soft" size="sm">Public</Badge>
              </div>
              <p className="text-xs text-ink-secondary leading-relaxed whitespace-pre-line">
                {idea.sections?.problem || "No public problem statement disclosed."}
              </p>
            </Card>

            {/* High-level Solution */}
            <Card className="p-5 space-y-2 bg-surface">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-ink uppercase tracking-wider">High-Level Solution</span>
                <Badge tone="primary-soft" size="sm">Public</Badge>
              </div>
              <p className="text-xs text-ink-secondary leading-relaxed whitespace-pre-line">
                {idea.sections?.solution || "No public solution disclosed."}
              </p>
            </Card>

            {/* Funding Requirement */}
            <Card className="p-5 space-y-2 bg-surface">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-ink uppercase tracking-wider">Funding Requirement</span>
                <Badge tone="primary-soft" size="sm">Public</Badge>
              </div>
              <div className="text-2xl font-extrabold text-ink tabular-nums">
                {idea.funding?.amount === 0 ? "Not raising yet" : formatINR(idea.funding?.amount)}
              </div>
              <p className="text-xs text-ink-muted">
                Intended for {idea.basics?.stage} stage milestones and product delivery.
              </p>
            </Card>
          </div>

          {/* 2. Controlled Disclosure: Locked Deep Sections */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-bold uppercase tracking-wider text-ink-muted">
                Controlled Disclosure (Locked Details)
              </h2>
              <span className="text-[11px] text-ink-faint">
                Requires accepted connection request
              </span>
            </div>

            <div className="space-y-2">
              <LockedRow
                title="Business Model & Revenue Unit Economics"
                subtitle={hasAccepted ? idea.sections?.businessModel : null}
              />
              <LockedRow
                title="Market Sizing & Detailed Competitor Landscape"
                subtitle={hasAccepted ? idea.sections?.market : null}
              />
              <LockedRow
                title="Growth Strategy & Geographic Expansion Triggers"
                subtitle={hasAccepted ? idea.sections?.growth : null}
              />
              <LockedRow
                title={idea.documents?.pitchDeckUrl ? "Founder Pitch Deck (Private Web Link)" : "Founder Confidential Documents"}
                reason={hasAccepted ? "Unlocked" : "Requires accepted connection request"}
              />
              <LockedRow
                title="Founder Direct Contact & Verified Team Identity"
                reason={hasAccepted ? "Unlocked" : "Masked until founder acceptance"}
              />
            </div>

            <p className="text-[11px] text-ink-muted leading-relaxed pt-1">
              * Locked sections prove what structured information exists without exposing sensitive intellectual property to open scraping.
            </p>
          </div>
        </div>

        {/* Right Column: Innovator Info & Outreach Action */}
        <div className="lg:col-span-4 space-y-6">
          {/* About Innovator Card */}
          <Card className="p-5 space-y-4 bg-surface">
            <h2 className="text-xs font-bold uppercase tracking-wider text-ink-muted">
              About the Founder
            </h2>

            <div className="flex items-center gap-3">
              <Avatar
                name={hasAccepted ? innovator?.name : `Innovator #${innovator?.code || "I-1000"}`}
                code={innovator?.code}
                hue={innovator?.avatarHue}
                size="md"
              />
              <div>
                <div className="text-sm font-bold text-ink">
                  {/* Masked until mutual acceptance */}
                  {hasAccepted
                    ? innovator?.name
                    : `Innovator #${innovator?.code || "I-1000"}`}
                </div>
                <div className="text-xs text-ink-muted">
                  Member since {memberYear} · {publishedCount} published {publishedCount === 1 ? "idea" : "ideas"}
                </div>
              </div>
            </div>

            <p className="text-xs text-ink-secondary leading-relaxed bg-surface-subtle p-3 rounded-lg border border-line">
              {hasAccepted
                ? "Connection accepted! You can now view unmasked founder credentials and message them directly."
                : "Founder identity remains masked until they formally accept your outreach request."}
            </p>
          </Card>

          {/* Connection Request CTA Card (Sticky) */}
          <Card className="p-5 space-y-4 bg-surface shadow-pop border-primary/20 sticky top-24">
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-bold uppercase tracking-wider text-primary">
                  Token Outreach
                </span>
                <span className="text-xs font-mono font-semibold text-ink-muted">
                  {tokenBalance} tokens available
                </span>
              </div>
              <h3 className="text-base font-bold text-ink">Request Connection</h3>
              <p className="text-xs text-ink-muted leading-relaxed mt-1">
                Spend 1 token to request full disclosure and unlock a private conversation.
              </p>
            </div>

            {/* Current Request State Buttons */}
            {hasAccepted ? (
              <div className="space-y-3">
                <div className="p-3 bg-success-soft border border-success/20 rounded-lg flex items-center gap-2 text-xs text-success font-semibold">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Connection accepted & unlocked</span>
                </div>
                <Link to="/messages">
                  <Button variant="primary" size="md" className="w-full">
                    <MessageSquare className="w-4 h-4 mr-1.5" />
                    Open Private Chat
                  </Button>
                </Link>
              </div>
            ) : hasPending ? (
              <div className="p-3 bg-warning-soft border border-warning/20 rounded-lg flex items-center gap-2 text-xs text-amber-900 font-semibold">
                <Clock className="w-4 h-4 text-warning" />
                <span>Request Pending — awaiting founder review</span>
              </div>
            ) : hasDeclined ? (
              <div className="p-3 bg-danger-soft border border-danger/20 rounded-lg flex items-center gap-2 text-xs text-danger font-semibold">
                <XCircle className="w-4 h-4" />
                <span>Declined — 1 token was refunded. (Cannot re-request in MVP)</span>
              </div>
            ) : (
              <div className="space-y-3">
                <Button
                  variant="primary"
                  size="md"
                  disabled={tokenBalance < 1}
                  onClick={() => setRequestModalOpen(true)}
                  className="w-full shadow-md"
                >
                  <Coins className="w-4 h-4 mr-1.5" />
                  Use 1 token — send request
                </Button>

                {tokenBalance < 1 ? (
                  <p className="text-xs text-danger font-medium leading-relaxed">
                    You're out of tokens. Declined requests refund automatically — tokens cannot be purchased in the MVP.
                  </p>
                ) : (
                  <p className="text-[11px] text-ink-muted leading-relaxed">
                    Token is auto-refunded to your wallet if the founder declines or if you withdraw before review.
                  </p>
                )}
              </div>
            )}

            <div className="flex items-start gap-2 pt-2 border-t border-line text-[11px] text-ink-muted">
              <ShieldCheck className="w-3.5 h-3.5 text-success shrink-0 mt-0.5" />
              <span>Full business sections unlock only after founder acceptance.</span>
            </div>
          </Card>
        </div>
      </div>

      {/* Send Connection Request Modal */}
      <Modal
        isOpen={requestModalOpen}
        onClose={() => setRequestModalOpen(false)}
        title="Send Connection Request"
        footer={
          <>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setRequestModalOpen(false)}
              disabled={sendingRequest}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleSendRequest}
              loading={sendingRequest}
            >
              Send Request (1 Token)
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="p-3 rounded-lg bg-surface-subtle border border-line text-xs">
            <span className="text-ink-muted">Connecting to:</span>{" "}
            <strong className="text-ink font-semibold">{idea.basics?.title}</strong>
          </div>

          <Field
            label="Introductory Note (Optional)"
            helper="Introduce yourself and explain why this fits your investment thesis (max 500 chars)"
            counter={`${message.length}/500`}
          >
            <Textarea
              rows={4}
              placeholder="Hi! We invest in early-stage AgriTech with check sizes around ₹25L. We love your hyperspectral imaging approach..."
              value={message}
              onChange={(e) => {
                if (e.target.value.length <= 500) setMessage(e.target.value);
              }}
            />
          </Field>

          {/* Token Summary Row */}
          <div className="flex items-center justify-between p-3 rounded-lg bg-amber-50 border border-amber-200 text-xs font-semibold text-amber-900">
            <span>Transaction Cost:</span>
            <span className="font-mono">1 Token (Balance {tokenBalance} → {tokenBalance - 1})</span>
          </div>
        </div>
      </Modal>
    </AppShell>
  );
}
