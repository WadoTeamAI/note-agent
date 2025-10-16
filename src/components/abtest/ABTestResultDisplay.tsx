import React, { useState } from 'react';
import { ABTestResult, ABTestVersion, ABTestStatus } from '../../types/abtest.types';
import ABTestVersionCard from './ABTestVersionCard';
import ABTestComparisonView from './ABTestComparisonView';

interface ABTestResultDisplayProps {
  result: ABTestResult;
  onClose: () => void;
  onSelectVersion: (version: ABTestVersion) => void;
}

/**
 * A/Bテスト結果表示コンポーネント
 * 複数バージョンの比較と選択
 */
const ABTestResultDisplay: React.FC<ABTestResultDisplayProps> = ({
  result,
  onClose,
  onSelectVersion
}) => {
  const [selectedVersionIds, setSelectedVersionIds] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<'grid' | 'comparison'>('grid');

  const completedVersions = result.versions.filter(v => v.status === ABTestStatus.COMPLETED);
  const generatingCount = result.versions.filter(v => v.status === ABTestStatus.GENERATING).length;
  const failedCount = result.versions.filter(v => v.status === ABTestStatus.FAILED).length;

  const handleVersionSelect = (version: ABTestVersion) => {
    if (selectedVersionIds.includes(version.id)) {
      setSelectedVersionIds(prev => prev.filter(id => id !== version.id));
    } else {
      if (selectedVersionIds.length < 2) {
        setSelectedVersionIds(prev => [...prev, version.id]);
      } else {
        // 既に2つ選択されている場合は、最初のを削除して新しいのを追加
        setSelectedVersionIds([selectedVersionIds[1], version.id]);
      }
    }
  };

  const handleCompare = () => {
    if (selectedVersionIds.length === 2) {
      setViewMode('comparison');
    }
  };

  const handleSelectForOutput = (version: ABTestVersion) => {
    onSelectVersion(version);
    onClose();
  };

  const recommendedVersion = result.versions.find(v => v.id === result.recommendedVersion);

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 overflow-y-auto">
      <div className="min-h-screen p-4 md:p-8">
        <div className="max-w-7xl mx-auto">
          {/* ヘッダー */}
          <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white p-6 rounded-t-2xl shadow-lg">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-3xl font-bold mb-2">🧪 A/Bテスト結果</h2>
                <p className="text-purple-100">
                  {result.versions.length}パターンの記事を生成しました
                </p>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* ステータスバッジ */}
            <div className="flex gap-3 mt-4">
              <div className="bg-white/20 backdrop-blur-sm px-4 py-2 rounded-lg">
                <span className="text-sm">✅ 完了: {completedVersions.length}</span>
              </div>
              {generatingCount > 0 && (
                <div className="bg-white/20 backdrop-blur-sm px-4 py-2 rounded-lg animate-pulse">
                  <span className="text-sm">⏳ 生成中: {generatingCount}</span>
                </div>
              )}
              {failedCount > 0 && (
                <div className="bg-white/20 backdrop-blur-sm px-4 py-2 rounded-lg">
                  <span className="text-sm">❌ 失敗: {failedCount}</span>
                </div>
              )}
              {result.totalGenerationTime && (
                <div className="bg-white/20 backdrop-blur-sm px-4 py-2 rounded-lg">
                  <span className="text-sm">⏱️ 合計: {result.totalGenerationTime}秒</span>
                </div>
              )}
            </div>
          </div>

          {/* コントロールパネル */}
          <div className="bg-white dark:bg-gray-800 p-4 border-x border-gray-200 dark:border-gray-700">
            <div className="flex flex-wrap justify-between items-center gap-3">
              {/* 表示モード切り替え */}
              <div className="flex gap-2">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
                    viewMode === 'grid'
                      ? 'bg-purple-500 text-white'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                  }`}
                >
                  📊 一覧表示
                </button>
                <button
                  onClick={handleCompare}
                  disabled={selectedVersionIds.length !== 2}
                  className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
                    viewMode === 'comparison'
                      ? 'bg-purple-500 text-white'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed'
                  }`}
                >
                  ⚖️ 比較表示 {selectedVersionIds.length > 0 && `(${selectedVersionIds.length}/2)`}
                </button>
              </div>

              {/* 選択情報 */}
              {selectedVersionIds.length > 0 && (
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  {selectedVersionIds.length}個のバージョンを選択中
                  <button
                    onClick={() => setSelectedVersionIds([])}
                    className="ml-2 text-purple-600 hover:text-purple-700 underline"
                  >
                    クリア
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* コンテンツエリア */}
          <div className="bg-gray-50 dark:bg-gray-900 p-6 rounded-b-2xl shadow-lg">
            {viewMode === 'grid' ? (
              <>
                {/* 推奨バージョンのハイライト */}
                {recommendedVersion && recommendedVersion.status === ABTestStatus.COMPLETED && (
                  <div className="mb-6">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-2xl">⭐</span>
                      <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                        おすすめバージョン
                      </h3>
                    </div>
                    <ABTestVersionCard
                      version={recommendedVersion}
                      isRecommended={true}
                      onSelect={() => handleSelectForOutput(recommendedVersion)}
                    />
                  </div>
                )}

                {/* 全バージョン表示 */}
                <div className="mb-3">
                  <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-3">
                    全バージョン
                  </h3>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {(result.versions || []).map(version => (
                    <div
                      key={version.id}
                      onClick={() => handleVersionSelect(version)}
                      className={`cursor-pointer transition-all ${
                        selectedVersionIds.includes(version.id)
                          ? 'ring-4 ring-purple-400 ring-offset-2 dark:ring-offset-gray-900'
                          : ''
                      }`}
                    >
                      <ABTestVersionCard
                        version={version}
                        isRecommended={version.id === result.recommendedVersion}
                        onSelect={() => handleSelectForOutput(version)}
                      />
                    </div>
                  ))}
                </div>
              </>
            ) : (
              // 比較表示
              <div>
                {selectedVersionIds.length === 2 ? (
                  <ABTestComparisonView
                    versionA={result.versions.find(v => v.id === selectedVersionIds[0])!}
                    versionB={result.versions.find(v => v.id === selectedVersionIds[1])!}
                    onBack={() => setViewMode('grid')}
                  />
                ) : (
                  <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-xl">
                    <p className="text-gray-600 dark:text-gray-400">
                      比較するには2つのバージョンを選択してください
                    </p>
                    <button
                      onClick={() => setViewMode('grid')}
                      className="mt-4 px-6 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors"
                    >
                      一覧に戻る
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ABTestResultDisplay;

