import React, { useState, useEffect } from 'react';
import { 
    ApprovalWorkflow, 
    ApprovalStep, 
    StepType, 
    ApprovalStatus, 
    WorkflowStatus,
    UserFeedback 
} from '../../types/approval.types';
import { ApprovalWorkflowManager } from '../../services/approval/approvalWorkflow';
import StepReviewCard from './StepReviewCard';

interface ApprovalWorkflowPanelProps {
    workflowId: string;
    workflowManager: ApprovalWorkflowManager;
    onClose: () => void;
    onComplete: (workflow: ApprovalWorkflow) => void;
}

const ApprovalWorkflowPanel: React.FC<ApprovalWorkflowPanelProps> = ({
    workflowId,
    workflowManager,
    onClose,
    onComplete
}) => {
    const [workflow, setWorkflow] = useState<ApprovalWorkflow | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        const loadWorkflow = () => {
            const wf = workflowManager.getWorkflow(workflowId);
            if (wf) {
                setWorkflow(wf);
            }
        };

        loadWorkflow();

        // ワークフロー更新の監視
        workflowManager.setWorkflowUpdateCallback((updatedWorkflow) => {
            if (updatedWorkflow.id === workflowId) {
                setWorkflow(updatedWorkflow);
                
                // 完了時のコールバック
                if (updatedWorkflow.status === WorkflowStatus.COMPLETED) {
                    onComplete(updatedWorkflow);
                }
            }
        });

        return () => {
            workflowManager.setWorkflowUpdateCallback(() => {});
        };
    }, [workflowId, workflowManager, onComplete]);

    const handleStepFeedback = async (stepId: string, feedback: Omit<UserFeedback, 'timestamp'>) => {
        if (!workflow) return;

        setIsSubmitting(true);
        try {
            await workflowManager.approveStep(workflowId, stepId, feedback);
        } catch (error) {
            console.error('Failed to submit feedback:', error);
            alert('フィードバックの送信に失敗しました');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleSkipStep = async (stepId: string, reason?: string) => {
        setIsSubmitting(true);
        try {
            await workflowManager.skipStep(workflowId, stepId, reason);
        } catch (error) {
            console.error('Failed to skip step:', error);
            alert('ステップのスキップに失敗しました');
        } finally {
            setIsSubmitting(false);
        }
    };

    const getStatusIcon = (status: WorkflowStatus) => {
        switch (status) {
            case WorkflowStatus.DRAFT: return '📝';
            case WorkflowStatus.IN_REVIEW: return '👀';
            case WorkflowStatus.APPROVED: return '✅';
            case WorkflowStatus.COMPLETED: return '🎉';
            case WorkflowStatus.REJECTED: return '❌';
            case WorkflowStatus.CANCELLED: return '⚠️';
            default: return '❓';
        }
    };

    const getStatusColor = (status: WorkflowStatus) => {
        switch (status) {
            case WorkflowStatus.DRAFT: return 'text-gray-600 bg-gray-50';
            case WorkflowStatus.IN_REVIEW: return 'text-blue-600 bg-blue-50';
            case WorkflowStatus.APPROVED: return 'text-green-600 bg-green-50';
            case WorkflowStatus.COMPLETED: return 'text-green-600 bg-green-50';
            case WorkflowStatus.REJECTED: return 'text-red-600 bg-red-50';
            case WorkflowStatus.CANCELLED: return 'text-orange-600 bg-orange-50';
            default: return 'text-gray-600 bg-gray-50';
        }
    };

    const getProgressPercentage = () => {
        if (!workflow) return 0;
        
        const completedSteps = workflow.steps.filter(s => 
            s.status === ApprovalStatus.APPROVED || 
            s.status === ApprovalStatus.MODIFIED ||
            s.status === ApprovalStatus.SKIPPED
        ).length;
        
        return Math.round((completedSteps / workflow.steps.length) * 100);
    };

    if (!workflow) {
        return (
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                <div className="bg-white/90 backdrop-blur-lg rounded-2xl shadow-2xl border border-white/30 p-8">
                    <div className="text-center">
                        <div className="animate-spin w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full mx-auto mb-4"></div>
                        <p className="text-gray-600">ワークフローを読み込み中...</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 overflow-auto">
            <div className="min-h-screen flex items-start justify-center p-4 py-8">
                <div className="bg-white/90 backdrop-blur-lg rounded-2xl shadow-2xl border border-white/30 w-full max-w-4xl">
                    {/* Header */}
                    <div className="flex items-center justify-between p-6 border-b border-white/20">
                        <div>
                            <h2 className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                                👥 記事承認ワークフロー
                            </h2>
                            <p className="text-gray-600 text-sm mt-1">
                                キーワード: <span className="font-medium">{workflow.originalRequest.keyword}</span>
                            </p>
                        </div>
                        <div className="flex items-center space-x-4">
                            <div className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(workflow.status)}`}>
                                {getStatusIcon(workflow.status)} {workflow.status}
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
                    </div>

                    {/* Progress Bar */}
                    <div className="p-6 border-b border-white/10">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium text-gray-700">進捗状況</span>
                            <span className="text-sm font-bold text-indigo-600">{getProgressPercentage()}%</span>
                        </div>
                        <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                            <div 
                                className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-500"
                                style={{ width: `${getProgressPercentage()}%` }}
                            ></div>
                        </div>
                        <div className="mt-2 text-xs text-gray-500">
                            {workflow.steps.filter(s => s.status === ApprovalStatus.APPROVED || s.status === ApprovalStatus.MODIFIED || s.status === ApprovalStatus.SKIPPED).length} / {workflow.steps.length} ステップ完了
                        </div>
                    </div>

                    {/* Steps */}
                    <div className="p-6 space-y-6 max-h-[60vh] overflow-y-auto">
                        {workflow.steps.map((step, index) => {
                            const isCurrentStep = index === workflow.currentStepIndex;
                            const isCompleted = step.status === ApprovalStatus.APPROVED || 
                                              step.status === ApprovalStatus.MODIFIED ||
                                              step.status === ApprovalStatus.SKIPPED;
                            const isPending = step.status === ApprovalStatus.PENDING;

                            return (
                                <div key={step.id} className="relative">
                                    {/* Step Connector */}
                                    {index < workflow.steps.length - 1 && (
                                        <div className={`absolute left-6 top-12 w-0.5 h-16 ${
                                            isCompleted ? 'bg-green-300' : 'bg-gray-200'
                                        }`}></div>
                                    )}

                                    <StepReviewCard
                                        step={step}
                                        isCurrentStep={isCurrentStep}
                                        isCompleted={isCompleted}
                                        isPending={isPending}
                                        isSubmitting={isSubmitting}
                                        onFeedback={(feedback) => handleStepFeedback(step.id, feedback)}
                                        onSkip={(reason) => handleSkipStep(step.id, reason)}
                                    />
                                </div>
                            );
                        })}
                    </div>

                    {/* Footer */}
                    <div className="p-6 border-t border-white/20 bg-gradient-to-r from-gray-50/50 to-white/50">
                        <div className="flex justify-between items-center">
                            <div className="text-sm text-gray-600">
                                作成日時: {workflow.createdAt.toLocaleString('ja-JP')}
                            </div>
                            <div className="flex space-x-3">
                                {workflow.status === WorkflowStatus.COMPLETED && (
                                    <button
                                        onClick={() => onComplete(workflow)}
                                        className="px-6 py-2 bg-gradient-to-r from-green-500 to-green-600 text-white font-bold rounded-lg hover:from-green-600 hover:to-green-700 transition-all"
                                    >
                                        ✅ 記事を公開準備
                                    </button>
                                )}
                                <button
                                    onClick={onClose}
                                    className="px-6 py-2 bg-gray-500 hover:bg-gray-600 text-white font-bold rounded-lg transition-colors"
                                >
                                    閉じる
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ApprovalWorkflowPanel;