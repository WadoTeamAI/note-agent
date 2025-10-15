import React, { useState, useEffect } from 'react';
import { ABTestVersion, ABTestComparison } from '../../types/abtest.types';
import { abtestService } from '../../services/abtest/abtestService';
import NoteStylePreview from '../preview/NoteStylePreview';

interface ABTestComparisonViewProps {
  versionA: ABTestVersion;
  versionB: ABTestVersion;
  onBack: () => void;
}

/**
 * A/Bテストバージョン比較ビュー
 * 2つのバージョンを詳細に比較
 */
const ABTestComparisonView: React.FC<ABTestComparisonViewProps> = ({
  versionA,
  versionB,
  onBack
}) => {
  const [comparison, setComparison] = useState<ABTestComparison | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [previewMode, setPreviewMode] = useState<'side-by-side' | 'overlay'>('side-by-side');

  useEffect(() => {
    const loadComparison = async () => {
      setLoading(true);
      try {
        const result = await abtestService.compareVersions(versionA, versionB);
        setComparison(result);
      } catch (error) {
        console.error('Comparison failed:', error);
      } finally {
        setLoading(false);
      }
    };

    loadComparison();
  }, [versionA.id, versionB.id]);

  const extractTitle = (markdown: string): string => {
    const titleMatch = markdown.match(/^#\s+(.+)$/m);
    return titleMatch ? titleMatch[1] : '無題の記事';
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl p-12 text-center">
        <div className="inline-block animate-spin rounded-full h-16 w-16 border-4 border-purple-200 border-t-purple-600 mb-4"></div>
        <p className="text-gray-600 dark:text-gray-400">比較分析中...</p>
      </div>
    );
  }

  if (!comparison) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl p-12 text-center">
        <p className="text-red-600">比較データの読み込みに失敗しました</p>
        <button
          onClick={onBack}
          className="mt-4 px-6 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors"
        >
          戻る
        </button>
      </div>
    );
  }

  const MetricCard: React.FC<{
    title: string;
    scoreA: number;
    scoreB: number;
    icon: string;
  }> = ({ title, scoreA, scoreB, icon }) => {
    const winner = scoreA > scoreB ? 'A' : scoreB > scoreA ? 'B' : 'tie';
    
    return (
      <div className="bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-700 p-4 rounded-xl border border-gray-200 dark:border-gray-600">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="text-2xl">{icon}</span>
            <h4 className="font-bold text-gray-900 dark:text-gray-100">{title}</h4>
          </div>
          {winner !== 'tie' && (
            <span className={`px-2 py-1 rounded-full text-xs font-bold ${
              winner === 'A' 
                ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300' 
                : 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
            }`}>
              {winner === 'A' ? 'バージョンA優位' : 'バージョンB優位'}
            </span>
          )}
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div className={`p-3 rounded-lg ${
            winner === 'A' 
              ? 'bg-blue-50 dark:bg-blue-900/20 ring-2 ring-blue-500' 
              : 'bg-gray-100 dark:bg-gray-700'
          }`}>
            <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">バージョンA</div>
            <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {scoreA.toFixed(1)}
            </div>
          </div>
          <div className={`p-3 rounded-lg ${
            winner === 'B' 
              ? 'bg-green-50 dark:bg-green-900/20 ring-2 ring-green-500' 
              : 'bg-gray-100 dark:bg-gray-700'
          }`}>
            <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">バージョンB</div>
            <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {scoreB.toFixed(1)}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* 戻るボタン */}
      <button
        onClick={onBack}
        className="flex items-center gap-2 px-4 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg transition-colors"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        一覧に戻る
      </button>

      {/* 推奨結果 */}
      <div className="bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 p-6 rounded-xl border-2 border-yellow-400">
        <div className="flex items-start gap-3">
          <span className="text-3xl">🏆</span>
          <div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">
              分析結果
            </h3>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
              {comparison.recommendation}
            </p>
          </div>
        </div>
      </div>

      {/* メトリクス比較 */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg">
        <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4">
          📊 詳細比較
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <MetricCard
            title="読みやすさスコア"
            scoreA={comparison.metrics.readabilityScore.a}
            scoreB={comparison.metrics.readabilityScore.b}
            icon="📖"
          />
          <MetricCard
            title="SEOスコア"
            scoreA={comparison.metrics.seoScore.a}
            scoreB={comparison.metrics.seoScore.b}
            icon="🔍"
          />
          <MetricCard
            title="エンゲージメント予測"
            scoreA={comparison.metrics.engagementPrediction.a}
            scoreB={comparison.metrics.engagementPrediction.b}
            icon="💬"
          />
          <MetricCard
            title="文字数"
            scoreA={comparison.metrics.wordCount.a}
            scoreB={comparison.metrics.wordCount.b}
            icon="📝"
          />
        </div>
      </div>

      {/* プレビュー比較 */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">
            👁️ プレビュー比較
          </h3>
          <div className="flex gap-2">
            <button
              onClick={() => setPreviewMode('side-by-side')}
              className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
                previewMode === 'side-by-side'
                  ? 'bg-purple-500 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
              }`}
            >
              並列表示
            </button>
            <button
              onClick={() => setPreviewMode('overlay')}
              className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
                previewMode === 'overlay'
                  ? 'bg-purple-500 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
              }`}
            >
              重ね表示
            </button>
          </div>
        </div>

        {previewMode === 'side-by-side' ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* バージョンA */}
            <div className="border-2 border-blue-500 rounded-xl overflow-hidden">
              <div className="bg-blue-500 text-white p-3 font-bold">
                バージョン {versionA.versionName}
              </div>
              <div className="max-h-[600px] overflow-y-auto">
                {versionA.output && (
                  <NoteStylePreview
                    title={extractTitle(versionA.output.markdownContent)}
                    content={versionA.output.markdownContent}
                    imageUrl={versionA.output.imageUrl}
                  />
                )}
              </div>
            </div>

            {/* バージョンB */}
            <div className="border-2 border-green-500 rounded-xl overflow-hidden">
              <div className="bg-green-500 text-white p-3 font-bold">
                バージョン {versionB.versionName}
              </div>
              <div className="max-h-[600px] overflow-y-auto">
                {versionB.output && (
                  <NoteStylePreview
                    title={extractTitle(versionB.output.markdownContent)}
                    content={versionB.output.markdownContent}
                    imageUrl={versionB.output.imageUrl}
                  />
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="relative">
            <div className="flex gap-2 mb-4">
              <span className="px-3 py-1 bg-blue-500 text-white rounded-full text-sm font-bold">
                バージョン {versionA.versionName}
              </span>
              <span className="px-3 py-1 bg-green-500 text-white rounded-full text-sm font-bold">
                バージョン {versionB.versionName}
              </span>
            </div>
            <div className="border-2 border-purple-500 rounded-xl overflow-hidden max-h-[600px] overflow-y-auto">
              {versionA.output && (
                <NoteStylePreview
                  title={extractTitle(versionA.output.markdownContent)}
                  content={versionA.output.markdownContent}
                  imageUrl={versionA.output.imageUrl}
                />
              )}
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-2 text-center">
              ※ 重ね表示ではバージョンAを表示しています
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ABTestComparisonView;

