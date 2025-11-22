export interface UserProfile {
  id: string;
  name: string;
  tone: string;
  voiceGuidelines: string;
  bannedWords: string[];
  defaultCTAs: string[];
  logoUrl?: string;
}

export interface VideoStats {
  viewCount: string;
  likeCount: string;
  commentCount: string;
}

export interface Video {
  id: string;
  snippet: {
    title: string;
    description: string;
    thumbnails: {
      medium: { url: string };
      high: { url: string };
    };
  };
  statistics: VideoStats;
}

// Structure for your AI Generator Output
export interface GeneratorResult {
  game: string;
  platformTitle: string;
  platformDescription: string;
  platformTags: string[];
  thumbnail: {
    description: string;
    layers: Array<{ layer: number; type: string; content: string }>;
  };
}