# 🧠 StreamTitle.AI — Developer Documentation  
**Version:** 2.5 → 3.0 (Development Roadmap)  
**Maintained by:** SafeHouse Studios (Lead Dev: Abyss Mage)  
**Status:** Actively in development  
**License:** Private — Internal Use Only  

---

## 📘 Overview

**StreamTitle.AI** is a full-stack AI-driven application designed to empower YouTube and content creators.  
It automatically generates SEO-optimized **titles**, **descriptions**, **thumbnails**, and **video scripts** while integrating with **real YouTube analytics** for personalized AI recommendations.  

Built with **React (Vite)**, **Node.js (Express)**, **Firebase**, and **Gemini AI**, the platform has evolved from a simple MVP into a secure and data-connected ecosystem.

---

## 🧩 Tech Stack Summary

### 🖥️ Frontend (Client-Side)
| Component | Description |
|------------|--------------|
| **Framework** | React v19 + Vite |
| **Routing** | React Router v6 |
| **HTTP Client** | Axios |
| **State Management** | Context API + Local Storage |
| **Auth & Database** | Firebase SDK (Auth, Firestore, Storage) |
| **Icons & Styling** | React Feather + TailwindCSS (Dark + Glassmorphism) |

### ⚙️ Backend (Server-Side)
| Component | Description |
|------------|--------------|
| **Framework** | Node.js + Express |
| **Auth System** | Firebase Admin SDK + JWT “Two-Token” System |
| **Security** | AES-256 Crypto (YouTube token encryption) |
| **Env Management** | dotenv |
| **AI Engine** | Google Gemini 2.5 Flash |
| **Video APIs** | YouTube Data API v3 + Analytics API v2 |
| **Game APIs** | Steam, Modrinth, CurseForge |

### 🗄️ Database & Storage
| Service | Usage |
|----------|--------|
| **Firestore** | User profiles, connections, generation history |
| **Firebase Storage** | Logos, Thumbnails, AI image outputs |

---

## 🧱 Architecture Overview

```plaintext
Frontend (React + Firebase)
│
├── Firebase Authentication
│      └── User signs in (Email/Google)
│      └── ID Token sent to backend
│
├── Axios HTTP Layer
│      └── Includes API JWT (Two-Token system)
│
└── Firestore SDK
       ├── Saves generation history
       └── Loads Creator Profile settings
````

```plaintext
Backend (Express.js)
│
├── Auth Layer
│   ├── /api/v1/auth/exchange → Firebase → API JWT
│   └── verifyApiToken → Secures private routes
│
├── YouTube Integration
│   ├── /api/v1/auth/connect/youtube → OAuth flow
│   └── /api/v1/youtube/analytics → Fetch stats
│
├── AI Engine
│   └── /api/v1/generate → Gemini 2.5 Flash
│
└── Database Layer
    ├── Firestore (Profiles, Tokens)
    └── Firebase Storage (Logos, Thumbnails)
```

---

## ✅ Completed Milestones (V1 → V2)

### **Step 1: V1 Foundation**

* React + Vite setup
* Express.js backend with Gemini integration
* Firebase authentication (Email & Google)
* Core pages: Generator, History, Settings
* Basic AI title/description generator

---

### **Step 2: Secure Two-Token Authentication**

* Endpoint: `/api/v1/auth/exchange`
* Middleware: `verifyApiToken`
* Backend issues secure JWT for each user
* Frontend stores API token locally for session persistence

---

### **Step 3: Creator Profiles**

* Users save brand tone, CTAs, banned words, etc.
* `SettingsPage.jsx` → Firestore write via `/api/v1/profile`
* AI prompts now include these attributes automatically

---

### **Step 4: YouTube OAuth 2.0 Integration**

* Frontend uses Google GSI client for OAuth
* Backend endpoint: `/api/v1/auth/connect/youtube`
* Tokens encrypted with AES-256 before storage
* `.env` variable for `YOUTUBE_REDIRECT_URI` prevents mismatch

---

### **Step 5: Live YouTube Analytics**

* Helper: `getAuthenticatedYouTubeClient(uid)`
* Endpoint: `/api/v1/youtube/analytics`
* Retrieves last 30 days of views, subs, engagement
* Displayed in SettingsPage (proof of live data fetch)

---

### **Step 6: Dashboard Planning**

* Planned new structure:

  * `/home`
  * `/optimize`
  * `/discover`
  * `/create`
  * `/ai-coach`
* Sidebar-based layout replacing top navbar

---

## 🚀 Upcoming Roadmap (V3)

### 🎨 **Phase 1: Dashboard Layout**

* Persistent sidebar navigation (`SidebarLayout.jsx`)
* User menu with profile & logout
* Routing setup for new sections
  🕓 *ETA: 1.5 weeks*

---

### 📊 **Phase 2: Home Dashboard**

* Quick Actions (Generate, Ideas, Analyze)
* Live YouTube stats (via `/api/v1/youtube/analytics`)
* Daily AI ideas (Gemini)
* Creator XP progression (Firestore)
  🕓 *ETA: 2 weeks*

---

### ⚙️ **Phase 3: Optimize Page**

* Fetch videos (YouTube Data API)
* Display thumbnails, stats
* “Optimize with AI” button (via `/api/v1/ai/optimize`)
* AI scoring system (CTR + SEO + Retention)
  🕓 *ETA: 3 weeks*

---

### 🔍 **Phase 4: Discover Suite**

* Tabs:

  * **Outliers** — Trending similar videos
  * **Keywords** — Google Trends + Gemini analysis
  * **Competitors** — Compare YouTube channels
  * **Subscribers** — Growth graphs (Recharts)
* Cached results in Firestore
  🕓 *ETA: 4 weeks*

---

### ✨ **Phase 5: Create Suite**

* Submodules:

  * **Thumbnails:** AI Image Gen (Replicate/Gemini Vision)
  * **Clipping:** Analyze captions for highlight moments
  * **Script Writer:** Scene-based scripts
  * **Generate:** Titles, Descriptions, Tags
    🕓 *ETA: 5 weeks*

---

### 🧠 **Phase 6: AI Coach**

* Conversational chatbot with memory
* Personalized responses based on:

  * Creator profile
  * Channel analytics
  * Recent AI generations
* Endpoint: `/api/v1/ai/coach`
  🕓 *ETA: 4 weeks*

---

### 💵 **Phase 7: Monetization**

* Stripe integration
* Tier-based access control via Firestore
* Free tier = 5 AI generations/day
  🕓 *ETA: 2 weeks*

---

### 🧪 **Phase 8: QA & Launch**

* Testing with Jest + Postman collections
* Sentry for error tracking
* Firebase Hosting deployment
  🕓 *ETA: 2 weeks*

---

## 📡 API Endpoints Overview

| Endpoint                       | Method  | Description                     |
| ------------------------------ | ------- | ------------------------------- |
| `/api/v1/auth/exchange`        | POST    | Exchange Firebase token for JWT |
| `/api/v1/profile`              | GET/PUT | Manage user AI profile          |
| `/api/v1/generate`             | POST    | Generate AI content             |
| `/api/v1/auth/connect/youtube` | GET     | Start OAuth 2.0 flow            |
| `/api/v1/youtube/analytics`    | GET     | Fetch channel metrics           |
| `/api/v1/ai/optimize`          | POST    | Analyze and rate videos         |
| `/api/v1/ai/script`            | POST    | Generate scripts                |
| `/api/v1/ai/thumbnails`        | POST    | AI-based image generation       |
| `/api/v1/ai/coach`             | POST    | Conversational AI mentor        |

---

## 🗃️ Firestore Data Structure

```plaintext
creatorProfiles
├── uid
│   ├── tone: "Energetic"
│   ├── bannedWords: ["clickbait", "subscribe"]
│   ├── defaultCTAs: "Join our journey!"
│   ├── logoUrl: "https://storage.googleapis.com/logo.png"
│   └── voiceGuidelines: "Friendly and humorous"

connections
├── uid
│   ├── provider: "youtube"
│   ├── encrypted_refresh_token
│   └── encrypted_access_token

history
├── uid
│   ├── type: "title" | "description" | "script"
│   ├── inputPrompt: "Minecraft survival stream..."
│   ├── outputText: "Conquer the Deep — Hardcore Survival Begins!"
│   ├── createdAt: "2025-11-09T14:00Z"
```

---

## 🧠 Gemini Prompt Schema

```plaintext
SYSTEM PROMPT:
You are StreamTitle.AI — a creative YouTube assistant that follows the creator's personal tone and avoids banned words.

CONTEXT:
{userProfile.tone}, {userProfile.voiceGuidelines}, {userProfile.bannedWords}

TASK:
Generate 5 SEO-optimized YouTube titles and one engaging video description.
```

---

## ☁️ Deployment Setup

| Environment           | Platform                          | Description                  |
| --------------------- | --------------------------------- | ---------------------------- |
| **Staging**           | Firebase Hosting + Functions      | Testing & pre-release builds |
| **Production**        | Firebase / Vercel                 | Live deployment              |
| **Monitoring**        | Sentry + Google Analytics         | Performance & error tracking |
| **Environment Files** | `.env.staging`, `.env.production` | Separate API keys            |

---

## 🧭 Development Timeline

| Phase | Module         | Duration  | Status |
| :---- | :------------- | :-------- | :----- |
| 1     | Sidebar Layout | 1.5 weeks | ⏳      |
| 2     | Home Dashboard | 2 weeks   | ⏳      |
| 3     | Optimize Page  | 3 weeks   | 🔜     |
| 4     | Discover Suite | 4 weeks   | 🔜     |
| 5     | Create Suite   | 5 weeks   | 🔜     |
| 6     | AI Coach       | 4 weeks   | 🔜     |
| 7     | Monetization   | 2 weeks   | 🔜     |
| 8     | QA & Launch    | 2 weeks   | 🔜     |

*Total Estimated Duration: 6–7 Months*

---

## 🧾 Contribution Guidelines

1. **Branch Naming:**
   `feature/<module_name>` or `fix/<bug_name>`
2. **Commit Format:**
   `feat(dashboard): added stats widget`
   `fix(auth): token refresh issue`
3. **Code Reviews:**
   PRs must be reviewed by one lead dev before merging.
4. **Environment:**
   Copy `.env.example` → `.env.local` for frontend, `.env` for backend.
5. **Testing:**
   Run unit tests via Jest before PR submission.

---

## 🔮 Future Expansion

* **Chrome Extension:** In-browser title generator overlay
* **OBS Plugin:** Real-time title/tag suggestions during live streams
* **Discord Bot:** Auto-generate titles + announcements
* **Mobile Companion App:** React Native version of dashboard

---

## 📘 Summary

**StreamTitle.AI** has matured from a simple AI-powered title generator into a robust, secure, and data-driven creator platform.
The upcoming **V3 dashboard** will unify all tools — AI generation, analytics, optimization, and monetization — into a single intelligent ecosystem for creators.

---

### 🧩 Maintainer Notes

> “Code scalability, prompt structure, and data security are the foundation pillars of StreamTitle.AI. Every commit should keep these three in balance.”
> — *Abyss Mage, Lead Developer*

---

**© 2025 SafeHouse Studios — Internal Developer Documentation**
