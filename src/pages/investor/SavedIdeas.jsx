// src/pages/investor/SavedIdeas.jsx
import React, { useState, useEffect, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AppShell } from "../../components/layout/AppShell.jsx";
import {
  Card,
  Button,
  Tag,
  ScoreChip,
  EmptyState,
  Skeleton
} from "../../components/ui/index.js";
import { useAuth } from "../../context/AuthContext.jsx";
import { useToast } from "../../context/ToastContext.jsx";
import { api } from "../../lib/api.js";
import { formatINR } from "../../lib/constants.js";
import { Heart, ArrowRight, Compass } from "lucide-react";

export function SavedIdeas() {
  const { user } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  const [savedTeasers, setSavedTeasers] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadSaved = useCallback(async () => {
    if (!user?._id) return;
    try {
      const list = await api.saved.list({ investorId: user._id });
      setSavedTeasers(list);
    } catch (err) {
      toast.error("Failed to load saved startups.");
    } finally {
      setLoading(false);
    }
  }, [user?._id, toast]);

  useEffect(() => {
    loadSaved();

    const handleSync = () => loadSaved();
    window.addEventListener("ventora:db", handleSync);
    window.addEventListener("storage", handleSync);
    return () => {
      window.removeEventListener("ventora:db", handleSync);
      window.removeEventListener("storage", handleSync);
    };
  }, [loadSaved]);

  const handleUnsave = async (e, ideaId) => {
    e.stopPropagation();
    e.preventDefault();
    try {
      await api.saved.toggle({ investorId: user._id, ideaId });
      // Optimistic update
      const removed = savedTeasers.find((t) => t._id === ideaId);
      setSavedTeasers((prev) => prev.filter((t) => t._id !== ideaId));

      toast.info("Idea removed from shortlist.", "", {
        label: "Undo",
        onClick: async () => {
          await api.saved.toggle({ investorId: user._id, ideaId });
          loadSaved();
        }
      });
    } catch (err) {
      toast.error("Could not unsave idea.");
    }
  };

  return (
    <AppShell
      title="Saved Ideas"
      subtitle="Your bookmarked startups shortlisted for potential investment"
    >
      <div className="max-w-4xl mx-auto space-y-6 pb-16">
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[1, 2].map((i) => (
              <Skeleton key={i} className="h-44 w-full" />
            ))}
          </div>
        ) : savedTeasers.length === 0 ? (
          <EmptyState
            icon={Heart}
            title="Nothing saved yet"
            description="Tap the heart on any idea in your feed to shortlist it here for quick access."
            action={{
              label: "Explore Feed",
              onClick: () => navigate("/feed")
            }}
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {savedTeasers.map((teaser) => (
              <Card
                key={teaser._id}
                variant="interactive"
                onClick={() => navigate(`/ideas/${teaser._id}`)}
                className="p-5 flex flex-col justify-between space-y-4 bg-surface"
              >
                <div className="flex items-center justify-between">
                  <Tag>{teaser.industry}</Tag>
                  <ScoreChip
                    score={teaser.scoreTotal}
                    band={teaser.scoreBand}
                  />
                </div>

                <div>
                  <h2 className="text-base font-bold text-ink hover:text-primary transition-colors">
                    {teaser.title}
                  </h2>
                  <p className="text-xs text-ink-secondary mt-1 line-clamp-2 leading-relaxed">
                    {teaser.oneLinePitch}
                  </p>
                </div>

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
                </div>

                <div className="pt-1 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={(e) => handleUnsave(e, teaser._id)}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-rose-600 hover:text-rose-700 transition-colors p-1"
                  >
                    <Heart className="w-4 h-4 fill-rose-600" />
                    <span>Saved</span>
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
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}
