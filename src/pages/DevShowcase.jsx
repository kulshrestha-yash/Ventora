// src/pages/DevShowcase.jsx
import React, { useState } from "react";
import { Link } from "react-router-dom";
import {
  Button,
  Input,
  Textarea,
  Select,
  Field,
  Card,
  Badge,
  Tag,
  ScoreChip,
  TokenChip,
  MatchRing,
  StatCard,
  ProgressRing,
  ProgressBar,
  LockedRow,
  Avatar,
  Stepper,
  Tabs,
  EmptyState,
  Skeleton,
  Modal,
  ConfirmDialog
} from "../components/ui/index.js";
import { useToast } from "../context/ToastContext.jsx";
import { Lightbulb, Inbox, Coins, Heart, Send } from "lucide-react";

export function DevShowcase() {
  const toast = useToast();
  const [modalOpen, setModalOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("all");
  const [currentStep, setCurrentStep] = useState(2);

  const sampleSteps = [
    { title: "Basics", subtitle: "Startup name & industry" },
    { title: "Problem", subtitle: "Target pain point" },
    { title: "Solution", subtitle: "Product mechanism" },
    { title: "Review", subtitle: "AI Completeness check" }
  ];

  return (
    <div className="max-w-5xl mx-auto p-8 space-y-12">
      <div className="flex items-center justify-between pb-6 border-b border-line">
        <div>
          <h1 className="text-2xl font-bold text-ink">Ventora UI Component Showcase</h1>
          <p className="text-xs text-ink-muted">Development testbed for all design system primitives (§5.3)</p>
        </div>
        <Link to="/" className="text-xs font-semibold text-primary hover:underline">
          ← Back to Home
        </Link>
      </div>

      {/* 1. Buttons & Toasts */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-ink">1. Buttons & Toast Actions</h2>
        <div className="flex flex-wrap items-center gap-3">
          <Button variant="primary" size="sm">Primary SM</Button>
          <Button variant="primary" size="md">Primary MD</Button>
          <Button variant="primary" size="lg">Primary LG</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="danger">Danger</Button>
          <Button variant="link">Link Button</Button>
          <Button loading>Loading</Button>
          <Button disabled>Disabled</Button>
        </div>
        <div className="flex flex-wrap items-center gap-3 pt-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => toast.success("Draft saved successfully!")}
          >
            Trigger Success Toast
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => toast.error("Publish gate failed: 2 missing sections.")}
          >
            Trigger Error Toast
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => toast.info("New connection request received.")}
          >
            Trigger Info Toast
          </Button>
        </div>
      </section>

      {/* 2. Badges, Tags & Chips */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-ink">2. Badges, Tags & Chips</h2>
        <div className="flex flex-wrap items-center gap-3">
          <Badge tone="primary-soft">primary-soft</Badge>
          <Badge tone="success-soft">success-soft</Badge>
          <Badge tone="warning-soft">warning-soft</Badge>
          <Badge tone="danger-soft">danger-soft</Badge>
          <Badge tone="neutral">neutral</Badge>
          <Tag>AgriTech</Tag>
          <Tag>MVP Stage</Tag>
          <ScoreChip score={86} band="strong" />
          <ScoreChip score={58} band="developing" />
          <ScoreChip score={32} band="weak" />
          <TokenChip balance={10} />
          <MatchRing percent={94} />
        </div>
      </section>

      {/* 3. Avatars with Deterministic Hues */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-ink">3. Avatars (Pastel Palette 0-7)</h2>
        <div className="flex items-center gap-4">
          {[0, 1, 2, 3, 4, 5, 6, 7].map((hue) => (
            <Avatar key={hue} name={`User ${hue}`} hue={hue} size="md" verified={hue % 2 === 0} />
          ))}
          <Avatar name="Shivam Kumar" size="lg" verified hue={3} />
          <Avatar name="Roshan" size="sm" hue={0} />
        </div>
      </section>

      {/* 4. StatCards & Cards */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-ink">4. Stat Cards & Surface Cards</h2>
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <StatCard label="Ideas submitted" value="3" icon={Lightbulb} subtext="+1 this week" />
          <StatCard label="Published" value="2" icon={Send} subtext="Active in feed" />
          <StatCard label="Investor views" value="48" icon={Heart} subtext="Across 2 startups" />
          <StatCard label="Pending requests" value="4" icon={Inbox} subtext="Awaiting response" />
        </div>
      </section>

      {/* 5. Progress Ring & Bars */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-ink">5. AI Score Progress Ring & Bars</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
          <Card className="flex flex-col items-center">
            <ProgressRing score={82} band="strong" />
          </Card>
          <Card className="flex flex-col items-center">
            <ProgressRing score={64} band="developing" />
          </Card>
          <Card className="space-y-4">
            <div>
              <div className="flex justify-between text-xs text-ink-muted mb-1">
                <span>Problem Section</span>
                <span>12 / 12 pts</span>
              </div>
              <ProgressBar value={100} tone="success" />
            </div>
            <div>
              <div className="flex justify-between text-xs text-ink-muted mb-1">
                <span>Business Model</span>
                <span>8 / 12 pts</span>
              </div>
              <ProgressBar value={66} tone="warning" />
            </div>
            <div>
              <div className="flex justify-between text-xs text-ink-muted mb-1">
                <span>Competitors</span>
                <span>0 / 10 pts</span>
              </div>
              <ProgressBar value={0} tone="danger" />
            </div>
          </Card>
        </div>
      </section>

      {/* 6. Form Controls & Locked Row */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-ink">6. Form Controls & Controlled Disclosure Row</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="Startup Title" helper="Max 80 characters" required counter="32/80">
            <Input defaultValue="AgriDrone Analytics" />
          </Field>
          <Field label="Industry Sector" required>
            <Select defaultValue="AgriTech">
              <option value="AgriTech">AgriTech</option>
              <option value="FinTech">FinTech</option>
              <option value="HealthTech">HealthTech</option>
            </Select>
          </Field>
          <div className="md:col-span-2">
            <Field label="One-line Pitch" error="Please expand your pitch slightly" required>
              <Textarea rows={2} defaultValue="Automated crop health telemetry using multi-spectral drones." />
            </Field>
          </div>
          <div className="md:col-span-2 space-y-2">
            <h3 className="text-sm font-semibold text-ink">Controlled Disclosure Preview:</h3>
            <LockedRow title="Detailed Revenue & Unit Economics" subtitle="Requires accepted request" />
            <LockedRow title="Founder Pitch Deck (PDF)" reason="Unlocked after innovator acceptance" />
          </div>
        </div>
      </section>

      {/* 7. Steppers & Tabs */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-ink">7. Steppers & Tabs</h2>
        <Tabs
          tabs={[
            { id: "all", label: "All Items", count: 12 },
            { id: "pending", label: "Pending", count: 4 },
            { id: "accepted", label: "Accepted", count: 8 }
          ]}
          activeTab={activeTab}
          onChange={setActiveTab}
        />
        <div className="pt-2">
          <Stepper
            steps={sampleSteps}
            currentStep={currentStep}
            onStepClick={setCurrentStep}
            variant="horizontal"
          />
        </div>
      </section>

      {/* 8. Modals & EmptyState */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-ink">8. Modals & Empty States</h2>
        <div className="flex gap-3">
          <Button variant="secondary" onClick={() => setModalOpen(true)}>
            Open Demo Modal
          </Button>
          <Button variant="danger" onClick={() => setConfirmOpen(true)}>
            Open Confirm Dialog
          </Button>
        </div>

        <EmptyState
          icon={Coins}
          title="No tokens spent yet"
          description="Browse your matched feed and spend 1 token to send a verified connection request to an innovator."
          action={{ label: "Explore Feed", onClick: () => {} }}
        />

        <Modal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          title="Send Connection Request"
          footer={
            <>
              <Button variant="secondary" size="sm" onClick={() => setModalOpen(false)}>
                Cancel
              </Button>
              <Button variant="primary" size="sm" onClick={() => setModalOpen(false)}>
                Send (Cost: 1 token)
              </Button>
            </>
          }
        >
          <p className="text-sm text-ink-secondary mb-4 leading-relaxed">
            Sending a connection request costs 1 token. If the founder declines your request, the token will be refunded to your wallet immediately.
          </p>
          <Field label="Introductory Note (optional)" counter="0/500">
            <Textarea rows={3} placeholder="Introduce your investment thesis and why this fits..." />
          </Field>
        </Modal>

        <ConfirmDialog
          isOpen={confirmOpen}
          onClose={() => setConfirmOpen(false)}
          onConfirm={() => {
            setConfirmOpen(false);
            toast.success("Request withdrawn and token refunded.");
          }}
          title="Withdraw Request?"
          message="Are you sure you want to withdraw this connection request? Your 1 token will be credited back immediately."
          confirmLabel="Withdraw Request"
          isDestructive
        />
      </section>
    </div>
  );
}
