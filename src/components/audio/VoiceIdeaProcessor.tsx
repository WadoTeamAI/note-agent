'use client';

/**
 * 音声アイデア処理コンポーネント
 * 音声入力されたアイデアをAIで分析・整理
 */

import React, { useState } from 'react';
import { VoiceInputButton } from './VoiceInputButton';
import { getSpeechRecognitionService, VoiceIdeaResult } from '../../services/audio/speechRecognitionService';
import { FormData, Tone, Audience } from '../../types';

interface VoiceIdeaProcessorProps {
  onIdeaProcessed: (formData: Partial<FormData>) => void;
  isVisible: boolean;
  onClose: () => void;
}

export const VoiceIdeaProcessor: React.FC<VoiceIdeaProcessorProps> = ({
  onIdeaProcessed,
  isVisible,
  onClose
}) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [rawTranscript, setRawTranscript] = useState('');
  const [processedResult, setProcessedResult] = useState<VoiceIdeaResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleVoiceInput = async (transcript: string) => {
    if (!transcript.trim()) return;

    setRawTranscript(transcript);
    setIsProcessing(true);
    setError(null);

    try {
      console.log('VoiceIdeaProcessor: 音声アイデア処理開始');
      const service = getSpeechRecognitionService();
      const result = await service.processVoiceIdea(transcript);
      
      if (result) {
        console.log('VoiceIdeaProcessor: 処理成功', result);
        setProcessedResult(result);
      } else {
        console.error('VoiceIdeaProcessor: 処理結果がnull');
        setError('音声アイデアの処理に失敗しました。ネットワーク接続やAPIキーを確認してから再試行してください。');
      }
    } catch (error) {
      console.error('VoiceIdeaProcessor error:', error);
      if (error instanceof Error) {
        setError(`音声アイデアの処理エラー: ${error.message}`);
      } else {
        setError('音声アイデアの処理中に予期しないエラーが発生しました。');
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const handleApplyIdea = () => {
    if (!processedResult) return;

    // 音声アイデアの結果をFormDataに変換
    const toneMap: Record<string, Tone> = {
      '丁寧で落ち着いた': Tone.POLITE,
      'フレンドリーで親しみやすい': Tone.FRIENDLY,
      '専門的で論理的': Tone.PROFESSIONAL
    };

    const audienceMap: Record<string, Audience> = {
      '初心者向け': Audience.BEGINNER,
      '中級者向け': Audience.INTERMEDIATE,
      '専門家向け': Audience.EXPERT
    };

    const formData: Partial<FormData> = {
      keyword: processedResult.processedKeyword,
      tone: toneMap[processedResult.tone] || Tone.POLITE,
      audience: audienceMap[processedResult.targetAudience] || Audience.BEGINNER,
      targetLength: processedResult.estimatedLength,
      imageTheme: '記事内容に適した画像'
    };

    onIdeaProcessed(formData);
    handleClose();
  };

  const handleClose = () => {
    setRawTranscript('');
    setProcessedResult(null);
    setError(null);
    setIsProcessing(false);
    onClose();
  };

  const handleRetry = () => {
    setProcessedResult(null);
    setError(null);
  };

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* ヘッダー */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z"/>
                <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"/>
              </svg>
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">🎙️ 音声アイデア入力</h2>
              <p className="text-sm text-gray-600">音声でアイデアを話すとAIが記事設定に変換します</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* 音声入力セクション */}
          {!processedResult && (
            <div className="space-y-4">
              <div className="text-center">
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  記事のアイデアを音声で話してください
                </h3>
                <p className="text-sm text-gray-600 mb-4">
                  例: 「副業でブログを始めたい初心者向けに、WordPressの使い方を丁寧に説明する記事を書きたい」
                </p>
              </div>

              <VoiceInputButton
                onTranscript={handleVoiceInput}
                onError={setError}
                disabled={isProcessing}
                className="max-w-md mx-auto"
              />

              {isProcessing && (
                <div className="text-center">
                  <div className="inline-flex items-center space-x-2 text-blue-600">
                    <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25"/>
                      <path fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" className="opacity-75"/>
                    </svg>
                    <span className="font-medium">AIがアイデアを分析中...</span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 処理結果表示 */}
          {processedResult && (
            <div className="space-y-6">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h3 className="text-lg font-medium text-green-900 mb-3 flex items-center">
                  <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                  </svg>
                  音声アイデアを分析しました
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        メインキーワード
                      </label>
                      <div className="px-3 py-2 bg-white border border-gray-300 rounded-md text-sm">
                        {processedResult.processedKeyword}
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        提案タイトル
                      </label>
                      <div className="px-3 py-2 bg-white border border-gray-300 rounded-md text-sm">
                        {processedResult.suggestedTitle}
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        想定読者層
                      </label>
                      <div className="px-3 py-2 bg-white border border-gray-300 rounded-md text-sm">
                        {processedResult.targetAudience}
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        推奨文体
                      </label>
                      <div className="px-3 py-2 bg-white border border-gray-300 rounded-md text-sm">
                        {processedResult.tone}
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        推奨文字数
                      </label>
                      <div className="px-3 py-2 bg-white border border-gray-300 rounded-md text-sm">
                        {processedResult.estimatedLength.toLocaleString()}文字
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        追加提案
                      </label>
                      <div className="px-3 py-2 bg-white border border-gray-300 rounded-md text-sm">
                        {processedResult.additionalNotes}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* 元の音声入力 */}
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <h4 className="text-sm font-medium text-gray-700 mb-2">元の音声入力:</h4>
                <p className="text-sm text-gray-600 italic">
                  "{processedResult.originalTranscript}"
                </p>
              </div>

              {/* アクションボタン */}
              <div className="flex space-x-3">
                <button
                  onClick={handleApplyIdea}
                  className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-medium py-3 px-6 rounded-lg hover:from-purple-600 hover:to-pink-600 transition-all duration-300 shadow-lg hover:shadow-xl"
                >
                  ✨ この設定で記事を生成
                </button>
                <button
                  onClick={handleRetry}
                  className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium"
                >
                  🔄 再入力
                </button>
              </div>
            </div>
          )}

          {/* エラー表示 */}
          {error && !isProcessing && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <svg className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                </svg>
                <div>
                  <p className="text-sm font-medium text-red-800">エラーが発生しました</p>
                  <p className="text-sm text-red-700 mt-1">{error}</p>
                </div>
              </div>
            </div>
          )}

          {/* 使用方法ガイド */}
          {!processedResult && !isProcessing && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="text-sm font-medium text-blue-900 mb-2">
                💡 音声入力のコツ
              </h4>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• できるだけ具体的にアイデアを話してください</li>
                <li>• 想定読者層（初心者、上級者など）を含めると精度が上がります</li>
                <li>• 記事の目的や書きたい内容を明確に伝えてください</li>
                <li>• 文体の希望（丁寧、フレンドリーなど）があれば言及してください</li>
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};