/**
 * 記事関連の型定義
 */

import { XPostGenerationResult } from './social.types';

export interface ArticleOutline {
  title: string;
  metaDescription: string;
  introduction: string;
  sections: {
    heading: string;
    content: string;
  }[];
  faq: {
    question: string;
    answer: string;
  }[];
}

export interface FinalOutput {
  markdownContent: string;
  imageUrl: string;
  metaDescription: string;
  xPosts?: XPostGenerationResult;
  researchData?: ResearchData;
  factCheckSummary?: import('./factcheck.types').FactCheckSummary;
}

export interface ResearchData {
  trends: string;
  seoKeywords: string[];
  notePopularPatterns: string;
}

