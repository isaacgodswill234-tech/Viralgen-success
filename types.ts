
export enum Niche {
  COMEDY = 'Viral Comedy & Relatable Skits',
  FACTS = 'Mind-Blowing Curiosities',
  LUXURY = 'High-End Luxury',
  MOTIVATION = 'Stoic Discipline',
  SCI_FI = 'Future Technologies',
  CRYPTO = 'Web3 & Wealth'
}

export interface PlatformStatus {
  linked: boolean;
  uploaded: boolean;
  platform: 'TikTok' | 'YouTube' | 'Facebook';
}

export interface GeneratedContent {
  id: string;
  niche: Niche;
  hook: string;
  videoUrl: string;
  audioUrl?: string;
  timestamp: number;
  platforms: PlatformStatus[];
  metadata: {
    title: string;
    description: string;
    tags: string[];
  };
  analytics: {
    projectedViews: number;
    estimatedRevenue: number;
    engagementRate: number;
  };
}

export interface ScriptIdea {
  hook: string;
  visualPrompt: string;
  narration: string;
  title: string;
  description: string;
  tags: string[];
}
