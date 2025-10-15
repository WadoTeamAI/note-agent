
import React from 'react';
import { ProcessStep } from '../../types';
import { ALL_STEPS, ALL_STEPS_WITH_YOUTUBE, isYouTubeURL } from '../../config/constants';

interface StepIndicatorProps {
    currentStep: ProcessStep;
    error: string | null;
    keyword?: string;
    generatedImage?: string | null; // Base64画像データまたはURL
}

const StepIndicator: React.FC<StepIndicatorProps> = ({ currentStep, error, keyword = '', generatedImage = null }) => {
    if (currentStep === ProcessStep.IDLE) return null;

    // YouTube URLかどうかで使用するステップ配列を決定
    const steps = isYouTubeURL(keyword) ? ALL_STEPS_WITH_YOUTUBE : ALL_STEPS;
    const currentIndex = steps.findIndex(step => step === currentStep);
    
    // 8段階ワークフローのステップ詳細情報（ファクトチェック追加）
    const stepDetails = [
        { step: ProcessStep.RESEARCH, icon: '🔬', label: 'リサーチ', image: '/images/status/lZVPMSIq_400x400のコピー.jpg' },
        { step: ProcessStep.ANALYZING, icon: '📊', label: 'SEO分析', image: '/images/status/わどさん (3).png' },
        { step: ProcessStep.OUTLINING, icon: '📝', label: '構成作成', image: '/images/status/わどさん (2).png' },
        { step: ProcessStep.WRITING, icon: '✍️', label: '記事執筆', image: '/images/status/ChatGPT_Image_202577_15_44_59.png' },
        { step: ProcessStep.FACT_CHECKING, icon: '✓', label: 'ファクトチェック', image: '/images/status/lZVPMSIq_400x400のコピー.jpg' },
        { step: ProcessStep.GENERATING_IMAGE, icon: '🖼️', label: '画像生成', image: '/images/status/ChatGPT_Image_202577_15_44_59.png' },
        { step: ProcessStep.GENERATING_X_POSTS, icon: '🐦', label: 'X告知文', image: '/images/status/わどさん (3).png' },
    ];

    const progressPercentage = currentStep === ProcessStep.DONE ? 100 : Math.round(((currentIndex + 1) / steps.length) * 100);
    
    return (
        <div className="w-full backdrop-blur-lg bg-white/70 p-6 md:p-8 rounded-2xl shadow-xl border border-white/20 mb-8">
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                    生成ステータス
                </h2>
                <div className="flex items-center space-x-3">
                    <span className={`text-sm font-bold px-4 py-2 rounded-full backdrop-blur-sm border ${
                        currentStep === ProcessStep.DONE 
                            ? 'bg-green-100/80 text-green-700 border-green-200' 
                            : currentStep === ProcessStep.ERROR 
                            ? 'bg-red-100/80 text-red-700 border-red-200' 
                            : 'bg-blue-100/80 text-blue-700 border-blue-200'
                    }`}>
                        {currentStep === ProcessStep.DONE ? '✅ 完了' : currentStep === ProcessStep.ERROR ? '❌ エラー' : '⚡ 進行中'}
                    </span>
                    <span className="text-lg font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                        {progressPercentage}%
                    </span>
                </div>
            </div>
            
            {/* 進捗バー */}
            <div className="relative mb-8">
                <div className="h-4 bg-gradient-to-r from-gray-100 to-gray-200 rounded-full overflow-hidden shadow-inner">
                    <div 
                        style={{ width: `${progressPercentage}%` }} 
                        className={`h-full transition-all duration-1000 ease-out rounded-full ${
                            currentStep === ProcessStep.ERROR 
                                ? 'bg-gradient-to-r from-red-400 to-red-500' 
                                : 'bg-gradient-to-r from-indigo-400 via-purple-500 to-pink-500'
                        } relative overflow-hidden`}
                    >
                        <div className="absolute inset-0 bg-gradient-to-r from-white/30 to-transparent"></div>
                    </div>
                </div>
            </div>

            {/* ステップ詳細表示 */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 md:gap-6 mb-6">
                {stepDetails.filter(detail => steps.includes(detail.step)).map((detail, index) => {
                    const isCompleted = steps.indexOf(detail.step) < currentIndex;
                    const isCurrent = detail.step === currentStep;
                    const isPending = steps.indexOf(detail.step) > currentIndex;
                    
                    return (
                        <div key={detail.step} className="text-center group">
                            <div className={`relative w-12 h-12 md:w-14 md:h-14 mx-auto mb-3 rounded-2xl flex items-center justify-center text-lg md:text-xl font-medium shadow-lg transition-all duration-300 ${
                                isCompleted 
                                    ? 'bg-gradient-to-br from-green-400 to-green-500 text-white shadow-green-200 scale-105' 
                                    : isCurrent 
                                    ? 'bg-gradient-to-br from-indigo-400 via-purple-500 to-pink-500 text-white shadow-purple-200 animate-pulse scale-110' 
                                    : 'bg-gradient-to-br from-gray-200 to-gray-300 text-gray-500 shadow-gray-100'
                            } group-hover:scale-110`}>
                                {isCompleted ? (
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                    </svg>
                                ) : (
                                    <div className="relative w-full h-full">
                                        <img 
                                            src={detail.image} 
                                            alt={detail.label}
                                            className="w-full h-full object-cover rounded-xl"
                                            onError={(e) => {
                                                // 画像読み込みエラー時は絵文字にフォールバック
                                                const target = e.target as HTMLImageElement;
                                                target.style.display = 'none';
                                                const parent = target.parentElement;
                                                if (parent) {
                                                    parent.innerHTML = detail.icon;
                                                    parent.className += ' flex items-center justify-center text-lg font-medium';
                                                }
                                            }}
                                        />
                                        {isCurrent && (
                                            <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-white/30 to-transparent flex items-center justify-center">
                                                <div className="w-6 h-6 border-2 border-white rounded-full animate-spin border-t-transparent"></div>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                            <p className={`text-sm font-semibold transition-colors duration-200 ${
                                isCompleted 
                                    ? 'text-green-600' 
                                    : isCurrent 
                                    ? 'bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent' 
                                    : 'text-gray-500'
                            }`}>
                                {detail.label}
                            </p>
                        </div>
                    );
                })}
            </div>
            
            {/* 現在のステップメッセージ */}
            {currentStep !== ProcessStep.DONE && currentStep !== ProcessStep.ERROR && (
                <div className="text-center">
                    <p className="text-lg font-medium bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent animate-pulse">
                        {currentStep}
                    </p>
                    <div className="flex justify-center mt-3">
                        <div className="flex space-x-1">
                            <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce"></div>
                            <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                            <div className="w-2 h-2 bg-pink-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                        </div>
                    </div>
                </div>
            )}

            {/* エラー表示 */}
            {error && (
                <div className="mt-6 p-4 backdrop-blur-sm bg-red-50/80 border border-red-200 rounded-xl">
                    <div className="flex items-center justify-center">
                        <svg className="w-5 h-5 text-red-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <p className="text-red-700 font-medium">{error}</p>
                    </div>
                </div>
            )}
        </div>
    );
};

export default StepIndicator;
