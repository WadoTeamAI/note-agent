/**
 * リアルタイム共同編集サービス（Phase 2.5）
 * Supabase Realtime + Yjs CRDT を使用
 */

import { supabase } from '../database/supabaseClient';
import * as Y from 'yjs';
import { WebsocketProvider } from 'y-websocket';
import { 
  CollaboratorUser, 
  RealtimeEvent, 
  CollaborationSession, 
  CursorPosition,
  UserRole
} from '../../types/collaboration.types';

export class RealtimeCollaborationService {
  private ydoc: Y.Doc;
  private provider: WebsocketProvider | null = null;
  private ytext: Y.Text;
  private currentUser: CollaboratorUser | null = null;
  private collaborators: Map<string, CollaboratorUser> = new Map();
  private eventHandlers: Map<string, ((...args: any[]) => void)[]> = new Map();

  constructor() {
    this.ydoc = new Y.Doc();
    this.ytext = this.ydoc.getText('content');
    this.setupEventListeners();
  }

  /**
   * コラボレーションセッションを開始
   */
  async startSession(documentId: string, user: CollaboratorUser): Promise<void> {
    this.currentUser = user;
    
    // Yjs WebSocket Provider を初期化
    const wsUrl = process.env.NODE_ENV === 'production' 
      ? `wss://your-websocket-server.com/collaboration`
      : `ws://localhost:1234/collaboration`;
    
    this.provider = new WebsocketProvider(wsUrl, `document-${documentId}`, this.ydoc);
    
    // Supabase Realtime チャンネルに参加
    const channel = supabase?.channel(`collaboration:${documentId}`)
      .on('presence', { event: 'sync' }, () => {
        this.handlePresenceSync();
      })
      .on('presence', { event: 'join' }, ({ key, newPresences }) => {
        this.handleUserJoin(newPresences);
      })
      .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
        this.handleUserLeave(leftPresences);
      })
      .on('broadcast', { event: 'cursor-move' }, (payload) => {
        this.handleCursorMove(payload);
      })
      .on('broadcast', { event: 'selection-change' }, (payload) => {
        this.handleSelectionChange(payload);
      })
      .subscribe();

    // 自分のプレゼンス情報を送信
    await channel?.track({
      user_id: user.id,
      user_name: user.name,
      role: user.role,
      status: 'online',
      joined_at: new Date().toISOString()
    });
  }

  /**
   * セッションを終了
   */
  async endSession(): Promise<void> {
    if (this.provider) {
      this.provider.destroy();
      this.provider = null;
    }
    
    // Supabase チャンネルから離脱
    await supabase?.removeAllChannels();
    
    this.collaborators.clear();
    this.currentUser = null;
  }

  /**
   * テキストを挿入
   */
  insertText(index: number, text: string): void {
    this.ytext.insert(index, text);
    this.broadcastChange('text-insert', { index, text });
  }

  /**
   * テキストを削除
   */
  deleteText(index: number, length: number): void {
    this.ytext.delete(index, length);
    this.broadcastChange('text-delete', { index, length });
  }

  /**
   * テキスト全体を取得
   */
  getText(): string {
    return this.ytext.toString();
  }

  /**
   * テキストを設定（初期化時）
   */
  setText(text: string): void {
    this.ytext.delete(0, this.ytext.length);
    this.ytext.insert(0, text);
  }

  /**
   * カーソル位置を更新
   */
  updateCursor(position: CursorPosition): void {
    if (!this.currentUser) return;

    this.currentUser.cursor = position;
    
    // Supabase Realtime で他のユーザーに通知
    supabase?.channel(`collaboration:document`)
      .send({
        type: 'broadcast',
        event: 'cursor-move',
        payload: {
          userId: this.currentUser.id,
          position
        }
      });
  }

  /**
   * 現在のコラボレーターリストを取得
   */
  getCollaborators(): CollaboratorUser[] {
    return Array.from(this.collaborators.values());
  }

  /**
   * イベントリスナーを追加
   */
  addEventListener(event: string, handler: (...args: any[]) => void): void {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, []);
    }
    this.eventHandlers.get(event)?.push(handler);
  }

  /**
   * イベントリスナーを削除
   */
  removeEventListener(event: string, handler: (...args: any[]) => void): void {
    const handlers = this.eventHandlers.get(event);
    if (handlers) {
      const index = handlers.indexOf(handler);
      if (index > -1) {
        handlers.splice(index, 1);
      }
    }
  }

  /**
   * Yjsイベントリスナーを設定
   */
  private setupEventListeners(): void {
    // テキスト変更イベント
    this.ytext.observe((event) => {
      this.emit('text-change', {
        changes: event.changes,
        origin: event.transaction.origin
      });
    });

    // 文書状態変更イベント
    this.ydoc.on('update', (update, origin) => {
      this.emit('document-update', { update, origin });
    });
  }

  /**
   * プレゼンス同期処理
   */
  private handlePresenceSync(): void {
    const presences = supabase?.channel(`collaboration:document`).presenceState();
    
    if (presences) {
      this.collaborators.clear();
      Object.values(presences).forEach((presence: any) => {
        presence.forEach((user: any) => {
          this.collaborators.set(user.user_id, {
            id: user.user_id,
            name: user.user_name,
            role: user.role,
            status: user.status,
            email: '', // プライバシー保護のため空
            lastSeen: new Date(user.joined_at)
          });
        });
      });
      
      this.emit('collaborators-updated', this.getCollaborators());
    }
  }

  /**
   * ユーザー参加処理
   */
  private handleUserJoin(newPresences: any[]): void {
    newPresences.forEach((presence) => {
      const user: CollaboratorUser = {
        id: presence.user_id,
        name: presence.user_name,
        role: presence.role,
        status: 'online',
        email: '',
        lastSeen: new Date()
      };
      
      this.collaborators.set(user.id, user);
      this.emit('user-joined', user);
    });
    
    this.emit('collaborators-updated', this.getCollaborators());
  }

  /**
   * ユーザー離脱処理
   */
  private handleUserLeave(leftPresences: any[]): void {
    leftPresences.forEach((presence) => {
      const userId = presence.user_id;
      const user = this.collaborators.get(userId);
      
      if (user) {
        this.collaborators.delete(userId);
        this.emit('user-left', user);
      }
    });
    
    this.emit('collaborators-updated', this.getCollaborators());
  }

  /**
   * カーソル移動処理
   */
  private handleCursorMove(payload: any): void {
    const { userId, position } = payload;
    const user = this.collaborators.get(userId);
    
    if (user && userId !== this.currentUser?.id) {
      user.cursor = position;
      this.emit('cursor-moved', { user, position });
    }
  }

  /**
   * 選択範囲変更処理
   */
  private handleSelectionChange(payload: any): void {
    const { userId, selection } = payload;
    this.emit('selection-changed', { userId, selection });
  }

  /**
   * 変更をブロードキャスト
   */
  private broadcastChange(type: string, data: any): void {
    if (!this.currentUser) return;

    const event: RealtimeEvent = {
      type: type as any,
      userId: this.currentUser.id,
      timestamp: new Date(),
      data
    };

    this.emit('change-broadcasted', event);
  }

  /**
   * イベントを発火
   */
  private emit(event: string, data: any): void {
    const handlers = this.eventHandlers.get(event);
    if (handlers) {
      handlers.forEach(handler => handler(data));
    }
  }

  /**
   * 権限チェック
   */
  canUserEdit(userId: string): boolean {
    const user = this.collaborators.get(userId);
    return user?.role === UserRole.OWNER || user?.role === UserRole.EDITOR;
  }

  /**
   * 操作ログを保存
   */
  private async logOperation(operation: string, details: any): Promise<void> {
    if (!this.currentUser) return;

    try {
      await supabase?.from('collaboration_logs').insert({
        document_id: 'current-document', // 実際のドキュメントIDを使用
        user_id: this.currentUser.id,
        operation,
        details,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Failed to log operation:', error);
    }
  }
}

// シングルトンインスタンス
export const realtimeService = new RealtimeCollaborationService();