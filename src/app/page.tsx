'use client';

import { useState, useRef } from 'react';
import dynamic from 'next/dynamic';
import { Tone, Audience, FormData, FinalOutput, ProcessStep } from '@/types';
import { TONE_OPTIONS, AUDIENCE_OPTIONS } from '@/config/constants';
import * as geminiService from '@/services/ai/geminiService';
import { generateXPosts } from '@/services/social/xPostGenerator';
import { extractClaims, performFactCheck } from '@/services/research/tavilyService';
import InputGroup from '@/components/forms/InputGroup';
import StepIndicator from '@/components/feedback/StepIndicator';
import OutputDisplay from '@/components/display/OutputDisplay';
import BatchGenerator from '@/components/batch/BatchGenerator';
import TrendingTopicsPanel from '@/components/news/TrendingTopicsPanel';
import { ArticleGenerationSuggestion } from '@/types/news.types';
import ApprovalWorkflowPanel from '@/components/approval/ApprovalWorkflowPanel';
import { ApprovalWorkflowManager } from '@/services/approval/approvalWorkflow';
import { ApprovalWorkflow, StepType, OutlineApprovalData, ContentApprovalData, ImageApprovalData, XPostApprovalData } from '@/types/approval.types';
import { ABTestPanel } from '@/components/abtest/ABTestPanel';

// Dynamic imports for client-side only components
const VoiceIdeaProcessor = dynamic(
  () => import('@/components/audio/VoiceIdeaProcessor').then(mod => ({ default: mod.VoiceIdeaProcessor })),
  { ssr: false }
);

const ThemeToggle = dynamic(
  () => import('@/components/theme/ThemeToggle'),
  { ssr: false }
);

export default function HomePage() {
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
    
    // 承認ワークフローマネージャーの初期化
    const workflowManager = useRef(new ApprovalWorkflowManager());

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
            const analysis = await geminiService.analyzeSerpResults(formData.keyword);

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

        } catch (err) {
            console.error(err);
            const errorMessage = err instanceof Error ? err.message : '不明なエラーが発生しました。';
            setError(`エラー: ${errorMessage}`);
            setCurrentStep(ProcessStep.ERROR);
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

    return (
        <div className="min-h-screen text-gray-800 font-sans relative overflow-hidden">
            {/* Header */}
            <header className="relative glass border-b border-white/20 shadow-lg">
                <div className="container mx-auto px-6 py-6">
                    <div className="flex justify-between items-center">
                        <div className="flex-1 text-center">
                            <h1 className="text-4xl md:text-5xl font-bold gradient-text mb-2">
                                note記事自動生成エージェント
                            </h1>
                            <p className="text-gray-600 dark:text-gray-300 text-lg font-medium">
                                noteの記事作成をAIで自動化し、あなたの執筆活動をサポートします
                            </p>
                        </div>
                        <div className="flex space-x-3 items-center">
                            <ThemeToggle />
                            <button
                                onClick={() => setShowVoiceProcessor(true)}
                                className="btn btn-secondary"
                            >
                                🎙️ 音声入力
                            </button>
                            <button
                                onClick={() => setShowABTestPanel(true)}
                                className="btn btn-primary"
                            >
                                🧪 A/Bテスト
                            </button>
                            <button
                                onClick={() => setShowTrendingPanel(true)}
                                className="btn btn-success"
                            >
                                📈 トレンド
                            </button>
                            <button
                                onClick={() => setShowBatchGenerator(true)}
                                className="btn-secondary"
                            >
                                📚 バッチ生成
                            </button>
                            <button
                                onClick={() => setShowHistoryPanel(true)}
                                className="btn btn-primary"
                            >
                                📋 履歴
                            </button>
                            <button
                                onClick={() => setShowApprovalWorkflow(true)}
                                className="btn btn-warning"
                            >
                                👥 承認フロー
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            <main className="relative container mx-auto px-4 md:px-6 py-8 md:py-12">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
                    {/* Left Column: Form */}
                    <div className="lg:col-span-4">
                        <div className="card animate-fade-in">
                            <h2 className="text-2xl font-bold mb-8 gradient-text border-b border-indigo-100 dark:border-indigo-700 pb-4">
                                記事設定
                            </h2>
                            <form onSubmit={handleSubmit} className="space-y-6">
                                <InputGroup 
                                    label="記事のテーマ・キーワード or YouTube URL" 
                                    id="keyword" 
                                    value={formData.keyword} 
                                    onChange={handleChange} 
                                    placeholder="例: 副業 始め方 または https://www.youtube.com/watch?v=..." 
                                    required 
                                />
                                <InputGroup 
                                    label="文体 (トーン)" 
                                    id="tone" 
                                    as="select" 
                                    options={TONE_OPTIONS} 
                                    value={formData.tone} 
                                    onChange={handleChange} 
                                />
                                <InputGroup 
                                    label="想定する読者層" 
                                    id="audience" 
                                    as="select" 
                                    options={AUDIENCE_OPTIONS} 
                                    value={formData.audience} 
                                    onChange={handleChange} 
                                />
                                <InputGroup 
                                    label="目安文字数" 
                                    id="targetLength" 
                                    type="number" 
                                    value={formData.targetLength} 
                                    onChange={handleChange} 
                                />
                                <InputGroup 
                                    label="画像テーマ" 
                                    id="imageTheme" 
                                    value={formData.imageTheme} 
                                    onChange={handleChange} 
                                    placeholder="例: PC作業をする人、カフェで読書する女性" 
                                />

                                <button 
                                    type="submit" 
                                    disabled={isLoading} 
                                    className="w-full mt-8 btn-primary py-4 text-lg animate-scale-in"
                                >
                                    {isLoading ? (
                                        <span className="flex items-center justify-center">
                                            <div className="loading-spinner w-5 h-5 mr-3" />
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
                            <div className="card text-center animate-fade-in">
                                <div className="mb-6">
                                    <div className="w-20 h-20 mx-auto bg-gradient-to-r from-indigo-400 to-purple-400 rounded-full flex items-center justify-center mb-4">
                                        <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                        </svg>
                                    </div>
                                </div>
                                <h2 className="text-2xl md:text-3xl font-bold text-gray-700 dark:text-gray-300 mb-4">準備完了</h2>
                                <p className="text-gray-600 dark:text-gray-400 text-lg leading-relaxed">
                                    左側のフォームに必要な情報を入力し、<br />
                                    「記事を生成する」ボタンを押してください
                                </p>
                            </div>
                        ) : null}
                    </div>
                </div>
            </main>

            {/* モーダル群 */}
            {showTrendingPanel && (
                <TrendingTopicsPanel 
                    onClose={() => setShowTrendingPanel(false)}
                    onSelectSuggestion={handleSuggestionSelect}
                />
            )}

            {showBatchGenerator && (
                <BatchGenerator onClose={() => setShowBatchGenerator(false)} />
            )}

            <VoiceIdeaProcessor 
                isVisible={showVoiceProcessor}
                onClose={() => setShowVoiceProcessor(false)}
                onIdeaProcessed={handleVoiceIdeaProcessed}
            />

            <ABTestPanel 
                isVisible={showABTestPanel}
                onClose={() => setShowABTestPanel(false)}
                initialFormData={formData}
            />

            {showApprovalWorkflow && currentWorkflowId && (
                <ApprovalWorkflowPanel
                    workflowId={currentWorkflowId}
                    workflowManager={workflowManager.current}
                    onClose={() => setShowApprovalWorkflow(false)}
                    onComplete={handleApprovalWorkflowComplete}
                />
            )}
        </div>
    );
}