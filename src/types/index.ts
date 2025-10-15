/**
 * 共通型定義
 * 記事関連の型は article.types.ts、API関連の型は api.types.ts を参照
 */

// 記事関連の型を再エクスポート
export * from './article.types';
// API関連の型を再エクスポート
export * from './api.types';
// ソーシャルメディア関連の型を再エクスポート
export * from './social.types';
// ファクトチェック関連の型を再エクスポート
export * from './factcheck.types';
// 下書き関連の型を再エクスポート
export * from './draft.types';
// SEO関連の型を再エクスポート
export * from './seo.types';
// テーマ関連の型を再エクスポート
export * from './theme.types';
// 図解関連の型を再エクスポート
export type { DiagramResult } from '../services/diagram/diagramService';
// 音声認識関連の型を再エクスポート
export * from './speech.types';
// A/Bテスト関連の型を再エクスポート
export * from './abtest.types';

export enum Tone {
  POLITE = '丁寧で落ち着いた',
  FRIENDLY = 'フレンドリーで親しみやすい',
  PROFESSIONAL = '専門的で論理的',
}

export enum Audience {
  BEGINNER = '初心者向け',
  INTERMEDIATE = '中級者向け',
  EXPERT = '専門家向け',
}

export enum ArticleCategory {
  BUSINESS = 'ビジネス・副業',
  LIFESTYLE = 'ライフスタイル',
  TECHNOLOGY = 'テクノロジー',
  HEALTH = '健康・美容',
  EDUCATION = '教育・学習',
  ENTERTAINMENT = 'エンターテイメント',
  FINANCE = '金融・投資',
  TRAVEL = '旅行・観光',
  FOOD = 'グルメ・料理',
  FASHION = 'ファッション',
  SPORTS = 'スポーツ・フィットネス',
  HOBBY = '趣味・娯楽',
}

export interface ContentStructure {
  includeIntroduction: boolean;
  includeFAQ: boolean;
  includeConclusion: boolean;
  sectionCount: number;
  includeTOC: boolean; // 目次の生成
  includeCallToAction: boolean; // 行動喚起の追加
}

export interface SEOSettings {
  focusKeyword: string;
  relatedKeywords: string[];
  metaDescriptionLength: number;
  includeSchema: boolean;
  targetSearchIntent: 'informational' | 'transactional' | 'navigational' | 'commercial';
  enableKeywordDensityOptimization: boolean;
}

export interface ImageSettings {
  style: 'リアル' | 'イラスト' | 'アイコン' | 'グラフィック';
  colorTone: '明るい' | '落ち着いた' | 'モノクロ' | 'カラフル';
  aspectRatio: '16:9' | '4:3' | '1:1' | '3:2';
  includeEyecatch: boolean;
  includeInlineGraphics: boolean;
  graphicsCount: number; // インライン図解の数
}

export interface PublishSettings {
  publishSchedule?: Date;
  targetPlatforms: ('note' | 'blog' | 'qiita' | 'zenn' | 'hatena')[];
  enableAnalytics: boolean;
  enableSEOOptimization: boolean;
  autoPublish: boolean;
  notificationSettings: {
    email: boolean;
    slack: boolean;
    discord: boolean;
  };
}

export interface FormData {
  keyword: string;
  tone: Tone;
  audience: Audience;
  targetLength: number;
  imageTheme: string;
  category: ArticleCategory;
  contentStructure: ContentStructure;
  seoSettings: SEOSettings;
  imageSettings: ImageSettings;
  publishSettings: PublishSettings;
  // 後方互換性のため古いフィールドも保持
  imageOptions?: {
    eyecatch: boolean;
    inlineGraphics: boolean;
  };
}

export enum ProcessStep {
  IDLE = 'IDLE',
  RESEARCH = '統合リサーチ中...',
  ANALYZING = 'SEO分析中...',
  OUTLINING = '記事構成案の作成中...',
  WRITING = '記事本文の執筆中...',
  FACT_CHECKING = 'ファクトチェック中...',
  GENERATING_DIAGRAMS = '図解生成中...',
  GENERATING_IMAGE = '画像生成中...',
  GENERATING_X_POSTS = 'X告知文生成中...',
  DONE = '完了',
  ERROR = 'エラー',
}