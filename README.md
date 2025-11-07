# 🎮 StreamTitle.AI

### AI-Powered Channel Growth & Metadata for Content Creators

---

## 🧠 Overview

**StreamTitle.AI** is an AI-driven platform that moves beyond simple text generation to become a complete, **data-driven growth partner** for streamers and gaming content creators.

Its core purpose is to connect directly to your **YouTube** and **Twitch** channels, analyze your historical performance (CTR, retention, views), and build a **Keyword Effectiveness Index (KEI)** unique to you. It then uses this personal insight, along with your defined **Creator Profile** (tone, voice, banned words), to generate high-performance, TOS-safe metadata that you can publish with one click.

---

## ✨ Current Features (V1)

The code in this repository reflects the **V1 build**, which includes:

* 🧠 **AI Content Generation** – Uses **Google Gemini** to generate titles, descriptions, tags, and Discord announcements.
* 🎨 **AI-Powered Thumbnail Recipes** – Generates a layer-by-layer thumbnail “recipe”, dynamically including a user-uploaded logo.
* 🔍 **External Game APIs** – Intelligently identifies games via **Steam**, **CurseForge**, and **Modrinth** APIs to provide factual data.
* 🔐 **Full Firebase Integration**:

  * **Authentication** – Secure login (Email/Password + Google).
  * **Firestore** – Saves all generation history per user.
  * **Storage** – Allows users to upload custom logos for thumbnails.
* ⚙️ **Customizable Generation** – Choose platform (YouTube/Twitch/Kick), language, and description length.

---

## 🚀 Future Roadmap (V2)

V2 introduces **a full re-architecture** into a scalable, analytics-driven platform:

### 🔗 Direct Channel Integration

* OAuth for YouTube & Twitch
* Reads analytics (CTR, views, retention)
* Publishes metadata directly

### 📊 Data-Driven AI (KEI)

* AI analyzes your channel to create a **Keyword Effectiveness Index (KEI)**
* Optimizes generations based on *your actual performance data*

### ⚡ One-Click Publish

* Transition from “copy & paste” to **“Preview & Publish”**
* Auto-updates metadata and posts to Discord

### 🧬 Creator-Specific Profiles

* Define tone, banned words, and CTAs (e.g., socials)
* AI respects your brand identity every time

### 🛡️ AI Guardrails & Safe Mode

* Integrates Perspective/OpenAI Moderation APIs
* Detects and filters toxicity or clickbait

### 🧠 Post-Stream Analysis

* Auto-summarizes VODs
* Suggests timestamps & highlights

---

## 🏗️ V2 Target Architecture

| Component       | Technology          | Purpose                          |
| --------------- | ------------------- | -------------------------------- |
| **Frontend**    | Next.js             | SSR, performance, and modern UX  |
| **API Gateway** | GCP                 | Unified API entry point          |
| **App Server**  | NestJS / Express    | Modular backend logic            |
| **Auth**        | Firebase + JWT      | Secure user auth & API access    |
| **Async Jobs**  | Pub/Sub + Cloud Run | Scalable background processing   |
| **Hot Storage** | Firestore           | Creator profiles & token storage |
| **Cache**       | Redis               | Rate limiting & API caching      |
| **Warehouse**   | BigQuery / GCS      | Stores analytics & powers KEI    |

---

## ⚙️ Installation (V1 – Current Code)

### 🧩 Prerequisites

* Node.js (v18+)
* npm or yarn
* A Google Cloud Project with:

  * Google Gemini API Key
  * Firebase (Auth, Firestore, Storage enabled)
  * Steam API Key
  * CurseForge API Key

---

### 🔧 Backend Setup

```bash
git clone https://github.com/abyss-mage/streamtitleai.git
cd streamtitleai/backend
npm install
```

#### 🔐 Firebase Admin SDK

1. Go to **Firebase Console → Project Settings → Service Accounts**
2. Click **“Generate new private key”**
3. Save it as `serviceAccountKey.json` in `/backend`

#### 📄 Create `.env` file

```bash
# Google Gemini API Key
GEMINI_API_KEY=your_google_gemini_api_key

# API Keys for Game Databases
STEAM_API_KEY=your_steam_api_key
CURSEFORGE_API_KEY=your_curseforge_api_key

# Firebase Storage Bucket
FIREBASE_STORAGE_BUCKET=your-project-id.firebasestorage.app

# Server Port
PORT=3001
```

#### ▶️ Run the Backend

```bash
npm run dev
# Server runs on http://localhost:3001
```

---

### 🎨 Frontend Setup

```bash
cd ../frontend
npm install
```

#### ⚙️ Configure Firebase

Edit `frontend/src/firebase.js` with your Firebase Web App configuration.

#### ▶️ Run the Frontend

```bash
npm run dev
# Runs on http://localhost:80 or your configured Vite port
```

> The frontend proxy (`vite.config.js`) automatically forwards `/api` to `http://localhost:3001`.

---

## 📜 License

This project is licensed under the **GNU General Public License v3.0 (GPLv3)**.
See the [LICENSE](LICENSE) file for full details.
