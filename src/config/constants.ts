/**
 * アプリケーション定数
 */

import { Tone, Audience, ProcessStep, ArticleCategory } from '../types';

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

export const CATEGORY_OPTIONS = [
    ArticleCategory.BUSINESS,
    ArticleCategory.LIFESTYLE,
    ArticleCategory.TECHNOLOGY,
    ArticleCategory.HEALTH,
    ArticleCategory.EDUCATION,
    ArticleCategory.ENTERTAINMENT,
    ArticleCategory.FINANCE,
    ArticleCategory.TRAVEL,
    ArticleCategory.FOOD,
    ArticleCategory.FASHION,
    ArticleCategory.SPORTS,
    ArticleCategory.HOBBY,
];

export const IMAGE_STYLE_OPTIONS = [
    'リアル',
    'イラスト', 
    'アイコン',
    'グラフィック'
];

export const COLOR_TONE_OPTIONS = [
    '明るい',
    '落ち着いた',
    'モノクロ',
    'カラフル'
];

export const ASPECT_RATIO_OPTIONS = [
    '16:9',
    '4:3',
    '1:1',
    '3:2'
];

export const SEARCH_INTENT_OPTIONS = [
    'informational',
    'transactional', 
    'navigational',
    'commercial'
];

export const PLATFORM_OPTIONS = [
    'note',
    'blog',
    'qiita',
    'zenn',
    'hatena'
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
