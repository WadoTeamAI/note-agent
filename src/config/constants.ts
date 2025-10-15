/**
 * アプリケーション定数
 */

import { Tone, Audience, ProcessStep } from '../types';

export const TONE_OPTIONS = [
    Tone.POLITE,
    Tone.FRIENDLY,
    Tone.PROFESSIONAL,
];

export const AUDIENCE_OPTIONS = [
    Audience.BEGINNER,
    Audience.INTERMEDIATE,
    Audience.EXPERT,
];

// 8段階のワークフロー（Phase 1 + Phase 1.5 ファクトチェック）
export const ALL_STEPS: ProcessStep[] = [
    ProcessStep.RESEARCH,
    ProcessStep.ANALYZING,
    ProcessStep.OUTLINING,
    ProcessStep.WRITING,
    ProcessStep.FACT_CHECKING,
    ProcessStep.GENERATING_IMAGE,
    ProcessStep.GENERATING_X_POSTS,
];

// YouTube URLの場合も同じ8段階ワークフロー
export const ALL_STEPS_WITH_YOUTUBE: ProcessStep[] = [
    ProcessStep.RESEARCH,
    ProcessStep.ANALYZING,
    ProcessStep.OUTLINING,
    ProcessStep.WRITING,
    ProcessStep.FACT_CHECKING,
    ProcessStep.GENERATING_IMAGE,
    ProcessStep.GENERATING_X_POSTS,
];

export function isYouTubeURL(url: string): boolean {
    const youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube\.com\/(watch\?v=|embed\/|v\/)|youtu\.be\/)[\w\-]+/;
    return youtubeRegex.test(url.trim());
}
