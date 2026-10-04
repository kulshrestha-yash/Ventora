// src/pages/investor/TokenWallet.jsx
import React, { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { AppShell } from "../../components/layout/AppShell.jsx";
import {
  Card,
  Badge,
  EmptyState,
  Skeleton
} from "../../components/ui/index.js";
import { useAuth } from "../../context/AuthContext.jsx";
import { useData } from "../../context/DataContext.jsx";
import { useToast } from "../../context/ToastContext.jsx";
import { api } from "../../lib/api.js";
import { TOKENS } from "../../lib/constants.js";
import { Coins, ArrowUpRight, ArrowDownLeft, ShieldCheck, Info } from "lucide-react";

export function TokenWallet() {
  const { user } = useAuth();
  const { tokenBalance } = useData();
  const toast = useToast();

  const [ledger, setLedger] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadLedger = useCallback(async () => {
    if (!user?._id) return;
    try {
      const rows = await api.tokens.ledger({ investorId: user._id });
      setLedger(rows);
    } catch (err) {
      toast.error("Failed to load token transactions.");
    } finally {
      setLoading(false);
    }
  }, [user?._id, toast]);

  useEffect(() => {
    loadLedger();

    const handleSync = () => loadLedger();
    window.addEventListener("ventora:db", handleSync);
    window.addEventListener("storage", handleSync);
    return () => {
      window.removeEventListener("ventora:db", handleSync);
      window.removeEventListener("storage", handleSync);
    };
  }, [loadLedger]);

  return (
    <AppShell
      title="Token Wallet & History"
      subtitle="Track your verified outreach budget and transaction ledger"
    >
      <div className="max-w-4xl mx-auto space-y-8 pb-16">
        {/* 1. Header Balance Card & Explainer Card */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-stretch">
          {/* Balance Metric Card */}
          <Card className="md:col-span-4 p-6 bg-surface shadow-card flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-ink-muted">
                <span>Available Tokens</span>
                <Coins className="w-4 h-4 text-warning" />
              </div>
              <div className="text-5xl font-extrabold text-ink tabular-nums mt-3">
                {tokenBalance}
              </div>
            </div>
            <p className="text-xs text-ink-muted mt-4">
              1 token spent per founder connection request.
            </p>
          </Card>

          {/* How Tokens Work Explainer Card */}
          <Card className="md:col-span-8 p-6 bg-surface shadow-card space-y-3">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-primary" />
              <h2 className="text-sm font-bold text-ink">How Outreach Tokens Work</h2>
            </div>
            <ul className="space-y-2 text-xs text-ink-secondary leading-relaxed">
              <li className="flex items-start gap-2">
                <span className="text-primary font-bold">•</span>
                <span>
                  <strong>Welcome Grant:</strong> You received {TOKENS.STARTING_GRANT} tokens upon completing mock identity verification (KYC).
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary font-bold">•</span>
                <span>
                  <strong>Outreach Escrow:</strong> Sending a connection request costs {TOKENS.REQUEST_COST} token.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary font-bold">•</span>
                <span>
                  <strong>100% Refundable:</strong> Declined or withdrawn requests credit your token back immediately.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary font-bold">•</span>
                <span>
                  <strong>Intentional Scarcity:</strong> Tokens cannot be purchased in the MVP. Scarcity protects founders from bulk spam.
                </span>
              </li>
            </ul>
          </Card>
        </div>

        {/* 2. Transaction Ledger */}
        <Card className="space-y-4 bg-surface shadow-card">
          <div className="flex items-center justify-between pb-3 border-b border-line">
            <div>
              <h2 className="text-base font-bold text-ink">Transaction History</h2>
              <p className="text-xs text-ink-muted">Complete audit trail of grants, spends, and refunds</p>
            </div>
            <span className="text-xs font-mono font-semibold text-ink-muted">
              {ledger.length} {ledger.length === 1 ? "entry" : "entries"}
            </span>
          </div>

          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : ledger.length === 0 ? (
            <EmptyState
              icon={Coins}
              title="No tokens yet"
              description="Complete investor verification to receive your starting tokens."
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-surface-subtle text-ink-muted uppercase tracking-wider font-semibold border-b border-line">
                  <tr>
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-4">Type</th>
                    <th className="py-3 px-4">Reason</th>
                    <th className="py-3 px-4 text-right">Amount</th>
                    <th className="py-3 px-4 text-right">Balance</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line text-ink">
                  {ledger.map((row) => {
                    const isSpend = row.type === "spend";
                    const isRefund = row.type === "refund";

                    return (
                      <tr key={row._id} className="hover:bg-surface-subtle transition-colors">
                        <td className="py-3 px-4 text-ink-muted whitespace-nowrap">
                          {new Date(row.createdAt).toLocaleDateString([], {
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit"
                          })}
                        </td>

                        <td className="py-3 px-4">
                          <Badge
                            tone={
                              isSpend
                                ? "warning-soft"
                                : isRefund
                                ? "primary-soft"
                                : "success-soft"
                            }
                            size="sm"
                          >
                            {isSpend ? (
                              <ArrowUpRight className="w-3 h-3 mr-0.5 text-warning" />
                            ) : (
                              <ArrowDownLeft className="w-3 h-3 mr-0.5 text-success" />
                            )}
                            {row.type}
                          </Badge>
                        </td>

                        <td className="py-3 px-4 text-ink font-medium max-w-xs truncate">
                          {row.reason}
                        </td>

                        <td className="py-3 px-4 text-right font-mono font-bold">
                          <span className={isSpend ? "text-danger" : "text-success"}>
                            {isSpend ? `-${row.amount}` : `+${row.amount}`}
                          </span>
                        </td>

                        <td className="py-3 px-4 text-right font-mono font-semibold text-ink-secondary">
                          {row.balanceAfter !== undefined ? row.balanceAfter : "—"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>
    </AppShell>
  );
}
