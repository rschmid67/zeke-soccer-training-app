# Zeke Soccer Training App

A youth soccer training tracker with AI coaching powered by Claude.

## Setup

### 1. Get an Anthropic API Key

1. Go to [console.anthropic.com](https://console.anthropic.com)
2. Create an account (or sign in)
3. Go to **API Keys** → **Create Key**
4. Copy the key

### 2. Run Locally

```bash
# Install dependencies
npm install

# Add your API key
# Open .env.local and paste your key:
# ANTHROPIC_API_KEY=sk-ant-...

# Start dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### 3. Deploy to Netlify

1. Push this repo to GitHub
2. Go to [app.netlify.com](https://app.netlify.com) → **Add new site** → **Import an existing project**
3. Connect your GitHub repo
4. In **Site configuration** → **Environment variables**, add:
   - Key: `ANTHROPIC_API_KEY`
   - Value: your API key from step 1
5. Click **Deploy**

## Features

- **Coach AI** — Chat with an AI soccer coach that knows your profile and training history
- **Video Analysis** — Upload a training video and get AI technique feedback
- **Training Log** — Track sessions with scores, duration, and notes
- **Progress Tracking** — Skill radar chart vs CONCACAF U15 target
- **Calendar** — View and schedule training sessions
- **Highlights & CV** — Build a shareable player profile

## Data

All profile, skill scores, and session data are persisted in your browser's `localStorage` — they survive page refreshes but are local to your device.
