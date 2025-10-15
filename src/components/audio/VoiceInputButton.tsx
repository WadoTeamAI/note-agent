/**
 * 音声入力ボタンコンポーネント
 * マイクボタンと音声認識の状態表示
 */

import React, { useState, useEffect } from 'react';
import { speechRecognitionService, SpeechRecognitionResult } from '../../services/audio/speechRecognitionService';

interface VoiceInputButtonProps {
  onTranscript: (transcript: string) => void;
  onError?: (error: string) => void;
  disabled?: boolean;
  className?: string;
}

export const VoiceInputButton: React.FC<VoiceInputButtonProps> = ({
  onTranscript,
  onError,
  disabled = false,
  className = ''
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const [currentTranscript, setCurrentTranscript] = useState('');
  const [finalTranscript, setFinalTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // 音声認識サポート確認
    setIsSupported(speechRecognitionService.getIsSupported());

    // コールバック設定
    speechRecognitionService.onResult((result: SpeechRecognitionResult) => {
      if (result.isFinal) {
        setFinalTranscript(prev => prev + ' ' + result.transcript);
        setCurrentTranscript('');
        onTranscript(result.transcript);
      } else {
        setCurrentTranscript(result.transcript);
      }
    });

    speechRecognitionService.onError((errorMessage: string) => {
      setError(errorMessage);
      setIsRecording(false);
      if (onError) {
        onError(errorMessage);
      }
    });

    return () => {
      // クリーンアップ
      if (isRecording) {
        speechRecognitionService.stopRecording();
      }
    };
  }, [onTranscript, onError, isRecording]);

  const handleStartRecording = async () => {
    if (!isSupported) {
      const errorMsg = 'このブラウザは音声認識をサポートしていません';
      setError(errorMsg);
      if (onError) onError(errorMsg);
      return;
    }

    // マイク権限を確認
    const hasPermission = await speechRecognitionService.requestMicrophonePermission();
    if (!hasPermission) {
      const errorMsg = 'マイクの使用許可が必要です';
      setError(errorMsg);
      if (onError) onError(errorMsg);
      return;
    }

    setError(null);
    setCurrentTranscript('');
    
    const started = speechRecognitionService.startRecording({
      language: 'ja-JP',
      continuous: true,
      interimResults: true,
      maxAlternatives: 1
    });

    if (started) {
      setIsRecording(true);
    }
  };

  const handleStopRecording = () => {
    speechRecognitionService.stopRecording();
    setIsRecording(false);
    
    // 最終的なテキストを結合して返す
    const fullTranscript = (finalTranscript + ' ' + currentTranscript).trim();
    if (fullTranscript) {
      onTranscript(fullTranscript);
    }
    
    setCurrentTranscript('');
    setFinalTranscript('');
  };

  const handleClearTranscript = () => {
    setCurrentTranscript('');
    setFinalTranscript('');
    setError(null);
  };

  if (!isSupported) {
    return (
      <div className={`text-center p-4 bg-yellow-50 border border-yellow-200 rounded-lg ${className}`}>
        <div className="text-yellow-800 text-sm">
          <p className="font-medium mb-2">音声入力をサポートしていません</p>
          <p className="text-xs">
            Chrome、Edge、Safariの最新版でお試しください
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* 音声入力ボタン */}
      <div className="flex items-center justify-center space-x-3">
        <button
          onClick={isRecording ? handleStopRecording : handleStartRecording}
          disabled={disabled}
          className={`
            relative w-16 h-16 rounded-full transition-all duration-300 focus:outline-none focus:ring-4 
            ${isRecording 
              ? 'bg-red-500 hover:bg-red-600 focus:ring-red-200 animate-pulse' 
              : 'bg-blue-500 hover:bg-blue-600 focus:ring-blue-200 hover:scale-105'
            }
            disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100
            shadow-lg hover:shadow-xl
          `}
        >
          {isRecording ? (
            <svg className="w-8 h-8 text-white mx-auto" fill="currentColor" viewBox="0 0 24 24">
              <rect x="6" y="6" width="12" height="12" rx="2" />
            </svg>
          ) : (
            <svg className="w-8 h-8 text-white mx-auto" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z"/>
              <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"/>
            </svg>
          )}
          
          {/* 録音中のアニメーション */}
          {isRecording && (
            <div className="absolute inset-0 rounded-full border-4 border-red-300 animate-ping" />
          )}
        </button>

        {/* 状態表示 */}
        <div className="text-center">
          <p className="text-sm font-medium text-gray-700">
            {isRecording ? '録音中...' : '音声入力'}
          </p>
          <p className="text-xs text-gray-500">
            {isRecording ? 'クリックで停止' : 'クリックで開始'}
          </p>
        </div>

        {/* クリアボタン */}
        {(currentTranscript || finalTranscript) && (
          <button
            onClick={handleClearTranscript}
            className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-colors"
            title="テキストをクリア"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        )}
      </div>

      {/* リアルタイム文字起こし表示 */}
      {(currentTranscript || finalTranscript) && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <h4 className="text-sm font-medium text-gray-700 mb-2">認識された音声:</h4>
          <div className="text-sm space-y-1">
            {finalTranscript && (
              <p className="text-gray-900">
                <span className="bg-green-100 px-1 rounded">確定:</span> {finalTranscript}
              </p>
            )}
            {currentTranscript && (
              <p className="text-gray-600">
                <span className="bg-yellow-100 px-1 rounded">認識中:</span> {currentTranscript}
              </p>
            )}
          </div>
        </div>
      )}

      {/* エラー表示 */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
          <div className="flex items-center space-x-2">
            <svg className="w-5 h-5 text-red-500 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
            </svg>
            <p className="text-sm text-red-800">{error}</p>
          </div>
        </div>
      )}

      {/* ヘルプテキスト */}
      <div className="text-xs text-gray-500 text-center space-y-1">
        <p>💡 <strong>使い方:</strong> ボタンを押して話し、もう一度押して停止</p>
        <p>🔒 初回使用時にマイクの許可が必要です</p>
        <p>📱 モバイルではボタンを長押ししてください</p>
      </div>
    </div>
  );
};