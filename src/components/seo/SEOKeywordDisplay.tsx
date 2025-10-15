import React, { useState } from 'react';
import { 
  SEOKeywordSet, 
  SEOKeyword, 
  SearchVolume, 
  Competition, 
  Difficulty 
} from '../../types/seo.types';

interface SEOKeywordDisplayProps {
  keywordSet: SEOKeywordSet;
}

const SEOKeywordDisplay: React.FC<SEOKeywordDisplayProps> = ({ keywordSet }) => {
  const [activeTab, setActiveTab] = useState<'related' | 'longtail' | 'question' | 'lsi'>('related');
  const [copiedKeyword, setCopiedKeyword] = useState<string | null>(null);

  const copyKeyword = (keyword: string) => {
    navigator.clipboard.writeText(keyword);
    setCopiedKeyword(keyword);
    setTimeout(() => setCopiedKeyword(null), 2000);
  };

  const copyAllKeywords = () => {
    const allKeywords = [
      ...keywordSet.relatedKeywords.map(k => k.keyword),
      ...keywordSet.longTailKeywords.map(k => k.keyword),
      ...keywordSet.questionKeywords.map(k => k.keyword),
      ...keywordSet.lsiKeywords,
    ].join('\n');
    
    navigator.clipboard.writeText(allKeywords);
    setCopiedKeyword('all');
    setTimeout(() => setCopiedKeyword(null), 2000);
  };

  const getSearchVolumeLabel = (volume: SearchVolume) => {
    switch (volume) {
      case SearchVolume.VERY_LOW: return { label: '極小', color: 'text-gray-500', bg: 'bg-gray-100' };
      case SearchVolume.LOW: return { label: '小', color: 'text-blue-500', bg: 'bg-blue-100' };
      case SearchVolume.MEDIUM: return { label: '中', color: 'text-green-500', bg: 'bg-green-100' };
      case SearchVolume.HIGH: return { label: '大', color: 'text-orange-500', bg: 'bg-orange-100' };
      case SearchVolume.VERY_HIGH: return { label: '極大', color: 'text-red-500', bg: 'bg-red-100' };
      default: return { label: '不明', color: 'text-gray-500', bg: 'bg-gray-100' };
    }
  };

  const getCompetitionLabel = (competition: Competition) => {
    switch (competition) {
      case Competition.LOW: return { label: '低競合', color: 'text-green-600', icon: '🟢' };
      case Competition.MEDIUM: return { label: '中競合', color: 'text-yellow-600', icon: '🟡' };
      case Competition.HIGH: return { label: '高競合', color: 'text-red-600', icon: '🔴' };
      default: return { label: '不明', color: 'text-gray-600', icon: '⚪' };
    }
  };

  const getDifficultyLabel = (difficulty: Difficulty) => {
    switch (difficulty) {
      case Difficulty.EASY: return { label: '容易', color: 'text-green-600' };
      case Difficulty.MODERATE: return { label: '中程度', color: 'text-yellow-600' };
      case Difficulty.HARD: return { label: '困難', color: 'text-orange-600' };
      case Difficulty.VERY_HARD: return { label: '非常に困難', color: 'text-red-600' };
      default: return { label: '不明', color: 'text-gray-600' };
    }
  };

  const renderKeywordCard = (keyword: SEOKeyword, isRecommended: boolean = false) => {
    const volumeStyle = getSearchVolumeLabel(keyword.searchVolume);
    const competitionStyle = getCompetitionLabel(keyword.competition);
    const difficultyStyle = getDifficultyLabel(keyword.difficulty);

    return (
      <div 
        key={keyword.keyword}
        className={`p-4 rounded-lg border-2 transition-all duration-200 hover:shadow-lg ${
          isRecommended 
            ? 'border-yellow-400 bg-gradient-to-r from-yellow-50 to-orange-50' 
            : 'border-gray-200 bg-white hover:border-blue-300'
        }`}
      >
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              {isRecommended && <span className="text-lg">⭐</span>}
              <h4 className="font-bold text-gray-800">{keyword.keyword}</h4>
              <button
                onClick={() => copyKeyword(keyword.keyword)}
                className="ml-2 text-gray-400 hover:text-blue-500 transition-colors"
                title="コピー"
              >
                {copiedKeyword === keyword.keyword ? (
                  <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                )}
              </button>
            </div>
            
            <div className="flex flex-wrap gap-2 text-xs">
              <span className={`px-2 py-1 rounded ${volumeStyle.bg} ${volumeStyle.color} font-medium`}>
                検索: {volumeStyle.label}
              </span>
              <span className="px-2 py-1 rounded bg-gray-100 text-gray-700">
                {competitionStyle.icon} {competitionStyle.label}
              </span>
              <span className={`px-2 py-1 rounded bg-gray-100 ${difficultyStyle.color} font-medium`}>
                難易度: {difficultyStyle.label}
              </span>
              <span className="px-2 py-1 rounded bg-blue-100 text-blue-700 font-medium">
                関連性: {Math.round(keyword.relevance * 100)}%
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* ヘッダー */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent flex items-center gap-2">
            <svg className="w-7 h-7 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
            </svg>
            SEOキーワードセット
          </h3>
          <p className="text-sm text-gray-600 mt-1">
            メインキーワード: <span className="font-bold text-gray-800">{keywordSet.mainKeyword}</span>
            {' '} | 合計 {keywordSet.totalKeywordCount}個のキーワード
          </p>
        </div>
        
        <button
          onClick={copyAllKeywords}
          className="px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-medium rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 flex items-center gap-2"
        >
          {copiedKeyword === 'all' ? (
            <>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              コピーしました！
            </>
          ) : (
            <>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              全てコピー
            </>
          )}
        </button>
      </div>

      {/* 推奨キーワード */}
      {keywordSet.recommendedKeywords.length > 0 && (
        <div className="bg-gradient-to-r from-yellow-50 to-orange-50 p-5 rounded-xl border-2 border-yellow-300">
          <h4 className="text-lg font-bold text-gray-800 mb-3 flex items-center gap-2">
            ⭐ 推奨キーワード（優先度高）
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {keywordSet.recommendedKeywords.map(kw => renderKeywordCard(kw, true))}
          </div>
        </div>
      )}

      {/* タブ */}
      <div className="border-b border-gray-200">
        <div className="flex gap-4">
          <button
            onClick={() => setActiveTab('related')}
            className={`px-4 py-2 font-medium transition-colors border-b-2 ${
              activeTab === 'related'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            関連キーワード ({keywordSet.relatedKeywords.length})
          </button>
          <button
            onClick={() => setActiveTab('longtail')}
            className={`px-4 py-2 font-medium transition-colors border-b-2 ${
              activeTab === 'longtail'
                ? 'border-green-500 text-green-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            ロングテール ({keywordSet.longTailKeywords.length})
          </button>
          <button
            onClick={() => setActiveTab('question')}
            className={`px-4 py-2 font-medium transition-colors border-b-2 ${
              activeTab === 'question'
                ? 'border-purple-500 text-purple-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            質問形式 ({keywordSet.questionKeywords.length})
          </button>
          <button
            onClick={() => setActiveTab('lsi')}
            className={`px-4 py-2 font-medium transition-colors border-b-2 ${
              activeTab === 'lsi'
                ? 'border-orange-500 text-orange-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            LSI ({keywordSet.lsiKeywords.length})
          </button>
        </div>
      </div>

      {/* キーワード表示 */}
      <div className="space-y-3">
        {activeTab === 'related' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {keywordSet.relatedKeywords.map(kw => renderKeywordCard(kw))}
          </div>
        )}
        
        {activeTab === 'longtail' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {keywordSet.longTailKeywords.map(kw => renderKeywordCard(kw))}
          </div>
        )}
        
        {activeTab === 'question' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {keywordSet.questionKeywords.map(kw => renderKeywordCard(kw))}
          </div>
        )}
        
        {activeTab === 'lsi' && (
          <div className="flex flex-wrap gap-2">
            {keywordSet.lsiKeywords.map((keyword, index) => (
              <button
                key={index}
                onClick={() => copyKeyword(keyword)}
                className="px-4 py-2 bg-gradient-to-r from-gray-100 to-gray-200 hover:from-gray-200 hover:to-gray-300 text-gray-700 font-medium rounded-lg transition-all duration-200 border border-gray-300 hover:border-gray-400 flex items-center gap-2"
              >
                {keyword}
                {copiedKeyword === keyword ? (
                  <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* 注意事項 */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-800">
        <strong>💡 活用のヒント:</strong>
        <ul className="list-disc list-inside mt-2 space-y-1">
          <li>推奨キーワードは、関連性・難易度・競合性を総合的に評価した最適なキーワードです</li>
          <li>ロングテールキーワードは競合が少なく、コンバージョン率が高い傾向があります</li>
          <li>質問形式キーワードは、FAQセクションや記事の見出しに最適です</li>
          <li>LSIキーワードは、記事内に自然に散りばめることでSEO効果が高まります</li>
        </ul>
      </div>
    </div>
  );
};

export default SEOKeywordDisplay;

