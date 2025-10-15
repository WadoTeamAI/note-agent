/**
 * コラボレーター一覧コンポーネント
 * アクティブなユーザーとそのカーソル位置を表示
 */

import React from 'react';
import { CollaboratorUser, UserRole } from '../../types/collaboration.types';

interface CollaboratorListProps {
  collaborators: CollaboratorUser[];
  currentUserId?: string;
  showDetails?: boolean;
}

export const CollaboratorList: React.FC<CollaboratorListProps> = ({
  collaborators,
  currentUserId,
  showDetails = true
}) => {
  const getRoleColor = (role: UserRole): string => {
    switch (role) {
      case UserRole.OWNER:
        return 'bg-red-100 text-red-800';
      case UserRole.EDITOR:
        return 'bg-blue-100 text-blue-800';
      case UserRole.REVIEWER:
        return 'bg-green-100 text-green-800';
      case UserRole.VIEWER:
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status: CollaboratorUser['status']): string => {
    switch (status) {
      case 'online':
        return 'bg-green-400';
      case 'away':
        return 'bg-yellow-400';
      case 'offline':
        return 'bg-gray-400';
      default:
        return 'bg-gray-400';
    }
  };

  const getRoleLabel = (role: UserRole): string => {
    switch (role) {
      case UserRole.OWNER:
        return 'オーナー';
      case UserRole.EDITOR:
        return '編集者';
      case UserRole.REVIEWER:
        return 'レビュワー';
      case UserRole.VIEWER:
        return '閲覧者';
      default:
        return '不明';
    }
  };

  const getStatusLabel = (status: CollaboratorUser['status']): string => {
    switch (status) {
      case 'online':
        return 'オンライン';
      case 'away':
        return '離席中';
      case 'offline':
        return 'オフライン';
      default:
        return '不明';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium text-gray-900">
          コラボレーター ({collaborators.length})
        </h3>
        <div className="flex space-x-1">
          {collaborators.slice(0, 5).map((user) => (
            <div
              key={user.id}
              className="relative"
              title={`${user.name} (${getStatusLabel(user.status)})`}
            >
              {user.avatar ? (
                <img
                  src={user.avatar}
                  alt={user.name}
                  className="w-8 h-8 rounded-full border-2 border-white shadow-sm"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white text-sm font-medium">
                  {user.name.charAt(0).toUpperCase()}
                </div>
              )}
              <div
                className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white ${getStatusColor(
                  user.status
                )}`}
              />
            </div>
          ))}
          {collaborators.length > 5 && (
            <div className="w-8 h-8 rounded-full bg-gray-100 border-2 border-white flex items-center justify-center text-gray-600 text-xs font-medium">
              +{collaborators.length - 5}
            </div>
          )}
        </div>
      </div>

      {showDetails && (
        <div className="space-y-3">
          {collaborators.map((user) => (
            <div
              key={user.id}
              className={`flex items-center justify-between p-3 rounded-lg transition-colors ${
                user.id === currentUserId ? 'bg-blue-50 border border-blue-200' : 'hover:bg-gray-50'
              }`}
            >
              <div className="flex items-center space-x-3">
                <div className="relative">
                  {user.avatar ? (
                    <img
                      src={user.avatar}
                      alt={user.name}
                      className="w-10 h-10 rounded-full"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-medium">
                      {user.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div
                    className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white ${getStatusColor(
                      user.status
                    )}`}
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {user.name}
                      {user.id === currentUserId && (
                        <span className="text-blue-600 ml-1">(あなた)</span>
                      )}
                    </p>
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getRoleColor(
                        user.role
                      )}`}
                    >
                      {getRoleLabel(user.role)}
                    </span>
                  </div>
                  <div className="flex items-center space-x-4 mt-1">
                    <p className="text-xs text-gray-500">{getStatusLabel(user.status)}</p>
                    {user.cursor && (
                      <p className="text-xs text-gray-500">
                        行 {user.cursor.line}, 列 {user.cursor.column}
                      </p>
                    )}
                    <p className="text-xs text-gray-500">
                      最終: {user.lastSeen.toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              </div>

              {user.status === 'online' && user.cursor && (
                <div className="text-xs text-gray-500">
                  編集中
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {collaborators.length === 0 && (
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
              d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z"
            />
          </svg>
          <p className="mt-2 text-sm">コラボレーターはまだいません</p>
        </div>
      )}
    </div>
  );
};