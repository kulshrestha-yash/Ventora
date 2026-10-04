// src/components/layout/Navbar.jsx
import React from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext.jsx";
import { Button } from "../ui/Button.jsx";

export function Navbar() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const isLanding = location.pathname === "/";

  const scrollTo = (id) => {
    if (!isLanding) return;
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-surface/90 backdrop-blur-md border-b border-line">
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        {/* Left: Logo block */}
        <Link to="/" className="flex items-center gap-2 group">
          <span className="font-extrabold tracking-[0.2em] border-2 border-ink px-2.5 py-1 text-sm rounded bg-surface transition-transform group-hover:scale-105">
            VENTORA
          </span>
        </Link>

        {/* Center: Anchor nav (on landing) */}
        <nav className="hidden md:flex items-center gap-7 text-xs font-semibold tracking-wide text-ink-secondary uppercase">
          {isLanding ? (
            <>
              <button
                type="button"
                onClick={() => scrollTo("how-it-works")}
                className="hover:text-primary transition-colors"
              >
                How it works
              </button>
              <button
                type="button"
                onClick={() => scrollTo("for-innovators")}
                className="hover:text-primary transition-colors"
              >
                For Innovators
              </button>
              <button
                type="button"
                onClick={() => scrollTo("for-investors")}
                className="hover:text-primary transition-colors"
              >
                For Investors
              </button>
            </>
          ) : (
            <Link to="/" className="hover:text-primary transition-colors">
              Home
            </Link>
          )}
        </nav>

        {/* Right: Actions */}
        <div className="flex items-center gap-3">
          {user ? (
            <div className="flex items-center gap-3">
              <Link
                to={user.role === "innovator" ? "/dashboard" : "/feed"}
                className="text-xs font-semibold text-primary hover:underline"
              >
                Go to Workspace →
              </Link>
              <Button variant="ghost" size="sm" onClick={logout}>
                Sign out
              </Button>
            </div>
          ) : (
            <>
              <Link to="/login">
                <Button variant="ghost" size="sm">
                  Log in
                </Button>
              </Link>
              <Link to="/signup">
                <Button variant="primary" size="sm">
                  Get started
                </Button>
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}

export function Footer() {
  return (
    <footer className="border-t border-line bg-surface py-10 mt-auto">
      <div className="max-w-6xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-ink-muted">
        <div className="flex items-center gap-2">
          <span className="font-bold tracking-widest text-ink">VENTORA</span>
          <span>— academic project (AKTU CSIT)</span>
        </div>
        <div className="text-center md:text-right">
          <p className="font-medium text-ink-secondary">
            Disclaimer: Ventora does not process investments. Deals happen offline.
          </p>
        </div>
      </div>
    </footer>
  );
}
