<<<<<<< HEAD
# 🤔 What Did I Miss?

> **Local-First AI micro-app** that catches you up on overwhelming chat conversations — in seconds, with zero data ever leaving your device.

[![Next.js](https://img.shields.io/badge/Next.js-14-black?logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3-38bdf8?logo=tailwindcss)](https://tailwindcss.com/)
[![Supabase](https://img.shields.io/badge/Supabase-Optional-3ecf8e?logo=supabase)](https://supabase.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

---

## ✨ What It Does

You come back after hours away and there are **300+ unread messages** across WhatsApp, Telegram, Discord, Slack, Email and more. You don't know where to start.

**What Did I Miss?** reads that chaos and gives you:

| Feature | Description |
|---|---|
| 🧠 **AI Summary** | Executive TL;DR of the whole conversation |
| 🔥 **Urgency Scoring** | Every message scored 0–100 with High / Med / Low labels |
| ✅ **Action Items** | Extracted tasks with owner and deadline |
| 📅 **Deadline Timeline** | Chronological view of all time-sensitive items |
| ⚖️ **Key Decisions** | What was decided, and by whom |
| 👤 **Mention Radar** | Every time your name (or nickname) was called out |
| 🚨 **Emergency Triage** | One-click "30-second catch-up" for truly urgent situations |
| 📡 **Live Notification Reader** | Real-time notification stream summarizer |
| 🌐 **Universal Parser** | Auto-detects WhatsApp, Telegram, Discord, Slack, Email, LinkedIn, Instagram, and plain text |
| 🔐 **Login / Signup** | Secure account system with session persistence |

---

## 🔒 Privacy-First Architecture

> **Your conversation content NEVER leaves your device.**

```
Your Browser
    │
    ├── IndexedDB (Dexie.js)  ← All chat content stored locally
    ├── Local LLM (Ollama)    ← AI runs on YOUR machine
    └── Rule-Based NLP Engine ← Works 100% offline, no API needed

Supabase (Optional, cloud)
    └── Only stores: email, display name, UI settings
        ── ZERO conversation content, ZERO message text
```

---

## 🚀 Quick Start (Local Development)

### Prerequisites
- [Node.js](https://nodejs.org/) v18 or later
- (Optional) [Ollama](https://ollama.ai/) for local AI (`ollama pull llama3.2`)

### 1. Clone the repository

```bash
git clone https://github.com/YOUR_USERNAME/what-did-i-miss.git
cd what-did-i-miss
```

### 2. Install dependencies

```bash
npm install
```

### 3. Set up environment variables

```bash
cp .env.example .env.local
```

Open `.env.local` and fill in your values (Supabase is optional — the app works 100% locally without it):

```env
# Optional — only needed for cloud auth & settings sync
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Local AI (Ollama) — auto-detected, falls back to rules if offline
OLLAMA_BASE_URL=http://127.0.0.1:11434
OLLAMA_MODEL=llama3.2:latest
```

### 4. Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

> ✅ **No Supabase? No Ollama?** The app still works fully in local guest mode using your browser's built-in storage and a fast rule-based NLP engine.

---

## 🌐 Supported Platforms (Universal Parser)

The app **auto-detects** which platform your conversation came from and parses it accordingly:

| Platform | Import Method | Notes |
|---|---|---|
| **WhatsApp** | Paste export text / Upload `.txt` | Standard export format |
| **Telegram** | Paste text | Desktop copy format |
| **Discord** | Paste text | Channel history copy |
| **Slack** | Paste text | Message history copy |
| **Email (Gmail, Outlook)** | Paste thread | Auto-extracts sender, subject, body |
| **LinkedIn** | Paste messages | InMail / message threads |
| **Instagram DMs** | Paste text | Basic text format |
| **Plain Text / Any App** | Paste anything | Smart fallback parser |
| **Live Notifications** | Browser Notification API | Real-time stream reader |

---

## 🤖 AI Modes

| Mode | Engine | Speed | Requires |
|---|---|---|---|
| **Smart (Ollama)** | Local LLM via Ollama | ~5–15s | Ollama installed + model pulled |
| **Quick (Rules)** | Built-in NLP rule engine | <1s | Nothing — works offline |

The app **automatically** falls back to Quick mode if Ollama is not running.

---

## 🗄️ Optional: Supabase Setup

Supabase is only needed if you want cloud-based **login/signup** and **cross-device settings sync**.

1. Create a free project at [supabase.com](https://supabase.com)
2. Run the SQL schema in your Supabase SQL editor:

```sql
-- Copy and paste contents of supabase/schema.sql
```

3. Copy your Project URL and anon key into `.env.local`

---

## 🚢 Deploy to Vercel (Production)

### One-Click Deploy

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/YOUR_USERNAME/what-did-i-miss)

### Manual Deploy

```bash
npm install -g vercel
vercel --prod
```

Set the following environment variables in your Vercel project dashboard:

| Variable | Value |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Your Supabase anon key |

> **Note:** Ollama cannot run on Vercel (serverless). In production, the app uses the **Quick Rules engine** by default, which needs zero infrastructure.

---

## 🏗️ Project Structure

```
what-did-i-miss/
├── app/
│   ├── page.tsx              # Main dashboard (protected by AuthGuard)
│   ├── login/page.tsx        # Login page
│   ├── signup/page.tsx       # Signup page
│   ├── layout.tsx            # Root layout
│   ├── globals.css           # Global styles + Tailwind
│   └── api/
│       ├── analyze/          # AI analysis endpoint (Ollama)
│       ├── health/           # Backend health check
│       └── notifications/    # Live notification stream
├── components/
│   ├── AuthGuard.tsx         # Session-based route protection
│   ├── Header.tsx            # Navigation + user avatar + sign out
│   ├── ChatImport.tsx        # Universal chat import UI
│   ├── SummaryCard.tsx       # AI summary display
│   ├── EmergencyTriageCard.tsx # 30-second urgent catch-up
│   ├── ActionItemsList.tsx   # Task list with completion toggle
│   ├── DeadlinesTimeline.tsx # Chronological deadline view
│   ├── DecisionsList.tsx     # Key decisions panel
│   ├── MentionsList.tsx      # Mention radar
│   ├── PrioritySection.tsx   # Priority message grouping
│   ├── LiveNotificationStream.tsx # Real-time notification reader
│   ├── ChatTranscriptDrawer.tsx   # Full transcript slide-over
│   ├── PrivacyModal.tsx      # Privacy manifesto + data purge
│   └── SettingsModal.tsx     # User settings panel
├── lib/
│   ├── auth.ts               # Auth helpers (Supabase + local fallback)
│   ├── db.ts                 # IndexedDB schema (Dexie.js)
│   ├── universalParser.ts    # Multi-platform message parser
│   ├── ruleEngine.ts         # Offline NLP rule engine
│   ├── ollamaClient.ts       # Ollama LLM integration
│   ├── llmPrompt.ts          # LLM prompt templates
│   └── supabaseClient.ts     # Supabase client + settings sync
├── types/
│   └── chat.ts               # TypeScript types
├── supabase/
│   └── schema.sql            # Database schema + RLS policies
├── public/
│   └── sample-chat.txt       # Demo WhatsApp chat export
├── .env.example              # Environment variable template
├── vercel.json               # Vercel deployment config
└── README.md                 # This file
```

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| **Framework** | Next.js 14 (App Router) |
| **Language** | TypeScript 5 |
| **Styling** | Tailwind CSS 3 + custom glassmorphism design |
| **Local Storage** | Dexie.js (IndexedDB wrapper) |
| **AI (Local)** | Ollama (llama3.2 / any compatible model) |
| **AI (Offline)** | Custom rule-based NLP engine |
| **Auth (Optional)** | Supabase Auth |
| **Cloud DB (Optional)** | Supabase Postgres (non-content only) |
| **Date Parsing** | Chrono-node |
| **Icons** | Lucide React |
| **Deployment** | Vercel |

---

## 🧪 Testing the Pipeline

```bash
# Run the rule engine test (no dependencies needed)
node test-pipeline.js

# Test sample data parsing
node test-samples.js
```

---

## 📝 License

MIT © 2026 — See [LICENSE](LICENSE) for details.

---

## 🙏 Acknowledgements

Built for a hackathon with ❤️. Inspired by the very real problem of returning to 500 unread messages and not knowing what happened.

> *"What did I miss?"* — Everyone, every day.
=======
# Project_Name_ProtocolX
A Project i have build in an hackathon.
>>>>>>> 4353af3148e8630ac712d0b4f745129ba291eafe
