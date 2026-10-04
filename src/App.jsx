// src/App.jsx
import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import {
  PublicOnly,
  RequireAuth,
  RequireRole,
  RequireVerifiedInvestor
} from "./components/routing/Guards.jsx";

// Pages
import { Landing } from "./pages/Landing.jsx";
import { Signup } from "./pages/Signup.jsx";
import { Login } from "./pages/Login.jsx";
import { Profile } from "./pages/Profile.jsx";

// Innovator Pages
import { Dashboard } from "./pages/innovator/Dashboard.jsx";
import { IdeaForm } from "./pages/innovator/IdeaForm.jsx";
import { ScoreResult } from "./pages/innovator/ScoreResult.jsx";
import { RequestsInbox } from "./pages/innovator/RequestsInbox.jsx";

// Investor Pages
import { Onboarding } from "./pages/investor/Onboarding.jsx";
import { Feed } from "./pages/investor/Feed.jsx";
import { IdeaPreview } from "./pages/investor/IdeaPreview.jsx";
import { SavedIdeas } from "./pages/investor/SavedIdeas.jsx";
import { MyRequests } from "./pages/investor/MyRequests.jsx";
import { TokenWallet } from "./pages/investor/TokenWallet.jsx";

// Shared Pages
import { Messages } from "./pages/chat/Messages.jsx";
import { DevShowcase } from "./pages/DevShowcase.jsx";

export function App() {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/" element={<Landing />} />

      {/* Public-only auth routes */}
      <Route
        path="/signup"
        element={
          <PublicOnly>
            <Signup />
          </PublicOnly>
        }
      />
      <Route
        path="/login"
        element={
          <PublicOnly>
            <Login />
          </PublicOnly>
        }
      />

      {/* Innovator routes */}
      <Route
        path="/dashboard"
        element={
          <RequireRole role="innovator">
            <Dashboard />
          </RequireRole>
        }
      />
      <Route
        path="/ideas/new"
        element={
          <RequireRole role="innovator">
            <IdeaForm />
          </RequireRole>
        }
      />
      <Route
        path="/ideas/:id/edit"
        element={
          <RequireRole role="innovator">
            <IdeaForm />
          </RequireRole>
        }
      />
      <Route
        path="/ideas/:id/score"
        element={
          <RequireRole role="innovator">
            <ScoreResult />
          </RequireRole>
        }
      />
      <Route
        path="/requests"
        element={
          <RequireRole role="innovator">
            <RequestsInbox />
          </RequireRole>
        }
      />

      {/* Investor routes */}
      <Route
        path="/onboarding/investor"
        element={
          <RequireRole role="investor">
            <Onboarding />
          </RequireRole>
        }
      />
      <Route
        path="/feed"
        element={
          <RequireVerifiedInvestor>
            <Feed />
          </RequireVerifiedInvestor>
        }
      />
      <Route
        path="/ideas/:id"
        element={
          <RequireVerifiedInvestor>
            <IdeaPreview />
          </RequireVerifiedInvestor>
        }
      />
      <Route
        path="/saved"
        element={
          <RequireVerifiedInvestor>
            <SavedIdeas />
          </RequireVerifiedInvestor>
        }
      />
      <Route
        path="/my-requests"
        element={
          <RequireVerifiedInvestor>
            <MyRequests />
          </RequireVerifiedInvestor>
        }
      />
      <Route
        path="/tokens"
        element={
          <RequireRole role="investor">
            <TokenWallet />
          </RequireRole>
        }
      />

      {/* Shared authenticated routes */}
      <Route
        path="/messages"
        element={
          <RequireAuth>
            <Messages />
          </RequireAuth>
        }
      />
      <Route
        path="/profile"
        element={
          <RequireAuth>
            <Profile />
          </RequireAuth>
        }
      />

      {/* Dev component testing showcase */}
      <Route path="/dev" element={<DevShowcase />} />

      {/* 404 catch-all redirects home */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
export default App;
