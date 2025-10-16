/**
 * コラボレーション機能の型定義（Phase 2.5）
 */

// ユーザー情報
export interface CollaboratorUser {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  role: UserRole;
  status: 'online' | 'offline' | 'away';
  cursor?: CursorPosition;
  lastSeen: Date;
}

// ユーザーロール
export enum UserRole {
  OWNER = 'owner',        // オーナー（すべての権限）
  EDITOR = 'editor',      // 編集者（編集・コメント可能）
  REVIEWER = 'reviewer',  // レビュワー（コメントのみ）
  VIEWER = 'viewer'       // 閲覧者（読み取り専用）
}

// カーソル位置
export interface CursorPosition {
  line: number;
  column: number;
  selection?: {
    start: { line: number; column: number };
    end: { line: number; column: number };
  };
}

// コメント
export interface Comment {
  id: string;
  content: string;
  authorId: string;
  authorName: string;
  createdAt: Date;
  updatedAt: Date;
  position: {
    line: number;
    column: number;
    text?: string; // 引用されたテキスト
  };
  thread: CommentReply[];
  status: 'open' | 'resolved';
  tags?: string[];
}

// コメント返信
export interface CommentReply {
  id: string;
  content: string;
  authorId: string;
  authorName: string;
  createdAt: Date;
}

// 文書バージョン
export interface DocumentVersion {
  id: string;
  content: string;
  title: string;
  authorId: string;
  authorName: string;
  createdAt: Date;
  changeDescription: string;
  isPublished: boolean;
  approvalStatus: ApprovalStatus;
  approvers: ApprovalRecord[];
}

// 承認状態
export enum ApprovalStatus {
  DRAFT = 'draft',           // 下書き
  PENDING = 'pending',       // 承認待ち
  APPROVED = 'approved',     // 承認済み
  REJECTED = 'rejected',     // 却下
  PUBLISHED = 'published'    // 公開済み
}

// 承認記録
export interface ApprovalRecord {
  approverId: string;
  approverName: string;
  status: 'approved' | 'rejected' | 'pending';
  comment?: string;
  timestamp: Date;
}

// チーム
export interface Team {
  id: string;
  name: string;
  description?: string;
  members: CollaboratorUser[];
  createdAt: Date;
  settings: TeamSettings;
}

// チーム設定
export interface TeamSettings {
  allowPublicJoin: boolean;
  requireApprovalForPublish: boolean;
  defaultRole: UserRole;
  approvalThreshold: number; // 承認に必要な人数
  enableComments: boolean;
  enableVersionHistory: boolean;
}

// リアルタイム編集イベント
export interface RealtimeEvent {
  type: 'text-change' | 'cursor-move' | 'user-join' | 'user-leave' | 'comment-add' | 'comment-update';
  userId: string;
  timestamp: Date;
  data: any;
}

// コラボレーションセッション
export interface CollaborationSession {
  documentId: string;
  users: CollaboratorUser[];
  comments: Comment[];
  currentVersion: DocumentVersion;
  versions: DocumentVersion[];
  settings: SessionSettings;
}

// セッション設定
export interface SessionSettings {
  allowGuestAccess: boolean;
  lockDocument: boolean;
  autoSave: boolean;
  autoSaveInterval: number; // 秒
  showCursors: boolean;
  showComments: boolean;
}

// 権限チェック
export interface Permission {
  canEdit: boolean;
  canComment: boolean;
  canApprove: boolean;
  canInvite: boolean;
  canChangeSettings: boolean;
  canDelete: boolean;
  canPublish: boolean;
}

// 通知
export interface Notification {
  id: string;
  type: 'comment' | 'approval-request' | 'approval-granted' | 'approval-rejected' | 'mention' | 'team-invitation' | 'role-changed';
  title: string;
  message: string;
  documentId?: string;
  userId: string;
  isRead: boolean;
  createdAt: Date;
  actionUrl?: string;
}

// 変更ログ
export interface ChangeLog {
  id: string;
  documentId: string;
  userId: string;
  userName: string;
  action: 'edit' | 'comment' | 'approve' | 'reject' | 'publish' | 'invite' | 'leave';
  description: string;
  timestamp: Date;
  metadata?: any;
}