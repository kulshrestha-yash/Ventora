// src/pages/innovator/ScoreResult.jsx
import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { AppShell } from "../../components/layout/AppShell.jsx";
import {
  Card,
  Button,
  Badge,
  ProgressRing,
  ProgressBar,
  ConfirmDialog,
  Skeleton
} from "../../components/ui/index.js";
import { useAuth } from "../../context/AuthContext.jsx";
import { useToast } from "../../context/ToastContext.jsx";
import { api } from "../../lib/api.js";
import { analyzeIdea } from "../../lib/ai/completenessEngine.js";
import { fetchLlmSuggestions } from "../../lib/ai/llmSuggestions.js";
import {
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  ArrowLeft,
  Send,
  Info
} from "lucide-react";

export function ScoreResult() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const toast = useToast();

  const [idea, setIdea] = useState(null);
  const [score, setScore] = useState(null);
  const [llmText, setLlmText] = useState(null);
  const [loading, setLoading] = useState(true);
  const [publishing, setPublishing] = useState(false);
  const [publishDialogOpen, setPublishDialogOpen] = useState(false);
  const [expandedSections, setExpandedSections] = useState({});

  useEffect(() => {
    const loadScore = async () => {
      try {
        const { idea: currentIdea } = await api.ideas.get({ ideaId: id });
        if (currentIdea.innovatorId !== user?._id) {
          toast.error("Unauthorized.");
          navigate("/dashboard");
          return;
        }

        // Pure deterministic AI score calculation
        const analysis = analyzeIdea(currentIdea);
        setIdea(currentIdea);
        setScore(analysis);

        // Optional background LLM enrichment if key is set
        if (analysis.weakOrMissingKeys?.length > 0) {
          fetchLlmSuggestions(currentIdea, analysis.weakOrMissingKeys).then((text) => {
            if (text) setLlmText(text);
          });
        }
      } catch (err) {
        toast.error("Failed to load completeness analysis: " + err.message);
        navigate("/dashboard");
      } finally {
        setLoading(false);
      }
    };
    loadScore();
  }, [id, user?._id, navigate, toast]);

  const toggleExpand = (key) => {
    setExpandedSections((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleConfirmPublish = async () => {
    setPublishing(true);
    try {
      await api.ideas.publish({ ideaId: id });
      toast.success(`"${idea.basics?.title}" is now live in the investor feed!`);
      setPublishDialogOpen(false);
      navigate("/dashboard");
    } catch (err) {
      toast.error(err.message || "Failed to publish idea.");
    } finally {
      setPublishing(false);
    }
  };

  if (loading || !score) {
    return (
      <AppShell title="Running AI Analysis..." subtitle="Evaluating completeness across 9 dimensions">
        <div className="max-w-3xl mx-auto space-y-6">
          <Skeleton className="h-48 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      </AppShell>
    );
  }

  const canPublish = score.canPublish;
  const missingCount = Object.values(score.sections).filter((s) => s.status === "missing").length;

  return (
    <AppShell
      title="AI Completeness Analysis"
      subtitle={`Comprehensive evaluation for "${idea?.basics?.title || "Startup Idea"}"`}
      actions={
        <Link to={`/ideas/${id}/edit`}>
          <Button variant="secondary" size="sm">
            <ArrowLeft className="w-3.5 h-3.5 mr-1" />
            Edit Idea
          </Button>
        </Link>
      }
    >
      <div className="max-w-3xl mx-auto space-y-8 pb-16">
        {/* 1. Header & Gauge Card */}
        <Card className="flex flex-col sm:flex-row items-center justify-between gap-8 p-8 bg-surface shadow-card">
          <div className="space-y-3 text-center sm:text-left flex-1">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
              <Badge tone="primary-soft" size="sm">
                Engine: Rule-Based Deterministic
              </Badge>
              <span className="text-xs text-ink-muted">
                {new Date(score.scoredAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>

            <h1 className="text-2xl font-extrabold text-ink tracking-tight">
              {idea?.basics?.title}
            </h1>

            <p className="text-xs text-ink-secondary leading-relaxed max-w-md">
              Evaluated across 9 critical venture dimensions. An objective score helps match your idea with verified investors.
            </p>

            {/* Publish Gate Notification */}
            {canPublish ? (
              <div className="inline-flex items-center gap-1.5 text-xs text-success font-semibold bg-success-soft px-3 py-1.5 rounded-lg border border-success/20">
                <CheckCircle2 className="w-4 h-4" />
                <span>Publish gate passed (Score ≥ 50 & No missing sections)</span>
              </div>
            ) : (
              <div className="inline-flex items-center gap-1.5 text-xs text-warning font-semibold bg-warning-soft px-3 py-1.5 rounded-lg border border-warning/20">
                <AlertTriangle className="w-4 h-4" />
                <span>
                  Publish gate locked: score must be ≥ 50 (currently {score.total}) with 0 missing sections ({missingCount} missing).
                </span>
              </div>
            )}
          </div>

          <div className="shrink-0">
            <ProgressRing
              score={score.total}
              band={score.band}
              size={130}
              stroke={10}
              label="Completeness / 100"
            />
          </div>
        </Card>

        {/* 2. Mandatory Disclaimer Note */}
        <div className="flex items-start gap-3 p-4 rounded-xl bg-surface border border-line text-xs text-ink-secondary leading-relaxed shadow-sm">
          <Info className="w-4 h-4 text-primary shrink-0 mt-0.5" />
          <p>
            <strong>Mandatory Note:</strong> This score measures how complete and structured your submission is. It is an index of information readiness, not a prediction of startup success, market profitability, or investment guarantee.
          </p>
        </div>

        {/* 3. Section Breakdown Card */}
        <Card className="space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-line">
            <div>
              <h2 className="text-base font-bold text-ink">Section-by-Section Breakdown</h2>
              <p className="text-xs text-ink-muted">Points awarded per dimension based on detail, word count, and key figures</p>
            </div>
            <span className="text-xs font-mono font-bold text-ink-muted">9 Dimensions</span>
          </div>

          <div className="divide-y divide-line">
            {Object.entries(score.sections).map(([key, sec]) => {
              const isExpanded = !!expandedSections[key];
              const isWeakOrMissing = sec.status === "weak" || sec.status === "missing";

              const statusTones = {
                strong: "success-soft",
                partial: "primary-soft",
                weak: "warning-soft",
                missing: "danger-soft"
              };

              const statusLabels = {
                strong: "Strong",
                partial: "Good",
                weak: "Weak ⚠",
                missing: "Missing ⚠"
              };

              return (
                <div key={key} className="py-3.5 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2 font-semibold text-ink">
                      <span>{sec.name}</span>
                      <Badge tone={statusTones[sec.status]} size="sm">
                        {statusLabels[sec.status]}
                      </Badge>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="font-mono text-ink-muted">
                        {Math.round((sec.points / 100) * sec.weight)} / {sec.weight} pts
                      </span>
                      {isWeakOrMissing && sec.tip && (
                        <button
                          type="button"
                          onClick={() => toggleExpand(key)}
                          className="text-primary hover:text-primary-hover p-1"
                          title="View recommendation"
                        >
                          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Progress bar */}
                  <ProgressBar
                    value={sec.points}
                    max={100}
                    tone={sec.status === "strong" ? "success" : sec.status === "missing" ? "danger" : "warning"}
                  />

                  {/* Expandable rule-based tip */}
                  {isExpanded && sec.tip && (
                    <div className="p-3 bg-surface-subtle border border-line rounded-lg text-xs text-ink-secondary animate-in fade-in duration-150">
                      <strong className="text-ink">AI Recommendation:</strong> {sec.tip}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </Card>

        {/* 4. AI Suggestions Card */}
        <Card className="border border-violet/30 bg-violet/5 space-y-4 p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-violet/20 text-violet flex items-center justify-center">
                <Sparkles className="w-4 h-4" />
              </div>
              <h2 className="text-sm font-bold text-ink">Actionable Improvements</h2>
            </div>
            {llmText ? (
              <Badge tone="primary-soft" size="sm">
                AI-assisted suggestions
              </Badge>
            ) : (
              <span className="text-[11px] text-ink-muted">
                Tips are rule-based. Connect an AI key for richer suggestions.
              </span>
            )}
          </div>

          {score.suggestions.length === 0 ? (
            <p className="text-xs text-success font-medium">
              Excellent job! All 9 sections meet strong completeness standards.
            </p>
          ) : (
            <ul className="space-y-2 text-xs text-ink-secondary leading-relaxed">
              {score.suggestions.map((s) => (
                <li key={s.key} className="flex items-start gap-2">
                  <span className="text-violet font-bold">•</span>
                  <span>
                    <strong className="text-ink">{s.name}:</strong> {s.tip}
                  </span>
                </li>
              ))}
            </ul>
          )}

          {/* Hybrid LLM response if available */}
          {llmText && (
            <div className="pt-3 border-t border-violet/20 text-xs text-ink-secondary bg-surface p-3 rounded-lg border border-line">
              <strong className="text-violet">LLM Synthesis:</strong> {llmText}
            </div>
          )}
        </Card>

        {/* 5. Action Row */}
        <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-line">
          <Link to={`/ideas/${id}/edit`}>
            <Button variant="secondary" size="md">
              ← Improve weak sections
            </Button>
          </Link>

          <div className="flex items-center gap-3">
            <Link to="/dashboard">
              <Button variant="ghost" size="md">
                Save as draft
              </Button>
            </Link>

            <Button
              variant="primary"
              size="md"
              disabled={!canPublish}
              onClick={() => setPublishDialogOpen(true)}
              className="shadow-md"
            >
              <Send className="w-4 h-4 mr-1.5" />
              Publish to investor feed
            </Button>
          </div>
        </div>
      </div>

      {/* Publish Confirmation Dialog */}
      <ConfirmDialog
        isOpen={publishDialogOpen}
        onClose={() => setPublishDialogOpen(false)}
        onConfirm={handleConfirmPublish}
        title="Publish Idea to Investor Feed?"
        message="Your startup's public teaser (title, one-line pitch, sector, stage, funding amount, and AI score) will become visible to verified investors. Detailed documents and private sections remain locked until you accept outreach requests."
        confirmLabel="Publish to Feed"
        loading={publishing}
      />
    </AppShell>
  );
}
