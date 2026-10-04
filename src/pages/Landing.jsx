// src/pages/Landing.jsx
import React from "react";
import { Link } from "react-router-dom";
import { Navbar, Footer } from "../components/layout/Navbar.jsx";
import { Button } from "../components/ui/Button.jsx";
import { Card, Badge, Tag, ScoreChip, TokenChip, MatchRing } from "../components/ui/CardsAndBadges.jsx";
import { ProgressRing } from "../components/ui/ProgressElements.jsx";
import {
  ShieldCheck,
  Lock,
  Sparkles,
  FilePlus,
  Gauge,
  LayoutList,
  MessageCircle,
  ArrowRight,
  CheckCircle2,
  Coins
} from "lucide-react";

export function Landing() {
  return (
    <div className="min-h-screen flex flex-col bg-surface-subtle selection:bg-primary-soft selection:text-primary">
      <Navbar />

      <main className="flex-1">
        {/* 1. Hero Section */}
        <section className="relative overflow-hidden py-16 md:py-24 border-b border-line bg-gradient-to-b from-white to-surface-subtle">
          <div className="max-w-6xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Left Column: Messaging */}
            <div className="lg:col-span-7 space-y-6">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary-soft text-primary text-xs font-semibold border border-primary/20">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Next-Gen Innovator–Investor Connection Platform</span>
              </div>

              <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-ink leading-[1.15]">
                Where bold ideas meet the right investors.
              </h1>

              <p className="text-base md:text-lg text-ink-secondary leading-relaxed max-w-xl">
                Ventora connects startup innovators with verified investors through AI-assisted idea evaluation, personalized feeds, and token-based, spam-free outreach.
              </p>

              {/* CTAs */}
              <div className="flex flex-wrap items-center gap-4 pt-2">
                <Link to="/signup?role=innovator">
                  <Button variant="primary" size="lg" className="shadow-md">
                    <span>I have an idea</span>
                    <ArrowRight className="w-4 h-4 ml-1" />
                  </Button>
                </Link>
                <Link to="/signup?role=investor">
                  <Button variant="secondary" size="lg">
                    <span>I'm an investor</span>
                    <ArrowRight className="w-4 h-4 ml-1" />
                  </Button>
                </Link>
              </div>

              {/* Trust markers */}
              <div className="pt-4 flex flex-wrap items-center gap-6 text-xs text-ink-muted">
                <div className="flex items-center gap-1.5 font-medium">
                  <ShieldCheck className="w-4 h-4 text-success" />
                  <span>Verified investors</span>
                </div>
                <div className="flex items-center gap-1.5 font-medium">
                  <Lock className="w-4 h-4 text-primary" />
                  <span>Controlled disclosure</span>
                </div>
                <div className="flex items-center gap-1.5 font-medium">
                  <Sparkles className="w-4 h-4 text-violet" />
                  <span>AI idea scoring</span>
                </div>
              </div>
            </div>

            {/* Right Column: Composed UI Card Illustration */}
            <div className="lg:col-span-5 relative flex justify-center">
              <div className="w-full max-w-md space-y-4 scale-95 md:scale-100">
                {/* Floating Token & Score Badges */}
                <div className="flex items-center justify-between">
                  <TokenChip balance={10} className="shadow-md" />
                  <Badge tone="success-soft" size="md" className="shadow-sm">
                    <ShieldCheck className="w-3.5 h-3.5 mr-1" />
                    Mock KYC Verified
                  </Badge>
                </div>

                {/* Mini Startup Teaser Card */}
                <Card className="border border-line shadow-pop space-y-3 bg-surface p-5">
                  <div className="flex items-center justify-between">
                    <Tag>AgriTech</Tag>
                    <ScoreChip score={86} band="strong" />
                  </div>
                  <h3 className="text-base font-bold text-ink">AgriDrone Analytics</h3>
                  <p className="text-xs text-ink-secondary leading-relaxed line-clamp-2">
                    Automated crop health telemetry and yield prediction using hyperspectral drone imagery for commercial farms.
                  </p>
                  <div className="flex items-center justify-between pt-2 border-t border-line text-xs font-semibold">
                    <span className="text-ink-muted">Seeking: <strong className="text-ink font-bold">₹25L</strong></span>
                    <MatchRing percent={94} />
                  </div>
                </Card>

                {/* Score gauge mini card */}
                <Card className="flex items-center justify-between p-4 bg-surface border border-line shadow-card">
                  <div className="space-y-1">
                    <span className="text-[11px] font-bold text-ink-muted uppercase tracking-wider">
                      Completeness Engine
                    </span>
                    <div className="text-sm font-semibold text-ink">
                      9 Evaluated Dimensions
                    </div>
                    <div className="text-xs text-success font-medium">
                      ✓ Ready for Investor Feed
                    </div>
                  </div>
                  <div className="scale-75 origin-right">
                    <ProgressRing score={86} band="strong" size={100} stroke={8} label="" />
                  </div>
                </Card>
              </div>
            </div>
          </div>
        </section>

        {/* 2. How it works — 4 steps */}
        <section id="how-it-works" className="py-20 max-w-6xl mx-auto px-6">
          <div className="text-center max-w-xl mx-auto mb-16 space-y-3">
            <span className="text-xs font-bold uppercase tracking-wider text-primary">Process</span>
            <h2 className="text-3xl font-extrabold text-ink">How Ventora Works</h2>
            <p className="text-sm text-ink-muted leading-relaxed">
              A balanced ecosystem engineered to eliminate spam, protect intellectual property, and surface structured startup potential.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Step 1 */}
            <Card className="flex flex-col justify-between space-y-4">
              <div className="w-10 h-10 rounded-xl bg-primary-soft text-primary flex items-center justify-center font-bold text-sm">
                <FilePlus className="w-5 h-5" />
              </div>
              <div className="space-y-1 flex-1">
                <span className="text-[11px] font-mono font-bold text-ink-muted uppercase">Step 01</span>
                <h3 className="text-base font-bold text-ink">Submit Idea</h3>
                <p className="text-xs text-ink-secondary leading-relaxed">
                  Draft your startup model across 9 structured sections with continuous autosave.
                </p>
              </div>
            </Card>

            {/* Step 2 */}
            <Card className="flex flex-col justify-between space-y-4">
              <div className="w-10 h-10 rounded-xl bg-violet/10 text-violet flex items-center justify-center font-bold text-sm">
                <Gauge className="w-5 h-5" />
              </div>
              <div className="space-y-1 flex-1">
                <span className="text-[11px] font-mono font-bold text-ink-muted uppercase">Step 02</span>
                <h3 className="text-base font-bold text-ink">AI Completeness</h3>
                <p className="text-xs text-ink-secondary leading-relaxed">
                  Deterministic rule engine scores completeness (0–100) and flags weak areas before publishing.
                </p>
              </div>
            </Card>

            {/* Step 3 */}
            <Card className="flex flex-col justify-between space-y-4">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-success flex items-center justify-center font-bold text-sm">
                <LayoutList className="w-5 h-5" />
              </div>
              <div className="space-y-1 flex-1">
                <span className="text-[11px] font-mono font-bold text-ink-muted uppercase">Step 03</span>
                <h3 className="text-base font-bold text-ink">Matched Feed</h3>
                <p className="text-xs text-ink-secondary leading-relaxed">
                  Verified investors discover personalized startup teasers filtered by sector, stage, and check size.
                </p>
              </div>
            </Card>

            {/* Step 4 */}
            <Card className="flex flex-col justify-between space-y-4">
              <div className="w-10 h-10 rounded-xl bg-amber-50 text-warning flex items-center justify-center font-bold text-sm">
                <MessageCircle className="w-5 h-5" />
              </div>
              <div className="space-y-1 flex-1">
                <span className="text-[11px] font-mono font-bold text-ink-muted uppercase">Step 04</span>
                <h3 className="text-base font-bold text-ink">Connect & Chat</h3>
                <p className="text-xs text-ink-secondary leading-relaxed">
                  Investors spend tokens to request access; mutual acceptance unlocks direct real-time chat.
                </p>
              </div>
            </Card>
          </div>
        </section>

        {/* 3. For Innovators & For Investors (Split Cards) */}
        <section className="py-16 bg-surface border-y border-line">
          <div className="max-w-6xl mx-auto px-6 grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* For Innovators */}
            <div id="for-innovators" className="bg-surface-subtle p-8 rounded-2xl border border-line flex flex-col justify-between space-y-6">
              <div className="space-y-4">
                <span className="text-xs font-bold uppercase tracking-wider text-primary">For Founders</span>
                <h3 className="text-2xl font-bold text-ink">Structure your vision without risking your IP.</h3>
                <ul className="space-y-3 text-xs text-ink-secondary leading-relaxed">
                  <li className="flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-success shrink-0 mt-0.5" />
                    <span><strong>Structured idea framework:</strong> Walk through problem, market, revenue model, and competitors.</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-success shrink-0 mt-0.5" />
                    <span><strong>Objective completeness feedback:</strong> Fix weak sections before investors ever see your card.</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-success shrink-0 mt-0.5" />
                    <span><strong>Controlled disclosure:</strong> Only whitelisted teasers are public. Full details remain locked.</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-success shrink-0 mt-0.5" />
                    <span><strong>Full permission control:</strong> You decide who to connect with. Reject unsolicited outreach.</span>
                  </li>
                </ul>
              </div>
              <Link to="/signup?role=innovator">
                <Button variant="primary" size="md">
                  Start as Innovator →
                </Button>
              </Link>
            </div>

            {/* For Investors */}
            <div id="for-investors" className="bg-surface-subtle p-8 rounded-2xl border border-line flex flex-col justify-between space-y-6">
              <div className="space-y-4">
                <span className="text-xs font-bold uppercase tracking-wider text-primary">For Investors</span>
                <h3 className="text-2xl font-bold text-ink">Discover curated startups matching your exact thesis.</h3>
                <ul className="space-y-3 text-xs text-ink-secondary leading-relaxed">
                  <li className="flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-success shrink-0 mt-0.5" />
                    <span><strong>Verified investor network:</strong> Mock KYC identity verification keeps communication high-trust.</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-success shrink-0 mt-0.5" />
                    <span><strong>Personalized ranking:</strong> Startup ideas are scored and ordered according to your sector and check size.</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-success shrink-0 mt-0.5" />
                    <span><strong>Token-backed intent:</strong> Spend tokens only on high-conviction startups. Unaccepted requests are refunded.</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-success shrink-0 mt-0.5" />
                    <span><strong>Direct founder connection:</strong> Instant messaging post-acceptance to conduct due diligence offline.</span>
                  </li>
                </ul>
              </div>
              <Link to="/signup?role=investor">
                <Button variant="secondary" size="md">
                  Start as Investor →
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
