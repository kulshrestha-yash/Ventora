// src/pages/Signup.jsx
import React, { useState, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Navbar, Footer } from "../components/layout/Navbar.jsx";
import { Button, Input, Field, Modal } from "../components/ui/index.js";
import { useAuth } from "../context/AuthContext.jsx";
import { useToast } from "../context/ToastContext.jsx";
import { Lightbulb, Briefcase, Check } from "lucide-react";

export function Signup() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { signup } = useAuth();
  const toast = useToast();

  const [role, setRole] = useState(searchParams.get("role") || "");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [agreed, setAgreed] = useState(false);

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [termsModalOpen, setTermsModalOpen] = useState(false);

  useEffect(() => {
    const roleParam = searchParams.get("role");
    if (roleParam && (roleParam === "innovator" || roleParam === "investor")) {
      setRole(roleParam);
    }
  }, [searchParams]);

  const validate = () => {
    const newErrors = {};
    if (!role) {
      newErrors.role = "Please select whether you are an Innovator or an Investor.";
    }
    if (!name.trim() || name.trim().length < 2 || name.trim().length > 60) {
      newErrors.name = "Please enter your full name (2–60 characters).";
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      newErrors.email = "Enter a valid email address.";
    }
    if (!password || password.length < 8 || !/[a-zA-Z]/.test(password) || !/\d/.test(password)) {
      newErrors.password = "Use at least 8 characters with a letter and a number.";
    }
    if (password !== confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match.";
    }
    if (!agreed) {
      newErrors.agreed = "You must agree to the Terms & Privacy Policy.";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    try {
      const user = await signup({
        role,
        name: name.trim(),
        email: email.trim(),
        password
      });

      toast.success(`Welcome to Ventora, ${user.name.split(" ")[0]}!`);

      if (user.role === "innovator") {
        navigate("/dashboard");
      } else {
        navigate("/onboarding/investor");
      }
    } catch (err) {
      if (err.code === "EMAIL_TAKEN") {
        setErrors((prev) => ({
          ...prev,
          email: "An account with this email already exists — try logging in."
        }));
      } else {
        toast.error(err.message || "Failed to create account. Please check your details.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-surface-subtle">
      <Navbar />

      <main className="flex-1 flex items-center justify-center p-6 py-12">
        <div className="w-full max-w-lg bg-surface border border-line rounded-2xl shadow-pop p-8 space-y-6">
          <div className="text-center space-y-1">
            <h1 className="text-2xl font-bold text-ink">Create your account</h1>
            <p className="text-xs text-ink-muted">
              Step 1 of 2 — choose how you'll use Ventora
            </p>
          </div>

          {errors.role && (
            <div className="p-3 bg-danger-soft border border-danger/30 text-danger text-xs rounded-lg font-medium text-center">
              {errors.role}
            </div>
          )}

          {/* Role Selection Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Innovator Card */}
            <div
              onClick={() => {
                setRole("innovator");
                setErrors((prev) => ({ ...prev, role: null }));
              }}
              className={`p-5 rounded-xl border cursor-pointer transition-all flex flex-col justify-between space-y-3 ${
                role === "innovator"
                  ? "border-primary bg-primary-soft/40 ring-2 ring-primary/20"
                  : "border-line bg-surface hover:bg-surface-subtle"
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="w-9 h-9 rounded-lg bg-primary-soft text-primary flex items-center justify-center">
                  <Lightbulb className="w-5 h-5" />
                </div>
                {role === "innovator" && (
                  <span className="w-5 h-5 rounded-full bg-primary text-white flex items-center justify-center text-xs">
                    <Check className="w-3.5 h-3.5" />
                  </span>
                )}
              </div>
              <div>
                <h3 className="text-sm font-bold text-ink">I'm an Innovator</h3>
                <p className="text-xs text-ink-muted mt-1 leading-relaxed">
                  Present your startup idea, get an AI completeness score, receive investor requests.
                </p>
              </div>
            </div>

            {/* Investor Card */}
            <div
              onClick={() => {
                setRole("investor");
                setErrors((prev) => ({ ...prev, role: null }));
              }}
              className={`p-5 rounded-xl border cursor-pointer transition-all flex flex-col justify-between space-y-3 ${
                role === "investor"
                  ? "border-primary bg-primary-soft/40 ring-2 ring-primary/20"
                  : "border-line bg-surface hover:bg-surface-subtle"
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="w-9 h-9 rounded-lg bg-emerald-50 text-success flex items-center justify-center">
                  <Briefcase className="w-5 h-5" />
                </div>
                {role === "investor" && (
                  <span className="w-5 h-5 rounded-full bg-primary text-white flex items-center justify-center text-xs">
                    <Check className="w-3.5 h-3.5" />
                  </span>
                )}
              </div>
              <div>
                <h3 className="text-sm font-bold text-ink">I'm an Investor</h3>
                <p className="text-xs text-ink-muted mt-1 leading-relaxed">
                  Discover matched startups, verify identity (KYC), connect using tokens.
                </p>
              </div>
            </div>
          </div>

          {/* Account Details Form */}
          {role && (
            <form onSubmit={handleSubmit} className="space-y-4 pt-2 border-t border-line animate-in fade-in duration-200">
              <Field label="Full name" error={errors.name} required>
                <Input
                  type="text"
                  placeholder="e.g. Roshan Sharma"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  error={!!errors.name}
                />
              </Field>

              <Field label="Email address" error={errors.email} required>
                <Input
                  type="email"
                  placeholder="name@startup.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  error={!!errors.email}
                />
              </Field>

              <Field
                label="Password"
                helper="min. 8 chars — hashed before storage"
                error={errors.password}
                required
              >
                <Input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  error={!!errors.password}
                />
              </Field>

              <Field label="Confirm password" error={errors.confirmPassword} required>
                <Input
                  type="password"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  error={!!errors.confirmPassword}
                />
              </Field>

              <div className="space-y-1">
                <label className="flex items-start gap-2.5 text-xs text-ink-secondary cursor-pointer">
                  <input
                    type="checkbox"
                    checked={agreed}
                    onChange={(e) => setAgreed(e.target.checked)}
                    className="mt-0.5 rounded border-line text-primary focus:ring-primary/20"
                  />
                  <span>
                    I agree to the{" "}
                    <button
                      type="button"
                      onClick={() => setTermsModalOpen(true)}
                      className="text-primary hover:underline font-semibold"
                    >
                      Terms & Privacy Policy
                    </button>
                  </span>
                </label>
                {errors.agreed && (
                  <p className="text-xs text-danger font-medium">{errors.agreed}</p>
                )}
              </div>

              <Button
                type="submit"
                variant="primary"
                size="lg"
                loading={loading}
                className="w-full shadow-md"
              >
                Create account
              </Button>
            </form>
          )}

          <div className="text-center pt-2 text-xs text-ink-muted">
            Already have an account?{" "}
            <Link to="/login" className="text-primary font-semibold hover:underline">
              Log in
            </Link>
          </div>
        </div>
      </main>

      <Footer />

      {/* Terms & Privacy Modal */}
      <Modal
        isOpen={termsModalOpen}
        onClose={() => setTermsModalOpen(false)}
        title="Terms of Service & Privacy Policy"
        footer={
          <Button variant="primary" size="sm" onClick={() => setTermsModalOpen(false)}>
            Close
          </Button>
        }
      >
        <div className="space-y-3 text-xs text-ink-secondary leading-relaxed">
          <p>
            Ventora is an academic prototype designed to facilitate startup idea discovery and investor connections.
            Users are advised not to disclose confidential trade secrets or proprietary intellectual property publicly.
          </p>
          <p>
            Financial transactions and due diligence take place strictly offline between participants. Ventora does not guarantee
            startup viability or investment outcomes.
          </p>
        </div>
      </Modal>
    </div>
  );
}
