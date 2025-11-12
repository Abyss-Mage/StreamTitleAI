# 🧠 StreamTitle.AI

**Version:** 3.0 (V4 Roadmap Planning)
**Status:** Actively in Development

## 📘 Overview

**StreamTitle.AI** is a full-stack, AI-driven application designed to empower content creators across **YouTube, Twitch, and Kick**.

Built with **React**, **Node.js**, **Firebase**, and **Gemini 2.5**, the platform has evolved from a simple generator into a secure, data-connected ecosystem. It provides AI-powered tools for SEO, content generation, and analytics, allowing creators to optimize their content, discover new trends, and analyze their performance.

### 🚀 Core Differentiators

While our primary competitor (VidIq) focuses only on YouTube, StreamTitle.AI is being built for the modern, multi-platform creator.

1.  **Multi-Platform Support:** All AI tools are being designed from the ground up to support **YouTube, Twitch, and Kick**, allowing creators to manage their entire content strategy from one dashboard.
2.  **Predictive & Niche Analytics:** By integrating a universal game database (V4 goal) instead of just Steam, our AI can track pre-release hype, find low-competition indie games, and identify cross-platform content gaps.
3.  **True AI Personalization:** The "Creator Profile" system ensures every AI-generated title, description, and idea is perfectly matched to the user's unique brand, tone, and voice.
4.  **Automated Growth Loop:** Our V4 roadmap includes a self-learning AI that fine-tunes itself on each creator's *actual channel performance* (CTR, retention) to provide suggestions that are proven to work for *their* specific audience.

-----

## 🧩 Tech Stack Summary

| Component | Technology |
| :--- | :--- |
| **Frontend** | React 19 + Vite, React Router, Axios, Recharts |
| **Backend** | Node.js + Express |
| **AI Engine** | Google Gemini 2.5 Flash |
| **Database** | Firebase Firestore & Firebase Storage |
| **Authentication** | Firebase Auth (Email, Google) + Custom JWTs |
| **External APIs** | Google (YouTube Data, YouTube Analytics) |
| **Security** | AES-256 Token Encryption |

-----

## 🏗️ Architecture

### Secure Authentication Flow (Two-Token System)

This project uses a secure, two-token system to manage user sessions and protect the backend API.

1.  **Firebase Login:** The user signs in on the React frontend using Firebase Authentication (Email/Google).
2.  **Token Exchange:** The frontend receives a temporary Firebase ID Token. It immediately sends this token to the backend's `/api/v1/auth/exchange` endpoint.
3.  **API JWT Issued:** The Express backend verifies the Firebase token with Firebase Admin, then signs and returns a custom, secure API JWT (1-hour expiry) containing the user's `uid`.
4.  **Secure API Calls:** The React frontend stores this API JWT in `localStorage` and includes it in the `Authorization: Bearer <token>` header of all subsequent requests to protected API routes.
5.  **Backend Verification:** The Express `verifyApiToken` middleware intercepts and validates the API JWT on every protected route, ensuring all requests are authenticated.

-----

## 🗺️ Feature Roadmap

### ✅ V1: Core Foundation (MVP)

  * [x] **Core Tech Stack:**
      * [x] Frontend: React + Vite
      * [x] Backend: Node.js + Express
      * [x] AI Engine: Google Gemini 2.5 Flash
  * [x] **User Authentication:**
      * [x] Firebase Email/Password & Google Sign-In
      * [x] Protected routes and auth state management
  * [x] **Core AI Generator:**
      * [x] Main generator page
      * [x] Backend AI prompt (`systemPrompt`) to generate title, description, tags, and thumbnail recipe
      * [x] Basic game database integration (Steam, Modrinth)
      * [x] Basic user preferences (language, description length)
  * [x] **History:**
      * [x] Save all generations to Firestore per-user
      * [x] History page to view, reload, and clear past generations

-----

### ✅ V2: Secure Integration & Personalization

  * [x] **Secure Backend API:**
      * [x] "Two-Token" auth system: Firebase ID Token is exchanged for a custom API JWT
      * [x] All backend API routes are protected by `verifyApiToken` middleware
  * [x] **YouTube Channel Integration:**
      * [x] Google OAuth 2.0 flow to connect a user's YouTube channel
      * [x] Secure, server-side encryption (AES-256) of YouTube refresh tokens
      * [x] Backend utility to create an authenticated YouTube client for any user
  * [x] **Creator Profiles (V1):**
      * [x] Settings page for users to define their brand: `tone`, `voiceGuidelines`, `bannedWords`, `defaultCTAs`, `logoUrl`
      * [x] Backend API to save/load this profile from Firestore
      * [x] AI prompt now dynamically includes the `creatorProfile` for personalized, on-brand results

-----

### 🟡 V3: The Dashboard (VidIq Competitor)

  * [ ] **New Dashboard UI:**
      * [x] New persistent sidebar layout to house all tools
      * [x] New `HomePage.jsx` with "Quick Actions"
  * [ ] **Live YouTube Analytics:**
      * [x] `HomePage.jsx` widget showing live 30-day Views & Net Subscribers
      * [x] Backend endpoint for total 30-day analytics (`/api/v1/youtube/analytics`)
  * [ ] **Optimize Suite:**
      * [x] `OptimizePage.jsx` to fetch and display a user's recent videos
      * [x] `OptimizeModal.jsx` for AI-powered suggestions (new title, description, tags) on existing videos
      * [x] New AI backend endpoint (`/api/v1/ai/optimize`) and prompt (`optimizePrompt`) for this feature
  * [ ] **Discover Suite:**
      * [x] Main `DiscoverPage.jsx` tabbed interface
      * [x] `OutliersTab.jsx`: AI ideas for non-obvious videos
      * [x] `KeywordsTab.jsx`: AI analysis for topic SEO, search intent, and related keywords
      * [x] `CompetitorsTab.jsx`: AI analysis of competitors to find "content gaps"
      * [x] `SubscribersTab.jsx`: Recharts graph of 30-day net subscriber growth (from `/api/v1/youtube/analytics/growth`)
  * [ ] **Multi-Platform & Profile Management:**
      * [x] Upgraded `SettingsPage.jsx` to support *multiple* Creator Profiles (Create, Read, Update, Delete)
      * [x] `GeneratorPage.jsx` UI includes dropdown for **YouTube, Twitch, and Kick** (This is the strategic differentiator)
      * [ ] **AI Coach (V1 - Chatbot):** Implement the conversational AI coach route
      * [ ] **Monetization:** Integrate Stripe and tier-based feature access.

-----

### 🚀 V4: Strategic Differentiation (Multi-Platform & Predictive AI)

  * [ ] **4.1. Universal Data Integration:**
      * [ ] **Integrate Universal Game Database (IGDB/RAWG):** Replace the PC-only game logic with a master API to find *any* game (console, mobile, upcoming).
      * [ ] **Full Twitch/Kick Integration:** Build backend support for Twitch/Kick connections, analytics, and VOD processing.
  * [ ] **4.2. Predictive & Niche-Finding Tools (Leveraging 4.1):**
      * [ ] **Predictive "Hype Cycle" Tracker:** New dashboard module to analyze pre-release hype for upcoming games.
      * [ ] **Cross-Platform Trend Analysis:** A tool to find YouTube content gaps by analyzing what's popular on Twitch/Kick.
      * [ ] **"Indie & Nichefinder" AI:** An AI tool that uses the new game database to suggest low-competition "hidden gems" that match a user's Creator Profile.
      * [ ] **AI-Powered Content Calendar:** A tool that uses game/DLC release dates from the universal database to generate a long-term, strategic content schedule.
  * [ ] **4.3. Proactive & Generative AI:**
      * [ ] **"Auto-Profile" Creator:** An AI feature that scans a user's existing channel (titles, descriptions, transcripts) to automatically fill out their Creator Profile fields on the `SettingsPage.jsx`.
      * [ ] **Proactive "AI Coach" (V2):** Evolve the AI Coach from a chatbot to a *proactive alert system* on the `HomePage.jsx` that delivers analytics-driven and competitor-driven opportunities.
      * [ ] **True Generative AI Thumbnails:** Integrate an image generation model (Gemini 2.5) to produce ready-to-use thumbnails, automatically compositing the AI-generated title and the user's logo.
      * [ ] **"Twitch/Kick Smart Clipper":** A VOD-to-Shorts pipeline that auto-finds highlights in long streams and generates a unique, optimized title/description for each clip.
  * [ ] **4.4. AI Training "Growth Loop" (Gemini 2.5):**
      * [ ] **Implement Creator-Specific Fine-Tuning Loop:** Create an automated system to train a custom AI model for *each user* based on their channel's *actual* performance data.
      * [ ] **Step 1. Data Collection:** Periodically fetch all video performance metrics (CTR, Retention, Sub Gain) for a user's channel.
      * [ ] **Step 2. "Golden Dataset" Creation:** Automatically categorize videos into "Winners" (high-performing) and "Losers" (low-performing).
      * [ ] **Step 3. AI Training (Two Options):**
          * [ ] **Option A (Fine-Tuning):** Use the Gemini 2.5 fine-tuning API to create a custom, personalized model (e.g., `gemini-2.5-flash-user-[UID]`) for each user.
          * [ ] **Option B (Dynamic Prompting):** Dynamically inject the user's top "Winner" and "Loser" examples into the `systemPrompt` at request time.
  * [ ] **4.5. Platform Expansion:**
      * [ ] **Chrome Extension (V1):** Begin development of the Chrome Extension for in-platform optimization.

-----

## 🛠️ Getting Started

### Prerequisites

  * Node.js (v18 or higher)
  * A Google Firebase project (for Auth, Firestore, and Storage)
  * Google Cloud project with:
      * Gemini API enabled
      * YouTube Data API v3 enabled
      * YouTube Analytics API v2 enabled

### 1\. Backend Setup

1.  Navigate to the backend directory:
    ```sh
    cd backend
    ```
2.  Install dependencies:
    ```sh
    npm install
    ```
3.  Create a `.env` file in the `backend/` directory and add your secret keys.
    ```env
    # Firebase
    # (Your Firebase Admin SDK JSON key contents)

    # AI
    GEMINI_API_KEY=your_gemini_api_key

    # API Security
    JWT_SECRET=your_super_strong_jwt_secret_key
    TOKEN_ENCRYPTION_KEY=your_32_character_aes_encryption_key

    # Google OAuth
    YOUTUBE_CLIENT_ID=your_google_cloud_client_id
    YOUTUBE_CLIENT_SECRET=your_google_cloud_client_secret
    YOUTUBE_REDIRECT_URI=http://localhost:80/settings # Must match Google Cloud Console
    ```
4.  Run the backend server:
    ```sh
    node index.js
    ```
    The server will run on `http://localhost:3001`.

### 2\. Frontend Setup

1.  Navigate to the frontend directory:
    ```sh
    cd frontend
    ```
2.  Install dependencies:
    ```sh
    npm install
    ```
3.  Open `frontend/src/firebase.js` and replace the `firebaseConfig` object with your own project's configuration.
4.  Create a `.env` file in the `frontend/` directory:
    ```env
    # Google OAuth Client ID for the *frontend*
    VITE_YOUTUBE_CLIENT_ID=your_google_cloud_client_id
    ```
5.  Run the frontend dev server:
    ```sh
    npm run dev
    ```
    The server will run on `http://localhost:80`.

**Note:** The frontend is configured with a Vite proxy that automatically forwards all requests from `/api` to the backend at `http://localhost:3001`.

-----

## 📡 API Endpoints Overview

All routes are prefixed with `/api/v1` and (except for `/auth`) require a valid API JWT.

| Method | Endpoint | Description | File |
| :--- | :--- | :--- | :--- |
| **POST** | `/auth/exchange` | Exchange a Firebase ID Token for a custom API JWT. | `auth.js` |
| **POST** | `/auth/connect/youtube` | Connect a user's YouTube account via OAuth code. | `auth.js` |
| **GET** | `/youtube/connections` | Get the connection status for YouTube, Twitch, etc. | `youtube.js` |
| **GET** | `/youtube/analytics` | Fetch 30-day total analytics for the connected channel. | `youtube.js` |
| **GET** | `/youtube/analytics/growth` | Fetch 30-day *daily* subscriber growth for charts. | `youtube.js` |
| **GET** | `/youtube/videos` | Get a list of the user's most recent 25 videos. | `youtube.js` |
| **GET** | `/profile` | Get all Creator Profiles for the user. | `profile.js` |
| **POST** | `/profile` | Create a new, blank Creator Profile. | `profile.js` |
| **PUT** | `/profile/:id` | Update a specific Creator Profile. | `profile.js` |
| **DELETE** | `/profile/:id` | Delete a specific Creator Profile. | `profile.js` |
| **POST** | `/generate` | **Core AI:** Generate content for a new game. | `generate.js` |
| **POST** | `/ai/optimize` | **Optimize AI:** Get suggestions for an existing video. | `ai.js` |
| **POST** | `/ai/discover/outliers` | **Discover AI:** Get "outlier" video ideas for a topic. | `ai.js` |
| **POST** | `/ai/discover/keywords` | **Discover AI:** Get SEO keywords and intent for a topic. | `ai.js` |
| **POST** | `/ai/discover/competitor` | **Discover AI:** Find content gaps for a competitor. | `ai.js` |
| **POST** | `/ai/coach` | *(Planned)* Conversational AI mentor. | `ai.js` |

-----

## 🗄️ Firestore Data Structure

```plaintext
creatorProfiles/
  └── {uid}/
      └── profiles/
          └── {profileId}
              ├── name: "Main Channel"
              ├── tone: "Funny, chaotic"
              ├── voiceGuidelines: "Always use 🚀 emojis"
              ├── bannedWords: ["boring"]
              ├── defaultCTAs: ["https://discord.gg/server"]
              └── logoUrl: "https://i.imgur.com/logo.png"

connections/
  └── {uid}/
      └── youtube/
          └── tokens
              ├── channelId: "UC..."
              ├── channelName: "Creator Name"
              ├── refreshToken: "AES-256 Encrypted Token"
              └── ...

history/
  └── {docId}
      ├── uid: "user-firebase-uid"
      ├── game: "Elden Ring"
      ├── platformTitle: "🔥 I Finally Beat Malenia..."
      ├── platformDescription: "..."
      ├── platformTags: ["elden ring", "malenia", ...]
      └── createdAt: "2025-11-12T14:00Z"
```

-----

## 🤝 Contribution Guidelines

1.  **Branch Naming:**
    `feature/<module_name>` or `fix/<bug_name>`
2.  **Commit Format:**
    `feat(dashboard): added stats widget`
    `fix(auth): token refresh issue`
3.  **Code Reviews:**
    PRs must be reviewed by one lead dev before merging.
4.  **Environment:**
    Copy `.env.example` → `.env.local` for frontend, `.env` for backend.
5.  **Testing:**
    Run unit tests via Jest (when added) before PR submission.
