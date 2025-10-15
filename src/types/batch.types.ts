import { Tone, Audience, FinalOutput, ProcessStep } from './index';

export interface BatchArticleJob {
    id: string;
    keyword: string;
    tone: Tone;
    audience: Audience;
    targetLength: number;
    imageTheme: string;
    status: BatchJobStatus;
    progress: ProcessStep;
    output?: FinalOutput;
    error?: string;
    createdAt: Date;
    updatedAt: Date;
    estimatedTimeMs?: number;
    actualTimeMs?: number;
}

export enum BatchJobStatus {
    PENDING = 'pending',
    RUNNING = 'running', 
    COMPLETED = 'completed',
    FAILED = 'failed',
    CANCELLED = 'cancelled'
}

export interface BatchConfig {
    maxConcurrentJobs: number;
    delayBetweenJobs: number; // milliseconds
    retryAttempts: number;
    timeoutMs: number;
}

export interface BatchGenerationRequest {
    keywords: string[];
    tone: Tone;
    audience: Audience;
    targetLength: number;
    imageTheme: string;
    config?: Partial<BatchConfig>;
}

export interface BatchProgress {
    totalJobs: number;
    completedJobs: number;
    failedJobs: number;
    runningJobs: number;
    pendingJobs: number;
    overallProgress: number; // 0-100
    estimatedTimeRemaining?: number; // milliseconds
}

export interface BatchResults {
    jobs: BatchArticleJob[];
    progress: BatchProgress;
    startTime: Date;
    endTime?: Date;
    config: BatchConfig;
}