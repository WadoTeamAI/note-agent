/**
 * 下書き関連の型定義
 */

import { FinalOutput } from './article.types';
import { ProcessStep, FormData } from './index';

export interface Draft {
  id: string;                        // 一意なID（UUID）
  title: string;                     // 下書きのタイトル（キーワードから生成）
  createdAt: string;                 // 作成日時（ISO 8601形式）
  updatedAt: string;                 // 更新日時（ISO 8601形式）
  formData: FormData;                // 入力フォームデータ
  currentStep: ProcessStep;          // 現在の進行ステップ
  output: Partial<FinalOutput>;      // 生成された出力（部分的に保存可能）
  status: DraftStatus;               // 下書きのステータス
  tags?: string[];                   // タグ（オプション）
  note?: string;                     // メモ（オプション）
}

export enum DraftStatus {
  IN_PROGRESS = 'in_progress',       // 生成途中
  COMPLETED = 'completed',           // 生成完了
  ERROR = 'error',                   // エラー発生
  SAVED_MANUALLY = 'saved_manually', // 手動保存
}

export interface DraftMetadata {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  status: DraftStatus;
  keyword: string;                   // キーワード（検索用）
  characterCount?: number;           // 文字数（出力がある場合）
  tags?: string[];
}

export interface DraftListItem {
  metadata: DraftMetadata;
  preview: string;                   // プレビュー用の短い本文（最初の150文字）
}

export interface DraftSaveOptions {
  autoSave?: boolean;                // 自動保存かどうか
  notify?: boolean;                  // 保存通知を表示するか
}

export interface DraftLoadOptions {
  deleteAfterLoad?: boolean;         // 読み込み後に削除するか
}

