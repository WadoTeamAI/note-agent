/**
 * コメントスレッドコンポーネント
 * コメントの表示、返信、解決機能
 */

import React, { useState } from 'react';
import { Comment, CommentReply, CollaboratorUser } from '../../types/collaboration.types';

interface CommentThreadProps {
  comment: Comment;
  currentUser: CollaboratorUser;
  onReply: (commentId: string, content: string) => Promise<void>;
  onResolve: (commentId: string) => Promise<void>;
  onUpdate: (commentId: string, content: string) => Promise<void>;
  onDelete: (commentId: string) => Promise<void>;
  isHighlighted?: boolean;
}

export const CommentThread: React.FC<CommentThreadProps> = ({
  comment,
  currentUser,
  onReply,
  onResolve,
  onUpdate,
  onDelete,
  isHighlighted = false
}) => {
  const [isReplying, setIsReplying] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [replyContent, setReplyContent] = useState('');
  const [editContent, setEditContent] = useState(comment.content);
  const [isLoading, setIsLoading] = useState(false);

  const handleReply = async () => {
    if (!replyContent.trim()) return;

    setIsLoading(true);
    try {
      await onReply(comment.id, replyContent);
      setReplyContent('');
      setIsReplying(false);
    } catch (error) {
      console.error('Failed to reply:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdate = async () => {
    if (!editContent.trim() || editContent === comment.content) {
      setIsEditing(false);
      return;
    }

    setIsLoading(true);
    try {
      await onUpdate(comment.id, editContent);
      setIsEditing(false);
    } catch (error) {
      console.error('Failed to update comment:', error);
      setEditContent(comment.content);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResolve = async () => {
    setIsLoading(true);
    try {
      await onResolve(comment.id);
    } catch (error) {
      console.error('Failed to resolve comment:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('このコメントを削除しますか？')) return;

    setIsLoading(true);
    try {
      await onDelete(comment.id);
    } catch (error) {
      console.error('Failed to delete comment:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const canEdit = currentUser.id === comment.authorId;
  const canResolve = currentUser.role === 'owner' || currentUser.role === 'editor' || canEdit;

  return (
    <div
      className={`bg-white rounded-lg border shadow-sm p-4 ${
        isHighlighted ? 'border-blue-500 shadow-blue-100' : 'border-gray-200'
      } ${comment.status === 'resolved' ? 'opacity-75' : ''}`}
    >
      {/* メインコメント */}
      <div className="flex items-start space-x-3">
        <div className="flex-shrink-0">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white text-sm font-medium">
            {comment.authorName.charAt(0).toUpperCase()}
          </div>
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <p className="text-sm font-medium text-gray-900">{comment.authorName}</p>
              <p className="text-xs text-gray-500">
                {comment.createdAt.toLocaleString()}
              </p>
              {comment.status === 'resolved' && (
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  解決済み
                </span>
              )}
            </div>
            
            <div className="flex items-center space-x-1">
              {canEdit && (
                <button
                  onClick={() => setIsEditing(!isEditing)}
                  className="p-1 text-gray-400 hover:text-gray-600 rounded"
                  title="編集"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </button>
              )}
              
              {canResolve && comment.status === 'open' && (
                <button
                  onClick={handleResolve}
                  disabled={isLoading}
                  className="p-1 text-gray-400 hover:text-green-600 rounded"
                  title="解決済みにする"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </button>
              )}
              
              {canEdit && (
                <button
                  onClick={handleDelete}
                  disabled={isLoading}
                  className="p-1 text-gray-400 hover:text-red-600 rounded"
                  title="削除"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              )}
            </div>
          </div>

          {/* 引用されたテキスト */}
          {comment.position.text && (
            <div className="mt-2 p-2 bg-gray-50 border-l-4 border-blue-500 rounded">
              <p className="text-sm text-gray-600 italic">
                &quot;{comment.position.text}&quot;
              </p>
              <p className="text-xs text-gray-500 mt-1">
                行 {comment.position.line}, 列 {comment.position.column}
              </p>
            </div>
          )}

          {/* コメント内容 */}
          <div className="mt-2">
            {isEditing ? (
              <div className="space-y-2">
                <textarea
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-md resize-none"
                  rows={3}
                  placeholder="コメントを編集..."
                />
                <div className="flex space-x-2">
                  <button
                    onClick={handleUpdate}
                    disabled={isLoading || !editContent.trim()}
                    className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 disabled:opacity-50"
                  >
                    更新
                  </button>
                  <button
                    onClick={() => {
                      setIsEditing(false);
                      setEditContent(comment.content);
                    }}
                    className="px-3 py-1 bg-gray-200 text-gray-700 text-sm rounded hover:bg-gray-300"
                  >
                    キャンセル
                  </button>
                </div>
              </div>
            ) : (
              <p className="text-sm text-gray-900 whitespace-pre-wrap">{comment.content}</p>
            )}
          </div>

          {/* 返信一覧 */}
          {(comment.thread || []).length > 0 && (
            <div className="mt-4 space-y-3 border-l-2 border-gray-200 pl-4">
              {(comment.thread || []).map((reply) => (
                <div key={reply.id} className="flex items-start space-x-3">
                  <div className="flex-shrink-0">
                    <div className="w-6 h-6 rounded-full bg-gradient-to-br from-green-400 to-blue-500 flex items-center justify-center text-white text-xs font-medium">
                      {reply.authorName.charAt(0).toUpperCase()}
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2">
                      <p className="text-sm font-medium text-gray-900">{reply.authorName}</p>
                      <p className="text-xs text-gray-500">
                        {reply.createdAt.toLocaleString()}
                      </p>
                    </div>
                    <p className="text-sm text-gray-700 mt-1 whitespace-pre-wrap">{reply.content}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* 返信フォーム */}
          {comment.status === 'open' && (
            <div className="mt-4">
              {isReplying ? (
                <div className="space-y-2">
                  <textarea
                    value={replyContent}
                    onChange={(e) => setReplyContent(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-md resize-none"
                    rows={2}
                    placeholder="返信を入力..."
                  />
                  <div className="flex space-x-2">
                    <button
                      onClick={handleReply}
                      disabled={isLoading || !replyContent.trim()}
                      className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 disabled:opacity-50"
                    >
                      返信
                    </button>
                    <button
                      onClick={() => {
                        setIsReplying(false);
                        setReplyContent('');
                      }}
                      className="px-3 py-1 bg-gray-200 text-gray-700 text-sm rounded hover:bg-gray-300"
                    >
                      キャンセル
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setIsReplying(true)}
                  className="text-sm text-blue-600 hover:text-blue-800"
                >
                  返信
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};