import React, { useState, useEffect } from 'react';
import { DraftListItem, DraftStatus } from '../../types/draft.types';
import { getDraftList, deleteDraft, cleanupOldDrafts } from '../../services/storage/localStorageService';

interface DraftListProps {
  onLoadDraft: (draftId: string) => void;
  onClose: () => void;
  isOpen: boolean;
}

const DraftList: React.FC<DraftListProps> = ({ onLoadDraft, onClose, isOpen }) => {
  const [drafts, setDrafts] = useState<DraftListItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<'all' | DraftStatus>('all');

  useEffect(() => {
    if (isOpen) {
      loadDrafts();
      // 古い下書きを自動削除
      cleanupOldDrafts();
    }
  }, [isOpen]);

  const loadDrafts = () => {
    const allDrafts = getDraftList();
    setDrafts(allDrafts);
  };

  const handleDelete = (draftId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    if (confirm('この下書きを削除しますか？')) {
      deleteDraft(draftId);
      loadDrafts();
    }
  };

  const handleLoad = (draftId: string) => {
    onLoadDraft(draftId);
    onClose();
  };

  const getStatusIcon = (status: DraftStatus) => {
    switch (status) {
      case DraftStatus.COMPLETED:
        return <span className="text-green-500">✓</span>;
      case DraftStatus.IN_PROGRESS:
        return <span className="text-blue-500">●</span>;
      case DraftStatus.ERROR:
        return <span className="text-red-500">✗</span>;
      case DraftStatus.SAVED_MANUALLY:
        return <span className="text-gray-500">📄</span>;
      default:
        return null;
    }
  };

  const getStatusLabel = (status: DraftStatus) => {
    switch (status) {
      case DraftStatus.COMPLETED:
        return '完了';
      case DraftStatus.IN_PROGRESS:
        return '生成中';
      case DraftStatus.ERROR:
        return 'エラー';
      case DraftStatus.SAVED_MANUALLY:
        return '手動保存';
      default:
        return '不明';
    }
  };

  const filteredDrafts = drafts.filter(draft => {
    const matchesSearch = 
      draft.metadata.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      draft.metadata.keyword.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = 
      selectedStatus === 'all' || draft.metadata.status === selectedStatus;
    
    return matchesSearch && matchesStatus;
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[80vh] flex flex-col">
        {/* ヘッダー */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              下書き一覧
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* 検索バー */}
          <div className="flex gap-3 mb-3">
            <div className="flex-1 relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="キーワードで検索..."
                className="w-full px-4 py-2 pl-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <svg className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            
            {/* ステータスフィルター */}
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value as any)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">全て</option>
              <option value={DraftStatus.COMPLETED}>完了</option>
              <option value={DraftStatus.IN_PROGRESS}>生成中</option>
              <option value={DraftStatus.SAVED_MANUALLY}>手動保存</option>
              <option value={DraftStatus.ERROR}>エラー</option>
            </select>
          </div>

          <div className="text-sm text-gray-500">
            {filteredDrafts.length}件の下書き
          </div>
        </div>

        {/* 下書きリスト */}
        <div className="flex-1 overflow-y-auto p-6 space-y-3">
          {filteredDrafts.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <p>下書きがありません</p>
            </div>
          ) : (
            (filteredDrafts || []).map(draft => (
              <div
                key={draft.metadata.id}
                onClick={() => handleLoad(draft.metadata.id)}
                className="border border-gray-200 rounded-xl p-4 hover:border-blue-400 hover:shadow-lg transition-all duration-200 cursor-pointer group"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      {getStatusIcon(draft.metadata.status)}
                      <h3 className="font-bold text-lg text-gray-800 group-hover:text-blue-600 transition-colors">
                        {draft.metadata.title}
                      </h3>
                      <span className="text-xs bg-gray-100 px-2 py-1 rounded">
                        {getStatusLabel(draft.metadata.status)}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">
                      キーワード: {draft.metadata.keyword}
                    </p>
                    <p className="text-sm text-gray-500 line-clamp-2">
                      {draft.preview}
                    </p>
                  </div>
                  
                  <button
                    onClick={(e) => handleDelete(draft.metadata.id, e)}
                    className="ml-4 text-gray-400 hover:text-red-500 transition-colors"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>

                <div className="flex items-center justify-between text-xs text-gray-400 mt-3">
                  <span>
                    更新: {new Date(draft.metadata.updatedAt).toLocaleDateString('ja-JP', { 
                      month: 'short', 
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </span>
                  {draft.metadata.characterCount && (
                    <span>{draft.metadata.characterCount.toLocaleString()}文字</span>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {/* フッター */}
        <div className="p-4 border-t border-gray-200 bg-gray-50 rounded-b-2xl">
          <button
            onClick={onClose}
            className="w-full py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 font-medium rounded-lg transition-colors"
          >
            閉じる
          </button>
        </div>
      </div>
    </div>
  );
};

export default DraftList;

