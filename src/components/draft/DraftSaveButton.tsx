import React, { useState, useEffect } from 'react';

interface DraftSaveButtonProps {
  onSave: () => void;
  isSaving: boolean;
  lastSaved?: Date | null;
  autoSaveEnabled?: boolean;
}

const DraftSaveButton: React.FC<DraftSaveButtonProps> = ({ 
  onSave, 
  isSaving, 
  lastSaved,
  autoSaveEnabled = false
}) => {
  const [showSavedNotification, setShowSavedNotification] = useState(false);

  useEffect(() => {
    if (lastSaved && !isSaving) {
      setShowSavedNotification(true);
      const timer = setTimeout(() => {
        setShowSavedNotification(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [lastSaved, isSaving]);

  const formatLastSaved = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'たった今';
    if (diffMins < 60) return `${diffMins}分前`;
    
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}時間前`;
    
    return date.toLocaleDateString('ja-JP', { 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="flex items-center gap-3">
      {/* 保存ボタン */}
      <button
        onClick={onSave}
        disabled={isSaving}
        className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
          isSaving
            ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
            : 'bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white shadow-lg hover:shadow-xl transform hover:scale-105'
        }`}
      >
        {isSaving ? (
          <>
            <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            保存中...
          </>
        ) : (
          <>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
            </svg>
            下書き保存
          </>
        )}
      </button>

      {/* 最終保存時刻 */}
      {lastSaved && (
        <div className="flex items-center gap-2 text-sm">
          {showSavedNotification ? (
            <span className="text-green-600 font-medium animate-pulse flex items-center gap-1">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              保存しました
            </span>
          ) : (
            <span className="text-gray-500">
              {autoSaveEnabled ? '自動保存: ' : '保存済み: '}
              {formatLastSaved(lastSaved)}
            </span>
          )}
        </div>
      )}

      {/* 自動保存インジケーター */}
      {autoSaveEnabled && (
        <div className="flex items-center gap-1 text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
          </svg>
          自動保存ON
        </div>
      )}
    </div>
  );
};

export default DraftSaveButton;

