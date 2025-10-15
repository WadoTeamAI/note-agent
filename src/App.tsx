import React, { useState } from 'react';
import { Tone, Audience, FormData, FinalOutput, ProcessStep } from './types';
import { TONE_OPTIONS, AUDIENCE_OPTIONS, isYouTubeURL } from './config/constants';
import * as geminiService from './services/ai/geminiService';
import { generateXPosts } from './services/social/xPostGenerator';
import InputGroup from './components/forms/InputGroup';
import StepIndicator from './components/feedback/StepIndicator';
import OutputDisplay from './components/display/OutputDisplay';

const App: React.FC = () => {
    const [formData, setFormData] = useState<FormData>({
        keyword: '副業 始め方',
        tone: Tone.POLITE,
        audience: Audience.BEGINNER,
        targetLength: 2500,
        imageTheme: 'PC作業をする人',
    });
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [currentStep, setCurrentStep] = useState<ProcessStep>(ProcessStep.IDLE);
    const [output, setOutput] = useState<FinalOutput | null>(null);
    const [error, setError] = useState<string | null>(null);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: name === 'targetLength' ? parseInt(value, 10) : value,
        }));
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);
        setOutput(null);
        setCurrentStep(ProcessStep.IDLE);

        try {
            // Step 0: 統合リサーチ
            setCurrentStep(ProcessStep.RESEARCH);
            // TODO: 統合リサーチ機能の実装
            
            // Step 1: SEO分析
            setCurrentStep(ProcessStep.ANALYZING);
            const analysis = await geminiService.analyzeSerpResults(formData.keyword);

            // Step 2: 記事構成生成
            setCurrentStep(ProcessStep.OUTLINING);
            const outline = await geminiService.createArticleOutline(analysis, formData.audience, formData.tone, formData.keyword);
            
            // Step 3: 本文生成
            setCurrentStep(ProcessStep.WRITING);
            const markdownContent = await geminiService.writeArticle(outline, formData.targetLength, formData.tone, formData.audience);
            
            // Step 4: 画像生成
            setCurrentStep(ProcessStep.GENERATING_IMAGE);
            const imagePrompt = await geminiService.createImagePrompt(outline.title, markdownContent, formData.imageTheme);
            const imageUrl = await geminiService.generateImage(imagePrompt);

            // Step 5: X告知文生成
            setCurrentStep(ProcessStep.GENERATING_X_POSTS);
            const xPosts = await generateXPosts({
                keyword: formData.keyword,
                articleTitle: outline.title,
                articleSummary: outline.metaDescription,
                tone: formData.tone,
                targetAudiences: ['初心者', '中級者', 'ビジネスパーソン', '主婦・主夫', '学生'],
            });

            setOutput({ 
                markdownContent, 
                imageUrl, 
                metaDescription: outline.metaDescription,
                xPosts 
            });
            setCurrentStep(ProcessStep.DONE);

        } catch (err) {
            console.error(err);
            const errorMessage = err instanceof Error ? err.message : '不明なエラーが発生しました。';
            setError(`エラー: ${errorMessage}`);
            setCurrentStep(ProcessStep.ERROR);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50 to-pink-50 text-gray-800 font-sans relative overflow-hidden">
            {/* Animated Background */}
            
            {/* Header */}
            <header className="relative backdrop-blur-sm bg-white/80 border-b border-white/20 shadow-lg">
                <div className="container mx-auto px-6 py-6">
                    <div className="text-center">
                        <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent mb-2">
                            note記事自動生成エージェント
                        </h1>
                        <p className="text-gray-600 text-lg font-medium">noteの記事作成をAIで自動化し、あなたの執筆活動をサポートします</p>
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
                            <OutputDisplay output={output} />
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

        </div>
    );
};

export default App;