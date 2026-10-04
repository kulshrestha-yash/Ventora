// src/pages/innovator/IdeaForm.jsx
import React, { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { AppShell } from "../../components/layout/AppShell.jsx";
import {
  Button,
  Input,
  Textarea,
  Select,
  Field,
  Card,
  Badge,
  Stepper,
  Skeleton
} from "../../components/ui/index.js";
import { useAuth } from "../../context/AuthContext.jsx";
import { useToast } from "../../context/ToastContext.jsx";
import { api } from "../../lib/api.js";
import { analyzeIdea } from "../../lib/ai/completenessEngine.js";
import {
  INDUSTRIES,
  STAGES,
  BIZ_MODELS,
  formatINR
} from "../../lib/constants.js";
import {
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  Save,
  Check
} from "lucide-react";

const STEPS = [
  { id: 1, title: "1. Basics", subtitle: "Title & sector" },
  { id: 2, title: "2. Problem", subtitle: "Customer pain" },
  { id: 3, title: "3. Solution", subtitle: "Product mechanism" },
  { id: 4, title: "4. Target Users", subtitle: "First 100 users" },
  { id: 5, title: "5. Market & Competitors", subtitle: "Landscape" },
  { id: 6, title: "6. Business Model", subtitle: "Monetization" },
  { id: 7, title: "7. Funding", subtitle: "Raise & allocation" },
  { id: 8, title: "8. Documents", subtitle: "Pitch links" },
  { id: 9, title: "9. Review & Submit", subtitle: "AI completeness check" }
];

export function IdeaForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const toast = useToast();

  const [currentStep, setCurrentStep] = useState(1);
  const [ideaId, setIdeaId] = useState(id || null);
  const [loading, setLoading] = useState(!!id);
  const [autosaveStatus, setAutosaveStatus] = useState("All changes saved");
  const [errors, setErrors] = useState({});

  // Form State
  const [formData, setFormData] = useState({
    basics: {
      title: "",
      industry: INDUSTRIES[0],
      stage: STAGES[0],
      oneLinePitch: "",
      location: "",
      businessModel: BIZ_MODELS[0]
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
      notRaising: false,
      currency: "INR"
    },
    documents: {
      pitchDeckUrl: "",
      notesUrl: ""
    },
    visibility: {
      problem: "public",
      solution: "public",
      targetUsers: "accepted",
      market: "accepted",
      competitors: "accepted",
      businessModel: "accepted",
      revenueModel: "accepted",
      fundingUse: "accepted",
      growth: "accepted"
    }
  });

  const autosaveTimerRef = useRef(null);
  const isDirtyRef = useRef(false);

  // Load existing draft if editing
  useEffect(() => {
    if (!id) return;
    const fetchDraft = async () => {
      try {
        const { idea } = await api.ideas.get({ ideaId: id });
        if (idea.innovatorId !== user?._id) {
          toast.error("You are not authorized to edit this idea.");
          navigate("/dashboard");
          return;
        }
        setFormData({
          basics: {
            title: idea.basics?.title || "",
            industry: idea.basics?.industry || INDUSTRIES[0],
            stage: idea.basics?.stage || STAGES[0],
            oneLinePitch: idea.basics?.oneLinePitch || "",
            location: idea.basics?.location || "",
            businessModel: idea.basics?.businessModel || BIZ_MODELS[0]
          },
          sections: {
            problem: idea.sections?.problem || "",
            solution: idea.sections?.solution || "",
            targetUsers: idea.sections?.targetUsers || "",
            market: idea.sections?.market || "",
            competitors: idea.sections?.competitors || "",
            businessModel: idea.sections?.businessModel || "",
            revenueModel: idea.sections?.revenueModel || "",
            fundingUse: idea.sections?.fundingUse || "",
            growth: idea.sections?.growth || ""
          },
          funding: {
            amount: idea.funding?.amount ?? 1500000,
            notRaising: idea.funding?.amount === 0,
            currency: "INR"
          },
          documents: {
            pitchDeckUrl: idea.documents?.pitchDeckUrl || "",
            notesUrl: idea.documents?.notesUrl || ""
          },
          visibility: idea.visibility || {
            problem: "public",
            solution: "public",
            targetUsers: "accepted",
            market: "accepted",
            competitors: "accepted",
            businessModel: "accepted",
            revenueModel: "accepted",
            fundingUse: "accepted",
            growth: "accepted"
          }
        });
        setIdeaId(idea._id);
      } catch (err) {
        toast.error("Could not load draft.");
        navigate("/dashboard");
      } finally {
        setLoading(false);
      }
    };
    fetchDraft();
  }, [id, user?._id, navigate, toast]);

  // Autosave handler (debounced 1.5s)
  const triggerAutosave = useCallback(async (currentData, currentIdeaId) => {
    if (!user?._id) return;
    setAutosaveStatus("Saving…");

    try {
      const payload = {
        basics: currentData.basics,
        sections: currentData.sections,
        funding: {
          amount: currentData.funding.notRaising ? 0 : Number(currentData.funding.amount),
          currency: "INR"
        },
        documents: currentData.documents,
        visibility: currentData.visibility
      };

      if (!currentIdeaId) {
        // Create draft
        const res = await api.ideas.createDraft({
          ownerId: user._id,
          basics: payload.basics
        });
        const newId = res.idea._id;
        setIdeaId(newId);
        // Save rest of payload
        await api.ideas.saveDraft({ ideaId: newId, patch: payload });
        setAutosaveStatus("Draft autosaved just now");
        navigate(`/ideas/${newId}/edit`, { replace: true });
      } else {
        await api.ideas.saveDraft({ ideaId: currentIdeaId, patch: payload });
        setAutosaveStatus("Draft autosaved just now");
      }
      isDirtyRef.current = false;
    } catch (err) {
      setAutosaveStatus("Autosave failed");
      console.warn("Autosave error:", err);
    }
  }, [user?._id, navigate]);

  // Debounce autosave whenever formData changes
  const updateData = (updater) => {
    isDirtyRef.current = true;
    setFormData((prev) => {
      const next = typeof updater === "function" ? updater(prev) : { ...prev, ...updater };

      if (autosaveTimerRef.current) clearTimeout(autosaveTimerRef.current);
      autosaveTimerRef.current = setTimeout(() => {
        triggerAutosave(next, ideaId);
      }, 1500);

      return next;
    });
  };

  // Section word counter and status helper
  const getSectionStatus = (key) => {
    const text = (formData.sections[key] || "").trim();
    const words = text ? text.split(/\s+/).filter(Boolean).length : 0;
    if (words === 0) return { status: "missing", label: "Missing", words, tone: "danger-soft" };
    if (words < 20) return { status: "weak", label: "Weak", words, tone: "warning-soft" };
    if (words < 50) return { status: "partial", label: "Good", words, tone: "primary-soft" };
    return { status: "strong", label: "Strong", words, tone: "success-soft" };
  };

  const validateStep = (step) => {
    const newErrors = {};
    if (step === 1) {
      if (!formData.basics.title.trim() || formData.basics.title.length < 3 || formData.basics.title.length > 80) {
        newErrors.title = "Give your idea a title (3–80 characters).";
      }
      if (!formData.basics.oneLinePitch.trim() || formData.basics.oneLinePitch.length > 140) {
        newErrors.oneLinePitch = "Keep the pitch within 140 characters.";
      }
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (!validateStep(currentStep)) return;
    if (currentStep < 9) {
      setCurrentStep((s) => s + 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      // Step 9: Run AI Analysis
      handleRunAnalysis();
    }
  };

  const handleRunAnalysis = async () => {
    try {
      setAutosaveStatus("Saving draft…");
      // Force immediate save
      const payload = {
        basics: formData.basics,
        sections: formData.sections,
        funding: {
          amount: formData.funding.notRaising ? 0 : Number(formData.funding.amount),
          currency: "INR"
        },
        documents: formData.documents,
        visibility: formData.visibility
      };

      let activeId = ideaId;
      if (!activeId) {
        const res = await api.ideas.createDraft({ ownerId: user._id, basics: payload.basics });
        activeId = res.idea._id;
      }
      await api.ideas.saveDraft({ ideaId: activeId, patch: payload });
      navigate(`/ideas/${activeId}/score`);
    } catch (err) {
      toast.error("Could not run analysis: " + err.message);
    }
  };

  if (loading) {
    return (
      <AppShell title="Loading Idea..." subtitle="Preparing workspace">
        <div className="max-w-4xl mx-auto space-y-4">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      </AppShell>
    );
  }

  // Live score calculation preview
  const liveScore = analyzeIdea({
    sections: formData.sections,
    funding: { amount: formData.funding.notRaising ? 0 : Number(formData.funding.amount) }
  });

  return (
    <AppShell
      title={ideaId ? `Edit Idea: ${formData.basics.title || "Draft"}` : "Submit New Startup Idea"}
      subtitle="Complete each section carefully. The AI will evaluate completeness before publishing."
      actions={
        <div className="flex items-center gap-3">
          <span className="text-xs text-ink-muted hidden sm:inline-block font-mono">
            {autosaveStatus}
          </span>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => triggerAutosave(formData, ideaId)}
          >
            <Save className="w-3.5 h-3.5 mr-1" />
            Save Draft
          </Button>
        </div>
      }
    >
      <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 pb-16">
        {/* Left Column: 9-Step Stepper (Sticky on desktop, horizontal on mobile) */}
        <div className="lg:col-span-4">
          <div className="lg:sticky lg:top-24 space-y-4">
            <Card className="p-4 bg-surface">
              <h2 className="text-xs font-bold uppercase tracking-wider text-ink-muted mb-3">
                Submission Steps
              </h2>
              <Stepper
                steps={STEPS}
                currentStep={currentStep}
                onStepClick={(step) => {
                  if (validateStep(currentStep)) {
                    setCurrentStep(step);
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }
                }}
                variant="vertical"
              />
            </Card>

            {/* Live Completeness Mini Widget */}
            <Card className="p-4 bg-surface-subtle border border-line space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-ink">Live AI Completeness</span>
                <span className="font-mono font-bold text-primary">{liveScore.total}/100</span>
              </div>
              <div className="w-full h-1.5 bg-line rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary transition-all duration-300"
                  style={{ width: `${liveScore.total}%` }}
                />
              </div>
              <p className="text-[11px] text-ink-muted">
                Gate requires ≥ 50 pts & 0 missing sections.
              </p>
            </Card>
          </div>
        </div>

        {/* Right Column: Step Fields */}
        <div className="lg:col-span-8">
          <Card className="p-6 space-y-6 bg-surface shadow-card">
            {/* Step 1: Basics */}
            {currentStep === 1 && (
              <div className="space-y-4 animate-in fade-in duration-150">
                <div>
                  <h2 className="text-lg font-bold text-ink">Startup Basics</h2>
                  <p className="text-xs text-ink-muted">Public metadata shown in investor search and teaser cards.</p>
                </div>

                <Field
                  label="Startup / Idea Title"
                  helper="3 to 80 characters"
                  error={errors.title}
                  required
                >
                  <Input
                    placeholder="e.g. AgriDrone Telemetry"
                    value={formData.basics.title}
                    onChange={(e) =>
                      updateData((prev) => ({
                        ...prev,
                        basics: { ...prev.basics, title: e.target.value }
                      }))
                    }
                  />
                </Field>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Field label="Industry Sector" required>
                    <Select
                      value={formData.basics.industry}
                      onChange={(e) =>
                        updateData((prev) => ({
                          ...prev,
                          basics: { ...prev.basics, industry: e.target.value }
                        }))
                      }
                    >
                      {INDUSTRIES.map((ind) => (
                        <option key={ind} value={ind}>
                          {ind}
                        </option>
                      ))}
                    </Select>
                  </Field>

                  <Field label="Startup Stage" required>
                    <Select
                      value={formData.basics.stage}
                      onChange={(e) =>
                        updateData((prev) => ({
                          ...prev,
                          basics: { ...prev.basics, stage: e.target.value }
                        }))
                      }
                    >
                      {STAGES.map((stg) => (
                        <option key={stg} value={stg}>
                          {stg}
                        </option>
                      ))}
                    </Select>
                  </Field>
                </div>

                <Field
                  label="One-line Pitch"
                  helper="Shown in the public feed (max 140 chars)"
                  counter={`${formData.basics.oneLinePitch.length}/140`}
                  error={errors.oneLinePitch}
                  required
                >
                  <Textarea
                    rows={2}
                    placeholder="Describe your startup in one compelling sentence..."
                    value={formData.basics.oneLinePitch}
                    onChange={(e) => {
                      if (e.target.value.length <= 140) {
                        updateData((prev) => ({
                          ...prev,
                          basics: { ...prev.basics, oneLinePitch: e.target.value }
                        }));
                      }
                    }}
                  />
                </Field>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Field label="Location / Headquarters" helper="e.g. Delhi NCR, Bengaluru, Remote">
                    <Input
                      placeholder="e.g. Noida, UP"
                      value={formData.basics.location}
                      onChange={(e) =>
                        updateData((prev) => ({
                          ...prev,
                          basics: { ...prev.basics, location: e.target.value }
                        }))
                      }
                    />
                  </Field>

                  <Field label="Primary Business Model" required>
                    <Select
                      value={formData.basics.businessModel}
                      onChange={(e) =>
                        updateData((prev) => ({
                          ...prev,
                          basics: { ...prev.basics, businessModel: e.target.value }
                        }))
                      }
                    >
                      {BIZ_MODELS.map((bm) => (
                        <option key={bm} value={bm}>
                          {bm}
                        </option>
                      ))}
                    </Select>
                  </Field>
                </div>
              </div>
            )}

            {/* Step 2: Problem */}
            {currentStep === 2 && (
              <div className="space-y-4 animate-in fade-in duration-150">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-bold text-ink">Problem Statement</h2>
                    <p className="text-xs text-ink-muted">Weight: 12% · Min 25 words (60 words for strong score)</p>
                  </div>
                  <Badge tone={getSectionStatus("problem").tone} size="sm">
                    {getSectionStatus("problem").label} ({getSectionStatus("problem").words} words)
                  </Badge>
                </div>

                <Field
                  label="What problem are you solving, and for whom?"
                  helper="Explain who feels the pain, how frequently, and what current workarounds cost them."
                  required
                >
                  <Textarea
                    rows={6}
                    placeholder="Commercial farm operators lose 18–25% of annual harvest to unspotted crop blight..."
                    value={formData.sections.problem}
                    onChange={(e) =>
                      updateData((prev) => ({
                        ...prev,
                        sections: { ...prev.sections, problem: e.target.value }
                      }))
                    }
                  />
                </Field>

                {/* IP Disclaimer Banner */}
                <div className="flex items-start gap-2.5 p-3 rounded-lg bg-surface-subtle border border-line text-xs text-ink-secondary">
                  <ShieldCheck className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                  <span>
                    Do not include confidential IP or trade secrets here. Detailed documents stay private until you approve access.
                  </span>
                </div>
              </div>
            )}

            {/* Step 3: Solution */}
            {currentStep === 3 && (
              <div className="space-y-4 animate-in fade-in duration-150">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-bold text-ink">Proposed Solution</h2>
                    <p className="text-xs text-ink-muted">Weight: 14% · Min 25 words (60 words for strong score)</p>
                  </div>
                  <Badge tone={getSectionStatus("solution").tone} size="sm">
                    {getSectionStatus("solution").label} ({getSectionStatus("solution").words} words)
                  </Badge>
                </div>

                <Field
                  label="How does your product solve it?"
                  helper="Keep it high-level — explain the user mechanism without exposing trade secrets."
                  required
                >
                  <Textarea
                    rows={6}
                    placeholder="We provide an autonomous multi-spectral drone fleet paired with an edge AI sensor..."
                    value={formData.sections.solution}
                    onChange={(e) =>
                      updateData((prev) => ({
                        ...prev,
                        sections: { ...prev.sections, solution: e.target.value }
                      }))
                    }
                  />
                </Field>

                <div className="flex items-start gap-2.5 p-3 rounded-lg bg-surface-subtle border border-line text-xs text-ink-secondary">
                  <ShieldCheck className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                  <span>
                    Do not include confidential IP or trade secrets here. Detailed documents stay private until you approve access.
                  </span>
                </div>
              </div>
            )}

            {/* Step 4: Target Users */}
            {currentStep === 4 && (
              <div className="space-y-4 animate-in fade-in duration-150">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-bold text-ink">Target Users</h2>
                    <p className="text-xs text-ink-muted">Weight: 10% · Min 15 words (40 words for strong score)</p>
                  </div>
                  <Badge tone={getSectionStatus("targetUsers").tone} size="sm">
                    {getSectionStatus("targetUsers").label} ({getSectionStatus("targetUsers").words} words)
                  </Badge>
                </div>

                <Field
                  label="Who exactly is this for? Describe your first 100 users."
                  helper="A specific segment (e.g. 50-acre sugarcane growers in UP) beats 'everyone'."
                  required
                >
                  <Textarea
                    rows={6}
                    placeholder="Our initial ideal customer profile consists of mid-tier agribusiness operators managing 50–200 acres..."
                    value={formData.sections.targetUsers}
                    onChange={(e) =>
                      updateData((prev) => ({
                        ...prev,
                        sections: { ...prev.sections, targetUsers: e.target.value }
                      }))
                    }
                  />
                </Field>

                <div className="flex items-start gap-2.5 p-3 rounded-lg bg-surface-subtle border border-line text-xs text-ink-secondary">
                  <ShieldCheck className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                  <span>
                    Do not include confidential IP or trade secrets here. Detailed documents stay private until you approve access.
                  </span>
                </div>
              </div>
            )}

            {/* Step 5: Market & Competitors */}
            {currentStep === 5 && (
              <div className="space-y-4 animate-in fade-in duration-150">
                <div>
                  <h2 className="text-lg font-bold text-ink">Market & Competitors</h2>
                  <p className="text-xs text-ink-muted">Combine quantitative market sizing with competitive differentiation.</p>
                </div>

                <Field
                  label="Market Opportunity (Weight: 12%)"
                  helper="Include at least one numeral for market size or growth rate (e.g. ₹2,400 Cr or 18% CAGR)."
                  required
                >
                  <Textarea
                    rows={4}
                    placeholder="The Indian precision agriculture sensor market stands at ₹4,200 Cr, expanding at 21% CAGR..."
                    value={formData.sections.market}
                    onChange={(e) =>
                      updateData((prev) => ({
                        ...prev,
                        sections: { ...prev.sections, market: e.target.value }
                      }))
                    }
                  />
                </Field>

                <Field
                  label="Competitors & Alternatives (Weight: 10%)"
                  helper="List at least 2 existing alternatives and your differentiator. One competitor per line."
                  required
                >
                  <Textarea
                    rows={4}
                    placeholder="1. Manual field scouting — labor intensive and delayed response&#10;2. Satellite imagery — 10m resolution too blurry for early fungal detection&#10;3. Spray drone services — lack diagnostic telemetry"
                    value={formData.sections.competitors}
                    onChange={(e) =>
                      updateData((prev) => ({
                        ...prev,
                        sections: { ...prev.sections, competitors: e.target.value }
                      }))
                    }
                  />
                </Field>

                <div className="flex items-start gap-2.5 p-3 rounded-lg bg-surface-subtle border border-line text-xs text-ink-secondary">
                  <ShieldCheck className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                  <span>
                    Do not include confidential IP or trade secrets here. Detailed documents stay private until you approve access.
                  </span>
                </div>
              </div>
            )}

            {/* Step 6: Business Model & Revenue */}
            {currentStep === 6 && (
              <div className="space-y-4 animate-in fade-in duration-150">
                <div>
                  <h2 className="text-lg font-bold text-ink">Business & Revenue Model</h2>
                  <p className="text-xs text-ink-muted">State your model tokens (B2B, B2C, subscription, etc.) and quantify revenue.</p>
                </div>

                <Field
                  label="Business Model (Weight: 12%)"
                  helper="Must mention at least one: B2B, B2C, marketplace, subscription, or commission."
                  required
                >
                  <Textarea
                    rows={4}
                    placeholder="We operate as a B2B SaaS platform combined with hardware-as-a-service drone rentals..."
                    value={formData.sections.businessModel}
                    onChange={(e) =>
                      updateData((prev) => ({
                        ...prev,
                        sections: { ...prev.sections, businessModel: e.target.value }
                      }))
                    }
                  />
                </Field>

                <Field
                  label="Revenue Model & Pricing (Weight: 12%)"
                  helper="Quantify pricing with numbers (e.g. ₹1,500/acre/season or ₹25,000 monthly subscription)."
                  required
                >
                  <Textarea
                    rows={4}
                    placeholder="Pricing is structured as an annual subscription of ₹45,000 per 100 acres, generating 72% gross margins..."
                    value={formData.sections.revenueModel}
                    onChange={(e) =>
                      updateData((prev) => ({
                        ...prev,
                        sections: { ...prev.sections, revenueModel: e.target.value }
                      }))
                    }
                  />
                </Field>

                <div className="flex items-start gap-2.5 p-3 rounded-lg bg-surface-subtle border border-line text-xs text-ink-secondary">
                  <ShieldCheck className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                  <span>
                    Do not include confidential IP or trade secrets here. Detailed documents stay private until you approve access.
                  </span>
                </div>
              </div>
            )}

            {/* Step 7: Funding & Growth */}
            {currentStep === 7 && (
              <div className="space-y-5 animate-in fade-in duration-150">
                <div>
                  <h2 className="text-lg font-bold text-ink">Funding Requirement & Growth</h2>
                  <p className="text-xs text-ink-muted">State what capital is required and how it scales the startup.</p>
                </div>

                {/* Amount with Chips */}
                <div className="space-y-2">
                  <Field label="Funding Seeking (in ₹ Rupees)">
                    <Input
                      type="number"
                      disabled={formData.funding.notRaising}
                      value={formData.funding.notRaising ? 0 : formData.funding.amount}
                      onChange={(e) =>
                        updateData((prev) => ({
                          ...prev,
                          funding: { ...prev.funding, amount: Number(e.target.value) }
                        }))
                      }
                      placeholder="1500000"
                    />
                  </Field>

                  {/* Preset chips */}
                  {!formData.funding.notRaising && (
                    <div className="flex flex-wrap gap-2 pt-1">
                      {[500000, 1000000, 1500000, 2500000, 5000000].map((amt) => (
                        <button
                          key={amt}
                          type="button"
                          onClick={() =>
                            updateData((prev) => ({
                              ...prev,
                              funding: { ...prev.funding, amount: amt }
                            }))
                          }
                          className={`text-xs px-2.5 py-1 rounded-md border transition-colors ${
                            formData.funding.amount === amt
                              ? "bg-primary text-white border-primary"
                              : "bg-surface text-ink-secondary border-line hover:bg-surface-subtle"
                          }`}
                        >
                          {formatINR(amt, true)}
                        </button>
                      ))}
                    </div>
                  )}

                  <label className="flex items-center gap-2 text-xs text-ink-secondary pt-1 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.funding.notRaising}
                      onChange={(e) =>
                        updateData((prev) => ({
                          ...prev,
                          funding: { ...prev.funding, notRaising: e.target.checked }
                        }))
                      }
                      className="rounded border-line text-primary focus:ring-primary/20"
                    />
                    <span>Not raising capital right now (bootstrapped / validation stage)</span>
                  </label>
                </div>

                <Field
                  label="Funding Allocation (Weight: 10%)"
                  helper="Break down allocations with percentages or figures (e.g. 40% R&D, 30% sales, 30% operations)."
                  required={!formData.funding.notRaising}
                >
                  <Textarea
                    rows={3}
                    placeholder="Funds will be deployed: 45% hardware fabrication, 35% agronomy sales team, 20% regulatory certification."
                    value={formData.sections.fundingUse}
                    onChange={(e) =>
                      updateData((prev) => ({
                        ...prev,
                        sections: { ...prev.sections, fundingUse: e.target.value }
                      }))
                    }
                  />
                </Field>

                <Field
                  label="Growth Potential & Scalability (Weight: 8%)"
                  helper="Name an expansion milestone (e.g. expanding to 3 adjacent districts after 50 paying clients)."
                >
                  <Textarea
                    rows={3}
                    placeholder="After onboarding 50 commercial farms in western UP, we plan to expand telemetry to orchards and vineyards in Maharashtra..."
                    value={formData.sections.growth}
                    onChange={(e) =>
                      updateData((prev) => ({
                        ...prev,
                        sections: { ...prev.sections, growth: e.target.value }
                      }))
                    }
                  />
                </Field>
              </div>
            )}

            {/* Step 8: Documents */}
            {currentStep === 8 && (
              <div className="space-y-4 animate-in fade-in duration-150">
                <div>
                  <h2 className="text-lg font-bold text-ink">Founder Documents & Links</h2>
                  <p className="text-xs text-ink-muted">Share pitch deck or research notes links.</p>
                </div>

                <Field
                  label="Pitch Deck URL (Optional)"
                  helper="Google Drive, DocSend, or Notion URL (must start with https://)"
                >
                  <Input
                    placeholder="https://docsend.com/view/..."
                    value={formData.documents.pitchDeckUrl}
                    onChange={(e) =>
                      updateData((prev) => ({
                        ...prev,
                        documents: { ...prev.documents, pitchDeckUrl: e.target.value }
                      }))
                    }
                  />
                </Field>

                <Field
                  label="Technical Notes / Research URL (Optional)"
                  helper="Link to patent filings, whitepapers, or prototype demos"
                >
                  <Input
                    placeholder="https://notion.so/..."
                    value={formData.documents.notesUrl}
                    onChange={(e) =>
                      updateData((prev) => ({
                        ...prev,
                        documents: { ...prev.documents, notesUrl: e.target.value }
                      }))
                    }
                  />
                </Field>

                <div className="p-4 rounded-xl bg-surface-subtle border border-line text-xs text-ink-muted leading-relaxed">
                  <strong>Notice:</strong> File uploads arrive in Phase 2 — share web links for now. Documents stay completely private until you explicitly approve an investor's connection request.
                </div>
              </div>
            )}

            {/* Step 9: Review & Submit */}
            {currentStep === 9 && (
              <div className="space-y-6 animate-in fade-in duration-150">
                <div>
                  <h2 className="text-lg font-bold text-ink">Review & Visibility Settings</h2>
                  <p className="text-xs text-ink-muted">
                    Review section readiness and customize disclosure permissions before running the AI completeness check.
                  </p>
                </div>

                {/* Basics Recap */}
                <div className="p-4 rounded-xl bg-surface-subtle border border-line space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-ink-muted">Basics Summary</span>
                    <button
                      type="button"
                      onClick={() => setCurrentStep(1)}
                      className="text-xs text-primary font-semibold hover:underline"
                    >
                      Edit
                    </button>
                  </div>
                  <h3 className="text-base font-bold text-ink">{formData.basics.title || "Untitled Startup"}</h3>
                  <div className="flex flex-wrap gap-2 text-xs">
                    <Badge tone="neutral">{formData.basics.industry}</Badge>
                    <Badge tone="neutral">{formData.basics.stage}</Badge>
                    <Badge tone="neutral">{formData.basics.businessModel}</Badge>
                    <Badge tone="neutral">
                      {formData.funding.notRaising ? "Not raising" : `Seeking ${formatINR(formData.funding.amount)}`}
                    </Badge>
                  </div>
                  <p className="text-xs text-ink-secondary italic pt-1">
                    "{formData.basics.oneLinePitch}"
                  </p>
                </div>

                {/* 9 Scored Sections Readiness Grid */}
                <div className="space-y-3">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-ink-muted">
                    Section Readiness & Controlled Disclosure
                  </h3>
                  <div className="space-y-2">
                    {STEPS.slice(1, 8).map((st) => {
                      // Map to key
                      const keyMap = {
                        2: "problem",
                        3: "solution",
                        4: "targetUsers",
                        5: "market",
                        6: "businessModel",
                        7: "fundingUse"
                      };
                      const key = keyMap[st.id] || "problem";
                      const stat = getSectionStatus(key);

                      return (
                        <div
                          key={st.id}
                          className="flex items-center justify-between p-3 rounded-lg border border-line bg-surface text-xs"
                        >
                          <div className="flex items-center gap-2">
                            <span className={`w-2 h-2 rounded-full ${stat.status === 'missing' ? 'bg-danger' : stat.status === 'weak' ? 'bg-warning' : 'bg-success'}`} />
                            <span className="font-semibold text-ink">{st.title}</span>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="text-ink-muted">{stat.words} words</span>
                            <Badge tone={stat.tone} size="sm">
                              {stat.label}
                            </Badge>
                            {/* Visibility Chip */}
                            <span className="text-[11px] font-mono text-ink-muted bg-surface-subtle px-2 py-0.5 rounded border border-line">
                              {key === "problem" || key === "solution" ? "Public teaser" : "After acceptance"}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* Stepper Navigation Footer */}
            <div className="flex items-center justify-between pt-6 border-t border-line">
              {currentStep > 1 ? (
                <Button
                  variant="secondary"
                  size="md"
                  onClick={() => setCurrentStep((s) => s - 1)}
                >
                  <ArrowLeft className="w-4 h-4 mr-1.5" />
                  Previous
                </Button>
              ) : (
                <Link to="/dashboard">
                  <Button variant="ghost" size="md">
                    Back to Dashboard
                  </Button>
                </Link>
              )}

              <div className="flex items-center gap-3">
                {currentStep < 9 ? (
                  <Button
                    variant="primary"
                    size="md"
                    onClick={handleNext}
                  >
                    <span>Next: {STEPS[currentStep]?.title.split(". ")[1]}</span>
                    <ArrowRight className="w-4 h-4 ml-1.5" />
                  </Button>
                ) : (
                  <Button
                    variant="primary"
                    size="md"
                    onClick={handleRunAnalysis}
                    className="bg-violet hover:bg-purple-700 shadow-md"
                  >
                    <Sparkles className="w-4 h-4 mr-1.5" />
                    Run AI analysis →
                  </Button>
                )}
              </div>
            </div>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}
