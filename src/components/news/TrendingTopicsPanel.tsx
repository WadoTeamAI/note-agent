import React, { useState, useEffect } from 'react';
import { NewsInsight, ArticleGenerationSuggestion, TrendingTopic } from '../../types/news.types';
import { HybridNewsService } from '../../services/news/hybridNewsService';
import { TrendAnalyzer } from '../../services/news/trendAnalyzer';

interface TrendingTopicsPanelProps {
    onClose: () => void;
    onSelectSuggestion: (suggestion: ArticleGenerationSuggestion) => void;
}

const TrendingTopicsPanel: React.FC<TrendingTopicsPanelProps> = ({ 
    onClose, 
    onSelectSuggestion 
}) => {
    const [isLoading, setIsLoading] = useState(false);
    const [insight, setInsight] = useState<NewsInsight | null>(null);
    const [suggestions, setSuggestions] = useState<ArticleGenerationSuggestion[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [selectedTimeframe, setSelectedTimeframe] = useState<number>(24);

    const rssService = new RSSService();
    const trendAnalyzer = new TrendAnalyzer();

    useEffect(() => {
        loadTrendingTopics();
    }, [selectedTimeframe]);

    const loadTrendingTopics = async () => {
        setIsLoading(true);
        setError(null);
        
        try {
            // 最新ニュースを取得
            const articles = await rssService.getLatestNews(100);
            
            if (articles.length === 0) {
                throw new Error('ニュース記事を取得できませんでした');
            }

            // トレンド分析
            const newsInsight = await trendAnalyzer.analyzeTrends(articles, selectedTimeframe);
            setInsight(newsInsight);

            // 記事提案生成
            if (newsInsight.trending.length > 0) {
                const articleSuggestions = await trendAnalyzer.generateArticleSuggestions(newsInsight.trending);
                setSuggestions(articleSuggestions);
            }

        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : '不明なエラーが発生しました';
            setError(errorMessage);
        } finally {
            setIsLoading(false);
        }
    };

    const getUrgencyColor = (urgency: string) => {
        switch (urgency) {
            case 'high': return 'text-red-600 bg-red-50';
            case 'medium': return 'text-orange-600 bg-orange-50';
            case 'low': return 'text-green-600 bg-green-50';
            default: return 'text-gray-600 bg-gray-50';
        }
    };

    const getUrgencyIcon = (urgency: string) => {
        switch (urgency) {
            case 'high': return '🔥';
            case 'medium': return '⚡';
            case 'low': return '💡';
            default: return '📝';
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white/90 backdrop-blur-lg rounded-2xl shadow-2xl border border-white/30 w-full max-w-6xl max-h-[90vh] overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-white/20">
                    <div>
                        <h2 className="text-2xl font-bold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
                            📈 トレンド記事提案
                        </h2>
                        <p className="text-gray-600 text-sm mt-1">
                            最新ニュースから注目トピックを分析し、記事アイデアを提案します
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <div className="overflow-y-auto max-h-[calc(90vh-80px)]">
                    {/* Controls */}
                    <div className="p-6 border-b border-white/10">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-4">
                                <label className="text-sm font-medium text-gray-700">時間範囲:</label>
                                <select
                                    value={selectedTimeframe}
                                    onChange={(e) => setSelectedTimeframe(parseInt(e.target.value))}
                                    className="px-3 py-2 bg-white/60 border border-white/30 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm"
                                >
                                    <option value={6}>過去6時間</option>
                                    <option value={12}>過去12時間</option>
                                    <option value={24}>過去24時間</option>
                                    <option value={48}>過去48時間</option>
                                </select>
                            </div>
                            <button
                                onClick={loadTrendingTopics}
                                disabled={isLoading}
                                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium disabled:opacity-50"
                            >
                                {isLoading ? '分析中...' : '🔄 更新'}
                            </button>
                        </div>
                    </div>

                    {error && (
                        <div className="p-6">
                            <div className="p-4 backdrop-blur-sm bg-red-50/80 border border-red-200 rounded-xl">
                                <div className="flex items-center">
                                    <svg className="w-5 h-5 text-red-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    <p className="text-red-700 font-medium">{error}</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {isLoading ? (
                        <div className="p-12 text-center">
                            <div className="animate-spin w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full mx-auto mb-4"></div>
                            <p className="text-gray-600">最新トレンドを分析中...</p>
                        </div>
                    ) : insight ? (
                        <div className="p-6 space-y-8">
                            {/* Overview */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div className="backdrop-blur-sm bg-blue-50/60 p-4 rounded-xl">
                                    <div className="text-2xl font-bold text-blue-600">{insight.totalArticles}</div>
                                    <div className="text-sm text-blue-700">分析記事数</div>
                                </div>
                                <div className="backdrop-blur-sm bg-green-50/60 p-4 rounded-xl">
                                    <div className="text-2xl font-bold text-green-600">{insight.trending.length}</div>
                                    <div className="text-sm text-green-700">トレンドトピック</div>
                                </div>
                                <div className="backdrop-blur-sm bg-purple-50/60 p-4 rounded-xl">
                                    <div className="text-2xl font-bold text-purple-600">{suggestions.length}</div>
                                    <div className="text-sm text-purple-700">記事提案</div>
                                </div>
                            </div>

                            {/* Article Suggestions */}
                            {suggestions.length > 0 && (
                                <div>
                                    <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
                                        <span className="mr-2">🚀</span>
                                        おすすめ記事アイデア
                                    </h3>
                                    <div className="grid gap-4">
                                        {suggestions.map((suggestion, index) => (
                                            <div 
                                                key={index}
                                                className="backdrop-blur-sm bg-white/60 p-6 rounded-xl border border-white/30 hover:shadow-lg transition-all cursor-pointer"
                                                onClick={() => onSelectSuggestion(suggestion)}
                                            >
                                                <div className="flex items-start justify-between mb-3">
                                                    <div className="flex items-center space-x-3">
                                                        <span className="text-2xl">{getUrgencyIcon(suggestion.urgency)}</span>
                                                        <div>
                                                            <h4 className="font-bold text-gray-900 text-lg">{suggestion.title}</h4>
                                                            <div className="flex items-center space-x-2 mt-1">
                                                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getUrgencyColor(suggestion.urgency)}`}>
                                                                    {suggestion.urgency === 'high' ? '高緊急' : 
                                                                     suggestion.urgency === 'medium' ? '中緊急' : '低緊急'}
                                                                </span>
                                                                <span className="text-sm text-gray-600">
                                                                    人気度: {suggestion.estimatedPopularity}/10
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                                
                                                <div className="space-y-2 text-sm">
                                                    <div>
                                                        <span className="font-medium text-gray-700">キーワード:</span>
                                                        <span className="ml-2 text-indigo-600 font-medium">{suggestion.keyword}</span>
                                                    </div>
                                                    <div>
                                                        <span className="font-medium text-gray-700">記事の角度:</span>
                                                        <span className="ml-2 text-gray-800">{suggestion.angle}</span>
                                                    </div>
                                                    <div>
                                                        <span className="font-medium text-gray-700">想定読者:</span>
                                                        <span className="ml-2 text-gray-800">{suggestion.targetAudience}</span>
                                                    </div>
                                                    <div className="pt-2 border-t border-gray-200">
                                                        <span className="font-medium text-gray-700">推薦理由:</span>
                                                        <p className="ml-2 text-gray-700 mt-1">{suggestion.reasoningJa}</p>
                                                    </div>
                                                </div>

                                                <div className="mt-4 pt-3 border-t border-gray-200">
                                                    <div className="text-xs text-gray-600">
                                                        関連ニュース: {suggestion.relatedNews.length}件
                                                    </div>
                                                    <div className="flex justify-end mt-2">
                                                        <span className="text-sm text-indigo-600 font-medium hover:text-indigo-800">
                                                            このアイデアで記事生成 →
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Trending Topics */}
                            {insight.trending.length > 0 && (
                                <div>
                                    <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
                                        <span className="mr-2">📊</span>
                                        トレンドトピック
                                    </h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {insight.trending.slice(0, 6).map((topic, index) => (
                                            <div key={index} className="backdrop-blur-sm bg-white/60 p-4 rounded-xl border border-white/30">
                                                <div className="flex items-center justify-between mb-2">
                                                    <h4 className="font-bold text-gray-900">{topic.keyword}</h4>
                                                    <div className="flex items-center space-x-2">
                                                        <span className="text-sm text-gray-600">スコア:</span>
                                                        <span className="text-sm font-bold text-indigo-600">
                                                            {topic.relevanceScore.toFixed(1)}
                                                        </span>
                                                    </div>
                                                </div>
                                                <p className="text-sm text-gray-700 mb-2">{topic.suggestedAngle}</p>
                                                <div className="text-xs text-gray-600">
                                                    関連記事: {topic.articles.length}件
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    ) : null}
                </div>
            </div>
        </div>
    );
};

export default TrendingTopicsPanel;