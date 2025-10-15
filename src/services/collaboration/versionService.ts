/**
 * バージョン管理サービス（Phase 2.5）
 * 文書のバージョン履歴、比較、復元機能
 */

import { supabase } from '../database/supabaseClient';
import { 
  DocumentVersion,
  ApprovalStatus,
  ApprovalRecord,
  CollaboratorUser,
  ChangeLog
} from '../../types/collaboration.types';

export class VersionService {
  /**
   * 新しいバージョンを作成
   */
  async createVersion(
    documentId: string,
    content: string,
    title: string,
    author: CollaboratorUser,
    changeDescription: string,
    isPublished: boolean = false
  ): Promise<DocumentVersion | null> {
    if (!supabase) {
      console.warn('Supabase not available');
      return null;
    }

    try {
      const version: Omit<DocumentVersion, 'id' | 'approvers'> = {
        content,
        title,
        authorId: author.id,
        authorName: author.name,
        createdAt: new Date(),
        changeDescription,
        isPublished,
        approvalStatus: isPublished ? ApprovalStatus.PUBLISHED : ApprovalStatus.DRAFT
      };

      const { data, error } = await supabase
        .from('document_versions')
        .insert({
          document_id: documentId,
          content: version.content,
          title: version.title,
          author_id: version.authorId,
          author_name: version.authorName,
          change_description: version.changeDescription,
          is_published: version.isPublished,
          approval_status: version.approvalStatus
        })
        .select()
        .single();

      if (error) throw error;

      const newVersion: DocumentVersion = {
        id: data.id,
        content: data.content,
        title: data.title,
        authorId: data.author_id,
        authorName: data.author_name,
        createdAt: new Date(data.created_at),
        changeDescription: data.change_description,
        isPublished: data.is_published,
        approvalStatus: data.approval_status,
        approvers: []
      };

      // 変更ログを記録
      await this.logChange(documentId, author.id, author.name, 'edit', changeDescription);

      return newVersion;
    } catch (error) {
      console.error('Error creating version:', error);
      return null;
    }
  }

  /**
   * 文書のバージョン履歴を取得
   */
  async getVersionHistory(documentId: string): Promise<DocumentVersion[]> {
    if (!supabase) return [];

    try {
      const { data: versions, error } = await supabase
        .from('document_versions')
        .select(`
          *,
          approval_records(*)
        `)
        .eq('document_id', documentId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return versions.map(version => ({
        id: version.id,
        content: version.content,
        title: version.title,
        authorId: version.author_id,
        authorName: version.author_name,
        createdAt: new Date(version.created_at),
        changeDescription: version.change_description,
        isPublished: version.is_published,
        approvalStatus: version.approval_status,
        approvers: version.approval_records.map((record: any) => ({
          approverId: record.approver_id,
          approverName: record.approver_name,
          status: record.status,
          comment: record.comment,
          timestamp: new Date(record.created_at)
        }))
      }));
    } catch (error) {
      console.error('Error fetching version history:', error);
      return [];
    }
  }

  /**
   * 特定のバージョンを取得
   */
  async getVersion(versionId: string): Promise<DocumentVersion | null> {
    if (!supabase) return null;

    try {
      const { data: version, error } = await supabase
        .from('document_versions')
        .select(`
          *,
          approval_records(*)
        `)
        .eq('id', versionId)
        .single();

      if (error) throw error;

      return {
        id: version.id,
        content: version.content,
        title: version.title,
        authorId: version.author_id,
        authorName: version.author_name,
        createdAt: new Date(version.created_at),
        changeDescription: version.change_description,
        isPublished: version.is_published,
        approvalStatus: version.approval_status,
        approvers: version.approval_records.map((record: any) => ({
          approverId: record.approver_id,
          approverName: record.approver_name,
          status: record.status,
          comment: record.comment,
          timestamp: new Date(record.created_at)
        }))
      };
    } catch (error) {
      console.error('Error fetching version:', error);
      return null;
    }
  }

  /**
   * 最新の公開バージョンを取得
   */
  async getLatestPublishedVersion(documentId: string): Promise<DocumentVersion | null> {
    if (!supabase) return null;

    try {
      const { data: version, error } = await supabase
        .from('document_versions')
        .select(`
          *,
          approval_records(*)
        `)
        .eq('document_id', documentId)
        .eq('is_published', true)
        .eq('approval_status', ApprovalStatus.PUBLISHED)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error) throw error;

      return {
        id: version.id,
        content: version.content,
        title: version.title,
        authorId: version.author_id,
        authorName: version.author_name,
        createdAt: new Date(version.created_at),
        changeDescription: version.change_description,
        isPublished: version.is_published,
        approvalStatus: version.approval_status,
        approvers: version.approval_records.map((record: any) => ({
          approverId: record.approver_id,
          approverName: record.approver_name,
          status: record.status,
          comment: record.comment,
          timestamp: new Date(record.created_at)
        }))
      };
    } catch (error) {
      console.error('Error fetching latest published version:', error);
      return null;
    }
  }

  /**
   * バージョンを復元
   */
  async restoreVersion(
    versionId: string,
    documentId: string,
    author: CollaboratorUser,
    changeDescription: string = 'バージョンを復元'
  ): Promise<DocumentVersion | null> {
    const originalVersion = await this.getVersion(versionId);
    if (!originalVersion) return null;

    // 復元されたバージョンを新しいバージョンとして作成
    return this.createVersion(
      documentId,
      originalVersion.content,
      originalVersion.title,
      author,
      `${changeDescription} (${originalVersion.createdAt.toLocaleDateString()}のバージョンから復元)`
    );
  }

  /**
   * バージョン間の差分を取得
   */
  async getVersionDiff(versionId1: string, versionId2: string): Promise<{
    additions: string[];
    deletions: string[];
    changes: Array<{ line: number; old: string; new: string }>;
  } | null> {
    const [version1, version2] = await Promise.all([
      this.getVersion(versionId1),
      this.getVersion(versionId2)
    ]);

    if (!version1 || !version2) return null;

    // 簡単な行ベースの差分計算
    const lines1 = version1.content.split('\n');
    const lines2 = version2.content.split('\n');

    const additions: string[] = [];
    const deletions: string[] = [];
    const changes: Array<{ line: number; old: string; new: string }> = [];

    const maxLines = Math.max(lines1.length, lines2.length);
    
    for (let i = 0; i < maxLines; i++) {
      const line1 = lines1[i];
      const line2 = lines2[i];

      if (line1 === undefined && line2 !== undefined) {
        additions.push(line2);
      } else if (line1 !== undefined && line2 === undefined) {
        deletions.push(line1);
      } else if (line1 !== line2) {
        changes.push({ line: i + 1, old: line1, new: line2 });
      }
    }

    return { additions, deletions, changes };
  }

  /**
   * バージョンを公開
   */
  async publishVersion(
    versionId: string,
    publisherId: string
  ): Promise<boolean> {
    if (!supabase) return false;

    try {
      const { error } = await supabase
        .from('document_versions')
        .update({
          is_published: true,
          approval_status: ApprovalStatus.PUBLISHED,
          published_at: new Date().toISOString(),
          published_by: publisherId
        })
        .eq('id', versionId);

      if (error) throw error;

      // 他のバージョンを非公開に
      await supabase
        .from('document_versions')
        .update({ is_published: false })
        .neq('id', versionId);

      return true;
    } catch (error) {
      console.error('Error publishing version:', error);
      return false;
    }
  }

  /**
   * バージョンを削除
   */
  async deleteVersion(
    versionId: string,
    userId: string
  ): Promise<boolean> {
    if (!supabase) return false;

    try {
      // 作成者または管理者のみ削除可能
      const version = await this.getVersion(versionId);
      if (!version || version.authorId !== userId) {
        throw new Error('Insufficient permissions');
      }

      const { error } = await supabase
        .from('document_versions')
        .delete()
        .eq('id', versionId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error deleting version:', error);
      return false;
    }
  }

  /**
   * 変更ログを記録
   */
  private async logChange(
    documentId: string,
    userId: string,
    userName: string,
    action: ChangeLog['action'],
    description: string,
    metadata?: any
  ): Promise<void> {
    if (!supabase) return;

    try {
      const changeLog: Omit<ChangeLog, 'id'> = {
        documentId,
        userId,
        userName,
        action,
        description,
        timestamp: new Date(),
        metadata
      };

      await supabase.from('change_logs').insert({
        document_id: changeLog.documentId,
        user_id: changeLog.userId,
        user_name: changeLog.userName,
        action: changeLog.action,
        description: changeLog.description,
        metadata: changeLog.metadata
      });
    } catch (error) {
      console.error('Failed to log change:', error);
    }
  }

  /**
   * 文書の変更履歴を取得
   */
  async getChangeHistory(documentId: string, limit: number = 50): Promise<ChangeLog[]> {
    if (!supabase) return [];

    try {
      const { data: logs, error } = await supabase
        .from('change_logs')
        .select('*')
        .eq('document_id', documentId)
        .order('timestamp', { ascending: false })
        .limit(limit);

      if (error) throw error;

      return logs.map(log => ({
        id: log.id,
        documentId: log.document_id,
        userId: log.user_id,
        userName: log.user_name,
        action: log.action,
        description: log.description,
        timestamp: new Date(log.timestamp),
        metadata: log.metadata
      }));
    } catch (error) {
      console.error('Error fetching change history:', error);
      return [];
    }
  }

  /**
   * 自動保存バージョンを作成
   */
  async createAutoSaveVersion(
    documentId: string,
    content: string,
    title: string,
    author: CollaboratorUser
  ): Promise<DocumentVersion | null> {
    return this.createVersion(
      documentId,
      content,
      title,
      author,
      '自動保存',
      false
    );
  }

  /**
   * 古い自動保存バージョンをクリーンアップ
   */
  async cleanupAutoSaveVersions(
    documentId: string,
    keepCount: number = 10
  ): Promise<void> {
    if (!supabase) return;

    try {
      // 自動保存バージョンを取得（新しい順）
      const { data: versions } = await supabase
        .from('document_versions')
        .select('id')
        .eq('document_id', documentId)
        .eq('change_description', '自動保存')
        .eq('is_published', false)
        .order('created_at', { ascending: false });

      if (versions && versions.length > keepCount) {
        const versionsToDelete = versions.slice(keepCount);
        const idsToDelete = versionsToDelete.map(v => v.id);

        await supabase
          .from('document_versions')
          .delete()
          .in('id', idsToDelete);
      }
    } catch (error) {
      console.error('Error cleaning up auto-save versions:', error);
    }
  }
}

// シングルトンインスタンス
export const versionService = new VersionService();