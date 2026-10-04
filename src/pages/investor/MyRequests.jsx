// src/pages/investor/MyRequests.jsx
import React, { useState, useEffect, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AppShell } from "../../components/layout/AppShell.jsx";
import {
  Card,
  Button,
  Badge,
  Tabs,
  EmptyState,
  Skeleton,
  ConfirmDialog,
  Avatar
} from "../../components/ui/index.js";
import { useAuth } from "../../context/AuthContext.jsx";
import { useData } from "../../context/DataContext.jsx";
import { useToast } from "../../context/ToastContext.jsx";
import { api } from "../../lib/api.js";
import {
  Send,
  Coins,
  MessageSquare,
  Clock,
  CheckCircle2,
  XCircle,
  RotateCcw,
  ArrowRight
} from "lucide-react";

export function MyRequests() {
  const { user } = useAuth();
  const { refreshData } = useData();
  const toast = useToast();
  const navigate = useNavigate();

  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("all");
  const [withdrawReqId, setWithdrawReqId] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  const loadRequests = useCallback(async () => {
    if (!user?._id) return;
    try {
      const data = await api.requests.listForInvestor({ investorId: user._id });
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

  const handleConfirmWithdraw = async () => {
    if (!withdrawReqId) return;
    setActionLoading(true);
    try {
      await api.requests.withdraw({ requestId: withdrawReqId });
      await refreshData();
      toast.success("Request withdrawn! 1 token refunded to your wallet.");
      setWithdrawReqId(null);
      loadRequests();
    } catch (err) {
      toast.error(err.message || "Failed to withdraw request.");
    } finally {
      setActionLoading(false);
    }
  };

  const pendingList = requests.filter((r) => r.status === "pending");
  const acceptedList = requests.filter((r) => r.status === "accepted");
  const declinedList = requests.filter((r) => r.status === "declined");
  const withdrawnList = requests.filter((r) => r.status === "withdrawn");

  const filteredRequests =
    activeTab === "pending"
      ? pendingList
      : activeTab === "accepted"
      ? acceptedList
      : activeTab === "declined"
      ? declinedList
      : activeTab === "withdrawn"
      ? withdrawnList
      : requests;

  const tabs = [
    { id: "all", label: "All Requests", count: requests.length },
    { id: "pending", label: "Pending", count: pendingList.length },
    { id: "accepted", label: "Accepted", count: acceptedList.length },
    { id: "declined", label: "Declined", count: declinedList.length },
    { id: "withdrawn", label: "Withdrawn", count: withdrawnList.length }
  ];

  return (
    <AppShell
      title="My Sent Requests"
      subtitle="Track connection inquiries, founder reviews, and token refunds"
    >
      <div className="max-w-4xl mx-auto space-y-6 pb-16">
        <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />

        {loading ? (
          <div className="space-y-4">
            <Skeleton className="h-28 w-full" />
            <Skeleton className="h-28 w-full" />
          </div>
        ) : filteredRequests.length === 0 ? (
          <EmptyState
            icon={Send}
            title="No requests sent"
            description="Browse your matched feed and spend a token when an idea genuinely fits your thesis."
            action={{
              label: "Explore Feed",
              onClick: () => navigate("/feed")
            }}
          />
        ) : (
          <div className="space-y-4">
            {filteredRequests.map((req) => {
              const statusBadges = {
                pending: { tone: "warning-soft", label: "Pending review", icon: Clock },
                accepted: { tone: "success-soft", label: "Accepted & unlocked", icon: CheckCircle2 },
                declined: { tone: "danger-soft", label: "Declined", icon: XCircle },
                withdrawn: { tone: "neutral", label: "Withdrawn", icon: RotateCcw }
              };

              const conf = statusBadges[req.status] || statusBadges.pending;
              const StatusIcon = conf.icon;

              return (
                <Card key={req._id} className="p-5 space-y-3 bg-surface shadow-card">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <Link
                          to={`/ideas/${req.ideaId}`}
                          className="text-base font-bold text-ink hover:text-primary transition-colors"
                        >
                          {req.idea?.title || "Startup Idea"}
                        </Link>
                        <Badge tone={conf.tone} size="sm">
                          <StatusIcon className="w-3 h-3 mr-0.5" />
                          {conf.label}
                        </Badge>
                      </div>

                      <div className="text-xs text-ink-muted mt-0.5">
                        Innovator:{" "}
                        <strong className="text-ink">
                          {req.status === "accepted"
                            ? req.innovator?.name
                            : `Innovator #${req.innovator?.code || "I-1000"}`}
                        </strong>{" "}
                        · Sent {new Date(req.createdAt).toLocaleDateString()}
                      </div>
                    </div>

                    {/* Side effects / Actions Column */}
                    <div className="flex items-center gap-2 self-end sm:self-center">
                      {req.status === "accepted" && (
                        <Link to="/messages">
                          <Button variant="primary" size="sm">
                            <MessageSquare className="w-3.5 h-3.5 mr-1" />
                            Chat unlocked →
                          </Button>
                        </Link>
                      )}

                      {req.status === "declined" && (
                        <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                          <Coins className="w-3.5 h-3.5 text-success" />
                          <span>+1 token refunded</span>
                        </span>
                      )}

                      {req.status === "withdrawn" && (
                        <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-surface-subtle text-ink-muted border border-line">
                          <Coins className="w-3.5 h-3.5" />
                          <span>+1 token refunded</span>
                        </span>
                      )}

                      {req.status === "pending" && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setWithdrawReqId(req._id)}
                          className="text-ink-muted hover:text-danger"
                        >
                          Withdraw
                        </Button>
                      )}
                    </div>
                  </div>

                  {req.message && (
                    <div className="text-xs text-ink-secondary italic bg-surface-subtle p-3 rounded-lg border border-line">
                      "{req.message}"
                    </div>
                  )}
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Withdraw Confirm Dialog */}
      <ConfirmDialog
        isOpen={!!withdrawReqId}
        onClose={() => setWithdrawReqId(null)}
        onConfirm={handleConfirmWithdraw}
        title="Withdraw Connection Request?"
        message="Withdraw now? Your token is refunded immediately and the request will be cancelled."
        confirmLabel="Withdraw Request"
        cancelLabel="Keep Pending"
        isDestructive
        loading={actionLoading}
      />
    </AppShell>
  );
}
