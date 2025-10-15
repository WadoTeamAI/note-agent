import React, { useState } from 'react';
import { Tone, Audience, FormData, FinalOutput, ProcessStep } from './types';
import { TONE_OPTIONS, AUDIENCE_OPTIONS } from './constants';
import * as geminiService from './services/geminiService';
import InputGroup from './components/InputGroup';
import StepIndicator from './components/StepIndicator';
import OutputDisplay from './components/OutputDisplay';

const App: React.FC = () => {
    const [formData, setFormData] = useState<FormData>({
        keyword: '副業 始め方',
        tone: Tone.POLITE,
        audience: Audience.BEGINNER,
        targetLength: 2500,
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
            setCurrentStep(ProcessStep.ANALYZING);
            const analysis = await geminiService.analyzeSerpResults(formData.keyword);

            setCurrentStep(ProcessStep.OUTLINING);
            const outline = await geminiService.createArticleOutline(analysis, formData.audience, formData.tone, formData.keyword);
            
            setCurrentStep(ProcessStep.WRITING);
            const markdownContent = await geminiService.writeArticle(outline, formData.targetLength, formData.tone, formData.audience);
            
            setCurrentStep(ProcessStep.GENERATING_IMAGE_PROMPT);
            const imagePrompt = await geminiService.createImagePrompt(outline.title, markdownContent);

            setCurrentStep(ProcessStep.GENERATING_IMAGE);
            const imageUrl = await geminiService.generateImage(imagePrompt);

            setOutput({ markdownContent, imageUrl, metaDescription: outline.metaDescription });
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
        <div className="min-h-screen bg-gray-100 text-gray-800 font-sans">
            <header className="bg-white shadow-md">
                <div className="container mx-auto px-6 py-4">
                    <h1 className="text-3xl font-bold text-gray-900">note記事自動生成エージェント</h1>
                    <p className="text-gray-600 mt-1">noteの記事作成をAIで自動化し、あなたの執筆活動をサポートします。</p>
                </div>
            </header>

            <main className="container mx-auto px-6 py-8">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    {/* Left Column: Form */}
                    <div className="lg:col-span-4">
                        <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow-md">
                            <h2 className="text-xl font-semibold mb-6 border-b pb-3">記事設定</h2>
                            <InputGroup label="記事のテーマ・キーワード" id="keyword" value={formData.keyword} onChange={handleChange} placeholder="例: 副業 始め方" required />
                            <InputGroup label="文体 (トーン)" id="tone" as="select" options={TONE_OPTIONS} value={formData.tone} onChange={handleChange} />
                            <InputGroup label="想定する読者層" id="audience" as="select" options={AUDIENCE_OPTIONS} value={formData.audience} onChange={handleChange} />
                            <InputGroup label="目安文字数" id="targetLength" type="number" value={formData.targetLength} onChange={handleChange} />

                            <button type="submit" disabled={isLoading} className="w-full mt-6 bg-indigo-600 text-white font-bold py-3 px-4 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors duration-300">
                                {isLoading ? '生成中...' : '記事を生成する'}
                            </button>
                        </form>
                    </div>

                    {/* Right Column: Status & Output */}
                    <div className="lg:col-span-8">
                        {isLoading || error ? (
                            <StepIndicator currentStep={currentStep} error={error} />
                        ) : null}

                        {output && !isLoading ? (
                            <OutputDisplay output={output} />
                        ) : !isLoading && !error && currentStep === ProcessStep.IDLE ? (
                             <div className="bg-white p-10 rounded-lg shadow-md text-center">
                                <h2 className="text-2xl font-semibold text-gray-700">準備完了</h2>
                                <p className="mt-2 text-gray-500">左側のフォームに必要な情報を入力し、「記事を生成する」ボタンを押してください。</p>
                            </div>
                        ) : null}
                    </div>
                </div>
            </main>
        </div>
    );
};

export default App;