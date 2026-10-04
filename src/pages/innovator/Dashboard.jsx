// src/pages/innovator/Dashboard.jsx
import React, { useState, useEffect, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AppShell } from "../../components/layout/AppShell.jsx";
import {
  Card,
  Button,
  Badge,
  ScoreChip,
  StatCard,
  EmptyState,
  Skeleton,
  ConfirmDialog,
  Avatar,
  Tag
} from "../../components/ui/index.js";
import { useAuth } from "../../context/AuthContext.jsx";
import { useToast } from "../../context/ToastContext.jsx";
import { api } from "../../lib/api.js";
import * as db from "../../lib/db/localStorageStore.js";
import {
  PlusCircle,
  Lightbulb,
  Send,
  Eye,
  Inbox,
  AlertTriangle,
  ArrowRight,
  ShieldCheck,
  Check,
  X,
  MoreVertical,
  Pause,
  Play,
  Trash2,
  Edit
} from "lucide-react";

export function Dashboard() {
  const { user } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  const [ideas, setIdeas] = useState([]);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal confirm states
  const [declineReqId, setDeclineReqId] = useState(null);
  const [deleteIdeaId, setDeleteIdeaId] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  const loadData = useCallback(async () => {
    if (!user?._id) return;
    try {
      const myIdeas = await api.ideas.listMine({ innovatorId: user._id });
      setIdeas(myIdeas);

      const incomingRequests = await api.requests.listForInnovator({ innovatorId: user._id });
      setRequests(incomingRequests);
    } catch (err) {
      toast.error("Failed to load dashboard data.");
    } finally {
      setLoading(false);
    }
  }, [user?._id, toast]);

  useEffect(() => {
    loadData();

    const handleSync = () => loadData();
    window.addEventListener("ventora:db", handleSync);
    window.addEventListener("storage", handleSync);
    return () => {
      window.removeEventListener("ventora:db", handleSync);
      window.removeEventListener("storage", handleSync);
    };
  }, [loadData]);

  // Compute stat metrics
  const totalSubmitted = ideas.length;
  const publishedIdeas = ideas.filter((i) => i.status === "published");
  const totalPublished = publishedIdeas.length;
  const totalViews = ideas.reduce((sum, i) => sum + (i.viewsCount || 0), 0);

  const meta = db.getMeta() || {};
  const ignoredList = meta.ignoredRequests || [];
  const pendingRequests = requests.filter(
    (r) => r.status === "pending" && !ignoredList.includes(r._id)
  );
  const totalPending = pendingRequests.length;

  // Improvement banner: find any draft with score < 50 or missing sections
  const draftNeedingImprovement = ideas.find((i) => {
    if (i.status !== "draft") return false;
    const score = i.score;
    if (!score) return false;
    const hasMissing = Object.values(score.sections || {}).some((s) => s.status === "missing");
    return score.total < 50 || hasMissing;
  });

  const handleAcceptRequest = async (requestId) => {
    try {
      const res = await api.requests.accept({ requestId });
      toast.success("Connection accepted! Chat conversation unlocked.");
      navigate(`/messages?c=${res.conversation._id}`);
    } catch (err) {
      toast.error(err.message || "Failed to accept request.");
    }
  };

  const handleConfirmDecline = async () => {
    if (!declineReqId) return;
    setActionLoading(true);
    try {
      await api.requests.decline({ requestId: declineReqId });
      toast.success("Request declined. Investor token has been refunded.");
      setDeclineReqId(null);
      loadData();
    } catch (err) {
      toast.error(err.message || "Failed to decline request.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleTogglePause = async (idea) => {
    try {
      if (idea.status === "published") {
        await api.ideas.pause({ ideaId: idea._id });
        toast.info(`"${idea.basics?.title}" has been paused and hidden from feed.`);
      } else if (idea.status === "paused") {
        await api.ideas.resume({ ideaId: idea._id });
        toast.success(`"${idea.basics?.title}" is published back to the feed.`);
      }
      loadData();
    } catch (err) {
      toast.error(err.message || "Action failed.");
    }
  };

  const handleConfirmDeleteDraft = async () => {
    if (!deleteIdeaId) return;
    setActionLoading(true);
    try {
      await api.ideas.deleteDraft({ ideaId: deleteIdeaId });
      toast.success("Draft deleted.");
      setDeleteIdeaId(null);
      loadData();
    } catch (err) {
      toast.error(err.message || "Cannot delete draft.");
    } finally {
      setActionLoading(false);
    }
  };

  const firstName = user?.name ? user.name.split(" ")[0] : "Innovator";

  return (
    <AppShell
      title={`Welcome back, ${firstName}`}
      subtitle="Here's how your startup ideas are performing."
      actions={
        <Link to="/ideas/new">
          <Button variant="primary" size="sm" className="shadow-sm">
            <PlusCircle className="w-4 h-4 mr-1.5" />
            + Submit new idea
          </Button>
        </Link>
      }
    >
      <div className="space-y-8 pb-12">
        {/* 1. Stat Cards Row */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-28" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              label="Ideas submitted"
              value={totalSubmitted}
              icon={Lightbulb}
              onClick={() => {
                document.getElementById("ideas-table-card")?.scrollIntoView({ behavior: "smooth" });
              }}
            />
            <StatCard
              label="Published"
              value={totalPublished}
              icon={Send}
              subtext="Live in investor feed"
            />
            <StatCard
              label="Investor views"
              value={totalViews}
              icon={Eye}
              subtext="Across all published ideas"
            />
            <StatCard
              label="Pending requests"
              value={totalPending}
              icon={Inbox}
              onClick={() => navigate("/requests")}
              subtext="Awaiting your response"
            />
          </div>
        )}

        {/* 2. Improvement Banner (Conditional) */}
        {draftNeedingImprovement && (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-warning-soft border border-warning/30 text-amber-900 shadow-sm animate-in fade-in duration-200">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-warning shrink-0 mt-0.5" />
              <div className="text-xs">
                <span className="font-bold">
                  '{draftNeedingImprovement.basics?.title}' scored {draftNeedingImprovement.score?.total || 0}
                </span>{" "}
                — the AI flagged incomplete sections. Improve it to meet the publish gate (score ≥ 50).
              </div>
            </div>
            <Link to={`/ideas/${draftNeedingImprovement._id}/score`} className="shrink-0">
              <Button variant="secondary" size="sm" className="bg-white">
                Improve now →
              </Button>
            </Link>
          </div>
        )}

        {/* 3. My Ideas Card */}
        <Card id="ideas-table-card" className="space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-line">
            <div>
              <h2 className="text-base font-bold text-ink">My Ideas</h2>
              <p className="text-xs text-ink-muted">Manage your startup submissions and AI completeness scores</p>
            </div>
            <Link to="/ideas/new">
              <Button variant="secondary" size="sm">
                + New Idea
              </Button>
            </Link>
          </div>

          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : ideas.length === 0 ? (
            <EmptyState
              icon={Lightbulb}
              title="No ideas yet"
              description="Your startup journey starts with one idea. Draft it section by section — our AI will score completeness as you go."
              action={{
                label: "+ Submit your first idea",
                onClick: () => navigate("/ideas/new")
              }}
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-surface-subtle text-ink-muted uppercase tracking-wider font-semibold border-b border-line">
                  <tr>
                    <th className="py-3 px-4">Idea</th>
                    <th className="py-3 px-4">AI Score</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Visibility</th>
                    <th className="py-3 px-4">Requests</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line text-ink">
                  {ideas.map((idea) => {
                    const reqCount = requests.filter(
                      (r) => r.ideaId === idea._id && r.status === "pending"
                    ).length;
                    const canPublish = idea.score?.canPublish;

                    return (
                      <tr key={idea._id} className="hover:bg-surface-subtle transition-colors">
                        <td className="py-3.5 px-4">
                          <div className="font-semibold text-sm text-ink">
                            {idea.basics?.title || "Untitled Startup"}
                          </div>
                          <div className="text-ink-muted flex items-center gap-2 mt-0.5">
                            <span>{idea.basics?.industry}</span>
                            <span>•</span>
                            <span>{idea.basics?.stage}</span>
                          </div>
                        </td>

                        <td className="py-3.5 px-4">
                          <Link to={`/ideas/${idea._id}/score`}>
                            <ScoreChip
                              score={idea.score?.total || 0}
                              band={idea.score?.band || "developing"}
                            />
                          </Link>
                        </td>

                        <td className="py-3.5 px-4">
                          <Badge
                            tone={
                              idea.status === "published"
                                ? "success-soft"
                                : idea.status === "draft"
                                ? "warning-soft"
                                : "neutral"
                            }
                            size="sm"
                          >
                            {idea.status}
                          </Badge>
                        </td>

                        <td className="py-3.5 px-4">
                          <span
                            className="inline-flex items-center text-[11px] font-medium text-ink-secondary bg-surface-subtle px-2 py-0.5 rounded border border-line"
                            title="Controlled disclosure active: public teaser + locked deep sections"
                          >
                            {idea.status === "published" ? "Limited Teaser" : "Hidden"}
                          </span>
                        </td>

                        <td className="py-3.5 px-4">
                          <span className="font-mono font-semibold">
                            {reqCount > 0 ? (
                              <Badge tone="primary-soft" size="sm">
                                {reqCount} pending
                              </Badge>
                            ) : (
                              <span className="text-ink-muted">0</span>
                            )}
                          </span>
                        </td>

                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {idea.status === "draft" && !canPublish ? (
                              <Link to={`/ideas/${idea._id}/score`}>
                                <Button variant="secondary" size="sm" className="text-warning border-warning/30">
                                  <AlertTriangle className="w-3.5 h-3.5 mr-1 text-warning" />
                                  Improve
                                </Button>
                              </Link>
                            ) : (
                              <Link to={`/ideas/${idea._id}/edit`}>
                                <Button variant="secondary" size="sm">
                                  <Edit className="w-3.5 h-3.5 mr-1" />
                                  Edit
                                </Button>
                              </Link>
                            )}

                            {idea.status === "published" ? (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleTogglePause(idea)}
                                title="Pause & hide from feed"
                              >
                                <Pause className="w-3.5 h-3.5" />
                              </Button>
                            ) : idea.status === "paused" ? (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleTogglePause(idea)}
                                title="Resume publishing"
                              >
                                <Play className="w-3.5 h-3.5" />
                              </Button>
                            ) : (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setDeleteIdeaId(idea._id)}
                                title="Delete draft"
                                className="text-ink-muted hover:text-danger"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        {/* 4. Latest Connection Requests Card */}
        <Card className="space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-line">
            <div>
              <h2 className="text-base font-bold text-ink">Latest Connection Requests</h2>
              <p className="text-xs text-ink-muted">Investors interested in discussing your startup</p>
            </div>
            {pendingRequests.length > 0 && (
              <Link to="/requests" className="text-xs font-semibold text-primary hover:underline">
                View all ({pendingRequests.length}) →
              </Link>
            )}
          </div>

          {loading ? (
            <Skeleton className="h-24 w-full" />
          ) : pendingRequests.length === 0 ? (
            <EmptyState
              icon={Inbox}
              title="No requests yet"
              description="Verified investors who match your industry will appear here. A strong AI score helps you get discovered."
            />
          ) : (
            <div className="space-y-3">
              {pendingRequests.slice(0, 3).map((req) => (
                <div
                  key={req._id}
                  className="p-4 rounded-xl border border-line bg-surface hover:border-line-strong transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="flex items-start gap-3">
                    <Avatar
                      name={req.investor?.code ? `Investor #${req.investor.code}` : "Investor"}
                      code={req.investor?.code}
                      hue={req.investor?.avatarHue}
                      size="md"
                      verified
                    />
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-ink">
                          Investor #{req.investor?.code || "A-1000"}
                        </span>
                        <Badge tone="success-soft" size="sm">
                          <ShieldCheck className="w-3 h-3 mr-0.5" />
                          KYC verified
                        </Badge>
                        <Tag>{req.investor?.investorType || "Angel"}</Tag>
                      </div>
                      <p className="text-xs text-ink-secondary">
                        Interested in <strong className="text-ink font-semibold">{req.idea?.title || "your startup"}</strong>
                      </p>
                      {req.message && (
                        <p className="text-xs text-ink-muted italic border-l-2 border-line pl-2 mt-1">
                          "{req.message}"
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-center">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => setDeclineReqId(req._id)}
                    >
                      <X className="w-3.5 h-3.5 mr-1 text-danger" />
                      Decline
                    </Button>
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => handleAcceptRequest(req._id)}
                    >
                      <Check className="w-3.5 h-3.5 mr-1" />
                      Accept
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      {/* Decline Confirm Dialog */}
      <ConfirmDialog
        isOpen={!!declineReqId}
        onClose={() => setDeclineReqId(null)}
        onConfirm={handleConfirmDecline}
        title="Decline Connection Request?"
        message="Declining refunds their 1 token and they won't be able to request this idea again in the MVP."
        confirmLabel="Decline Request"
        cancelLabel="Keep Pending"
        isDestructive
        loading={actionLoading}
      />

      {/* Delete Draft Confirm Dialog */}
      <ConfirmDialog
        isOpen={!!deleteIdeaId}
        onClose={() => setDeleteIdeaId(null)}
        onConfirm={handleConfirmDeleteDraft}
        title="Delete Draft?"
        message="Are you sure you want to delete this unpublished draft? This cannot be undone."
        confirmLabel="Delete Draft"
        isDestructive
        loading={actionLoading}
      />
    </AppShell>
  );
}
