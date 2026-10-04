// src/components/routing/Guards.jsx
import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext.jsx";
import { Skeleton } from "../ui/index.js";

export function PublicOnly({ children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <Skeleton className="w-64 h-12" />
      </div>
    );
  }

  if (user) {
    if (user.role === "innovator") {
      return <Navigate to="/dashboard" replace />;
    }
    // Investor
    if (user.kyc?.status === "verified") {
      return <Navigate to="/feed" replace />;
    }
    return <Navigate to="/onboarding/investor" replace />;
  }

  return children;
}

export function RequireAuth({ children }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <Skeleton className="w-64 h-12" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to={`/login?next=${encodeURIComponent(location.pathname + location.search)}`} replace />;
  }

  return children;
}

export function RequireRole({ role, children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <Skeleton className="w-64 h-12" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (user.role !== role) {
    const fallback = user.role === "innovator" ? "/dashboard" : "/feed";
    return <Navigate to={fallback} replace />;
  }

  return children;
}

export function RequireVerifiedInvestor({ children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <Skeleton className="w-64 h-12" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (user.role !== "investor") {
    return <Navigate to="/dashboard" replace />;
  }

  if (user.kyc?.status !== "verified") {
    return <Navigate to="/onboarding/investor" replace />;
  }

  return children;
}
