// backend/config/ai.js
const OpenAI = require('openai');
require('dotenv').config();

// --- OpenRouter Configuration ---
const openai = new OpenAI({
  baseURL: 'https://openrouter.ai/api/v1',
  apiKey: process.env.OPENROUTER_API_KEY,
  defaultHeaders: {
    'HTTP-Referer': 'http://localhost:3000', // Required by OpenRouter
    'X-Title': 'StreamTitle.AI', // Optional
  },
});

// --- Supported Models ---
const AVAILABLE_MODELS = [
  { id: 'openai/gpt-oss-20b:free', name: 'GPT-OSS 20B (Free)' },
  { id: 'google/gemini-2.0-flash-exp:free', name: 'Gemini 2.0 Flash (Free)' },
  { id: 'tngtech/deepseek-r1t2-chimera:free', name: 'DeepSeek R1 Chimera (Free)' },
  { id: 'meta-llama/llama-3.3-70b-instruct:free', name: 'Llama 3.3 70B (Free)' }
];

const DEFAULT_MODEL = AVAILABLE_MODELS[0].id;

console.log(`[StreamTitle.AI] AI Engine Initialized via OpenRouter`);

// --- Adapter: Dynamic Model Switching ---
const mainModel = {
  startChat: (config) => {
    // Determine which model to use (passed from route, or default)
    const selectedModel = config.model || DEFAULT_MODEL;
    
    // Convert history to OpenAI format
    let history = (config.history || []).map(msg => ({
      role: msg.role === 'model' ? 'assistant' : 'user',
      content: msg.parts[0].text
    }));

    return {
      sendMessage: async (message) => {
        history.push({ role: 'user', content: message });
        try {
          const completion = await openai.chat.completions.create({
            model: selectedModel,
            messages: history,
            temperature: config.generationConfig?.temperature || 0.7,
            max_tokens: config.generationConfig?.maxOutputTokens || 2048,
          });

          const responseText = completion.choices[0].message.content;
          history.push({ role: 'assistant', content: responseText });

          return {
            response: {
              text: () => responseText
            }
          };
        } catch (error) {
          console.error(`OpenRouter Error (${selectedModel}):`, error.message);
          throw new Error(`AI Error: ${error.message}`);
        }
      }
    };
  }
};

// Use the same adapter for expansion
const expanderModel = mainModel;

// --- PROMPTS (Unchanged) ---
const systemPrompt = `
You are StreamTitle.AI, a world-class creative writer for gaming content creators.
Your sole purpose is to generate highly detailed, SEO-optimized, and community-aware content packages.

You will be given "facts" (verified game data), "preferences" (language, length), and a "creatorProfile" (tone, voice, banned words).
You MUST follow all instructions from the "creatorProfile".

**Output Structure (Your Output):**
You MUST return ONLY a valid, minified JSON object using this exact structure.
{
  "game": "The Game Name",
  "platformTitle": "Title",
  "platformDescription": "Description",
  "platformTags": ["tag1", "tag2"],
  "discordAnnouncement": "Announcement",
  "thumbnail": {
    "description": "Theme",
    "text_overlay": "Text",
    "layers": [
      { "layer": 1, "type": "background", "content": "..." },
      { "layer": 2, "type": "main_subject", "content": "..." },
      { "layer": 3, "type": "text_overlay", "content": "..." },
      { "layer": 4, "type": "logo_placement", "content": "User's channel logo placed in the bottom-left corner." }
    ]
  }
}
`;

const optimizePrompt = `
You are StreamTitle.AI, a YouTube expert. Analyze the input video and creator profile.
Return ONLY a valid JSON object.
OUTPUT:
{
  "originalScore": 15,
  "newScore": 85,
  "overallSuggestion": "Analysis...",
  "newTitle": "New Title",
  "newDescription": "New Description",
  "newTags": ["tag1", "tag2"]
}
`;

const outliersPrompt = `
You are StreamTitle.AI. Find 5 "Outlier" video ideas.
Return ONLY a valid JSON object.
OUTPUT:
{
  "ideas": [
    { "title": "Title", "concept": "Concept", "hook": "Hook" }
  ]
}
`;

const keywordsPrompt = `
You are StreamTitle.AI SEO expert.
Return ONLY a valid JSON object.
OUTPUT:
{
  "primaryKeyword": "Keyword",
  "searchIntent": "Intent",
  "relatedKeywords": ["k1", "k2"],
  "videoIdeas": [ { "title": "Title", "keywordFocus": "Focus" } ]
}
`;

const competitorPrompt = `
You are StreamTitle.AI competitive strategist.
Return ONLY a valid JSON object.
OUTPUT:
{
  "competitorAnalysis": { "assumedStrategy": "...", "whatWorks": "..." },
  "contentGaps": [ { "gap": "...", "opportunity": "..." } ],
  "videoIdeas": [ { "title": "...", "strategy": "..." } ]
}
`;

const coachPrompt = `
You are "Coach," the AI mentor built into StreamTitle.AI. 
Your goal is to help content creators grow their YouTube/Twitch channels by providing specific, actionable, and data-driven advice.
Adopt the persona described in the "creatorProfile".
Keep responses concise and action-oriented.
`;

const expanderSystemPrompt = `
Convert the input (acronym/slang) to the FULL, OFFICIAL game name.
Output ONLY the name.
`;

const dailyIdeaPrompt = `
You are a gaming trend analyst. Identify ONE rising trend, mechanic, or challenge in the gaming world right now (e.g., a specific challenge run in Elden Ring, a mod in Minecraft, a viral strategy in a competitive shooter).

Return ONLY a valid JSON object.
OUTPUT:
{
  "game": "Game Name",
  "title": "Viral Video Title Idea",
  "idea": "A 2-sentence explanation of why this is trending and what the video should be.",
  "difficulty": "Hard/Medium/Easy"
}
`;

module.exports = {
  mainModel,
  expanderModel,
  AVAILABLE_MODELS, // Export the list so routes can use it if needed
  systemPrompt,
  expanderSystemPrompt,
  optimizePrompt,
  outliersPrompt,
  keywordsPrompt,
  competitorPrompt,
  coachPrompt,
  dailyIdeaPrompt
};