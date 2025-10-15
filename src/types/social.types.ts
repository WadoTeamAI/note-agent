/**
 * ソーシャルメディア関連の型定義
 */

export type XPostType = 'short' | 'long' | 'thread';

export interface XPost {
  id: string;
  type: XPostType;
  target: string;
  text: string;
  hashtags: string[];
  estimatedEngagement?: 'low' | 'medium' | 'high';
  characterCount: number;
}

export interface XThread {
  id: string;
  tweets: string[];
  totalCharacters: number;
  tweetCount: number;
}

export interface XPostGenerationResult {
  shortPosts: XPost[];        // 140文字以内の短文ポスト（5パターン）
  longPosts: XPost[];         // 長文ポスト（300-500文字、2パターン）
  threads: XThread[];         // スレッド形式（1-2パターン）
  scheduleSuggestion?: string; // 投稿時間提案
}

export interface XPostGenerationOptions {
  keyword: string;
  articleTitle: string;
  articleSummary: string;
  tone: string;
  targetAudiences: string[];
}

