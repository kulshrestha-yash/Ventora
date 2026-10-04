// src/pages/investor/Feed.jsx
import React, { useState, useEffect, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AppShell } from "../../components/layout/AppShell.jsx";
import {
  Card,
  Button,
  Select,
  Tag,
  ScoreChip,
  MatchRing,
  EmptyState,
  Skeleton
} from "../../components/ui/index.js";
import { useAuth } from "../../context/AuthContext.jsx";
import { useToast } from "../../context/ToastContext.jsx";
import { api } from "../../lib/api.js";
import {
  INDUSTRIES,
  STAGES,
  RANGES,
  RANGE_LABELS,
  formatINR
} from "../../lib/constants.js";
import {
  SlidersHorizontal,
  Compass,
  Heart,
  ArrowRight,
  ShieldCheck,
  Settings,
  Sparkles
} from "lucide-react";

export function Feed() {
  const { user } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  const [teasers, setTeasers] = useState([]);
  const [savedIdeaIds, setSavedIdeaIds] = useState(new Set());
  const [loading, setLoading] = useState(true);

  // Sorting & Filters State
  const [sort, setSort] = useState("match"); // "match" | "newest" | "score"
  const [industryFilter, setIndustryFilter] = useState("All");
  const [stageFilter, setStageFilter] = useState("All");
  const [rangeFilter, setRangeFilter] = useState("All");
  const [nearMatch, setNearMatch] = useState(false);

  const prefs = user?.preferences || {};
  const hasPreferences = prefs.industries && prefs.industries.length > 0;

  const loadFeed = useCallback(async () => {
    if (!user?._id) return;
    try {
      const filters = {
        industry: industryFilter,
        stage: stageFilter,
        range: rangeFilter === "All" ? "All" : RANGES[Number(rangeFilter)]
      };

      const items = await api.feed.list({
        investorId: user._id,
        sort,
        filters,
        nearMatch
      });
      setTeasers(items);

      // Load saved list
      const saved = await api.saved.list({ investorId: user._id });
      setSavedIdeaIds(new Set(saved.map((s) => s._id)));
    } catch (err) {
      toast.error("Failed to load matched feed.");
    } finally {
      setLoading(false);
    }
  }, [user?._id, sort, industryFilter, stageFilter, rangeFilter, nearMatch, toast]);

  useEffect(() => {
    loadFeed();

    const handleSync = () => loadFeed();
    window.addEventListener("ventora:db", handleSync);
    window.addEventListener("storage", handleSync);
    return () => {
      window.removeEventListener("ventora:db", handleSync);
      window.removeEventListener("storage", handleSync);
    };
  }, [loadFeed]);

  const handleToggleSave = async (e, ideaId) => {
    e.stopPropagation();
    e.preventDefault();
    try {
      const res = await api.saved.toggle({ investorId: user._id, ideaId });
      const nextSet = new Set(savedIdeaIds);
      if (res.saved) {
        nextSet.add(ideaId);
        toast.success("Idea saved to your shortlist!");
      } else {
        nextSet.delete(ideaId);
        toast.info("Removed from saved ideas.", "", {
          label: "Undo",
          onClick: async () => {
            await api.saved.toggle({ investorId: user._id, ideaId });
            loadFeed();
          }
        });
      }
      setSavedIdeaIds(nextSet);
    } catch (err) {
      toast.error("Could not update saved idea.");
    }
  };

  return (
    <AppShell
      title="Your Matched Feed"
      subtitle={
        hasPreferences
          ? `Ranked by your thesis: ${prefs.industries.join(", ")} · ${prefs.stages.join(", ")}`
          : "Showing all published ideas (preferences skipped)"
      }
      actions={
        <Link to="/onboarding/investor?edit=1">
          <Button variant="secondary" size="sm">
            <Settings className="w-3.5 h-3.5 mr-1.5" />
            Edit preferences
          </Button>
        </Link>
      }
    >
      <div className="space-y-6 pb-16">
        {/* Skipped Preferences Banner */}
        {!hasPreferences && (
          <div className="flex items-center justify-between p-4 rounded-xl bg-primary-soft/60 border border-primary/20 text-ink text-xs">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-primary shrink-0" />
              <span>You skipped preferences — showing everything, unranked. Set your thesis to enable matching %!</span>
            </div>
            <Link to="/onboarding/investor?edit=1">
              <Button variant="primary" size="sm">
                Set thesis →
              </Button>
            </Link>
          </div>
        )}

        {/* Controls Row: Sort Tabs & Filter Dropdowns */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 p-4 rounded-xl bg-surface border border-line shadow-sm">
          {/* Sort tabs */}
          <div className="flex items-center gap-2 bg-surface-subtle p-1 rounded-lg border border-line text-xs font-semibold">
            {[
              { id: "match", label: "Best match" },
              { id: "newest", label: "Newest" },
              { id: "score", label: "Highest AI score" }
            ].map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => setSort(s.id)}
                className={`px-3 py-1.5 rounded-md transition-colors ${
                  sort === s.id
                    ? "bg-surface text-primary shadow-sm font-bold"
                    : "text-ink-muted hover:text-ink"
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>

          {/* Filters */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Industry Filter */}
            <select
              value={industryFilter}
              onChange={(e) => setIndustryFilter(e.target.value)}
              className="h-8 px-2.5 text-xs bg-surface border border-line rounded-lg text-ink focus:outline-none focus:ring-1 focus:ring-primary/20"
            >
              <option value="All">All Industries</option>
              {INDUSTRIES.map((ind) => (
                <option key={ind} value={ind}>
                  {ind}
                </option>
              ))}
            </select>

            {/* Stage Filter */}
            <select
              value={stageFilter}
              onChange={(e) => setStageFilter(e.target.value)}
              className="h-8 px-2.5 text-xs bg-surface border border-line rounded-lg text-ink focus:outline-none focus:ring-1 focus:ring-primary/20"
            >
              <option value="All">All Stages</option>
              {STAGES.map((stg) => (
                <option key={stg} value={stg}>
                  {stg}
                </option>
              ))}
            </select>

            {/* Range Filter */}
            <select
              value={rangeFilter}
              onChange={(e) => setRangeFilter(e.target.value)}
              className="h-8 px-2.5 text-xs bg-surface border border-line rounded-lg text-ink focus:outline-none focus:ring-1 focus:ring-primary/20"
            >
              <option value="All">All Check Sizes</option>
              {RANGE_LABELS.map((label, idx) => (
                <option key={label} value={idx}>
                  {label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Feed Disclaimer Strip */}
        <div className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-surface-subtle border border-line text-xs text-ink-muted">
          <ShieldCheck className="w-4 h-4 text-primary shrink-0" />
          <span>
            Cards show only the public teaser (title, pitch, industry, stage, funding need, AI score). Full details unlock after the innovator accepts your request.
          </span>
        </div>

        {/* 3. Idea Teaser Cards List */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-48 w-full" />
            ))}
          </div>
        ) : teasers.length === 0 ? (
          // Empty State
          <EmptyState
            icon={SlidersHorizontal}
            title="No matches right now"
            description="Nothing matches your current filter or investment thesis. Widen your industries or range to see near-matches."
            action={{
              label: nearMatch ? "Adjust preferences" : "Show near-matches",
              onClick: () => {
                if (nearMatch) {
                  navigate("/onboarding/investor?edit=1");
                } else {
                  setNearMatch(true);
                }
              }
            }}
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {teasers.map((teaser) => {
              const isSaved = savedIdeaIds.has(teaser._id);

              return (
                <Card
                  key={teaser._id}
                  variant="interactive"
                  onClick={() => navigate(`/ideas/${teaser._id}`)}
                  className="p-5 flex flex-col justify-between space-y-4 bg-surface"
                >
                  {/* Row 1: Tags and AI Score */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <Tag>{teaser.industry}</Tag>
                      {teaser.outsidePrefs && (
                        <span className="text-[11px] font-semibold text-ink-muted bg-surface-subtle px-2 py-0.5 rounded border border-line">
                          Outside your range
                        </span>
                      )}
                    </div>
                    <ScoreChip
                      score={teaser.scoreTotal}
                      band={teaser.scoreBand}
                    />
                  </div>

                  {/* Row 2: Title */}
                  <div>
                    <h2 className="text-base font-bold text-ink hover:text-primary transition-colors">
                      {teaser.title}
                    </h2>
                    {/* Row 3: One-line pitch */}
                    <p className="text-xs text-ink-secondary mt-1 line-clamp-2 leading-relaxed">
                      {teaser.oneLinePitch}
                    </p>
                  </div>

                  {/* Row 4: Meta Information */}
                  <div className="pt-3 border-t border-line flex items-center justify-between text-xs text-ink-muted">
                    <div className="flex items-center gap-2">
                      <span>Stage: <strong className="text-ink">{teaser.stage}</strong></span>
                      <span>•</span>
                      <span>
                        Seeking:{" "}
                        <strong className="text-ink">
                          {teaser.fundingAmount === 0 ? "Not raising" : formatINR(teaser.fundingAmount, true)}
                        </strong>
                      </span>
                    </div>

                    {hasPreferences && !teaser.outsidePrefs && (
                      <MatchRing percent={teaser.matchPercent} />
                    )}
                  </div>

                  {/* Row 5: Save & View Idea */}
                  <div className="pt-1 flex items-center justify-between">
                    <button
                      type="button"
                      onClick={(e) => handleToggleSave(e, teaser._id)}
                      className={`inline-flex items-center gap-1.5 text-xs font-semibold transition-colors p-1 rounded ${
                        isSaved
                          ? "text-rose-600 hover:text-rose-700"
                          : "text-ink-muted hover:text-ink"
                      }`}
                      title={isSaved ? "Remove from saved" : "Save to shortlist"}
                    >
                      <Heart
                        className={`w-4 h-4 ${isSaved ? "fill-rose-600" : ""}`}
                      />
                      <span>{isSaved ? "Saved" : "Save"}</span>
                    </button>

                    <Link
                      to={`/ideas/${teaser._id}`}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
                    >
                      <span>View idea</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </AppShell>
  );
}
