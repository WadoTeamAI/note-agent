import React, { useState } from 'react';
import { FactCheckSummary, FactCheckResult } from '../../types/factcheck.types';

interface FactCheckDisplayProps {
  summary: FactCheckSummary;
}

const FactCheckDisplay: React.FC<FactCheckDisplayProps> = ({ summary }) => {
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  const toggleExpand = (id: string) => {
    const newExpanded = new Set(expandedIds);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedIds(newExpanded);
  };

  const getVerdictColor = (verdict: string) => {
    switch (verdict) {
      case 'correct': return 'text-green-700 bg-green-50 border-green-200';
      case 'incorrect': return 'text-red-700 bg-red-50 border-red-200';
      case 'partially-correct': return 'text-yellow-700 bg-yellow-50 border-yellow-200';
      case 'unverified': return 'text-gray-700 bg-gray-50 border-gray-200';
      default: return 'text-gray-700 bg-gray-50 border-gray-200';
    }
  };

  const getVerdictIcon = (verdict: string) => {
    switch (verdict) {
      case 'correct': return '✓';
      case 'incorrect': return '✗';
      case 'partially-correct': return '⚠';
      case 'unverified': return '?';
      default: return '?';
    }
  };

  const getVerdictLabel = (verdict: string) => {
    switch (verdict) {
      case 'correct': return '正確';
      case 'incorrect': return '不正確';
      case 'partially-correct': return '部分的に正確';
      case 'unverified': return '未検証';
      default: return '不明';
    }
  };

  const getConfidenceColor = (confidence: string) => {
    switch (confidence) {
      case 'high': return 'text-green-600';
      case 'medium': return 'text-yellow-600';
      case 'low': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  return (
    <div className="space-y-6">
      {/* サマリー */}
      <div className={`rounded-lg p-6 border-2 ${
        summary.needsReview 
          ? 'bg-yellow-50 border-yellow-300' 
          : 'bg-green-50 border-green-300'
      }`}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold flex items-center">
            {summary.needsReview ? '⚠️' : '✓'} ファクトチェック結果
          </h3>
          <span className={`text-sm font-semibold ${getConfidenceColor(summary.overallConfidence)}`}>
            信頼度: {summary.overallConfidence === 'high' ? '高' : summary.overallConfidence === 'medium' ? '中' : '低'}
          </span>
        </div>

        <div className="grid grid-cols-4 gap-4 mb-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-700">{summary.totalClaims}</div>
            <div className="text-sm text-gray-600">総チェック数</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{summary.verifiedClaims}</div>
            <div className="text-sm text-gray-600">検証済み</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-red-600">{summary.incorrectClaims}</div>
            <div className="text-sm text-gray-600">不正確</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-600">{summary.unverifiedClaims}</div>
            <div className="text-sm text-gray-600">未検証</div>
          </div>
        </div>

        {summary.needsReview && (
          <div className="bg-yellow-100 border border-yellow-300 rounded p-3 text-sm text-yellow-800">
            <strong>⚠️ レビュー推奨:</strong> 不正確または未検証の主張が含まれています。公開前に内容を確認してください。
          </div>
        )}
      </div>

      {/* 個別の結果 */}
      <div className="space-y-4">
        <h4 className="text-lg font-bold text-gray-800">詳細チェック結果</h4>
        
        {summary.results.map((result: FactCheckResult) => (
          <div 
            key={result.id} 
            className={`border-2 rounded-lg p-4 ${getVerdictColor(result.verdict)}`}
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-2xl">{getVerdictIcon(result.verdict)}</span>
                  <span className="font-semibold text-sm px-2 py-1 rounded bg-white">
                    {getVerdictLabel(result.verdict)}
                  </span>
                  <span className={`text-xs font-medium ${getConfidenceColor(result.confidence)}`}>
                    信頼度: {result.confidence}
                  </span>
                </div>
                <p className="text-gray-800 font-medium mb-2">{result.claim}</p>
                <p className="text-sm text-gray-700">{result.explanation}</p>
                
                {result.suggestedCorrection && (
                  <div className="mt-3 p-3 bg-white rounded border">
                    <strong className="text-sm">修正提案:</strong>
                    <p className="text-sm text-gray-700 mt-1">{result.suggestedCorrection}</p>
                  </div>
                )}
              </div>

              <button
                onClick={() => toggleExpand(result.id)}
                className="ml-4 text-sm font-medium text-gray-600 hover:text-gray-800 transition-colors"
              >
                {expandedIds.has(result.id) ? '▼ 閉じる' : '▶ 参照ソース'}
              </button>
            </div>

            {/* 参照ソース */}
            {expandedIds.has(result.id) && result.sources.length > 0 && (
              <div className="mt-4 pt-4 border-t space-y-3">
                <h5 className="text-sm font-semibold text-gray-700">参照ソース ({result.sources.length}件)</h5>
                {result.sources.map((source, idx) => (
                  <div key={idx} className="bg-white p-3 rounded border">
                    <div className="flex items-start justify-between mb-2">
                      <a 
                        href={source.url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-sm font-medium text-blue-600 hover:text-blue-800 hover:underline flex-1"
                      >
                        {source.title}
                      </a>
                      <span className="text-xs text-gray-500 ml-2">
                        関連度: {Math.round(source.relevanceScore * 100)}%
                      </span>
                    </div>
                    <p className="text-xs text-gray-600 mb-2">{source.snippet}</p>
                    <div className="flex items-center gap-3 text-xs text-gray-500">
                      <span>{source.domain}</span>
                      {source.publishedDate && <span>• {source.publishedDate}</span>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* 注意事項 */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-800">
        <strong>💡 ご注意:</strong> ファクトチェックはAIによる自動判定です。重要な情報は必ず複数の信頼できる情報源で確認してください。
      </div>
    </div>
  );
};

export default FactCheckDisplay;

