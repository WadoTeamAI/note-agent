/**
 * コメント管理サービス（Phase 2.5）
 * 記事の特定箇所にコメント・レビューを投稿する機能
 */

import { supabase } from '../database/supabaseClient';
import { 
  Comment, 
  CommentReply, 
  CollaboratorUser,
  Notification
} from '../../types/collaboration.types';

export class CommentService {
  /**
   * コメントを投稿
   */
  async addComment(
    documentId: string,
    content: string,
    position: { line: number; column: number; text?: string },
    author: CollaboratorUser
  ): Promise<Comment | null> {
    if (!supabase) {
      console.warn('Supabase not available');
      return null;
    }

    try {
      const comment: Omit<Comment, 'id' | 'thread'> = {
        content,
        authorId: author.id,
        authorName: author.name,
        createdAt: new Date(),
        updatedAt: new Date(),
        position,
        status: 'open'
      };

      const { data, error } = await supabase
        .from('document_comments')
        .insert({
          document_id: documentId,
          content: comment.content,
          author_id: comment.authorId,
          author_name: comment.authorName,
          line_number: comment.position.line,
          column_number: comment.position.column,
          quoted_text: comment.position.text,
          status: comment.status
        })
        .select()
        .single();

      if (error) throw error;

      const newComment: Comment = {
        id: data.id,
        content: data.content,
        authorId: data.author_id,
        authorName: data.author_name,
        createdAt: new Date(data.created_at),
        updatedAt: new Date(data.updated_at),
        position: {
          line: data.line_number,
          column: data.column_number,
          text: data.quoted_text
        },
        thread: [],
        status: data.status
      };

      // リアルタイム通知
      await this.broadcastCommentEvent('comment-added', newComment, documentId);
      
      // メンション通知（将来実装）
      await this.checkForMentions(content, documentId, author);

      return newComment;
    } catch (error) {
      console.error('Error adding comment:', error);
      return null;
    }
  }

  /**
   * コメントに返信
   */
  async replyToComment(
    commentId: string,
    content: string,
    author: CollaboratorUser
  ): Promise<CommentReply | null> {
    if (!supabase) return null;

    try {
      const reply: Omit<CommentReply, 'id'> = {
        content,
        authorId: author.id,
        authorName: author.name,
        createdAt: new Date()
      };

      const { data, error } = await supabase
        .from('comment_replies')
        .insert({
          comment_id: commentId,
          content: reply.content,
          author_id: reply.authorId,
          author_name: reply.authorName
        })
        .select()
        .single();

      if (error) throw error;

      const newReply: CommentReply = {
        id: data.id,
        content: data.content,
        authorId: data.author_id,
        authorName: data.author_name,
        createdAt: new Date(data.created_at)
      };

      // リアルタイム通知
      await this.broadcastCommentEvent('comment-reply-added', { commentId, reply: newReply });

      return newReply;
    } catch (error) {
      console.error('Error replying to comment:', error);
      return null;
    }
  }

  /**
   * コメントを編集
   */
  async updateComment(
    commentId: string,
    content: string,
    userId: string
  ): Promise<boolean> {
    if (!supabase) return false;

    try {
      const { error } = await supabase
        .from('document_comments')
        .update({
          content,
          updated_at: new Date().toISOString()
        })
        .eq('id', commentId)
        .eq('author_id', userId); // 本人のみ編集可能

      if (error) throw error;

      // リアルタイム通知
      await this.broadcastCommentEvent('comment-updated', { commentId, content });

      return true;
    } catch (error) {
      console.error('Error updating comment:', error);
      return false;
    }
  }

  /**
   * コメントを解決済みにマーク
   */
  async resolveComment(commentId: string, userId: string): Promise<boolean> {
    if (!supabase) return false;

    try {
      const { error } = await supabase
        .from('document_comments')
        .update({
          status: 'resolved',
          resolved_by: userId,
          resolved_at: new Date().toISOString()
        })
        .eq('id', commentId);

      if (error) throw error;

      // リアルタイム通知
      await this.broadcastCommentEvent('comment-resolved', { commentId, resolvedBy: userId });

      return true;
    } catch (error) {
      console.error('Error resolving comment:', error);
      return false;
    }
  }

  /**
   * コメントを削除
   */
  async deleteComment(commentId: string, userId: string): Promise<boolean> {
    if (!supabase) return false;

    try {
      // 権限チェック（作成者または文書オーナーのみ削除可能）
      const { data: comment } = await supabase
        .from('document_comments')
        .select('author_id')
        .eq('id', commentId)
        .single();

      if (!comment || comment.author_id !== userId) {
        throw new Error('Insufficient permissions');
      }

      const { error } = await supabase
        .from('document_comments')
        .delete()
        .eq('id', commentId);

      if (error) throw error;

      // リアルタイム通知
      await this.broadcastCommentEvent('comment-deleted', { commentId });

      return true;
    } catch (error) {
      console.error('Error deleting comment:', error);
      return false;
    }
  }

  /**
   * 文書のコメント一覧を取得
   */
  async getDocumentComments(documentId: string): Promise<Comment[]> {
    if (!supabase) return [];

    try {
      const { data: comments, error } = await supabase
        .from('document_comments')
        .select(`
          *,
          comment_replies(*)
        `)
        .eq('document_id', documentId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      return comments.map(comment => ({
        id: comment.id,
        content: comment.content,
        authorId: comment.author_id,
        authorName: comment.author_name,
        createdAt: new Date(comment.created_at),
        updatedAt: new Date(comment.updated_at),
        position: {
          line: comment.line_number,
          column: comment.column_number,
          text: comment.quoted_text
        },
        thread: comment.comment_replies.map((reply: any) => ({
          id: reply.id,
          content: reply.content,
          authorId: reply.author_id,
          authorName: reply.author_name,
          createdAt: new Date(reply.created_at)
        })),
        status: comment.status
      }));
    } catch (error) {
      console.error('Error fetching comments:', error);
      return [];
    }
  }

  /**
   * 特定の行のコメントを取得
   */
  async getCommentsForLine(documentId: string, lineNumber: number): Promise<Comment[]> {
    const allComments = await this.getDocumentComments(documentId);
    return allComments.filter(comment => comment.position.line === lineNumber);
  }

  /**
   * 未解決のコメント数を取得
   */
  async getUnresolvedCommentCount(documentId: string): Promise<number> {
    if (!supabase) return 0;

    try {
      const { count, error } = await supabase
        .from('document_comments')
        .select('*', { count: 'exact', head: true })
        .eq('document_id', documentId)
        .eq('status', 'open');

      if (error) throw error;
      return count || 0;
    } catch (error) {
      console.error('Error counting unresolved comments:', error);
      return 0;
    }
  }

  /**
   * コメントイベントをブロードキャスト
   */
  private async broadcastCommentEvent(
    event: string, 
    data: any, 
    documentId?: string
  ): Promise<void> {
    if (!supabase || !documentId) return;

    const channel = supabase.channel(`collaboration:${documentId}`);
    await channel.send({
      type: 'broadcast',
      event,
      payload: data
    });
  }

  /**
   * メンション機能（将来実装）
   */
  private async checkForMentions(
    content: string, 
    documentId: string, 
    author: CollaboratorUser
  ): Promise<void> {
    // @username形式のメンションを検出
    const mentionRegex = /@(\w+)/g;
    const mentions = content.match(mentionRegex);

    if (mentions && mentions.length > 0) {
      // 各メンションユーザーに通知送信
      for (const mention of mentions) {
        const username = mention.substring(1);
        await this.sendMentionNotification(username, documentId, author, content);
      }
    }
  }

  /**
   * メンション通知を送信
   */
  private async sendMentionNotification(
    mentionedUsername: string,
    documentId: string,
    author: CollaboratorUser,
    content: string
  ): Promise<void> {
    if (!supabase) return;

    try {
      // ユーザー名からユーザーIDを取得（ユーザー管理システムが必要）
      const { data: user } = await supabase
        .from('users')
        .select('id')
        .eq('username', mentionedUsername)
        .single();

      if (user) {
        const notification: Omit<Notification, 'id'> = {
          type: 'mention',
          title: `${author.name}があなたをメンションしました`,
          message: content.substring(0, 100) + '...',
          documentId,
          userId: user.id,
          isRead: false,
          createdAt: new Date()
        };

        await supabase.from('notifications').insert(notification);
      }
    } catch (error) {
      console.error('Error sending mention notification:', error);
    }
  }

  /**
   * コメントの統計情報を取得
   */
  async getCommentStats(documentId: string): Promise<{
    total: number;
    open: number;
    resolved: number;
    byAuthor: Record<string, number>;
  }> {
    if (!supabase) {
      return { total: 0, open: 0, resolved: 0, byAuthor: {} };
    }

    try {
      const { data: comments } = await supabase
        .from('document_comments')
        .select('status, author_name')
        .eq('document_id', documentId);

      if (!comments) {
        return { total: 0, open: 0, resolved: 0, byAuthor: {} };
      }

      const stats = {
        total: comments.length,
        open: comments.filter(c => c.status === 'open').length,
        resolved: comments.filter(c => c.status === 'resolved').length,
        byAuthor: {} as Record<string, number>
      };

      // 作成者別集計
      comments.forEach(comment => {
        stats.byAuthor[comment.author_name] = 
          (stats.byAuthor[comment.author_name] || 0) + 1;
      });

      return stats;
    } catch (error) {
      console.error('Error fetching comment stats:', error);
      return { total: 0, open: 0, resolved: 0, byAuthor: {} };
    }
  }
}

// シングルトンインスタンス
export const commentService = new CommentService();