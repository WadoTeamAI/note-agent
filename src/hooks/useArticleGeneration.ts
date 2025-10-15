/**
 * 記事生成カスタムフック
 * Phase 1: 基本的な記事生成ロジックをフック化
 */

import { useState, useCallback } from 'react';
import { FormData, FinalOutput, ProcessStep } from '../types';
import * as geminiService from '../services/ai/geminiService';

interface UseArticleGenerationReturn {
  isLoading: boolean;
  currentStep: ProcessStep;
  output: FinalOutput | null;
  error: string | null;
  generateArticle: (formData: FormData) => Promise<void>;
  reset: () => void;
}

export function useArticleGeneration(): UseArticleGenerationReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState<ProcessStep>(ProcessStep.IDLE);
  const [output, setOutput] = useState<FinalOutput | null>(null);
  const [error, setError] = useState<string | null>(null);

  const generateArticle = useCallback(async (formData: FormData) => {
    setIsLoading(true);
    setError(null);
    setOutput(null);
    setCurrentStep(ProcessStep.IDLE);

    try {
      // Step 0: 統合リサーチ
      setCurrentStep(ProcessStep.RESEARCH);
      // TODO: 統合リサーチ機能の実装
      
      // Step 1: SEO分析
      setCurrentStep(ProcessStep.ANALYZING);
      const analysis = await geminiService.analyzeSerpResults(formData.keyword);

      // Step 2: 記事構成生成
      setCurrentStep(ProcessStep.OUTLINING);
      const outline = await geminiService.createArticleOutline(
        analysis,
        formData.audience,
        formData.tone,
        formData.keyword
      );
      
      // Step 3: 本文生成
      setCurrentStep(ProcessStep.WRITING);
      const markdownContent = await geminiService.writeArticle(
        outline,
        formData.targetLength,
        formData.tone,
        formData.audience
      );
      
      // Step 4: 画像生成
      setCurrentStep(ProcessStep.GENERATING_IMAGE);
      const imagePrompt = await geminiService.createImagePrompt(
        outline.title,
        markdownContent,
        formData.imageTheme
      );
      const imageUrl = await geminiService.generateImage(imagePrompt);

      // Step 5: X告知文生成
      setCurrentStep(ProcessStep.GENERATING_X_POSTS);
      // TODO: X告知文生成機能の実装

      setOutput({
        markdownContent,
        imageUrl,
        metaDescription: outline.metaDescription,
      });
      setCurrentStep(ProcessStep.DONE);
    } catch (err) {
      console.error(err);
      const errorMessage = err instanceof Error ? err.message : '不明なエラーが発生しました。';
      setError(`エラー: ${errorMessage}`);
      setCurrentStep(ProcessStep.ERROR);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const reset = useCallback(() => {
    setIsLoading(false);
    setCurrentStep(ProcessStep.IDLE);
    setOutput(null);
    setError(null);
  }, []);

  return {
    isLoading,
    currentStep,
    output,
    error,
    generateArticle,
    reset,
  };
}

