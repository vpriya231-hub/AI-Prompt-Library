export interface CheatCodePrompt {
  id: number;
  shortcut: string;
  title: string;
  category: string;
  description: string;
  prompt: string;
  isOfficial?: boolean;
  isCommunity?: boolean;
  contributor?: string;
}

export type CollectionTierId = 'basic' | 'advanced' | 'expert' | 'master' | 'ultimate';

export interface CollectionTier {
  id: CollectionTierId;
  name: string;
  emoji: string;
  codesCount: number;
  description: string;
}

export interface AIModel {
  id: string;
  name: string;
  developer: string;
  codesCount: number;
  isComingSoon: boolean;
  logo: React.ReactNode;
  description: string;
  categories?: { name: string; samplePrompt: string; tags: string[] }[];
}

export interface ProCollectionItem {
  id: string;
  name: string;
  emoji: string;
  url: string;
  pdf?: string;
  description: string;
}

