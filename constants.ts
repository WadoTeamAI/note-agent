
import { Tone, Audience, ProcessStep } from './types';

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

export const ALL_STEPS: ProcessStep[] = [
    ProcessStep.ANALYZING,
    ProcessStep.OUTLINING,
    ProcessStep.WRITING,
    ProcessStep.GENERATING_IMAGE,
];
