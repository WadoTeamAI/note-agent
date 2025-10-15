
import React from 'react';
import { ProcessStep } from '../../types';
import { ALL_STEPS, ALL_STEPS_WITH_YOUTUBE, isYouTubeURL } from '../../config/constants';

interface StepIndicatorProps {
    currentStep: ProcessStep;
    error: string | null;
    keyword?: string;
}

const StepIndicator: React.FC<StepIndicatorProps> = ({ currentStep, error, keyword = '' }) => {
    if (currentStep === ProcessStep.IDLE) return null;

    // YouTube URLかどうかで使用するステップ配列を決定
    const steps = isYouTubeURL(keyword) ? ALL_STEPS_WITH_YOUTUBE : ALL_STEPS;
    const currentIndex = steps.findIndex(step => step === currentStep);
    
    // 7段階ワークフローのステップ詳細情報
    const stepDetails = [
        { step: ProcessStep.RESEARCH, icon: '🔬', label: 'リサーチ' },
        { step: ProcessStep.ANALYZING, icon: '📊', label: 'SEO分析' },
        { step: ProcessStep.OUTLINING, icon: '📝', label: '構成作成' },
        { step: ProcessStep.WRITING, icon: '✍️', label: '記事執筆' },
        { step: ProcessStep.GENERATING_IMAGE, icon: '🖼️', label: '画像生成' },
        { step: ProcessStep.GENERATING_X_POSTS, icon: '🐦', label: 'X告知文' },
    ];

    const progressPercentage = currentStep === ProcessStep.DONE ? 100 : Math.round(((currentIndex + 1) / steps.length) * 100);
    
    return (
        <div className="w-full bg-white p-4 md:p-6 rounded-lg shadow-md mb-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4 text-center md:text-left">生成ステータス</h2>
            
            {/* 進捗バー */}
            <div className="relative pt-1 mb-6">
                <div className="flex mb-2 items-center justify-between">
                    <div>
                        <span className="text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full text-indigo-600 bg-indigo-200">
                            {currentStep === ProcessStep.DONE ? '完了' : currentStep === ProcessStep.ERROR ? 'エラー' : '進行中'}
                        </span>
                    </div>
                    <div className="text-right">
                        <span className="text-xs font-semibold inline-block text-indigo-600">
                            {progressPercentage}%
                        </span>
                    </div>
                </div>
                <div className="overflow-hidden h-3 mb-4 text-xs flex rounded bg-gray-200">
                    <div 
                        style={{ width: `${progressPercentage}%` }} 
                        className={`shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center transition-all duration-500 ${
                            currentStep === ProcessStep.ERROR ? 'bg-red-500' : 'bg-indigo-500'
                        }`}
                    ></div>
                </div>
            </div>

            {/* ステップ詳細表示 */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2 md:gap-4 mb-4">
                {stepDetails.filter(detail => steps.includes(detail.step)).map((detail, index) => {
                    const isCompleted = steps.indexOf(detail.step) < currentIndex;
                    const isCurrent = detail.step === currentStep;
                    const isPending = steps.indexOf(detail.step) > currentIndex;
                    
                    return (
                        <div key={detail.step} className="text-center">
                            <div className={`w-8 h-8 md:w-10 md:h-10 mx-auto mb-1 md:mb-2 rounded-full flex items-center justify-center text-sm md:text-base ${
                                isCompleted ? 'bg-green-500 text-white' :
                                isCurrent ? 'bg-indigo-500 text-white animate-pulse' :
                                'bg-gray-200 text-gray-400'
                            }`}>
                                {isCompleted ? '✓' : detail.icon}
                            </div>
                            <p className={`text-xs font-medium ${
                                isCompleted ? 'text-green-600' :
                                isCurrent ? 'text-indigo-600' :
                                'text-gray-400'
                            }`}>
                                {detail.label}
                            </p>
                        </div>
                    );
                })}
            </div>
            
            {/* 現在のステップメッセージ */}
            {currentStep !== ProcessStep.DONE && currentStep !== ProcessStep.ERROR && (
                <p className="text-center text-gray-600 animate-pulse text-sm md:text-base">
                    {currentStep}
                </p>
            )}

            {/* エラー表示 */}
            {error && (
                <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
                    <p className="text-center text-red-600 text-sm">{error}</p>
                </div>
            )}
        </div>
    );
};

export default StepIndicator;
