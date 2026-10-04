// src/pages/Login.jsx
import React, { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Navbar, Footer } from "../components/layout/Navbar.jsx";
import { Button, Input, Field } from "../components/ui/index.js";
import { useAuth } from "../context/AuthContext.jsx";
import { useToast } from "../context/ToastContext.jsx";
import { Eye, EyeOff, Info } from "lucide-react";

export function Login() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { login } = useAuth();
  const toast = useToast();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleForgot = (e) => {
    e.preventDefault();
    toast.info("Password reset isn't part of the MVP — for the demo, create a new account or ask the team.");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!email.trim() || !password) {
      setError("Please fill in both email and password.");
      return;
    }

    setLoading(true);
    try {
      const user = await login({ email: email.trim(), password });
      toast.success(`Welcome back, ${user.name.split(" ")[0]}!`);

      const next = searchParams.get("next");
      if (next && next.startsWith("/")) {
        navigate(next);
        return;
      }

      // Post-login redirect matrix per spec §4
      if (user.role === "innovator") {
        navigate("/dashboard");
      } else {
        if (user.kyc?.status === "verified" && user.preferences?.industries?.length > 0) {
          navigate("/feed");
        } else {
          navigate("/onboarding/investor");
        }
      }
    } catch (err) {
      setError("Incorrect email or password.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-surface-subtle">
      <Navbar />

      <main className="flex-1 flex items-center justify-center p-6 py-12">
        <div className="w-full max-w-md bg-surface border border-line rounded-2xl shadow-pop p-8 space-y-6">
          <div className="text-center space-y-1">
            <h1 className="text-2xl font-bold text-ink">Welcome back</h1>
            <p className="text-xs text-ink-muted">
              Log in to access your startup workspace
            </p>
          </div>

          {error && (
            <div className="p-3 bg-danger-soft border border-danger/30 text-danger text-xs rounded-lg font-medium text-center">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <Field label="Email address" required>
              <Input
                type="email"
                placeholder="name@startup.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
              />
            </Field>

            <Field label="Password" required>
              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-2.5 text-ink-faint hover:text-ink"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </Field>

            <div className="flex items-center justify-end">
              <button
                type="button"
                onClick={handleForgot}
                className="text-xs text-primary font-medium hover:underline"
              >
                Forgot?
              </button>
            </div>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              loading={loading}
              className="w-full shadow-md"
            >
              Log in
            </Button>
          </form>

          {/* Info note */}
          <div className="flex items-start gap-2.5 p-3 rounded-lg bg-surface-subtle border border-line text-xs text-ink-muted leading-relaxed">
            <Info className="w-4 h-4 text-primary shrink-0 mt-0.5" />
            <span>
              Sessions are stored locally in this MVP. JWT + email verification arrive with the backend.
            </span>
          </div>

          <div className="text-center pt-2 text-xs text-ink-muted">
            No account yet?{" "}
            <Link to="/signup" className="text-primary font-semibold hover:underline">
              Sign up
            </Link>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
