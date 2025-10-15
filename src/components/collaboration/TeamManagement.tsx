/**
 * チーム管理コンポーネント
 * メンバー管理、権限設定、招待機能
 */

import React, { useState } from 'react';
import { Team, CollaboratorUser, UserRole, Permission } from '../../types/collaboration.types';

interface TeamManagementProps {
  team: Team;
  currentUser: CollaboratorUser;
  userPermissions: Permission;
  onInviteMember: (email: string, role: UserRole) => Promise<void>;
  onUpdateMemberRole: (userId: string, newRole: UserRole) => Promise<void>;
  onRemoveMember: (userId: string) => Promise<void>;
  onUpdateTeamSettings: (settings: Partial<Team['settings']>) => Promise<void>;
}

export const TeamManagement: React.FC<TeamManagementProps> = ({
  team,
  currentUser,
  userPermissions,
  onInviteMember,
  onUpdateMemberRole,
  onRemoveMember,
  onUpdateTeamSettings
}) => {
  const [activeTab, setActiveTab] = useState<'members' | 'settings'>('members');
  const [isInviting, setIsInviting] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<UserRole>(UserRole.VIEWER);
  const [isLoading, setIsLoading] = useState(false);

  const handleInvite = async () => {
    if (!inviteEmail.trim()) return;

    setIsLoading(true);
    try {
      await onInviteMember(inviteEmail, inviteRole);
      setInviteEmail('');
      setInviteRole(UserRole.VIEWER);
      setIsInviting(false);
    } catch (error) {
      console.error('Failed to invite member:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRoleChange = async (userId: string, newRole: UserRole) => {
    setIsLoading(true);
    try {
      await onUpdateMemberRole(userId, newRole);
    } catch (error) {
      console.error('Failed to update role:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveMember = async (userId: string, userName: string) => {
    if (!confirm(`${userName}をチームから削除しますか？`)) return;

    setIsLoading(true);
    try {
      await onRemoveMember(userId);
    } catch (error) {
      console.error('Failed to remove member:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSettingsUpdate = async (key: keyof Team['settings'], value: any) => {
    setIsLoading(true);
    try {
      await onUpdateTeamSettings({ [key]: value });
    } catch (error) {
      console.error('Failed to update settings:', error);
    } finally {
      setIsLoading(false);
    }
  };

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

  const canChangeRole = (targetRole: UserRole): boolean => {
    // オーナーは全ての役割を変更可能
    if (currentUser.role === UserRole.OWNER) return true;
    // 編集者はオーナー以外の役割を変更可能
    if (currentUser.role === UserRole.EDITOR && targetRole !== UserRole.OWNER) return true;
    return false;
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      {/* ヘッダー */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-medium text-gray-900">{team.name}</h2>
            <p className="text-sm text-gray-600">{team.description}</p>
          </div>
          {userPermissions.canInvite && (
            <button
              onClick={() => setIsInviting(true)}
              className="px-4 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700"
            >
              メンバーを招待
            </button>
          )}
        </div>
      </div>

      {/* タブナビゲーション */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8 px-6" aria-label="Tabs">
          {[
            { id: 'members', label: 'メンバー', count: team.members.length },
            { id: 'settings', label: '設定' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as 'members' | 'settings')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-200'
              }`}
            >
              {tab.label}
              {tab.count && (
                <span className="ml-2 py-0.5 px-2 rounded-full text-xs bg-gray-100 text-gray-600">
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </nav>
      </div>

      <div className="p-6">
        {activeTab === 'members' && (
          <div className="space-y-4">
            {/* メンバー一覧 */}
            <div className="space-y-3">
              {team.members.map((member) => (
                <div
                  key={member.id}
                  className="flex items-center justify-between p-4 border border-gray-200 rounded-lg"
                >
                  <div className="flex items-center space-x-3">
                    <div className="flex-shrink-0">
                      {member.avatar ? (
                        <img
                          src={member.avatar}
                          alt={member.name}
                          className="w-10 h-10 rounded-full"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-medium">
                          {member.name.charAt(0).toUpperCase()}
                        </div>
                      )}
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <p className="text-sm font-medium text-gray-900">
                          {member.name}
                          {member.id === currentUser.id && (
                            <span className="text-blue-600 ml-1">(あなた)</span>
                          )}
                        </p>
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getRoleColor(
                            member.role
                          )}`}
                        >
                          {getRoleLabel(member.role)}
                        </span>
                      </div>
                      <p className="text-sm text-gray-500">{member.email}</p>
                      <p className="text-xs text-gray-400">
                        最終ログイン: {member.lastSeen.toLocaleString()}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    {/* 役割変更 */}
                    {userPermissions.canChangeSettings && member.id !== currentUser.id && (
                      <select
                        value={member.role}
                        onChange={(e) => handleRoleChange(member.id, e.target.value as UserRole)}
                        disabled={isLoading || !canChangeRole(member.role)}
                        className="text-sm border border-gray-300 rounded px-2 py-1"
                      >
                        <option value={UserRole.VIEWER}>閲覧者</option>
                        <option value={UserRole.REVIEWER}>レビュワー</option>
                        <option value={UserRole.EDITOR}>編集者</option>
                        {currentUser.role === UserRole.OWNER && (
                          <option value={UserRole.OWNER}>オーナー</option>
                        )}
                      </select>
                    )}

                    {/* 削除ボタン */}
                    {(userPermissions.canChangeSettings || member.id === currentUser.id) && 
                     member.role !== UserRole.OWNER && (
                      <button
                        onClick={() => handleRemoveMember(member.id, member.name)}
                        disabled={isLoading}
                        className="p-1 text-gray-400 hover:text-red-600 rounded"
                        title={member.id === currentUser.id ? 'チームから脱退' : 'メンバーを削除'}
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'settings' && userPermissions.canChangeSettings && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 gap-6">
              {/* 基本設定 */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-900">基本設定</h3>
                
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-sm font-medium text-gray-700">
                      パブリック参加を許可
                    </label>
                    <p className="text-sm text-gray-500">
                      リンクを知っている人がチームに参加できるようになります
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={team.settings.allowPublicJoin}
                    onChange={(e) => handleSettingsUpdate('allowPublicJoin', e.target.checked)}
                    className="h-4 w-4 text-blue-600 border-gray-300 rounded"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-sm font-medium text-gray-700">
                      公開時に承認が必要
                    </label>
                    <p className="text-sm text-gray-500">
                      文書を公開する前に承認プロセスを要求します
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={team.settings.requireApprovalForPublish}
                    onChange={(e) => handleSettingsUpdate('requireApprovalForPublish', e.target.checked)}
                    className="h-4 w-4 text-blue-600 border-gray-300 rounded"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-sm font-medium text-gray-700">
                      コメントを有効化
                    </label>
                    <p className="text-sm text-gray-500">
                      メンバーが文書にコメントできるようになります
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={team.settings.enableComments}
                    onChange={(e) => handleSettingsUpdate('enableComments', e.target.checked)}
                    className="h-4 w-4 text-blue-600 border-gray-300 rounded"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-sm font-medium text-gray-700">
                      バージョン履歴を有効化
                    </label>
                    <p className="text-sm text-gray-500">
                      文書の変更履歴を保存します
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={team.settings.enableVersionHistory}
                    onChange={(e) => handleSettingsUpdate('enableVersionHistory', e.target.checked)}
                    className="h-4 w-4 text-blue-600 border-gray-300 rounded"
                  />
                </div>
              </div>

              {/* 承認設定 */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-900">承認設定</h3>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    承認に必要な人数
                  </label>
                  <select
                    value={team.settings.approvalThreshold}
                    onChange={(e) => handleSettingsUpdate('approvalThreshold', parseInt(e.target.value))}
                    className="w-32 border border-gray-300 rounded-md px-3 py-2 text-sm"
                  >
                    {[1, 2, 3, 4, 5].map(num => (
                      <option key={num} value={num}>{num}人</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    新メンバーのデフォルト役割
                  </label>
                  <select
                    value={team.settings.defaultRole}
                    onChange={(e) => handleSettingsUpdate('defaultRole', e.target.value as UserRole)}
                    className="w-32 border border-gray-300 rounded-md px-3 py-2 text-sm"
                  >
                    <option value={UserRole.VIEWER}>閲覧者</option>
                    <option value={UserRole.REVIEWER}>レビュワー</option>
                    <option value={UserRole.EDITOR}>編集者</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 招待モーダル */}
      {isInviting && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-medium text-gray-900 mb-4">メンバーを招待</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  メールアドレス
                </label>
                <input
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                  placeholder="user@example.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  役割
                </label>
                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value as UserRole)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                >
                  <option value={UserRole.VIEWER}>閲覧者</option>
                  <option value={UserRole.REVIEWER}>レビュワー</option>
                  <option value={UserRole.EDITOR}>編集者</option>
                  {currentUser.role === UserRole.OWNER && (
                    <option value={UserRole.OWNER}>オーナー</option>
                  )}
                </select>
              </div>
            </div>

            <div className="flex space-x-3 mt-6">
              <button
                onClick={handleInvite}
                disabled={isLoading || !inviteEmail.trim()}
                className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                招待を送信
              </button>
              <button
                onClick={() => {
                  setIsInviting(false);
                  setInviteEmail('');
                  setInviteRole(UserRole.VIEWER);
                }}
                className="flex-1 bg-gray-200 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-300"
              >
                キャンセル
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};