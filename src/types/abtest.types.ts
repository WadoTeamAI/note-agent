/**
 * A/Bテスト（複数バージョン生成）関連の型定義
 */

import { FinalOutput, Tone, Audience } from './index';

export interface ABTestRequest {
  keyword: string;
  tone: Tone;
  audience: Audience;
  targetLength: number;
  imageTheme: string;
  versionCount: number; // 生成するバージョン数（2-4）
  variationTypes: VariationType[]; // バリエーションタイプ
}

export enum VariationType {
  TONE = 'tone',           // 文体のバリエーション
  LENGTH = 'length',       // 文字数のバリエーション
  STRUCTURE = 'structure', // 構成のバリエーション
  ANGLE = 'angle',         // 切り口のバリエーション
  TARGET = 'target'        // ターゲット読者のバリエーション
}

export interface ABTestVersion {
  id: string;
  versionName: string;     // A, B, C, D
  description: string;     // バージョンの特徴説明
  parameters: {
    tone: Tone;
    audience: Audience;
    targetLength: number;
    specialInstructions?: string;
  };
  output?: FinalOutput;
  generationTime?: number; // 生成時間（秒）
  status: ABTestStatus;
}

export enum ABTestStatus {
  PENDING = 'pending',
  GENERATING = 'generating',
  COMPLETED = 'completed',
  FAILED = 'failed'
}

export interface ABTestResult {
  id: string;
  originalRequest: ABTestRequest;
  versions: ABTestVersion[];
  createdAt: Date;
  completedAt?: Date;
  totalGenerationTime?: number;
  recommendedVersion?: string; // 推奨バージョンのID
}

export interface ABTestComparison {
  versionA: ABTestVersion;
  versionB: ABTestVersion;
  metrics: {
    readabilityScore: { a: number; b: number };
    seoScore: { a: number; b: number };
    engagementPrediction: { a: number; b: number };
    wordCount: { a: number; b: number };
  };
  recommendation: string;
}

export interface VariationStrategy {
  type: VariationType;
  name: string;
  description: string;
  generateVariants: (baseRequest: ABTestRequest) => ABTestVersion[];
}