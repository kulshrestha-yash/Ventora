// src/pages/innovator/RequestsInbox.jsx
import React, { useState, useEffect, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AppShell } from "../../components/layout/AppShell.jsx";
import {
  Card,
  Button,
  Badge,
  Tag,
  Avatar,
  Tabs,
  EmptyState,
  Skeleton,
  ConfirmDialog
} from "../../components/ui/index.js";
import { useAuth } from "../../context/AuthContext.jsx";
import { useToast } from "../../context/ToastContext.jsx";
import { api } from "../../lib/api.js";
import * as db from "../../lib/db/localStorageStore.js";
import { formatINR } from "../../lib/constants.js";
import {
  Inbox,
  ShieldCheck,
  Coins,
  Check,
  X,
  EyeOff,
  MessageSquare,
  Info,
  ChevronDown,
  ChevronUp
} from "lucide-react";

export function RequestsInbox() {
  const { user } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("pending");
  const [declineReqId, setDeclineReqId] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [showIgnored, setShowIgnored] = useState(false);

  const loadRequests = useCallback(async () => {
    if (!user?._id) return;
    try {
      const data = await api.requests.listForInnovator({ innovatorId: user._id });
      setRequests(data);
    } catch (err) {
      toast.error("Failed to load requests.");
    } finally {
      setLoading(false);
    }
  }, [user?._id, toast]);

  useEffect(() => {
    loadRequests();

    const handleSync = () => loadRequests();
    window.addEventListener("ventora:db", handleSync);
    window.addEventListener("storage", handleSync);
    return () => {
      window.removeEventListener("ventora:db", handleSync);
      window.removeEventListener("storage", handleSync);
    };
  }, [loadRequests]);

  const meta = db.getMeta() || {};
  const ignoredIds = meta.ignoredRequests || [];

  const pendingRequests = requests.filter(
    (r) => r.status === "pending" && !ignoredIds.includes(r._id)
  );
  const ignoredRequests = requests.filter(
    (r) => r.status === "pending" && ignoredIds.includes(r._id)
  );
  const acceptedRequests = requests.filter((r) => r.status === "accepted");
  const declinedRequests = requests.filter((r) => r.status === "declined");

  const handleAccept = async (requestId) => {
    try {
      const res = await api.requests.accept({ requestId });
      toast.success("Request accepted! Chat conversation unlocked.");
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
      toast.success("Request declined and 1 token refunded to investor.");
      setDeclineReqId(null);
      loadRequests();
    } catch (err) {
      toast.error(err.message || "Failed to decline request.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleIgnore = (requestId) => {
    db.updateMeta((m) => {
      const current = m.ignoredRequests || [];
      return {
        ...m,
        ignoredRequests: [...current, requestId]
      };
    });
    toast.info("Request moved to Ignored tray.");
    loadRequests();
  };

  const handleUnignore = (requestId) => {
    db.updateMeta((m) => {
      const current = m.ignoredRequests || [];
      return {
        ...m,
        ignoredRequests: current.filter((id) => id !== requestId)
      };
    });
    toast.info("Request restored to pending queue.");
    loadRequests();
  };

  const tabs = [
    { id: "pending", label: "Pending", count: pendingRequests.length },
    { id: "accepted", label: "Accepted", count: acceptedRequests.length },
    { id: "declined", label: "Declined", count: declinedRequests.length }
  ];

  return (
    <AppShell
      title="Connection Requests"
      subtitle="Review outreach from verified investors interested in your ideas"
    >
      <div className="max-w-4xl mx-auto space-y-6 pb-16">
        <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />

        {loading ? (
          <div className="space-y-4">
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-32 w-full" />
          </div>
        ) : (
          <>
            {/* 1. Pending Tab */}
            {activeTab === "pending" && (
              <div className="space-y-4">
                {pendingRequests.length === 0 ? (
                  <EmptyState
                    icon={Inbox}
                    title="No pending requests"
                    description="When a verified investor spends a token on your idea, it lands here for your approval."
                  />
                ) : (
                  pendingRequests.map((req) => (
                    <Card key={req._id} className="p-5 space-y-4 bg-surface shadow-card">
                      {/* Row 1: Masked investor header */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Avatar
                            name={req.investor?.code ? `Investor #${req.investor.code}` : "Investor"}
                            code={req.investor?.code}
                            hue={req.investor?.avatarHue}
                            size="md"
                            verified
                          />
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-sm text-ink">
                                Investor #{req.investor?.code || "A-1000"}
                              </span>
                              <Badge tone="success-soft" size="sm">
                                <ShieldCheck className="w-3 h-3 mr-0.5" />
                                KYC verified
                              </Badge>
                              <Tag>{req.investor?.investorType || "Angel"}</Tag>
                            </div>
                            <div className="text-xs text-ink-muted">
                              Interested in <strong className="text-ink">{req.idea?.title}</strong>
                            </div>
                          </div>
                        </div>

                        <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-amber-50 text-amber-900 border border-amber-200">
                          <Coins className="w-3.5 h-3.5 text-warning" />
                          <span>1 token spent</span>
                        </span>
                      </div>

                      {/* Row 2: Thesis match meta */}
                      <div className="text-xs text-ink-secondary bg-surface-subtle p-3 rounded-lg border border-line flex flex-wrap items-center gap-x-4 gap-y-1">
                        <span>
                          <strong>Focus:</strong>{" "}
                          {req.investor?.preferences?.industries?.join(", ") || "General"}
                        </span>
                        <span>•</span>
                        <span>
                          <strong>Stage:</strong>{" "}
                          {req.investor?.preferences?.stages?.join(", ") || "Any"}
                        </span>
                        <span>•</span>
                        <span>
                          <strong>Check Size:</strong>{" "}
                          {req.investor?.preferences?.rangeMin
                            ? `${formatINR(req.investor.preferences.rangeMin, true)} – ${formatINR(req.investor.preferences.rangeMax, true)}`
                            : "Flexible"}
                        </span>
                        <span>•</span>
                        <span>{req.investor?.connectionsMade || 0} connections made</span>
                      </div>

                      {/* Row 3: Message */}
                      {req.message && (
                        <div className="text-xs text-ink-secondary italic bg-white p-3 rounded-lg border border-line">
                          "{req.message}"
                        </div>
                      )}

                      {/* Row 4: Actions */}
                      <div className="flex items-center justify-end gap-2 pt-2 border-t border-line">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleIgnore(req._id)}
                          className="text-ink-muted hover:text-ink"
                        >
                          <EyeOff className="w-3.5 h-3.5 mr-1" />
                          Ignore
                        </Button>
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
                          onClick={() => handleAccept(req._id)}
                          className="shadow-sm"
                        >
                          <Check className="w-3.5 h-3.5 mr-1" />
                          Accept & open chat
                        </Button>
                      </div>
                    </Card>
                  ))
                )}

                {/* Collapsed Ignored Tray */}
                {ignoredRequests.length > 0 && (
                  <div className="pt-4 border-t border-line">
                    <button
                      type="button"
                      onClick={() => setShowIgnored(!showIgnored)}
                      className="flex items-center justify-between w-full p-3 rounded-lg bg-surface-subtle text-xs font-semibold text-ink-muted hover:text-ink"
                    >
                      <span>Ignored Requests ({ignoredRequests.length})</span>
                      {showIgnored ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>

                    {showIgnored && (
                      <div className="space-y-3 pt-3">
                        {ignoredRequests.map((req) => (
                          <div
                            key={req._id}
                            className="p-4 rounded-lg border border-line bg-surface flex items-center justify-between text-xs"
                          >
                            <div>
                              <span className="font-bold text-ink">
                                Investor #{req.investor?.code}
                              </span>{" "}
                              — for <em>{req.idea?.title}</em>
                            </div>
                            <div className="flex items-center gap-2">
                              <Button
                                variant="secondary"
                                size="sm"
                                onClick={() => handleUnignore(req._id)}
                              >
                                Restore to Queue
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* 2. Accepted Tab */}
            {activeTab === "accepted" && (
              <div className="space-y-4">
                {acceptedRequests.length === 0 ? (
                  <div className="p-8 text-center text-xs text-ink-muted">
                    No accepted requests yet. When you accept an investor's request, their real identity is revealed and chat unlocks.
                  </div>
                ) : (
                  acceptedRequests.map((req) => (
                    <Card key={req._id} className="p-5 space-y-3 bg-surface">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Avatar
                            name={req.investor?.name || "Investor"}
                            code={req.investor?.code}
                            hue={req.investor?.avatarHue}
                            size="md"
                            verified
                          />
                          <div>
                            <div className="flex items-center gap-2">
                              {/* Real Name Unmasked Post-Acceptance */}
                              <span className="font-bold text-sm text-ink">
                                {req.investor?.name}
                              </span>
                              <Badge tone="success-soft" size="sm">
                                Connected
                              </Badge>
                              <span className="text-xs text-ink-muted font-mono">
                                ({req.investor?.code})
                              </span>
                            </div>
                            <div className="text-xs text-ink-muted">
                              Startup: <strong className="text-ink">{req.idea?.title}</strong> · Connected{" "}
                              {new Date(req.respondedAt || req.createdAt).toLocaleDateString()}
                            </div>
                          </div>
                        </div>

                        <Link to={`/messages`}>
                          <Button variant="primary" size="sm">
                            <MessageSquare className="w-3.5 h-3.5 mr-1" />
                            Open chat →
                          </Button>
                        </Link>
                      </div>
                    </Card>
                  ))
                )}
              </div>
            )}

            {/* 3. Declined Tab */}
            {activeTab === "declined" && (
              <div className="space-y-4">
                {declinedRequests.length === 0 ? (
                  <div className="p-8 text-center text-xs text-ink-muted">
                    No declined requests in history.
                  </div>
                ) : (
                  declinedRequests.map((req) => (
                    <div
                      key={req._id}
                      className="p-4 rounded-xl border border-line bg-surface-subtle flex items-center justify-between text-xs text-ink-muted"
                    >
                      <div>
                        Declined request from{" "}
                        <strong className="text-ink">Investor #{req.investor?.code}</strong> regarding{" "}
                        <em>{req.idea?.title}</em>
                      </div>
                      <Badge tone="neutral" size="sm">
                        Declined & Refunded
                      </Badge>
                    </div>
                  ))
                )}
              </div>
            )}
          </>
        )}

        {/* Footer info note */}
        <div className="flex items-center gap-2 text-xs text-ink-muted pt-4 border-t border-line">
          <Info className="w-4 h-4 text-ink-muted shrink-0" />
          <span>
            Investor names stay masked until you accept. Reporting and blocking arrive in Phase 2.
          </span>
        </div>
      </div>

      {/* Decline Confirm Dialog */}
      <ConfirmDialog
        isOpen={!!declineReqId}
        onClose={() => setDeclineReqId(null)}
        onConfirm={handleConfirmDecline}
        title="Decline Connection Request?"
        message="Declining refunds their 1 token immediately and they will not be able to re-request this idea in the MVP."
        confirmLabel="Decline Request"
        cancelLabel="Cancel"
        isDestructive
        loading={actionLoading}
      />
    </AppShell>
  );
}
