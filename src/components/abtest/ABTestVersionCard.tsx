import React, { useState } from 'react';
import { ABTestVersion, ABTestStatus } from '../../types/abtest.types';
import NoteStylePreview from '../preview/NoteStylePreview';

interface ABTestVersionCardProps {
  version: ABTestVersion;
  isRecommended?: boolean;
  onSelect?: () => void;
  onCompare?: () => void;
}

/**
 * A/Bテストバージョンカード
 * 個別バージョンの表示とプレビュー
 */
const ABTestVersionCard: React.FC<ABTestVersionCardProps> = ({
  version,
  isRecommended = false,
  onSelect,
  onCompare
}) => {
  const [showPreview, setShowPreview] = useState<boolean>(false);
  const [previewMode, setPreviewMode] = useState<'preview' | 'markdown'>('preview');

  const getStatusColor = (status: ABTestStatus) => {
    switch (status) {
      case ABTestStatus.COMPLETED:
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300';
      case ABTestStatus.GENERATING:
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300';
      case ABTestStatus.FAILED:
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    }
  };

  const getStatusLabel = (status: ABTestStatus) => {
    switch (status) {
      case ABTestStatus.COMPLETED:
        return '完了';
      case ABTestStatus.GENERATING:
        return '生成中...';
      case ABTestStatus.FAILED:
        return '失敗';
      default:
        return '待機中';
    }
  };

  const handleCopy = () => {
    if (version.output?.markdownContent) {
      navigator.clipboard.writeText(version.output.markdownContent);
      alert('記事本文をコピーしました！');
    }
  };

  const extractTitle = (markdown: string): string => {
    const titleMatch = markdown.match(/^#\s+(.+)$/m);
    return titleMatch ? titleMatch[1] : '無題の記事';
  };

  return (
    <div className={`relative rounded-xl border-2 overflow-hidden transition-all ${
      isRecommended 
        ? 'border-yellow-400 shadow-lg shadow-yellow-200 dark:shadow-yellow-900/50' 
        : 'border-gray-200 dark:border-gray-700'
    }`}>
      {/* 推奨バッジ */}
      {isRecommended && (
        <div className="absolute top-0 right-0 bg-gradient-to-r from-yellow-400 to-orange-400 text-white px-4 py-1 rounded-bl-xl font-bold text-sm z-10 shadow-lg">
          ⭐ おすすめ
        </div>
      )}

      {/* カードヘッダー */}
      <div className={`p-4 ${
        isRecommended 
          ? 'bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20' 
          : 'bg-gray-50 dark:bg-gray-800'
      }`}>
        <div className="flex justify-between items-start mb-2">
          <div>
            <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              バージョン {version.versionName}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              {version.description}
            </p>
          </div>
          <span className={`px-3 py-1 rounded-full text-xs font-bold ${getStatusColor(version.status)}`}>
            {getStatusLabel(version.status)}
          </span>
        </div>

        {/* パラメータ表示 */}
        <div className="flex flex-wrap gap-2 mt-3">
          <span className="px-3 py-1 bg-white dark:bg-gray-700 rounded-full text-xs font-medium border border-gray-200 dark:border-gray-600">
            📝 {version.parameters.tone}
          </span>
          <span className="px-3 py-1 bg-white dark:bg-gray-700 rounded-full text-xs font-medium border border-gray-200 dark:border-gray-600">
            👥 {version.parameters.audience}
          </span>
          <span className="px-3 py-1 bg-white dark:bg-gray-700 rounded-full text-xs font-medium border border-gray-200 dark:border-gray-600">
            📏 {version.parameters.targetLength.toLocaleString()}字
          </span>
          {version.generationTime && (
            <span className="px-3 py-1 bg-white dark:bg-gray-700 rounded-full text-xs font-medium border border-gray-200 dark:border-gray-600">
              ⏱️ {version.generationTime}秒
            </span>
          )}
        </div>
      </div>

      {/* カードコンテンツ */}
      {version.status === ABTestStatus.COMPLETED && version.output && (
        <div className="p-4 space-y-3">
          {/* 統計情報 */}
          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
              <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">文字数</div>
              <div className="text-lg font-bold text-gray-900 dark:text-gray-100">
                {version.output.markdownContent.length.toLocaleString()}
              </div>
            </div>
            <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-lg">
              <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">見出し数</div>
              <div className="text-lg font-bold text-gray-900 dark:text-gray-100">
                {(version.output.markdownContent.match(/^#+\s/gm) || []).length}
              </div>
            </div>
            <div className="bg-purple-50 dark:bg-purple-900/20 p-3 rounded-lg">
              <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">画像数</div>
              <div className="text-lg font-bold text-gray-900 dark:text-gray-100">
                {(version.output.markdownContent.match(/!\[.*?\]\(.*?\)/g) || []).length + 1}
              </div>
            </div>
          </div>

          {/* アクションボタン */}
          <div className="flex gap-2">
            <button
              onClick={() => setShowPreview(!showPreview)}
              className="flex-1 py-2 px-4 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white font-bold rounded-lg transition-all"
            >
              {showPreview ? '👁️ プレビューを閉じる' : '👁️ プレビュー'}
            </button>
            <button
              onClick={handleCopy}
              className="py-2 px-4 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 font-bold rounded-lg transition-colors"
            >
              📋 コピー
            </button>
            {onSelect && (
              <button
                onClick={onSelect}
                className="py-2 px-4 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white font-bold rounded-lg transition-all"
              >
                ✓ 選択
              </button>
            )}
          </div>

          {/* プレビュー表示 */}
          {showPreview && (
            <div className="mt-4 border-t-2 border-gray-200 dark:border-gray-700 pt-4">
              {/* プレビューモード切り替え */}
              <div className="flex gap-2 mb-3">
                <button
                  onClick={() => setPreviewMode('preview')}
                  className={`flex-1 py-2 px-4 rounded-lg font-semibold transition-colors ${
                    previewMode === 'preview'
                      ? 'bg-purple-500 text-white'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                  }`}
                >
                  👁️ note風プレビュー
                </button>
                <button
                  onClick={() => setPreviewMode('markdown')}
                  className={`flex-1 py-2 px-4 rounded-lg font-semibold transition-colors ${
                    previewMode === 'markdown'
                      ? 'bg-purple-500 text-white'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                  }`}
                >
                  📝 Markdown
                </button>
              </div>

              {/* プレビュー内容 */}
              <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden max-h-96 overflow-y-auto">
                {previewMode === 'preview' ? (
                  <NoteStylePreview
                    title={extractTitle(version.output.markdownContent)}
                    content={version.output.markdownContent}
                    imageUrl={version.output.imageUrl}
                  />
                ) : (
                  <pre className="p-4 text-xs text-gray-700 dark:text-gray-300 font-mono whitespace-pre-wrap">
                    {version.output.markdownContent}
                  </pre>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* 生成中の表示 */}
      {version.status === ABTestStatus.GENERATING && (
        <div className="p-8 text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-purple-200 border-t-purple-600 mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">生成中...</p>
        </div>
      )}

      {/* 失敗時の表示 */}
      {version.status === ABTestStatus.FAILED && (
        <div className="p-8 text-center">
          <div className="text-red-500 text-4xl mb-2">❌</div>
          <p className="text-gray-600 dark:text-gray-400">生成に失敗しました</p>
        </div>
      )}
    </div>
  );
};

export default ABTestVersionCard;

