/**
 * アプリケーション定数
 */

import { Tone, Audience, ProcessStep } from '../types';

export const TONE_OPTIONS: Tone[] = [
    Tone.POLITE,
    Tone.FRIENDLY,
    Tone.PROFESSIONAL,
];

export const AUDIENCE_OPTIONS: Audience[] = [
    Audience.BEGINNER,
    Audience.INTERMEDIATE,
    Audience.EXPERT,
];

// 7段階のワークフロー（Phase 1）
export const ALL_STEPS: ProcessStep[] = [
    ProcessStep.RESEARCH,
    ProcessStep.ANALYZING,
    ProcessStep.OUTLINING,
    ProcessStep.WRITING,
    ProcessStep.GENERATING_IMAGE,
    ProcessStep.GENERATING_X_POSTS,
];

// YouTube URLの場合も同じ7段階ワークフロー
export const ALL_STEPS_WITH_YOUTUBE: ProcessStep[] = [
    ProcessStep.RESEARCH,
    ProcessStep.ANALYZING,
    ProcessStep.OUTLINING,
    ProcessStep.WRITING,
    ProcessStep.GENERATING_IMAGE,
    ProcessStep.GENERATING_X_POSTS,
];

export function isYouTubeURL(url: string): boolean {
    const youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube\.com\/(watch\?v=|embed\/|v\/)|youtu\.be\/)[\w\-]+/;
    return youtubeRegex.test(url.trim());
}
