# VENTORA — Smart Innovator–Investor Connection Platform

> **"Where bold ideas meet the right investors."**

Ventora is an innovator–investor connection platform that connects early-stage founders with verified investors through AI-assisted idea completeness evaluation, personalized feeds, and token-based, spam-free outreach.

---

## 🚀 Quick Start

### 1. Requirements
- Node.js 18+
- npm 9+

### 2. Install Dependencies
```bash
npm install
```

### 3. Run Development Server
```bash
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser.

### 4. Build for Production
```bash
npm run build
```

---

## 🌟 Key Differentiators & Features

| Feature | Description | Implementation |
|---|---|---|
| **Deterministic AI Completeness** | Evaluates startup ideas across 9 structured dimensions (0–100 score), gates publishing at ≥ 50 pts with 0 missing sections. | `src/lib/ai/completenessEngine.js` |
| **Controlled Disclosure** | Feeds display strictly whitelisted public teasers. Proprietary business models, market details, and decks remain locked until mutual acceptance. | `src/lib/disclosure.js` |
| **Token-Based Outreach** | Investors receive 10 tokens upon mock KYC verification. Contacting an innovator costs 1 token. Declined or withdrawn requests auto-refund immediately. | `src/lib/constants.js`, `src/lib/api.js` |
| **Personalized Feed Ranking** | Feed score combines investor thesis match % (30% industry, 20% stage, 25% range, 15% location, 10% model) with the idea's AI score. | `src/lib/matching.js` |
| **Real-Time Live Chat Sync** | Post-acceptance chat features same-browser live sync using custom DB events and native cross-tab storage events, with presence heartbeats. | `src/pages/chat/Messages.jsx` |

---

## 🧪 Testing the 2-Tab Live Demo

1. **Tab 1 (Innovator):**
   - Go to `/signup?role=innovator` and create an account.
   - Click `+ Submit new idea`, fill the 9 steps (watch continuous autosave).
   - On Step 9, run the AI completeness analysis, pass the publish gate, and publish your idea.
2. **Tab 2 (Investor — Incognito or another window):**
   - Go to `/signup?role=investor` and create an account.
   - Complete Step 1 mock KYC (3-second simulated review) to receive 10 tokens.
   - Select your sector preferences in Step 2.
   - In `/feed`, locate the startup published in Tab 1 with high match %.
   - Open `/ideas/:id` and click **"Use 1 token — send connection request"**.
3. **Back to Tab 1 (Innovator):**
   - Open `/requests` — the request appears under Pending.
   - Click **"Accept & open chat"**.
4. **Both Tabs:**
   - Both users are unmasked and can send messages in real-time without page refreshes!

---

## 📚 Complete Project Documentation

For full architectural blueprints, viva questions, team responsibilities, and algorithm equations, read:
👉 **[VENTORA_EXPLANATION.md](file:///c:/Users/yashk/OneDrive/Desktop/Ventora/VENTORA_EXPLANATION.md)**
