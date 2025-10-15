import React, { useState, useRef } from 'react';
import { Tone, Audience, FormData, FinalOutput, ProcessStep } from './types';
import { TONE_OPTIONS, AUDIENCE_OPTIONS, isYouTubeURL } from './config/constants';
import * as geminiService from './services/ai/geminiService';
import { generateXPosts } from './services/social/xPostGenerator';
import { extractClaims, performFactCheck } from './services/research/tavilyService';
import InputGroup from './components/forms/InputGroup';
import StepIndicator from './components/feedback/StepIndicator';
import OutputDisplay from './components/display/OutputDisplay';
import BatchGenerator from './components/batch/BatchGenerator';
import TrendingTopicsPanel from './components/news/TrendingTopicsPanel';
import { VoiceIdeaProcessor } from './components/audio/VoiceIdeaProcessor';
import ThemeToggle from './components/theme/ThemeToggle';
import { ArticleGenerationSuggestion } from './types/news.types';
import ApprovalWorkflowPanel from './components/approval/ApprovalWorkflowPanel';
import { ApprovalWorkflowManager } from './services/approval/approvalWorkflow';
import { ApprovalWorkflow, StepType, OutlineApprovalData, ContentApprovalData, ImageApprovalData, XPostApprovalData } from './types/approval.types';
import ABTestPanel from './components/abtest/ABTestPanel';
import ABTestResultDisplay from './components/abtest/ABTestResultDisplay';
import { abtestService } from './services/abtest/abtestService';
import { ABTestResult, ABTestVersion, VariationType } from './types/abtest.types';
import AnalyticsDashboard from './components/analytics/AnalyticsDashboard';
import { AnalyticsService } from './services/analytics/analyticsService';
import { InteractionType } from './types/analytics.types';
import XPostManager from './components/social/XPostManager';
import { xPostExporter, PreparedPost } from './services/social/xPostExporter';

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
    const [showHistoryPanel, setShowHistoryPanel] = useState<boolean>(false);
    const [showBatchGenerator, setShowBatchGenerator] = useState<boolean>(false);
    const [showTrendingPanel, setShowTrendingPanel] = useState<boolean>(false);
    const [showVoiceProcessor, setShowVoiceProcessor] = useState<boolean>(false);
    const [showApprovalWorkflow, setShowApprovalWorkflow] = useState<boolean>(false);
    const [currentWorkflowId, setCurrentWorkflowId] = useState<string | null>(null);
    const [showABTestPanel, setShowABTestPanel] = useState<boolean>(false);
    const [abtestResult, setAbtestResult] = useState<ABTestResult | null>(null);
    const [isABTestRunning, setIsABTestRunning] = useState<boolean>(false);
    const [showAnalyticsDashboard, setShowAnalyticsDashboard] = useState<boolean>(false);
    const [showXPostManager, setShowXPostManager] = useState<boolean>(false);
    const [currentXPosts, setCurrentXPosts] = useState<PreparedPost[]>([]);
    
    // 承認ワークフローマネージャーの初期化
    const workflowManager = useRef(new ApprovalWorkflowManager());
    const analyticsService = useRef(new AnalyticsService());

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

        // 分析用のタイミング記録
        const stepTimings: Record<string, number> = {};
        const errors: any[] = [];
        const startTime = performance.now();

        try {
            // 承認ワークフローを作成
            const workflowId = await workflowManager.current.createWorkflow({
                keyword: formData.keyword,
                tone: formData.tone,
                audience: formData.audience,
                targetLength: formData.targetLength,
                imageTheme: formData.imageTheme
            });

            setCurrentWorkflowId(workflowId);

            // Step 1: SEO分析
            setCurrentStep(ProcessStep.ANALYZING);
            const stepStartTime = performance.now();
            const analysis = await geminiService.analyzeSerpResults(formData.keyword);
            stepTimings.analyzing = performance.now() - stepStartTime;

            // Step 2: 記事構成生成
            setCurrentStep(ProcessStep.OUTLINING);
            const outline = await geminiService.createArticleOutline(analysis, formData.audience, formData.tone, formData.keyword);
            
            // 構成承認データを設定
            const outlineData: OutlineApprovalData = {
                originalOutline: {
                    title: outline.title,
                    metaDescription: outline.metaDescription,
                    sections: outline.sections.map(section => ({
                        heading: section.heading,
                        subheadings: section.content ? [section.content] : []
                    }))
                }
            };
            await workflowManager.current.updateStepContent(workflowId, StepType.OUTLINE_REVIEW, outlineData);

            // Step 3: 本文生成
            setCurrentStep(ProcessStep.WRITING);
            const markdownContent = await geminiService.writeArticle(outline, formData.targetLength, formData.tone, formData.audience);
            
            // 本文承認データを設定
            const contentData: ContentApprovalData = {
                originalContent: markdownContent,
                wordCount: markdownContent.length
            };
            await workflowManager.current.updateStepContent(workflowId, StepType.CONTENT_REVIEW, contentData);

            // Step 4: ファクトチェック
            setCurrentStep(ProcessStep.FACT_CHECKING);
            const claims = await extractClaims(markdownContent, formData.keyword);
            const factCheckSummary = await performFactCheck({
                articleContent: markdownContent,
                claims: claims,
                keyword: formData.keyword,
            });
            
            // Step 5: 画像生成
            setCurrentStep(ProcessStep.GENERATING_IMAGE);
            const imagePrompt = await geminiService.createImagePrompt(outline.title, markdownContent, formData.imageTheme);
            const imageUrl = await geminiService.generateImage(imagePrompt);

            // 画像承認データを設定
            const imageData: ImageApprovalData = {
                originalImageUrl: imageUrl,
                originalPrompt: imagePrompt
            };
            await workflowManager.current.updateStepContent(workflowId, StepType.IMAGE_REVIEW, imageData);

            // Step 6: X告知文生成
            setCurrentStep(ProcessStep.GENERATING_X_POSTS);
            const xPosts = await generateXPosts({
                keyword: formData.keyword,
                articleTitle: outline.title,
                articleSummary: outline.metaDescription,
                tone: formData.tone,
                targetAudiences: ['初心者', '中級者', 'ビジネスパーソン', '主婦・主夫', '学生'],
            });

            // X投稿をエクスポート用に準備
            const preparedPosts = xPostExporter.preparePosts(xPosts, {
                articleTitle: outline.title,
                keyword: formData.keyword
            });
            setCurrentXPosts(preparedPosts);

            // X投稿承認データを設定
            const allPosts = [
                ...xPosts.shortPosts.map(post => ({ type: post.type, content: post.text, audience: post.target })),
                ...xPosts.longPosts.map(post => ({ type: post.type, content: post.text, audience: post.target }))
            ];
            const xPostData: XPostApprovalData = {
                originalPosts: allPosts
            };
            await workflowManager.current.updateStepContent(workflowId, StepType.XPOST_REVIEW, xPostData);

            const finalOutput = { 
                markdownContent, 
                imageUrl, 
                metaDescription: outline.metaDescription,
                xPosts,
                factCheckSummary
            };
            
            // 最終出力をワークフローに設定
            await workflowManager.current.setFinalOutput(workflowId, finalOutput);
            
            setOutput(finalOutput);
            setCurrentStep(ProcessStep.DONE);

            // 承認ワークフローパネルを表示
            setShowApprovalWorkflow(true);

            // 分析データを記録
            try {
                await analyticsService.current.trackArticleGeneration(
                    formData,
                    finalOutput,
                    stepTimings,
                    errors
                );
            } catch (analyticsError) {
                console.warn('Analytics tracking failed:', analyticsError);
            }

        } catch (err) {
            console.error(err);
            const errorMessage = err instanceof Error ? err.message : '不明なエラーが発生しました。';
            setError(`エラー: ${errorMessage}`);
            setCurrentStep(ProcessStep.ERROR);
            
            // エラーを分析サービスに記録
            if (err instanceof Error) {
                analyticsService.current.trackError(err, { formData, stepTimings });
            }
        } finally {
            setIsLoading(false);
        }
    };

    const handleSuggestionSelect = (suggestion: ArticleGenerationSuggestion) => {
        // 提案された記事の設定をフォームに反映
        setFormData(prev => ({
            ...prev,
            keyword: suggestion.keyword,
            // 読者層を推定してマッピング
            audience: suggestion.targetAudience.includes('初心者') ? Audience.BEGINNER : 
                     suggestion.targetAudience.includes('中級者') ? Audience.INTERMEDIATE : 
                     Audience.EXPERT
        }));
        
        setShowTrendingPanel(false);
        
        // 自動的に記事生成を開始（オプション）
        // generateArticle(newFormData);
    };

    const handleVoiceIdeaProcessed = (voiceFormData: Partial<FormData>) => {
        // 音声アイデアの結果をフォームに反映
        setFormData(prev => ({
            ...prev,
            ...voiceFormData
        }));
        
        setShowVoiceProcessor(false);
        
        // 音声アイデアが処理されたことを表示
        console.log('音声アイデアが適用されました:', voiceFormData);
    };

    const handleApprovalWorkflowComplete = (workflow: ApprovalWorkflow) => {
        // 承認完了時の処理
        console.log('承認ワークフローが完了しました:', workflow);
        
        // 最終出力を設定
        if (workflow.finalOutput) {
            setOutput(workflow.finalOutput);
        }
        
        // パネルを閉じる
        setShowApprovalWorkflow(false);
        setCurrentWorkflowId(null);
        
        // 成功メッセージを表示
        alert('記事の承認が完了しました！公開準備に進んでください。');
    };

    const handleABTestStart = async (versionCount: number, variationTypes: VariationType[]) => {
        setShowABTestPanel(false);
        setIsABTestRunning(true);
        setError(null);

        try {
            const result = await abtestService.runABTest({
                keyword: formData.keyword,
                tone: formData.tone,
                audience: formData.audience,
                targetLength: formData.targetLength,
                imageTheme: formData.imageTheme,
                versionCount,
                variationTypes,
            });

            setAbtestResult(result);
        } catch (err) {
            console.error('A/Bテスト実行エラー:', err);
            setError(err instanceof Error ? err.message : 'A/Bテストの実行に失敗しました');
        } finally {
            setIsABTestRunning(false);
        }
    };

    const handleABTestVersionSelect = (version: ABTestVersion) => {
        if (version.output) {
            setOutput(version.output);
            setAbtestResult(null);
        }
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
                        <div className="flex space-x-3 items-center">
                            <ThemeToggle />
                            <button
                                onClick={() => setShowVoiceProcessor(true)}
                                className="px-4 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700 transition-colors font-medium"
                            >
                                🎙️ 音声入力
                            </button>
                            <button
                                onClick={() => setShowABTestPanel(true)}
                                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                            >
                                🧪 A/Bテスト
                            </button>
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
                            <button
                                onClick={() => setShowApprovalWorkflow(true)}
                                className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors font-medium"
                            >
                                👥 承認フロー
                            </button>
                            <button
                                onClick={() => setShowAnalyticsDashboard(true)}
                                className="px-4 py-2 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 transition-colors font-medium"
                            >
                                📊 分析
                            </button>
                            <button
                                onClick={() => setShowXPostManager(true)}
                                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                            >
                                🐦 X投稿管理
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

            {/* トレンド記事提案パネル */}
            {showTrendingPanel && (
                <TrendingTopicsPanel 
                    onClose={() => setShowTrendingPanel(false)}
                    onSelectSuggestion={handleSuggestionSelect}
                />
            )}

            {/* バッチ生成パネル */}
            {showBatchGenerator && (
                <BatchGenerator onClose={() => setShowBatchGenerator(false)} />
            )}

            {/* 音声入力プロセッサー */}
            <VoiceIdeaProcessor 
                isVisible={showVoiceProcessor}
                onClose={() => setShowVoiceProcessor(false)}
                onIdeaProcessed={handleVoiceIdeaProcessed}
            />

            {/* A/Bテストパネル */}
            {showABTestPanel && (
                <ABTestPanel 
                    formData={formData}
                    onClose={() => setShowABTestPanel(false)}
                    onStart={handleABTestStart}
                />
            )}

            {/* A/Bテスト結果表示 */}
            {abtestResult && (
                <ABTestResultDisplay
                    result={abtestResult}
                    onClose={() => setAbtestResult(null)}
                    onSelectVersion={handleABTestVersionSelect}
                />
            )}

            {/* A/Bテスト実行中表示 */}
            {isABTestRunning && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center">
                    <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-2xl text-center max-w-md">
                        <div className="inline-block animate-spin rounded-full h-16 w-16 border-4 border-purple-200 border-t-purple-600 mb-4"></div>
                        <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                            🧪 A/Bテスト実行中
                        </h3>
                        <p className="text-gray-600 dark:text-gray-400">
                            複数バージョンの記事を生成しています...<br />
                            完了まで数分かかる場合があります
                        </p>
                    </div>
                </div>
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

            {/* 承認ワークフローパネル */}
            {showApprovalWorkflow && currentWorkflowId && (
                <ApprovalWorkflowPanel
                    workflowId={currentWorkflowId}
                    workflowManager={workflowManager.current}
                    onClose={() => setShowApprovalWorkflow(false)}
                    onComplete={handleApprovalWorkflowComplete}
                />
            )}

            {/* 分析ダッシュボード */}
            <AnalyticsDashboard
                isOpen={showAnalyticsDashboard}
                onClose={() => setShowAnalyticsDashboard(false)}
            />

            {/* X投稿管理 */}
            <XPostManager
                isOpen={showXPostManager}
                onClose={() => setShowXPostManager(false)}
                initialPosts={currentXPosts}
            />

        </div>
    );
};

export default App;