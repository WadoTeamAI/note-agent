import React, { useState } from 'react';
import { Tone, Audience } from '../../types';
import { TONE_OPTIONS, AUDIENCE_OPTIONS } from '../../config/constants';
import { BatchGenerationRequest, BatchResults } from '../../types/batch.types';
import { BatchArticleGenerator } from '../../services/batch/batchGenerator';
import BatchProgress from './BatchProgress';
import BatchResultsDisplay from './BatchResultsDisplay';

interface BatchGeneratorProps {
    onClose: () => void;
}

const BatchGenerator: React.FC<BatchGeneratorProps> = ({ onClose }) => {
    const [keywords, setKeywords] = useState<string>('');
    const [tone, setTone] = useState<Tone>(Tone.POLITE);
    const [audience, setAudience] = useState<Audience>(Audience.BEGINNER);
    const [targetLength, setTargetLength] = useState<number>(2500);
    const [imageTheme, setImageTheme] = useState<string>('PC作業をする人');
    const [maxConcurrentJobs, setMaxConcurrentJobs] = useState<number>(2);
    
    const [isGenerating, setIsGenerating] = useState<boolean>(false);
    const [generator] = useState(() => new BatchArticleGenerator());
    const [results, setResults] = useState<BatchResults | null>(null);
    const [error, setError] = useState<string | null>(null);

    const keywordList = keywords.split('\n').filter(k => k.trim()).map(k => k.trim());

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (keywordList.length === 0) {
            setError('キーワードを入力してください');
            return;
        }

        if (keywordList.length > 20) {
            setError('一度に処理できるキーワードは20個までです');
            return;
        }

        setError(null);
        setIsGenerating(true);
        setResults(null);

        const request: BatchGenerationRequest = {
            keywords: keywordList,
            tone,
            audience,
            targetLength,
            imageTheme,
            config: {
                maxConcurrentJobs
            }
        };

        try {
            generator.setProgressCallback((progress) => {
                setResults(prev => prev ? { ...prev, progress } : null);
            });

            const batchResults = await generator.startBatch(request);
            setResults(batchResults);
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'バッチ生成中にエラーが発生しました';
            setError(errorMessage);
        } finally {
            setIsGenerating(false);
        }
    };

    const handleCancel = () => {
        if (isGenerating) {
            generator.cancelBatch();
            setIsGenerating(false);
        }
    };

    const estimatedTime = keywordList.length * 90; // 90 seconds per article estimate

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white/90 backdrop-blur-lg rounded-2xl shadow-2xl border border-white/30 w-full max-w-4xl max-h-[90vh] overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-white/20">
                    <h2 className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                        📚 バッチ記事生成
                    </h2>
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
                    {!isGenerating && !results ? (
                        /* Configuration Form */
                        <div className="p-6 space-y-6">
                            <form onSubmit={handleSubmit} className="space-y-6">
                                {/* Keywords Input */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        記事キーワード（1行に1つずつ入力、最大20個）
                                    </label>
                                    <textarea
                                        value={keywords}
                                        onChange={(e) => setKeywords(e.target.value)}
                                        className="w-full h-32 px-4 py-3 backdrop-blur-sm bg-white/60 border border-white/30 rounded-xl shadow-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200 resize-none"
                                        placeholder={`副業 始め方\nフリーランス 税金\nリモートワーク メリット\nプログラミング 学習方法`}
                                        required
                                    />
                                    <div className="flex justify-between text-sm text-gray-500 mt-2">
                                        <span>{keywordList.length} キーワード</span>
                                        <span>推定時間: {Math.ceil(estimatedTime / 60)}分</span>
                                    </div>
                                </div>

                                {/* Settings Grid */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">文体</label>
                                        <select 
                                            value={tone} 
                                            onChange={(e) => setTone(e.target.value as Tone)}
                                            className="w-full px-4 py-3 backdrop-blur-sm bg-white/60 border border-white/30 rounded-xl shadow-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200"
                                        >
                                            {TONE_OPTIONS.map(option => (
                                                <option key={option} value={option}>
                                                    {option}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">読者層</label>
                                        <select 
                                            value={audience} 
                                            onChange={(e) => setAudience(e.target.value as Audience)}
                                            className="w-full px-4 py-3 backdrop-blur-sm bg-white/60 border border-white/30 rounded-xl shadow-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200"
                                        >
                                            {AUDIENCE_OPTIONS.map(option => (
                                                <option key={option} value={option}>
                                                    {option}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">目安文字数</label>
                                        <select 
                                            value={targetLength} 
                                            onChange={(e) => setTargetLength(parseInt(e.target.value))}
                                            className="w-full px-4 py-3 backdrop-blur-sm bg-white/60 border border-white/30 rounded-xl shadow-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200"
                                        >
                                            <option value={2500}>2,500文字</option>
                                            <option value={5000}>5,000文字</option>
                                            <option value={10000}>10,000文字</option>
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">同時処理数</label>
                                        <select 
                                            value={maxConcurrentJobs} 
                                            onChange={(e) => setMaxConcurrentJobs(parseInt(e.target.value))}
                                            className="w-full px-4 py-3 backdrop-blur-sm bg-white/60 border border-white/30 rounded-xl shadow-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200"
                                        >
                                            <option value={1}>1件ずつ（安全）</option>
                                            <option value={2}>2件同時（推奨）</option>
                                            <option value={3}>3件同時（高速）</option>
                                        </select>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">画像テーマ</label>
                                    <input
                                        type="text"
                                        value={imageTheme}
                                        onChange={(e) => setImageTheme(e.target.value)}
                                        className="w-full px-4 py-3 backdrop-blur-sm bg-white/60 border border-white/30 rounded-xl shadow-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200"
                                        placeholder="PC作業をする人、カフェで読書する女性"
                                    />
                                </div>

                                {error && (
                                    <div className="p-4 backdrop-blur-sm bg-red-50/80 border border-red-200 rounded-xl">
                                        <p className="text-red-700 text-sm">{error}</p>
                                    </div>
                                )}

                                <div className="flex space-x-4">
                                    <button
                                        type="submit"
                                        disabled={keywordList.length === 0}
                                        className="flex-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 hover:from-indigo-600 hover:via-purple-600 hover:to-pink-600 text-white font-bold py-4 px-6 rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        🚀 バッチ生成開始
                                    </button>
                                    <button
                                        type="button"
                                        onClick={onClose}
                                        className="px-6 py-4 bg-gray-500 hover:bg-gray-600 text-white font-bold rounded-xl transition-colors"
                                    >
                                        キャンセル
                                    </button>
                                </div>
                            </form>

                            <div className="text-xs text-gray-500 bg-yellow-50/60 p-3 rounded-lg border border-yellow-200/30">
                                <strong>注意:</strong> バッチ生成は大量のAPI呼び出しを行います。料金制限やレート制限にご注意ください。
                                生成された内容は必ず確認してからご利用ください。
                            </div>
                        </div>
                    ) : isGenerating ? (
                        /* Progress Display */
                        <div className="p-6">
                            <BatchProgress 
                                generator={generator} 
                                onCancel={handleCancel}
                            />
                        </div>
                    ) : results ? (
                        /* Results Display */
                        <div className="p-6">
                            <BatchResultsDisplay results={results} />
                        </div>
                    ) : null}
                </div>
            </div>
        </div>
    );
};

export default BatchGenerator;