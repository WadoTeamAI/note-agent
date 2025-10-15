import { FinalOutput, ProcessStep, Tone, Audience } from './index';

export interface ApprovalWorkflow {
    id: string;
    originalRequest: {
        keyword: string;
        tone: Tone;
        audience: Audience;
        targetLength: number;
        imageTheme: string;
    };
    steps: ApprovalStep[];
    currentStepIndex: number;
    status: WorkflowStatus;
    createdAt: Date;
    updatedAt: Date;
    finalOutput?: FinalOutput;
}

export interface ApprovalStep {
    id: string;
    type: StepType;
    title: string;
    description: string;
    content: any; // 各ステップ固有のコンテンツ
    status: ApprovalStatus;
    feedback?: UserFeedback;
    approvedAt?: Date;
    rejectedAt?: Date;
    modifiedContent?: any; // ユーザーが修正した内容
}

export enum StepType {
    OUTLINE_REVIEW = 'outline_review',
    CONTENT_REVIEW = 'content_review', 
    IMAGE_REVIEW = 'image_review',
    XPOST_REVIEW = 'xpost_review',
    FINAL_REVIEW = 'final_review'
}

export enum ApprovalStatus {
    PENDING = 'pending',
    APPROVED = 'approved',
    REJECTED = 'rejected',
    MODIFIED = 'modified',
    SKIPPED = 'skipped'
}

export enum WorkflowStatus {
    DRAFT = 'draft',
    IN_REVIEW = 'in_review',
    APPROVED = 'approved',
    REJECTED = 'rejected',
    COMPLETED = 'completed',
    CANCELLED = 'cancelled'
}

export interface UserFeedback {
    decision: ApprovalStatus;
    comment?: string;
    suggestions?: string;
    rating?: number; // 1-5
    timestamp: Date;
}

export interface OutlineApprovalData {
    originalOutline: {
        title: string;
        metaDescription: string;
        sections: Array<{
            heading: string;
            subheadings: string[];
        }>;
    };
    modifiedOutline?: {
        title: string;
        metaDescription: string;
        sections: Array<{
            heading: string;
            subheadings: string[];
        }>;
    };
}

export interface ContentApprovalData {
    originalContent: string;
    modifiedContent?: string;
    wordCount: number;
    readabilityScore?: number;
}

export interface ImageApprovalData {
    originalImageUrl: string;
    originalPrompt: string;
    alternativeImageUrl?: string;
    modifiedPrompt?: string;
    userUploadedImage?: string;
}

export interface XPostApprovalData {
    originalPosts: Array<{
        type: string;
        content: string;
        audience: string;
    }>;
    modifiedPosts?: Array<{
        type: string;
        content: string;
        audience: string;
    }>;
}

export interface ApprovalConfiguration {
    enableOutlineReview: boolean;
    enableContentReview: boolean;
    enableImageReview: boolean;
    enableXPostReview: boolean;
    enableFinalReview: boolean;
    autoApproveOnTimeout: boolean;
    timeoutMinutes: number;
    requireComments: boolean;
    minimumRating?: number;
}

export interface ApprovalMetrics {
    totalWorkflows: number;
    approvedWorkflows: number;
    rejectedWorkflows: number;
    averageReviewTime: number; // minutes
    averageRating: number;
    commonFeedbackPatterns: string[];
    improvementSuggestions: string[];
}

export interface ApprovalNotification {
    id: string;
    workflowId: string;
    type: NotificationType;
    title: string;
    message: string;
    isRead: boolean;
    createdAt: Date;
    actionUrl?: string;
}

export enum NotificationType {
    STEP_READY = 'step_ready',
    WORKFLOW_COMPLETED = 'workflow_completed',
    WORKFLOW_REJECTED = 'workflow_rejected',
    TIMEOUT_WARNING = 'timeout_warning',
    FEEDBACK_REQUEST = 'feedback_request'
}