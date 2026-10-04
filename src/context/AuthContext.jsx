// src/context/AuthContext.jsx
import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { api } from "../lib/api.js";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const refreshUser = useCallback(async () => {
    try {
      const current = await api.auth.me();
      setUser(current);
      return current;
    } catch (err) {
      console.error("Auth check failed:", err);
      setUser(null);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshUser();

    // Listen for auth-related broadcast events
    const handleAuthEvent = () => {
      refreshUser();
    };

    window.addEventListener("ventora:auth", handleAuthEvent);
    window.addEventListener("ventora:db", handleAuthEvent);
    window.addEventListener("storage", handleAuthEvent);

    return () => {
      window.removeEventListener("ventora:auth", handleAuthEvent);
      window.removeEventListener("ventora:db", handleAuthEvent);
      window.removeEventListener("storage", handleAuthEvent);
    };
  }, [refreshUser]);

  const login = async ({ email, password }) => {
    const res = await api.auth.login({ email, password });
    setUser(res.user);
    return res.user;
  };

  const signup = async ({ role, name, email, password }) => {
    const res = await api.auth.signup({ role, name, email, password });
    setUser(res.user);
    return res.user;
  };

  const logout = async () => {
    await api.auth.logout();
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        signup,
        logout,
        refreshUser,
        isAuthenticated: !!user,
        isInnovator: user?.role === "innovator",
        isInvestor: user?.role === "investor",
        isVerifiedInvestor: user?.role === "investor" && user?.kyc?.status === "verified"
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
