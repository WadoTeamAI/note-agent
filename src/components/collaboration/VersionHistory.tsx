/**
 * バージョン履歴コンポーネント
 * 文書の変更履歴とバージョン管理機能
 */

import React, { useState } from 'react';
import { DocumentVersion, ApprovalStatus, ChangeLog } from '../../types/collaboration.types';

interface VersionHistoryProps {
  versions: DocumentVersion[];
  changeHistory: ChangeLog[];
  currentVersionId?: string;
  onRestoreVersion: (versionId: string) => Promise<void>;
  onPublishVersion: (versionId: string) => Promise<void>;
  onDeleteVersion: (versionId: string) => Promise<void>;
  onViewDiff: (versionId1: string, versionId2: string) => void;
  canEdit: boolean;
  canPublish: boolean;
}

export const VersionHistory: React.FC<VersionHistoryProps> = ({
  versions,
  changeHistory,
  currentVersionId,
  onRestoreVersion,
  onPublishVersion,
  onDeleteVersion,
  onViewDiff,
  canEdit,
  canPublish
}) => {
  const [selectedVersions, setSelectedVersions] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<'versions' | 'changes'>('versions');
  const [isLoading, setIsLoading] = useState(false);

  const handleVersionSelect = (versionId: string) => {
    if (selectedVersions.includes(versionId)) {
      setSelectedVersions(selectedVersions.filter(id => id !== versionId));
    } else if (selectedVersions.length < 2) {
      setSelectedVersions([...selectedVersions, versionId]);
    } else {
      setSelectedVersions([selectedVersions[1], versionId]);
    }
  };

  const handleRestore = async (versionId: string) => {
    if (!confirm('このバージョンを復元しますか？')) return;

    setIsLoading(true);
    try {
      await onRestoreVersion(versionId);
    } catch (error) {
      console.error('Failed to restore version:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePublish = async (versionId: string) => {
    if (!confirm('このバージョンを公開しますか？')) return;

    setIsLoading(true);
    try {
      await onPublishVersion(versionId);
    } catch (error) {
      console.error('Failed to publish version:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (versionId: string) => {
    if (!confirm('このバージョンを削除しますか？この操作は取り消せません。')) return;

    setIsLoading(true);
    try {
      await onDeleteVersion(versionId);
    } catch (error) {
      console.error('Failed to delete version:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = (status: ApprovalStatus): string => {
    switch (status) {
      case ApprovalStatus.PUBLISHED:
        return 'bg-green-100 text-green-800';
      case ApprovalStatus.APPROVED:
        return 'bg-blue-100 text-blue-800';
      case ApprovalStatus.PENDING:
        return 'bg-yellow-100 text-yellow-800';
      case ApprovalStatus.REJECTED:
        return 'bg-red-100 text-red-800';
      case ApprovalStatus.DRAFT:
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: ApprovalStatus): string => {
    switch (status) {
      case ApprovalStatus.PUBLISHED:
        return '公開済み';
      case ApprovalStatus.APPROVED:
        return '承認済み';
      case ApprovalStatus.PENDING:
        return '承認待ち';
      case ApprovalStatus.REJECTED:
        return '却下';
      case ApprovalStatus.DRAFT:
      default:
        return '下書き';
    }
  };

  const getActionIcon = (action: ChangeLog['action']): string => {
    switch (action) {
      case 'edit':
        return '✏️';
      case 'comment':
        return '💬';
      case 'approve':
        return '✅';
      case 'reject':
        return '❌';
      case 'publish':
        return '🚀';
      case 'invite':
        return '👥';
      case 'leave':
        return '👋';
      default:
        return '📝';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      {/* タブヘッダー */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8 px-6" aria-label="Tabs">
          {[
            { id: 'versions', label: 'バージョン履歴', count: versions.length },
            { id: 'changes', label: '変更履歴', count: changeHistory.length }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as 'versions' | 'changes')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-200'
              }`}
            >
              {tab.label}
              <span className="ml-2 py-0.5 px-2 rounded-full text-xs bg-gray-100 text-gray-600">
                {tab.count}
              </span>
            </button>
          ))}
        </nav>
      </div>

      <div className="p-6">
        {activeTab === 'versions' && (
          <div className="space-y-4">
            {/* 比較ボタン */}
            {selectedVersions.length === 2 && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-blue-800">
                    2つのバージョンが選択されています
                  </p>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => onViewDiff(selectedVersions[0], selectedVersions[1])}
                      className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
                    >
                      差分を表示
                    </button>
                    <button
                      onClick={() => setSelectedVersions([])}
                      className="px-3 py-1 bg-gray-200 text-gray-700 text-sm rounded hover:bg-gray-300"
                    >
                      選択解除
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* バージョン一覧 */}
            <div className="space-y-3">
              {versions.map((version) => (
                <div
                  key={version.id}
                  className={`border rounded-lg p-4 transition-colors ${
                    version.id === currentVersionId
                      ? 'border-blue-500 bg-blue-50'
                      : selectedVersions.includes(version.id)
                      ? 'border-purple-500 bg-purple-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3">
                      <input
                        type="checkbox"
                        checked={selectedVersions.includes(version.id)}
                        onChange={() => handleVersionSelect(version.id)}
                        className="mt-1 h-4 w-4 text-blue-600 border-gray-300 rounded"
                      />
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <h4 className="text-sm font-medium text-gray-900">{version.title}</h4>
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
                              version.approvalStatus
                            )}`}
                          >
                            {getStatusLabel(version.approvalStatus)}
                          </span>
                          {version.isPublished && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              公開中
                            </span>
                          )}
                          {version.id === currentVersionId && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              現在
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 mt-1">{version.changeDescription}</p>
                        <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                          <span>作成者: {version.authorName}</span>
                          <span>{version.createdAt.toLocaleString()}</span>
                          {version.approvers.length > 0 && (
                            <span>承認者: {version.approvers.length}名</span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      {canEdit && version.id !== currentVersionId && (
                        <button
                          onClick={() => handleRestore(version.id)}
                          disabled={isLoading}
                          className="p-1 text-gray-400 hover:text-blue-600 rounded"
                          title="復元"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                          </svg>
                        </button>
                      )}

                      {canPublish && version.approvalStatus === ApprovalStatus.APPROVED && !version.isPublished && (
                        <button
                          onClick={() => handlePublish(version.id)}
                          disabled={isLoading}
                          className="p-1 text-gray-400 hover:text-green-600 rounded"
                          title="公開"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                          </svg>
                        </button>
                      )}

                      {canEdit && !version.isPublished && version.changeDescription !== '自動保存' && (
                        <button
                          onClick={() => handleDelete(version.id)}
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
                </div>
              ))}
            </div>

            {versions.length === 0 && (
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
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
                <p className="mt-2 text-sm">バージョン履歴はありません</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'changes' && (
          <div className="space-y-3">
            {changeHistory.map((change) => (
              <div key={change.id} className="flex items-start space-x-3 p-3 rounded-lg hover:bg-gray-50">
                <div className="text-lg">{getActionIcon(change.action)}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2">
                    <p className="text-sm font-medium text-gray-900">{change.userName}</p>
                    <p className="text-xs text-gray-500">{change.timestamp.toLocaleString()}</p>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">{change.description}</p>
                  {change.metadata && (
                    <div className="text-xs text-gray-500 mt-1">
                      {JSON.stringify(change.metadata, null, 2)}
                    </div>
                  )}
                </div>
              </div>
            ))}

            {changeHistory.length === 0 && (
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
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <p className="mt-2 text-sm">変更履歴はありません</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};