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
// 図解関連の型を再エクスポート
export type { DiagramResult } from '../services/diagram/diagramService';

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

export interface FormData {
  keyword: string;
  tone: Tone;
  audience: Audience;
  targetLength: number;
  imageTheme: string;
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