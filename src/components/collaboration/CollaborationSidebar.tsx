/**
 * コラボレーションサイドバー
 * コラボレーターリスト、コメント、バージョン履歴を統合
 */

import React, { useState } from 'react';
import { CollaboratorList } from './CollaboratorList';
import { CommentThread } from './CommentThread';
import { VersionHistory } from './VersionHistory';
import { TeamManagement } from './TeamManagement';
import { 
  CollaboratorUser, 
  Comment, 
  DocumentVersion, 
  ChangeLog, 
  Team, 
  Permission 
} from '../../types/collaboration.types';

interface CollaborationSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  activeTab: 'collaborators' | 'comments' | 'versions' | 'team';
  onTabChange: (tab: 'collaborators' | 'comments' | 'versions' | 'team') => void;
  
  // コラボレーター関連
  collaborators: CollaboratorUser[];
  currentUser: CollaboratorUser;
  
  // コメント関連
  comments: Comment[];
  onAddComment: (content: string, position: { line: number; column: number; text?: string }) => Promise<void>;
  onReplyToComment: (commentId: string, content: string) => Promise<void>;
  onUpdateComment: (commentId: string, content: string) => Promise<void>;
  onDeleteComment: (commentId: string) => Promise<void>;
  onResolveComment: (commentId: string) => Promise<void>;
  
  // バージョン関連
  versions: DocumentVersion[];
  changeHistory: ChangeLog[];
  currentVersionId?: string;
  onRestoreVersion: (versionId: string) => Promise<void>;
  onPublishVersion: (versionId: string) => Promise<void>;
  onDeleteVersion: (versionId: string) => Promise<void>;
  onViewDiff: (versionId1: string, versionId2: string) => void;
  
  // チーム関連
  team?: Team;
  userPermissions: Permission;
  onInviteMember?: (email: string, role: any) => Promise<void>;
  onUpdateMemberRole?: (userId: string, newRole: any) => Promise<void>;
  onRemoveMember?: (userId: string) => Promise<void>;
  onUpdateTeamSettings?: (settings: any) => Promise<void>;
}

export const CollaborationSidebar: React.FC<CollaborationSidebarProps> = ({
  isOpen,
  onClose,
  activeTab,
  onTabChange,
  collaborators,
  currentUser,
  comments,
  onAddComment,
  onReplyToComment,
  onUpdateComment,
  onDeleteComment,
  onResolveComment,
  versions,
  changeHistory,
  currentVersionId,
  onRestoreVersion,
  onPublishVersion,
  onDeleteVersion,
  onViewDiff,
  team,
  userPermissions,
  onInviteMember,
  onUpdateMemberRole,
  onRemoveMember,
  onUpdateTeamSettings
}) => {
  const [newCommentPosition, setNewCommentPosition] = useState<{
    line: number;
    column: number;
    text?: string;
  } | null>(null);
  const [newCommentContent, setNewCommentContent] = useState('');

  type TabId = 'collaborators' | 'comments' | 'versions' | 'team';
  
  const tabs: Array<{
    id: TabId;
    label: string;
    icon: React.ReactNode;
    count: number;
  }> = [
    {
      id: 'collaborators' as const,
      label: 'メンバー',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
        </svg>
      ),
      count: collaborators.length
    },
    {
      id: 'comments' as const,
      label: 'コメント',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
      ),
      count: comments.filter(c => c.status === 'open').length
    },
    {
      id: 'versions' as const,
      label: '履歴',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      count: versions.length
    }
  ];

  if (team && userPermissions.canChangeSettings) {
    tabs.push({
      id: 'team' as const,
      label: 'チーム',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ),
      count: team.members.length
    });
  }

  const handleAddComment = async () => {
    if (!newCommentContent.trim() || !newCommentPosition) return;

    try {
      await onAddComment(newCommentContent, newCommentPosition);
      setNewCommentContent('');
      setNewCommentPosition(null);
    } catch (error) {
      console.error('Failed to add comment:', error);
    }
  };

  return (
    <>
      {/* オーバーレイ */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* サイドバー */}
      <div
        className={`fixed right-0 top-0 h-full w-80 bg-white border-l border-gray-200 z-50 transform transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        } lg:translate-x-0 lg:static lg:w-96`}
      >
        {/* ヘッダー */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">コラボレーション</h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 lg:hidden"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* タブナビゲーション */}
        <div className="border-b border-gray-200">
          <nav className="flex overflow-x-auto" aria-label="Tabs">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className={`flex items-center space-x-2 px-4 py-3 text-sm font-medium border-b-2 whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-200'
                }`}
              >
                {tab.icon}
                <span>{tab.label}</span>
                {tab.count > 0 && (
                  <span className="bg-gray-100 text-gray-600 py-0.5 px-2 rounded-full text-xs">
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </nav>
        </div>

        {/* コンテンツエリア */}
        <div className="flex-1 overflow-y-auto p-4">
          {activeTab === 'collaborators' && (
            <CollaboratorList
              collaborators={collaborators}
              currentUserId={currentUser.id}
              showDetails={true}
            />
          )}

          {activeTab === 'comments' && (
            <div className="space-y-6">
              {/* 新しいコメントフォーム */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="text-sm font-medium text-blue-900 mb-3">新しいコメント</h3>
                <div className="space-y-3">
                  <div className="flex space-x-2 text-xs">
                    <input
                      type="number"
                      placeholder="行"
                      value={newCommentPosition?.line || ''}
                      onChange={(e) => setNewCommentPosition({
                        ...newCommentPosition,
                        line: parseInt(e.target.value) || 0,
                        column: newCommentPosition?.column || 0
                      })}
                      className="w-16 px-2 py-1 border border-blue-300 rounded"
                    />
                    <input
                      type="number"
                      placeholder="列"
                      value={newCommentPosition?.column || ''}
                      onChange={(e) => setNewCommentPosition({
                        ...newCommentPosition,
                        line: newCommentPosition?.line || 0,
                        column: parseInt(e.target.value) || 0
                      })}
                      className="w-16 px-2 py-1 border border-blue-300 rounded"
                    />
                  </div>
                  <textarea
                    value={newCommentContent}
                    onChange={(e) => setNewCommentContent(e.target.value)}
                    placeholder="コメントを入力..."
                    className="w-full p-2 border border-blue-300 rounded-md resize-none"
                    rows={3}
                  />
                  <button
                    onClick={handleAddComment}
                    disabled={!newCommentContent.trim() || !newCommentPosition}
                    className="w-full px-3 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 disabled:opacity-50"
                  >
                    コメントを追加
                  </button>
                </div>
              </div>

              {/* コメント一覧 */}
              <div className="space-y-4">
                {comments.map((comment) => (
                  <CommentThread
                    key={comment.id}
                    comment={comment}
                    currentUser={currentUser}
                    onReply={onReplyToComment}
                    onUpdate={onUpdateComment}
                    onDelete={onDeleteComment}
                    onResolve={onResolveComment}
                  />
                ))}
                
                {comments.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <svg
                      className="mx-auto h-12 w-12 text-gray-400"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                      />
                    </svg>
                    <p className="mt-2 text-sm">コメントはまだありません</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'versions' && (
            <VersionHistory
              versions={versions}
              changeHistory={changeHistory}
              currentVersionId={currentVersionId}
              onRestoreVersion={onRestoreVersion}
              onPublishVersion={onPublishVersion}
              onDeleteVersion={onDeleteVersion}
              onViewDiff={onViewDiff}
              canEdit={userPermissions.canEdit}
              canPublish={userPermissions.canPublish}
            />
          )}

          {activeTab === 'team' && team && (
            <TeamManagement
              team={team}
              currentUser={currentUser}
              userPermissions={userPermissions}
              onInviteMember={onInviteMember!}
              onUpdateMemberRole={onUpdateMemberRole!}
              onRemoveMember={onRemoveMember!}
              onUpdateTeamSettings={onUpdateTeamSettings!}
            />
          )}
        </div>
      </div>
    </>
  );
};