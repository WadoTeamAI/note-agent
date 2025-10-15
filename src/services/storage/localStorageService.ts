/**
 * LocalStorageを使用した下書き保存サービス
 */

import { 
  Draft, 
  DraftMetadata, 
  DraftListItem, 
  DraftSaveOptions, 
  DraftLoadOptions,
  DraftStatus
} from '../../types/draft.types';
import { FormData, FinalOutput } from '../../types/article.types';
import { ProcessStep } from '../../types';

const DRAFT_STORAGE_KEY = 'note-agent-drafts';
const MAX_DRAFTS = 20; // 最大保存件数

/**
 * LocalStorageから全ての下書きを取得
 */
function getAllDrafts(): Draft[] {
  try {
    const draftsJson = localStorage.getItem(DRAFT_STORAGE_KEY);
    if (!draftsJson) return [];
    
    const drafts = JSON.parse(draftsJson) as Draft[];
    return drafts;
  } catch (error) {
    console.error('下書きの読み込みに失敗しました:', error);
    return [];
  }
}

/**
 * LocalStorageに全ての下書きを保存
 */
function saveAllDrafts(drafts: Draft[]): void {
  try {
    localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(drafts));
  } catch (error) {
    console.error('下書きの保存に失敗しました:', error);
    throw new Error('下書きの保存に失敗しました。ストレージ容量を確認してください。');
  }
}

/**
 * 下書きを保存
 */
export function saveDraft(
  formData: FormData,
  currentStep: ProcessStep,
  output: Partial<FinalOutput>,
  options: DraftSaveOptions = {}
): string {
  const drafts = getAllDrafts();
  
  // 既存の下書きを検索（同じキーワードで未完了の下書き）
  const existingDraftIndex = drafts.findIndex(
    d => d.formData.keyword === formData.keyword && 
         d.status !== DraftStatus.COMPLETED
  );
  
  const now = new Date().toISOString();
  const draftId = existingDraftIndex >= 0 
    ? drafts[existingDraftIndex].id 
    : `draft-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  
  const draft: Draft = {
    id: draftId,
    title: formData.keyword || '無題の記事',
    createdAt: existingDraftIndex >= 0 ? drafts[existingDraftIndex].createdAt : now,
    updatedAt: now,
    formData,
    currentStep,
    output,
    status: currentStep === ProcessStep.DONE 
      ? DraftStatus.COMPLETED 
      : currentStep === ProcessStep.ERROR
      ? DraftStatus.ERROR
      : options.autoSave
      ? DraftStatus.IN_PROGRESS
      : DraftStatus.SAVED_MANUALLY,
    tags: [], // 将来的にタグ機能を実装
    note: '',
  };
  
  if (existingDraftIndex >= 0) {
    // 既存の下書きを更新
    drafts[existingDraftIndex] = draft;
  } else {
    // 新しい下書きを追加
    drafts.unshift(draft);
    
    // 最大件数を超えた場合、古いものから削除
    if (drafts.length > MAX_DRAFTS) {
      drafts.splice(MAX_DRAFTS);
    }
  }
  
  saveAllDrafts(drafts);
  
  if (options.notify !== false) {
    console.log(`下書きを保存しました: ${draft.title}`);
  }
  
  return draftId;
}

/**
 * 下書きを読み込み
 */
export function loadDraft(
  draftId: string,
  options: DraftLoadOptions = {}
): Draft | null {
  const drafts = getAllDrafts();
  const draft = drafts.find(d => d.id === draftId);
  
  if (!draft) {
    console.warn(`下書きが見つかりません: ${draftId}`);
    return null;
  }
  
  if (options.deleteAfterLoad) {
    deleteDraft(draftId);
  }
  
  return draft;
}

/**
 * 下書きを削除
 */
export function deleteDraft(draftId: string): boolean {
  const drafts = getAllDrafts();
  const index = drafts.findIndex(d => d.id === draftId);
  
  if (index === -1) {
    console.warn(`下書きが見つかりません: ${draftId}`);
    return false;
  }
  
  drafts.splice(index, 1);
  saveAllDrafts(drafts);
  
  console.log(`下書きを削除しました: ${draftId}`);
  return true;
}

/**
 * 全ての下書きを削除
 */
export function deleteAllDrafts(): void {
  localStorage.removeItem(DRAFT_STORAGE_KEY);
  console.log('全ての下書きを削除しました');
}

/**
 * 下書き一覧を取得（メタデータのみ）
 */
export function getDraftList(): DraftListItem[] {
  const drafts = getAllDrafts();
  
  return drafts.map(draft => {
    const preview = draft.output.markdownContent 
      ? draft.output.markdownContent.substring(0, 150) + '...'
      : '（本文未生成）';
    
    const metadata: DraftMetadata = {
      id: draft.id,
      title: draft.title,
      createdAt: draft.createdAt,
      updatedAt: draft.updatedAt,
      status: draft.status,
      keyword: draft.formData.keyword,
      characterCount: draft.output.markdownContent?.length,
      tags: draft.tags,
    };
    
    return {
      metadata,
      preview,
    };
  });
}

/**
 * 下書きの件数を取得
 */
export function getDraftCount(): number {
  return getAllDrafts().length;
}

/**
 * キーワードで下書きを検索
 */
export function searchDrafts(keyword: string): DraftListItem[] {
  const allDrafts = getDraftList();
  const lowerKeyword = keyword.toLowerCase();
  
  return allDrafts.filter(draft => 
    draft.metadata.title.toLowerCase().includes(lowerKeyword) ||
    draft.metadata.keyword.toLowerCase().includes(lowerKeyword) ||
    draft.preview.toLowerCase().includes(lowerKeyword)
  );
}

/**
 * ストレージの使用状況を取得（デバッグ用）
 */
export function getStorageInfo(): {
  draftCount: number;
  storageSize: number;
  maxDrafts: number;
} {
  const draftsJson = localStorage.getItem(DRAFT_STORAGE_KEY) || '';
  const storageSize = new Blob([draftsJson]).size;
  
  return {
    draftCount: getDraftCount(),
    storageSize: storageSize,
    maxDrafts: MAX_DRAFTS,
  };
}

/**
 * 古い下書きを自動削除（7日以上前の完了済み下書きを削除）
 */
export function cleanupOldDrafts(): number {
  const drafts = getAllDrafts();
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  
  const filtered = drafts.filter(draft => {
    if (draft.status !== DraftStatus.COMPLETED) {
      return true; // 未完了の下書きは保持
    }
    
    const updatedDate = new Date(draft.updatedAt);
    return updatedDate > sevenDaysAgo; // 7日以内の下書きは保持
  });
  
  const deletedCount = drafts.length - filtered.length;
  
  if (deletedCount > 0) {
    saveAllDrafts(filtered);
    console.log(`${deletedCount}件の古い下書きを削除しました`);
  }
  
  return deletedCount;
}

