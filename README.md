# 🎮 StreamTitle.AI

***AI-powered Stream & Video Title Generator for Gamers***
Built using **Google Gemini**, **React (Vite)**, and **Express.js**

---

## 🧠 Overview

**StreamTitle.AI** is an AI-driven platform designed for **streamers and gaming content creators**.
Just enter the **name of a game or modpack**, and the system automatically performs background research and generates:

* 🎬 SEO-optimized YouTube titles
* 📝 Engaging descriptions with emojis & markdown
* 🏷️ Smart SEO tags
* 💬 Prebuilt Discord announcement messages

Powered by **Google Gemini**, the system intelligently identifies real games/modpacks using public APIs like **Steam** and **Curseforge**, ensuring **accurate, up-to-date, and trending results**.

---

## 🚀 Features

✅ **One-click AI Generation** – Just type a game name and get your full YouTube + Discord content package.
✅ **Game Data Fetching** – Uses Steam & Curseforge APIs for verified game/modpack info.
✅ **SEO & Trend Optimization** – Titles and tags optimized for 2025 gaming trends.
✅ **Discord Integration** – Automatically formats announcement messages for your server.
✅ **Fast Web Interface** – Built with Vite + React for a responsive, minimal UI.
✅ **Expandable Backend** – Node.js + Express architecture ready for scaling and new features.

---

## 🏗️ Tech Stack

| Layer                   | Technology                                      |
| ----------------------- | ----------------------------------------------- |
| **Frontend**            | React.js (Vite), Tailwind CSS                   |
| **Backend**             | Node.js, Express.js                             |
| **AI Engine**           | Google Gemini API (`@google/generative-ai`)     |
| **Database (optional)** | Firebase / Firestore                            |
| **External APIs**       | Steam (Game Data), Curseforge                   |

---

## ⚙️ Installation

### 🧩 Prerequisites

* Node.js (v18+ recommended)
* npm or yarn
* Google Gemini API key
* Steam API key
* Curseforge API key

---

### 🔧 Backend Setup

```bash
# 1️⃣ Clone the Repository
git clone https://github.com/yourusername/streamtitle-ai.git
cd streamtitle-ai/backend

# 2️⃣ Install Dependencies
npm install

# 3️⃣ Create .env File
touch .env
```

Add your keys in `.env`:

```env
GEMINI_API_KEY=your_google_gemini_api_key
STEAM_API_KEY=your_steam_api_key
CURSEFORGE_API_KEY=your_curseforge_api_key
```

---

### 🔧 Frontend Setup
```

```bash
# 4️⃣ Start the Server
npm run dev
```

Backend runs on **[http://localhost:3001](http://localhost:3001)**

---

### 🎨 Frontend Setup

```bash
cd ../frontend
npm install
npm run dev
```

Frontend runs on **[http://localhost:5173](http://localhost:5173)**

---

## 🧠 API Endpoints

### **POST /api/generate**

Generate SEO-optimized content for a given game name.

#### Request:

```json
{
  "gameName": "Elden Ring"
}
```

#### Response:

```json
{
  "game": "Elden Ring",
  "youtube": {
    "title": "⚔️ Conquering the Lands Between – Elden Ring Live Adventure!",
    "description": "Exploring the vast open world of Elden Ring... 🔥",
    "tags": ["elden ring", "open world", "rpg", "gaming", "soulslike"]
  },
  "discord": {
    "announcement": "🚀 Elden Ring stream is LIVE! ⚙️\n\nHey @everyone! ..."
  }
}
```

---

## 🌐 API Sources

| Source                | Use                                                   |
| --------------------- | ----------------------------------------------------- |
| **Steam API**         | Game metadata (genres, developer, release, platforms) |
| **Curseforge API**    | Minecraft modpack details                             |
| **Google Gemini API** | Natural language generation for content creation      |

---

## 🔒 Environment Variables

| Variable                           | Description                        |
| ---------------------------------- | ---------------------------------- |
| `GEMINI_API_KEY`                   | Your Google Gemini API key         |
| `STEAM_API_KEY`                    | Game database API key              |

---

## 🧰 Folder Structure

```
StreamTitleAI/
│
├── backend/
│   ├── index.js
│   ├── package.json
│   ├── .env
│   └── /node_modules
│
├── frontend/
│   ├── src/
|   |   ├── assets/
|   |   |    └── react.svg
|   |   ├── App.css
|   |   ├── App.jsx
|   |   ├── index.css
|   |   └── main.jsx
|   ├── public/
|   |   └── favicon.ico
|   ├── index.html
│   ├── vite.config.js
│   ├── package.json
│   └── /node_modules
│
├── .gitignore
├── README.md
└── LICENSE
```

---

## 💡 Example Usage

**Input:**

```
Minecraft Create Modpack
```

**Output:**
🎮 Title: *“Building the Ultimate Factory in Create Modpack – Automation Overload!”*
📝 Description: *Jumping into the world of Create Mod for full automation chaos ⚙️...*
🏷️ Tags: *["minecraft", "create mod", "automation", "survival", "factory build"]*
💬 Discord: *“🚀 Create Mod Stream is LIVE!”*

---

## 🧩 Future Enhancements

* 🎯 Multi-language Support (English, Hindi, etc.)
* 📈 AI-driven thumbnail ideas & titles split-testing
* 🎥 YouTube API Integration for direct upload optimization
* 🧠 Personalized presets (Funny, Cinematic, Competitive)
* 📊 Dashboard analytics for trending games

---

## 👥 Contributing

1. Fork the repository
2. Create your feature branch

   ```bash
   git checkout -b feature/your-feature
   ```
3. Commit your changes

   ```bash
   git commit -m "Add new feature"
   ```
4. Push to the branch

   ```bash
   git push origin feature/your-feature
   ```
5. Create a Pull Request

---

## 📜 License

This project is licensed under the **MIT License** — you’re free to use, modify, and distribute with attribution.

---

## 💬 Contact

**Developed by:** Abyss Mage
📧 Email: [contact@abyssmage.fun](mailto:contact@abyssmage.fun)
🌐 Website: [https://abyssmage.fun](https://abyssmage.fun)
🐙 GitHub: [@abyssmage](https://github.com/abyss-mage)

---