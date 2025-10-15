import { v4 as uuidv4 } from 'uuid';
import {
    ApprovalWorkflow,
    ApprovalStep,
    StepType,
    ApprovalStatus,
    WorkflowStatus,
    UserFeedback,
    ApprovalConfiguration,
    OutlineApprovalData,
    ContentApprovalData,
    ImageApprovalData,
    XPostApprovalData
} from '../../types/approval.types';
import { FinalOutput } from '../../types';

export class ApprovalWorkflowManager {
    private workflows: Map<string, ApprovalWorkflow> = new Map();
    private onWorkflowUpdate: ((workflow: ApprovalWorkflow) => void) | null = null;
    private onStepReady: ((workflowId: string, step: ApprovalStep) => void) | null = null;

    private defaultConfig: ApprovalConfiguration = {
        enableOutlineReview: true,
        enableContentReview: true,
        enableImageReview: true,
        enableXPostReview: false, // デフォルトは無効
        enableFinalReview: true,
        autoApproveOnTimeout: false,
        timeoutMinutes: 30,
        requireComments: false,
        minimumRating: undefined
    };

    setWorkflowUpdateCallback(callback: (workflow: ApprovalWorkflow) => void) {
        this.onWorkflowUpdate = callback;
    }

    setStepReadyCallback(callback: (workflowId: string, step: ApprovalStep) => void) {
        this.onStepReady = callback;
    }

    async createWorkflow(
        originalRequest: ApprovalWorkflow['originalRequest'], 
        config: Partial<ApprovalConfiguration> = {}
    ): Promise<string> {
        const workflowId = uuidv4();
        const mergedConfig = { ...this.defaultConfig, ...config };

        const steps: ApprovalStep[] = [];

        // 構成確認ステップ
        if (mergedConfig.enableOutlineReview) {
            steps.push({
                id: uuidv4(),
                type: StepType.OUTLINE_REVIEW,
                title: '記事構成の確認',
                description: 'AI が生成した記事構成を確認し、必要に応じて修正してください',
                content: null, // 後で設定
                status: ApprovalStatus.PENDING
            });
        }

        // 本文確認ステップ
        if (mergedConfig.enableContentReview) {
            steps.push({
                id: uuidv4(),
                type: StepType.CONTENT_REVIEW,
                title: '記事本文の確認',
                description: 'AI が生成した記事本文を確認し、必要に応じて修正してください',
                content: null,
                status: ApprovalStatus.PENDING
            });
        }

        // 画像確認ステップ
        if (mergedConfig.enableImageReview) {
            steps.push({
                id: uuidv4(),
                type: StepType.IMAGE_REVIEW,
                title: '画像の確認',
                description: 'AI が生成した画像を確認し、必要に応じて変更してください',
                content: null,
                status: ApprovalStatus.PENDING
            });
        }

        // X投稿確認ステップ
        if (mergedConfig.enableXPostReview) {
            steps.push({
                id: uuidv4(),
                type: StepType.XPOST_REVIEW,
                title: 'X投稿の確認',
                description: 'AI が生成したX投稿案を確認し、必要に応じて修正してください',
                content: null,
                status: ApprovalStatus.PENDING
            });
        }

        // 最終確認ステップ
        if (mergedConfig.enableFinalReview) {
            steps.push({
                id: uuidv4(),
                type: StepType.FINAL_REVIEW,
                title: '最終確認',
                description: '全体を確認し、記事の公開準備を完了してください',
                content: null,
                status: ApprovalStatus.PENDING
            });
        }

        const workflow: ApprovalWorkflow = {
            id: workflowId,
            originalRequest,
            steps,
            currentStepIndex: 0,
            status: WorkflowStatus.DRAFT,
            createdAt: new Date(),
            updatedAt: new Date()
        };

        this.workflows.set(workflowId, workflow);
        this.notifyWorkflowUpdate(workflow);

        return workflowId;
    }

    async updateStepContent(workflowId: string, stepType: StepType, content: any): Promise<void> {
        const workflow = this.workflows.get(workflowId);
        if (!workflow) {
            throw new Error('Workflow not found');
        }

        const step = workflow.steps.find(s => s.type === stepType);
        if (!step) {
            throw new Error('Step not found');
        }

        step.content = content;
        workflow.updatedAt = new Date();

        // ステップが準備完了した場合
        if (step.status === ApprovalStatus.PENDING && content) {
            this.onStepReady?.(workflowId, step);
        }

        this.workflows.set(workflowId, workflow);
        this.notifyWorkflowUpdate(workflow);
    }

    async approveStep(
        workflowId: string, 
        stepId: string, 
        feedback: Omit<UserFeedback, 'timestamp'>
    ): Promise<void> {
        const workflow = this.workflows.get(workflowId);
        if (!workflow) {
            throw new Error('Workflow not found');
        }

        const stepIndex = workflow.steps.findIndex(s => s.id === stepId);
        if (stepIndex === -1) {
            throw new Error('Step not found');
        }

        const step = workflow.steps[stepIndex];
        step.status = feedback.decision;
        step.feedback = { ...feedback, timestamp: new Date() };
        step.approvedAt = new Date();

        // 修正内容がある場合は保存
        if (feedback.decision === ApprovalStatus.MODIFIED) {
            step.modifiedContent = feedback.suggestions;
        }

        workflow.updatedAt = new Date();

        // 次のステップに進む
        if (feedback.decision === ApprovalStatus.APPROVED || 
            feedback.decision === ApprovalStatus.MODIFIED) {
            
            // 現在のステップを進める
            if (workflow.currentStepIndex === stepIndex) {
                workflow.currentStepIndex = Math.min(
                    workflow.currentStepIndex + 1, 
                    workflow.steps.length - 1
                );
            }

            // 全ステップが完了したかチェック
            const allCompleted = workflow.steps.every(s => 
                s.status === ApprovalStatus.APPROVED || 
                s.status === ApprovalStatus.MODIFIED ||
                s.status === ApprovalStatus.SKIPPED
            );

            if (allCompleted) {
                workflow.status = WorkflowStatus.COMPLETED;
            } else {
                workflow.status = WorkflowStatus.IN_REVIEW;
            }
        } else if (feedback.decision === ApprovalStatus.REJECTED) {
            step.rejectedAt = new Date();
            workflow.status = WorkflowStatus.REJECTED;
        }

        this.workflows.set(workflowId, workflow);
        this.notifyWorkflowUpdate(workflow);
    }

    async skipStep(workflowId: string, stepId: string, reason?: string): Promise<void> {
        const feedback: Omit<UserFeedback, 'timestamp'> = {
            decision: ApprovalStatus.SKIPPED,
            comment: reason || 'Step skipped by user',
            rating: undefined
        };

        await this.approveStep(workflowId, stepId, feedback);
    }

    getWorkflow(workflowId: string): ApprovalWorkflow | undefined {
        return this.workflows.get(workflowId);
    }

    getCurrentStep(workflowId: string): ApprovalStep | undefined {
        const workflow = this.workflows.get(workflowId);
        if (!workflow) return undefined;

        return workflow.steps[workflow.currentStepIndex];
    }

    getPendingSteps(workflowId: string): ApprovalStep[] {
        const workflow = this.workflows.get(workflowId);
        if (!workflow) return [];

        return workflow.steps.filter(s => s.status === ApprovalStatus.PENDING);
    }

    async setFinalOutput(workflowId: string, output: FinalOutput): Promise<void> {
        const workflow = this.workflows.get(workflowId);
        if (!workflow) {
            throw new Error('Workflow not found');
        }

        workflow.finalOutput = output;
        workflow.updatedAt = new Date();

        this.workflows.set(workflowId, workflow);
        this.notifyWorkflowUpdate(workflow);
    }

    private notifyWorkflowUpdate(workflow: ApprovalWorkflow): void {
        this.onWorkflowUpdate?.(workflow);
    }

    // ワークフローの統計情報を取得
    getWorkflowStats(): {
        total: number;
        inProgress: number;
        completed: number;
        rejected: number;
    } {
        const workflows = Array.from(this.workflows.values());
        
        return {
            total: workflows.length,
            inProgress: workflows.filter(w => 
                w.status === WorkflowStatus.IN_REVIEW || 
                w.status === WorkflowStatus.DRAFT
            ).length,
            completed: workflows.filter(w => w.status === WorkflowStatus.COMPLETED).length,
            rejected: workflows.filter(w => w.status === WorkflowStatus.REJECTED).length
        };
    }

    // 全ワークフローを取得（最新順）
    getAllWorkflows(): ApprovalWorkflow[] {
        return Array.from(this.workflows.values())
            .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
    }

    // ワークフローを削除
    deleteWorkflow(workflowId: string): boolean {
        return this.workflows.delete(workflowId);
    }

    // ワークフローを複製
    async duplicateWorkflow(workflowId: string): Promise<string> {
        const workflow = this.workflows.get(workflowId);
        if (!workflow) {
            throw new Error('Workflow not found');
        }

        return await this.createWorkflow(workflow.originalRequest);
    }
}