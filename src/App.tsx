import React, { useState } from 'react';
import { Tone, Audience, FormData } from './types';
import { TONE_OPTIONS, AUDIENCE_OPTIONS } from './config/constants';
import { useArticleGeneration } from './hooks/useArticleGeneration';
import InputGroup from './components/forms/InputGroup';
import StepIndicator from './components/feedback/StepIndicator';
import OutputDisplay from './components/display/OutputDisplay';
import DiagramDisplay from './components/display/DiagramDisplay';
import BatchGenerator from './components/batch/BatchGenerator';
import TrendingTopicsPanel from './components/news/TrendingTopicsPanel';
import { ArticleGenerationSuggestion } from './types/news.types';

const App: React.FC = () => {
    const [formData, setFormData] = useState<FormData>({
        keyword: '副業 始め方',
        tone: Tone.POLITE,
        audience: Audience.BEGINNER,
        targetLength: 2500,
        imageTheme: 'PC作業をする人',
        imageOptions: {
            eyecatch: true,
            inlineGraphics: true
        }
    });
    const [showHistoryPanel, setShowHistoryPanel] = useState<boolean>(false);
    const [showBatchGenerator, setShowBatchGenerator] = useState<boolean>(false);
    const [showTrendingPanel, setShowTrendingPanel] = useState<boolean>(false);
    
    const { 
        isLoading, 
        currentStep, 
        output, 
        diagrams, 
        error, 
        generateArticle, 
        reset 
    } = useArticleGeneration();

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: name === 'targetLength' ? parseInt(value, 10) : value,
        }));
    };

    const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            imageOptions: {
                ...prev.imageOptions,
                [name]: checked
            }
        }));
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        await generateArticle(formData);
    };

    const handleSuggestionSelect = (suggestion: ArticleGenerationSuggestion) => {
        // 提案された記事の設定をフォームに反映
        setFormData(prev => ({
            ...prev,
            keyword: suggestion.keyword,
            // 読者層を推定してマッピング
            audience: suggestion.targetAudience.includes('初心者') ? Audience.BEGINNER : 
                     suggestion.targetAudience.includes('ビジネス') ? Audience.BUSINESS_PERSON : 
                     Audience.GENERAL
        }));
        
        setShowTrendingPanel(false);
        
        // 自動的に記事生成を開始（オプション）
        // generateArticle(newFormData);
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50 to-pink-50 text-gray-800 font-sans relative overflow-hidden">
            {/* Animated Background */}
            
            {/* Header */}
            <header className="relative backdrop-blur-sm bg-white/80 border-b border-white/20 shadow-lg">
                <div className="container mx-auto px-6 py-6">
                    <div className="flex justify-between items-center">
                        <div className="flex-1 text-center">
                            <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent mb-2">
                                note記事自動生成エージェント
                            </h1>
                            <p className="text-gray-600 text-lg font-medium">noteの記事作成をAIで自動化し、あなたの執筆活動をサポートします</p>
                        </div>
                        <div className="flex space-x-3">
                            <button
                                onClick={() => setShowTrendingPanel(true)}
                                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
                            >
                                📈 トレンド
                            </button>
                            <button
                                onClick={() => setShowBatchGenerator(true)}
                                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium"
                            >
                                📚 バッチ生成
                            </button>
                            <button
                                onClick={() => setShowHistoryPanel(true)}
                                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium"
                            >
                                📋 履歴
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            <main className="relative container mx-auto px-4 md:px-6 py-8 md:py-12">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
                    {/* Left Column: Form */}
                    <div className="lg:col-span-4">
                        <div className="backdrop-blur-lg bg-white/70 p-6 md:p-8 rounded-2xl shadow-xl border border-white/20 hover:shadow-2xl transition-all duration-300">
                            <h2 className="text-2xl font-bold mb-8 bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent border-b border-indigo-100 pb-4">
                                記事設定
                            </h2>
                            <form onSubmit={handleSubmit} className="space-y-6">
                                <InputGroup label="記事のテーマ・キーワード or YouTube URL" id="keyword" value={formData.keyword} onChange={handleChange} placeholder="例: 副業 始め方 または https://www.youtube.com/watch?v=..." required />
                                <InputGroup label="文体 (トーン)" id="tone" as="select" options={TONE_OPTIONS} value={formData.tone} onChange={handleChange} />
                                <InputGroup label="想定する読者層" id="audience" as="select" options={AUDIENCE_OPTIONS} value={formData.audience} onChange={handleChange} />
                                <InputGroup label="目安文字数" id="targetLength" type="number" value={formData.targetLength} onChange={handleChange} />
                                <InputGroup label="画像テーマ" id="imageTheme" value={formData.imageTheme} onChange={handleChange} placeholder="例: PC作業をする人、カフェで読書する女性" />

                                {/* 画像生成オプション */}
                                <div className="space-y-3">
                                    <label className="block text-sm font-semibold text-gray-700 mb-3">
                                        画像生成オプション
                                    </label>
                                    <div className="space-y-2">
                                        <label className="flex items-center space-x-3">
                                            <input
                                                type="checkbox"
                                                name="eyecatch"
                                                checked={formData.imageOptions?.eyecatch || false}
                                                onChange={handleCheckboxChange}
                                                className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                                            />
                                            <span className="text-sm text-gray-700">アイキャッチ画像を生成</span>
                                        </label>
                                        <label className="flex items-center space-x-3">
                                            <input
                                                type="checkbox"
                                                name="inlineGraphics"
                                                checked={formData.imageOptions?.inlineGraphics || false}
                                                onChange={handleCheckboxChange}
                                                className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                                            />
                                            <span className="text-sm text-gray-700">📊 記事内図解を自動生成（Mermaid.js）</span>
                                        </label>
                                    </div>
                                    <p className="text-xs text-gray-500 mt-2">
                                        💡 記事内図解では、プロセス図、比較表、タイムラインなどを自動生成します
                                    </p>
                                </div>

                                <button 
                                    type="submit" 
                                    disabled={isLoading} 
                                    className="w-full mt-8 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white font-bold py-4 px-6 rounded-xl hover:from-indigo-600 hover:via-purple-600 hover:to-pink-600 focus:outline-none focus:ring-4 focus:ring-purple-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 text-lg shadow-lg hover:shadow-xl transform hover:scale-[1.02] active:scale-[0.98]"
                                >
                                    {isLoading ? (
                                        <span className="flex items-center justify-center">
                                            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                            </svg>
                                            生成中...
                                        </span>
                                    ) : '記事を生成する ✨'}
                                </button>
                            </form>
                        </div>
                    </div>

                    {/* Right Column: Status & Output */}
                    <div className="lg:col-span-8">
                        {isLoading || error ? (
                            <StepIndicator currentStep={currentStep} error={error} keyword={formData.keyword} />
                        ) : null}

                        {output && !isLoading ? (
                            <div className="space-y-8">
                                <OutputDisplay output={output} />
                                {diagrams.length > 0 && (
                                    <DiagramDisplay 
                                        diagrams={diagrams}
                                        onCopyDiagram={(diagram) => {
                                            console.log('Diagram copied:', diagram.title);
                                        }}
                                    />
                                )}
                            </div>
                        ) : !isLoading && !error && currentStep === ProcessStep.IDLE ? (
                            <div className="backdrop-blur-lg bg-white/70 p-8 md:p-12 rounded-2xl shadow-xl border border-white/20 text-center">
                                <div className="mb-6">
                                    <div className="w-20 h-20 mx-auto bg-gradient-to-r from-indigo-400 to-purple-400 rounded-full flex items-center justify-center mb-4">
                                        <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                        </svg>
                                    </div>
                                </div>
                                <h2 className="text-2xl md:text-3xl font-bold text-gray-700 mb-4">準備完了</h2>
                                <p className="text-gray-600 text-lg leading-relaxed">
                                    左側のフォームに必要な情報を入力し、<br />
                                    「記事を生成する」ボタンを押してください
                                </p>
                            </div>
                        ) : null}
                    </div>
                </div>
            </main>

            {/* バッチ生成パネル */}
            {showBatchGenerator && (
                <BatchGenerator onClose={() => setShowBatchGenerator(false)} />
            )}

            {/* 履歴パネル - Phase 2で実装予定 */}
            {/* <HistoryPanel
                isOpen={showHistoryPanel}
                onClose={() => setShowHistoryPanel(false)}
                onSelectHistory={(history) => {
                    // 履歴から記事を復元
                    if (history.markdown_content && history.meta_description) {
                        setOutput({
                            markdownContent: history.markdown_content,
                            imageUrl: history.image_url || '',
                            metaDescription: history.meta_description,
                        });
                        setCurrentStep(ProcessStep.DONE);
                    }
                }}
            /> */}

        </div>
    );
};

export default App;