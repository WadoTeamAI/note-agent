
import React from 'react';
import { ProcessStep } from '../types';
import { ALL_STEPS } from '../constants';

interface StepIndicatorProps {
    currentStep: ProcessStep;
    error: string | null;
}

const StepIndicator: React.FC<StepIndicatorProps> = ({ currentStep, error }) => {
    if (currentStep === ProcessStep.IDLE) return null;

    const currentIndex = ALL_STEPS.findIndex(step => step === currentStep);

    return (
        <div className="w-full bg-white p-6 rounded-lg shadow-md mb-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">生成ステータス</h2>
            <div className="relative pt-1">
                <div className="flex mb-2 items-center justify-between">
                    <div>
                        <span className="text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full text-indigo-600 bg-indigo-200">
                            {currentStep === ProcessStep.DONE ? '完了' : '進行中'}
                        </span>
                    </div>
                    <div className="text-right">
                        <span className="text-xs font-semibold inline-block text-indigo-600">
                            {currentStep === ProcessStep.DONE ? '100%' : `${((currentIndex + 1) / (ALL_STEPS.length + 1)) * 100}%`}
                        </span>
                    </div>
                </div>
                <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-indigo-200">
                    <div style={{ width: `${currentStep === ProcessStep.DONE ? 100 : ((currentIndex + 1) / (ALL_STEPS.length + 1)) * 100}%` }} className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-indigo-500 transition-all duration-500"></div>
                </div>
            </div>
            
            <p className="text-center text-gray-600 animate-pulse">{currentStep !== ProcessStep.DONE && currentStep}</p>

            {error && <p className="text-center text-red-500 mt-4">{error}</p>}
        </div>
    );
};

export default StepIndicator;
