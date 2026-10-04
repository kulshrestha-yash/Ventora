// src/pages/Profile.jsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { AppShell } from "../components/layout/AppShell.jsx";
import {
  Card,
  Button,
  Input,
  Field,
  Badge,
  Avatar,
  ConfirmDialog,
  Select
} from "../components/ui/index.js";
import { useAuth } from "../context/AuthContext.jsx";
import { useToast } from "../context/ToastContext.jsx";
import { api } from "../lib/api.js";
import * as db from "../lib/db/localStorageStore.js";
import { INDUSTRIES, STAGES, RANGES, RANGE_LABELS, BIZ_MODELS } from "../lib/constants.js";
import { ShieldCheck, User, Lock, Sliders, Trash2, LogOut } from "lucide-react";

export function Profile() {
  const { user, refreshUser, logout } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  // Account details state
  const [name, setName] = useState(user?.name || "");
  const [savingProfile, setSavingProfile] = useState(false);

  // Password state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [savingPassword, setSavingPassword] = useState(false);

  // Investor preferences state (if investor)
  const isInvestor = user?.role === "investor";
  const [selectedIndustries, setSelectedIndustries] = useState(
    user?.preferences?.industries || []
  );
  const [selectedStages, setSelectedStages] = useState(
    user?.preferences?.stages || []
  );
  const [selectedRangeIdx, setSelectedRangeIdx] = useState(() => {
    if (!user?.preferences?.rangeMin) return 0;
    const idx = RANGES.findIndex(
      (r) => r[0] === user.preferences.rangeMin && r[1] === user.preferences.rangeMax
    );
    return idx !== -1 ? idx : 0;
  });
  const [locationInput, setLocationInput] = useState(
    (user?.preferences?.locations || []).join(", ")
  );
  const [selectedBizModels, setSelectedBizModels] = useState(
    user?.preferences?.businessModels || ["Any"]
  );
  const [savingPrefs, setSavingPrefs] = useState(false);

  // Clear data confirm modal
  const [confirmClearOpen, setConfirmClearOpen] = useState(false);

  const handleUpdateName = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;

    setSavingProfile(true);
    try {
      await api.users.updateProfile({ name });
      await refreshUser();
      toast.success("Profile updated successfully!");
    } catch (err) {
      toast.error(err.message || "Failed to update profile.");
    } finally {
      setSavingProfile(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmNewPassword) {
      toast.error("New passwords do not match.");
      return;
    }

    setSavingPassword(true);
    try {
      await api.users.changePassword({ current: currentPassword, next: newPassword });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmNewPassword("");
      toast.success("Password changed successfully!");
    } catch (err) {
      toast.error(err.message || "Failed to change password.");
    } finally {
      setSavingPassword(false);
    }
  };

  const handleSavePreferences = async (e) => {
    e.preventDefault();
    if (selectedIndustries.length === 0 || selectedStages.length === 0) {
      toast.error("Please pick at least one industry and stage.");
      return;
    }

    setSavingPrefs(true);
    try {
      const [rangeMin, rangeMax] = RANGES[selectedRangeIdx];
      const locations = locationInput
        .split(",")
        .map((l) => l.trim())
        .filter(Boolean);

      await api.users.savePreferences({
        industries: selectedIndustries,
        stages: selectedStages,
        rangeMin,
        rangeMax,
        locations,
        businessModels: selectedBizModels
      });
      await refreshUser();
      toast.success("Investment preferences saved! Feed updated.");
    } catch (err) {
      toast.error(err.message || "Failed to save preferences.");
    } finally {
      setSavingPrefs(false);
    }
  };

  const handleClearData = () => {
    db.clearAll();
    logout();
    navigate("/");
  };

  const toggleItem = (list, setList, item) => {
    if (list.includes(item)) {
      setList(list.filter((i) => i !== item));
    } else {
      setList([...list, item]);
    }
  };

  return (
    <AppShell title="Profile & Settings" subtitle="Manage your account preferences and credentials">
      <div className="max-w-3xl mx-auto space-y-8 pb-12">
        {/* 1. Account Details Card */}
        <Card className="space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-line">
            <div className="flex items-center gap-3">
              <Avatar
                name={user?.name}
                code={user?.code}
                hue={user?.avatarHue}
                size="lg"
                verified={user?.kyc?.status === "verified"}
              />
              <div>
                <h2 className="text-base font-bold text-ink">{user?.name}</h2>
                <div className="flex items-center gap-2 mt-1">
                  <Badge tone="primary-soft" size="sm">
                    {user?.role === "innovator" ? "Innovator" : "Investor"}
                  </Badge>
                  <span className="text-xs text-ink-muted font-mono">{user?.code}</span>
                  {user?.kyc?.status === "verified" && (
                    <Badge tone="success-soft" size="sm">
                      <ShieldCheck className="w-3 h-3 mr-0.5" />
                      KYC Verified
                    </Badge>
                  )}
                </div>
              </div>
            </div>
            <div className="text-right text-xs text-ink-muted">
              Member since {new Date(user?.createdAt || Date.now()).toLocaleDateString("en-IN", { month: "short", year: "numeric" })}
            </div>
          </div>

          <form onSubmit={handleUpdateName} className="space-y-4">
            <Field label="Full name" required>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Full name"
              />
            </Field>

            <Field label="Email address" helper="Email changes arrive with the backend">
              <Input value={user?.email || ""} disabled className="bg-surface-subtle opacity-75" />
            </Field>

            <div className="flex justify-end">
              <Button type="submit" variant="primary" size="sm" loading={savingProfile}>
                Save Profile
              </Button>
            </div>
          </form>
        </Card>

        {/* 2. Password Reset Card */}
        <Card className="space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-line">
            <Lock className="w-4 h-4 text-ink-muted" />
            <h2 className="text-sm font-bold text-ink">Change Password</h2>
          </div>

          <form onSubmit={handleChangePassword} className="space-y-4">
            <Field label="Current password" required>
              <Input
                type="password"
                placeholder="••••••••"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
              />
            </Field>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="New password" helper="Min. 8 characters" required>
                <Input
                  type="password"
                  placeholder="••••••••"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />
              </Field>

              <Field label="Confirm new password" required>
                <Input
                  type="password"
                  placeholder="••••••••"
                  value={confirmNewPassword}
                  onChange={(e) => setConfirmNewPassword(e.target.value)}
                />
              </Field>
            </div>

            <div className="flex items-center justify-between pt-2">
              <span className="text-xs text-ink-muted">
                Real hashed resets arrive with the backend.
              </span>
              <Button type="submit" variant="secondary" size="sm" loading={savingPassword}>
                Update Password
              </Button>
            </div>
          </form>
        </Card>

        {/* 3. Investor Preferences (Investors only) */}
        {isInvestor && (
          <Card className="space-y-6">
            <div className="flex items-center gap-2 pb-2 border-b border-line">
              <Sliders className="w-4 h-4 text-primary" />
              <h2 className="text-sm font-bold text-ink">Investment Thesis & Preferences</h2>
            </div>

            <form onSubmit={handleSavePreferences} className="space-y-6">
              {/* Industries */}
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase text-ink-muted tracking-wider">
                  Target Industries (min 1)
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

              {/* Stages */}
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase text-ink-muted tracking-wider">
                  Startup Stage (min 1)
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

                <Field label="Target Locations" helper="Comma-separated (e.g. Delhi NCR, Remote)">
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

              <div className="flex justify-end">
                <Button type="submit" variant="primary" size="sm" loading={savingPrefs}>
                  Save Preferences
                </Button>
              </div>
            </form>
          </Card>
        )}

        {/* 4. Data & Session Card */}
        <Card className="space-y-4 border-danger/30 bg-surface">
          <div className="flex items-center gap-2 pb-2 border-b border-line">
            <Trash2 className="w-4 h-4 text-danger" />
            <h2 className="text-sm font-bold text-ink">Session & Local Storage Management</h2>
          </div>

          <p className="text-xs text-ink-secondary leading-relaxed">
            All data in this MVP is persisted locally in your browser under the <code className="bg-surface-subtle px-1.5 py-0.5 rounded font-mono text-ink">ventora:v1:</code> namespace. You can sign out or perform a complete demo reset.
          </p>

          <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
            <Button variant="secondary" size="sm" onClick={() => logout()}>
              <LogOut className="w-4 h-4 mr-1.5" />
              Sign Out
            </Button>
            <Button
              variant="danger"
              size="sm"
              onClick={() => setConfirmClearOpen(true)}
            >
              <Trash2 className="w-4 h-4 mr-1.5" />
              Clear Local Data
            </Button>
          </div>
        </Card>
      </div>

      <ConfirmDialog
        isOpen={confirmClearOpen}
        onClose={() => setConfirmClearOpen(false)}
        onConfirm={handleClearData}
        title="Clear All Local Data?"
        message="This deletes every account, startup idea, request, and chat message stored in this browser. This cannot be undone and resets the app to its initial state."
        confirmLabel="Wipe Local Data"
        isDestructive
      />
    </AppShell>
  );
}
