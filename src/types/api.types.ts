/**
 * API関連の型定義
 */

export interface SearchAPIResponse {
  results: SearchResult[];
  relatedKeywords: string[];
  searchVolume?: number;
}

export interface SearchResult {
  title: string;
  url: string;
  snippet: string;
  position: number;
}

export interface NoteAnalysisResult {
  popularPatterns: string[];
  trendingTopics: string[];
  averageEngagement: {
    likes: number;
    views: number;
  };
}

export interface SNSTrendResult {
  platform: 'X' | 'Threads' | 'Instagram';
  trending: string[];
  relatedHashtags: string[];
}

export interface GeminiAPIRequest {
  prompt: string;
  model: string;
  temperature?: number;
  maxTokens?: number;
}

export interface GeminiAPIResponse {
  text: string;
  model: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

