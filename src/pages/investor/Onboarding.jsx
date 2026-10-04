// src/pages/investor/Onboarding.jsx
import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { AppShell } from "../../components/layout/AppShell.jsx";
import {
  Card,
  Button,
  Input,
  Select,
  Field,
  Badge,
  Stepper
} from "../../components/ui/index.js";
import { useAuth } from "../../context/AuthContext.jsx";
import { useToast } from "../../context/ToastContext.jsx";
import { api } from "../../lib/api.js";
import {
  INDUSTRIES,
  STAGES,
  RANGES,
  RANGE_LABELS,
  BIZ_MODELS,
  INVESTOR_TYPES
} from "../../lib/constants.js";
import {
  ShieldCheck,
  UploadCloud,
  Loader2,
  CheckCircle2,
  ArrowRight,
  Sparkles,
  Sliders
} from "lucide-react";

export function Onboarding() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, refreshUser } = useAuth();
  const toast = useToast();

  const isEditMode = searchParams.get("edit") === "1";
  const isAlreadyVerified = user?.kyc?.status === "verified";

  const [step, setStep] = useState(isAlreadyVerified || isEditMode ? 2 : 1);

  // Step 1: Mock KYC Form State
  const [legalName, setLegalName] = useState(user?.kyc?.legalName || user?.name || "");
  const [investorType, setInvestorType] = useState(user?.investorType || INVESTOR_TYPES[0]);
  const [docFile, setDocFile] = useState(null);
  const [kycSubmitting, setKycSubmitting] = useState(false);
  const [reviewPending, setReviewPending] = useState(user?.kyc?.status === "pending");

  // Step 2: Preferences State
  const [selectedIndustries, setSelectedIndustries] = useState(
    user?.preferences?.industries?.length > 0 ? user.preferences.industries : [INDUSTRIES[0], INDUSTRIES[1]]
  );
  const [selectedStages, setSelectedStages] = useState(
    user?.preferences?.stages?.length > 0 ? user.preferences.stages : [STAGES[0], STAGES[1]]
  );
  const [selectedRangeIdx, setSelectedRangeIdx] = useState(0);
  const [locationInput, setLocationInput] = useState(
    (user?.preferences?.locations || []).join(", ")
  );
  const [selectedBizModels, setSelectedBizModels] = useState(
    user?.preferences?.businessModels?.length > 0 ? user.preferences.businessModels : ["Any"]
  );
  const [savingPrefs, setSavingPrefs] = useState(false);

  // Step 1 KYC Submit: 3s simulated review timer
  const handleKycSubmit = async (e) => {
    e.preventDefault();
    if (!legalName.trim()) {
      toast.error("Please enter your full legal name.");
      return;
    }

    setKycSubmitting(true);
    try {
      await api.kyc.submit({
        legalName: legalName.trim(),
        investorType,
        idDocName: docFile ? docFile.name : "government-id.pdf"
      });

      setReviewPending(true);
      setKycSubmitting(false);

      // SPEC: mock KYC review delay — simulated 3s review then poll verification
      setTimeout(async () => {
        try {
          await api.kyc.poll();
          await refreshUser();
          setReviewPending(false);
          toast.success("Identity verified! 10 welcome tokens granted.", "KYC Approved");
          setStep(2);
        } catch (err) {
          toast.error("Verification check failed.");
          setReviewPending(false);
        }
      }, 3000);
    } catch (err) {
      toast.error(err.message || "Failed to submit KYC.");
      setKycSubmitting(false);
    }
  };

  const handleSavePreferences = async (skip = false) => {
    setSavingPrefs(true);
    try {
      let prefs = {
        industries: [],
        stages: [],
        rangeMin: 500000,
        rangeMax: 2500000,
        locations: [],
        businessModels: ["Any"]
      };

      if (!skip) {
        if (selectedIndustries.length === 0 || selectedStages.length === 0) {
          toast.error("Please select at least one industry and one startup stage.");
          setSavingPrefs(false);
          return;
        }

        const [rangeMin, rangeMax] = RANGES[selectedRangeIdx];
        const locations = locationInput
          .split(",")
          .map((l) => l.trim())
          .filter(Boolean);

        prefs = {
          industries: selectedIndustries,
          stages: selectedStages,
          rangeMin,
          rangeMax,
          locations,
          businessModels: selectedBizModels
        };
      }

      await api.users.savePreferences(prefs);
      await refreshUser();

      toast.success(skip ? "Preferences skipped — feed ready!" : "Feed personalized!");
      navigate("/feed");
    } catch (err) {
      toast.error(err.message || "Failed to save preferences.");
    } finally {
      setSavingPrefs(false);
    }
  };

  const toggleItem = (list, setList, item) => {
    if (list.includes(item)) {
      setList(list.filter((i) => i !== item));
    } else {
      setList([...list, item]);
    }
  };

  const steps = [
    { title: "Identity verification", subtitle: "Mock KYC compliance" },
    { title: "Investment preferences", subtitle: "Feed personalization" }
  ];

  return (
    <AppShell
      title="Investor Setup"
      subtitle="Complete your verification and investment thesis to unlock the startup feed"
    >
      <div className="max-w-2xl mx-auto space-y-8 pb-16">
        {/* Stepper Header */}
        <div className="bg-surface p-4 rounded-xl border border-line shadow-sm">
          <Stepper steps={steps} currentStep={step} variant="horizontal" />
        </div>

        {/* STEP 1: Mock KYC Verification */}
        {step === 1 && (
          <Card className="p-6 space-y-6 bg-surface shadow-card">
            <div>
              <div className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full bg-primary-soft text-primary mb-2">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Step 1 of 2 — Identity Verification (KYC)</span>
              </div>
              <h2 className="text-xl font-bold text-ink">Verify your Investor Identity</h2>
              <p className="text-xs text-ink-muted mt-1 leading-relaxed">
                Ventora only permits verified investors to browse full startup teasers and initiate token connections.
              </p>
            </div>

            {/* Info notice */}
            <div className="p-3.5 rounded-lg bg-surface-subtle border border-line text-xs text-ink-secondary flex items-start gap-2.5">
              <ShieldCheck className="w-4 h-4 text-success shrink-0 mt-0.5" />
              <span>
                <strong>Academic Prototype Note:</strong> This platform uses a simulated mock verification flow. No real government IDs or sensitive documents are uploaded to external servers.
              </span>
            </div>

            {reviewPending ? (
              <div className="p-8 rounded-xl bg-primary-soft/30 border border-primary/20 text-center space-y-4 animate-in fade-in">
                <div className="w-12 h-12 rounded-full bg-primary-soft text-primary mx-auto flex items-center justify-center animate-spin">
                  <Loader2 className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-sm font-bold text-ink">Status: Pending review…</h3>
                  <p className="text-xs text-ink-muted">
                    Simulating background verification against investor registry (approx. 3 seconds)...
                  </p>
                </div>
              </div>
            ) : (
              <form onSubmit={handleKycSubmit} className="space-y-4">
                <Field label="Full Legal Name" helper="As shown on official identity document" required>
                  <Input
                    value={legalName}
                    onChange={(e) => setLegalName(e.target.value)}
                    placeholder="e.g. Yash Vardhan"
                    required
                  />
                </Field>

                <Field label="Investor Classification" required>
                  <Select
                    value={investorType}
                    onChange={(e) => setInvestorType(e.target.value)}
                  >
                    {INVESTOR_TYPES.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </Select>
                </Field>

                {/* Mock File Upload Dropzone */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase text-ink-muted tracking-wider">
                    Identity Document (Aadhaar / Passport / Corporate PAN)
                  </label>
                  <label className="border-2 border-dashed border-line hover:border-primary rounded-xl p-6 flex flex-col items-center justify-center text-center cursor-pointer bg-surface-subtle/50 transition-colors">
                    <UploadCloud className="w-8 h-8 text-ink-muted mb-2" />
                    <span className="text-xs font-semibold text-ink">
                      {docFile ? docFile.name : "Click to select file (mock upload)"}
                    </span>
                    <span className="text-[11px] text-ink-muted mt-0.5">
                      PDF, PNG, or JPG up to 10MB — nothing leaves your browser
                    </span>
                    <input
                      type="file"
                      className="hidden"
                      onChange={(e) => setDocFile(e.target.files[0] || null)}
                    />
                  </label>
                </div>

                <div className="pt-2">
                  <Button
                    type="submit"
                    variant="primary"
                    size="lg"
                    loading={kycSubmitting}
                    className="w-full shadow-md"
                  >
                    Submit for verification →
                  </Button>
                </div>
              </form>
            )}
          </Card>
        )}

        {/* STEP 2: Investment Preferences */}
        {step === 2 && (
          <Card className="p-6 space-y-6 bg-surface shadow-card animate-in fade-in duration-200">
            <div>
              <div className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full bg-success-soft text-success mb-2">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Step 2 of 2 — Investment Thesis</span>
              </div>
              <h2 className="text-xl font-bold text-ink">Personalize Your Startup Feed</h2>
              <p className="text-xs text-ink-muted mt-1 leading-relaxed">
                Ventora's recommendation engine ranks startup ideas based on your preferred sectors, stages, and check sizes.
              </p>
            </div>

            <div className="space-y-6">
              {/* Preferred Industries */}
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase text-ink-muted tracking-wider">
                  Target Industries (Pick at least 1)
                </label>
                <div className="flex flex-wrap gap-2">
                  {INDUSTRIES.map((ind) => {
                    const active = selectedIndustries.includes(ind);
                    return (
                      <button
                        key={ind}
                        type="button"
                        onClick={() => toggleItem(selectedIndustries, setSelectedIndustries, ind)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                          active
                            ? "bg-primary text-white shadow-sm"
                            : "bg-surface border border-line text-ink-secondary hover:bg-surface-subtle"
                        }`}
                      >
                        {ind}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Startup Stages */}
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase text-ink-muted tracking-wider">
                  Startup Stage (Pick at least 1)
                </label>
                <div className="flex flex-wrap gap-2">
                  {STAGES.map((stg) => {
                    const active = selectedStages.includes(stg);
                    return (
                      <button
                        key={stg}
                        type="button"
                        onClick={() => toggleItem(selectedStages, setSelectedStages, stg)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                          active
                            ? "bg-primary text-white shadow-sm"
                            : "bg-surface border border-line text-ink-secondary hover:bg-surface-subtle"
                        }`}
                      >
                        {stg}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Range & Locations */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Check Size / Range">
                  <Select
                    value={selectedRangeIdx}
                    onChange={(e) => setSelectedRangeIdx(Number(e.target.value))}
                  >
                    {RANGE_LABELS.map((label, idx) => (
                      <option key={label} value={idx}>
                        {label}
                      </option>
                    ))}
                  </Select>
                </Field>

                <Field label="Location Preference" helper="e.g. Delhi NCR, Bengaluru, Remote">
                  <Input
                    value={locationInput}
                    onChange={(e) => setLocationInput(e.target.value)}
                    placeholder="Delhi NCR, Bengaluru"
                  />
                </Field>
              </div>

              {/* Business Models */}
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase text-ink-muted tracking-wider">
                  Business Models
                </label>
                <div className="flex flex-wrap gap-2">
                  {["Any", ...BIZ_MODELS].map((m) => {
                    const active = selectedBizModels.includes(m);
                    return (
                      <button
                        key={m}
                        type="button"
                        onClick={() => {
                          if (m === "Any") {
                            setSelectedBizModels(["Any"]);
                          } else {
                            const withoutAny = selectedBizModels.filter((b) => b !== "Any");
                            if (withoutAny.includes(m)) {
                              const next = withoutAny.filter((b) => b !== m);
                              setSelectedBizModels(next.length === 0 ? ["Any"] : next);
                            } else {
                              setSelectedBizModels([...withoutAny, m]);
                            }
                          }
                        }}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                          active
                            ? "bg-primary text-white shadow-sm"
                            : "bg-surface border border-line text-ink-secondary hover:bg-surface-subtle"
                        }`}
                      >
                        {m}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Footer Actions */}
              <div className="flex items-center justify-between pt-4 border-t border-line">
                <Button
                  variant="ghost"
                  size="md"
                  onClick={() => handleSavePreferences(true)}
                  disabled={savingPrefs}
                >
                  Skip for now
                </Button>

                <Button
                  variant="primary"
                  size="md"
                  onClick={() => handleSavePreferences(false)}
                  loading={savingPrefs}
                  className="shadow-md"
                >
                  <span>{isEditMode ? "Save changes" : "Save & build my feed →"}</span>
                </Button>
              </div>
            </div>
          </Card>
        )}
      </div>
    </AppShell>
  );
}
