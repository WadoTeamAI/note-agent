/**
 * 音声認識サービス（Phase 1.5）
 * Web Speech API + Gemini AIを使用した音声入力対応
 */

import { generateText } from '../ai/geminiService';

export interface SpeechRecognitionResult {
  transcript: string;
  confidence: number;
  isFinal: boolean;
}

export interface AudioProcessingOptions {
  language?: string;
  continuous?: boolean;
  interimResults?: boolean;
  maxAlternatives?: number;
}

export interface VoiceIdeaResult {
  originalTranscript: string;
  processedKeyword: string;
  suggestedTitle: string;
  targetAudience: string;
  tone: string;
  estimatedLength: number;
  additionalNotes: string;
}

export class SpeechRecognitionService {
  private recognition: SpeechRecognition | null = null;
  private isSupported: boolean = false;
  private isRecording: boolean = false;
  private onResultCallback?: (result: SpeechRecognitionResult) => void;
  private onErrorCallback?: (error: string) => void;

  constructor() {
    this.initializeSpeechRecognition();
  }

  /**
   * 音声認識を初期化
   */
  private initializeSpeechRecognition(): void {
    // ブラウザサポートチェック
    const SpeechRecognition = 
      (window as any).SpeechRecognition || 
      (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      console.warn('このブラウザは音声認識をサポートしていません');
      this.isSupported = false;
      return;
    }

    this.isSupported = true;
    this.recognition = new SpeechRecognition();
    
    // デフォルト設定
    this.recognition.continuous = true;
    this.recognition.interimResults = true;
    this.recognition.lang = 'ja-JP';
    this.recognition.maxAlternatives = 1;

    // イベントリスナーを設定
    this.setupEventListeners();
  }

  /**
   * イベントリスナーを設定
   */
  private setupEventListeners(): void {
    if (!this.recognition) return;

    // 結果を受信
    this.recognition.onresult = (event: SpeechRecognitionEvent) => {
      const lastResult = event.results[event.results.length - 1];
      const transcript = lastResult[0].transcript;
      const confidence = lastResult[0].confidence;
      const isFinal = lastResult.isFinal;

      const result: SpeechRecognitionResult = {
        transcript,
        confidence,
        isFinal
      };

      if (this.onResultCallback) {
        this.onResultCallback(result);
      }
    };

    // エラーハンドリング
    this.recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      let errorMessage = '音声認識エラーが発生しました';
      
      switch (event.error) {
        case 'no-speech':
          errorMessage = '音声が検出されませんでした。もう一度お試しください。';
          break;
        case 'audio-capture':
          errorMessage = 'マイクにアクセスできません。ブラウザの設定を確認してください。';
          break;
        case 'not-allowed':
          errorMessage = 'マイクの使用が許可されていません。ブラウザの設定を確認してください。';
          break;
        case 'network':
          errorMessage = 'ネットワークエラーが発生しました。';
          break;
        case 'service-not-allowed':
          errorMessage = '音声認識サービスが利用できません。';
          break;
        default:
          errorMessage = `音声認識エラー: ${event.error}`;
      }

      if (this.onErrorCallback) {
        this.onErrorCallback(errorMessage);
      }

      this.isRecording = false;
    };

    // 録音開始
    this.recognition.onstart = () => {
      this.isRecording = true;
      console.log('音声認識開始');
    };

    // 録音終了
    this.recognition.onend = () => {
      this.isRecording = false;
      console.log('音声認識終了');
    };
  }

  /**
   * 音声認識を開始
   */
  startRecording(options?: AudioProcessingOptions): boolean {
    if (!this.isSupported) {
      if (this.onErrorCallback) {
        this.onErrorCallback('このブラウザは音声認識をサポートしていません');
      }
      return false;
    }

    if (!this.recognition) {
      if (this.onErrorCallback) {
        this.onErrorCallback('音声認識の初期化に失敗しました');
      }
      return false;
    }

    if (this.isRecording) {
      console.warn('既に録音中です');
      return false;
    }

    // オプション設定
    if (options) {
      if (options.language) this.recognition.lang = options.language;
      if (options.continuous !== undefined) this.recognition.continuous = options.continuous;
      if (options.interimResults !== undefined) this.recognition.interimResults = options.interimResults;
      if (options.maxAlternatives) this.recognition.maxAlternatives = options.maxAlternatives;
    }

    try {
      this.recognition.start();
      return true;
    } catch (error) {
      if (this.onErrorCallback) {
        this.onErrorCallback('音声認識の開始に失敗しました');
      }
      return false;
    }
  }

  /**
   * 音声認識を停止
   */
  stopRecording(): void {
    if (this.recognition && this.isRecording) {
      this.recognition.stop();
    }
  }

  /**
   * 結果コールバックを設定
   */
  onResult(callback: (result: SpeechRecognitionResult) => void): void {
    this.onResultCallback = callback;
  }

  /**
   * エラーコールバックを設定
   */
  onError(callback: (error: string) => void): void {
    this.onErrorCallback = callback;
  }

  /**
   * サポート状況を確認
   */
  getIsSupported(): boolean {
    return this.isSupported;
  }

  /**
   * 録音状況を確認
   */
  getIsRecording(): boolean {
    return this.isRecording;
  }

  /**
   * 音声からアイデアを抽出・整理
   */
  async processVoiceIdea(transcript: string): Promise<VoiceIdeaResult | null> {
    try {
      console.log('音声アイデア処理開始:', transcript);
      
      const prompt = `以下は音声入力で取得したアイデアのテキストです。このアイデアを分析し、note記事作成に最適な形に整理してください。

音声入力内容:
「${transcript}」

以下の形式でJSON形式で回答してください:
{
  "originalTranscript": "元の音声入力内容",
  "processedKeyword": "記事のメインキーワード（検索されやすい形）",
  "suggestedTitle": "提案記事タイトル",
  "targetAudience": "想定読者層（初心者向け/中級者向け/専門家向け）",
  "tone": "推奨文体（丁寧で落ち着いた/フレンドリーで親しみやすい/専門的で論理的）",
  "estimatedLength": 記事の推奨文字数（2500/5000/10000）,
  "additionalNotes": "記事作成時の注意点や追加提案"
}

条件:
- processedKeywordは検索エンジンで検索されやすい形に調整
- suggestedTitleは興味を引く魅力的なタイトル
- targetAudienceとtoneは音声の内容から推測
- additionalNotesには具体的なアドバイスを含める`;

      console.log('AI処理開始...');
      const response = await generateText(prompt);
      console.log('AI応答受信:', response);
      
      // JSONレスポンスを解析
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        console.error('JSON形式の応答が見つかりません:', response);
        throw new Error('Invalid JSON response from AI');
      }

      const result = JSON.parse(jsonMatch[0]) as VoiceIdeaResult;
      console.log('音声アイデア処理成功:', result);
      return result;
    } catch (error) {
      console.error('音声アイデア処理エラーの詳細:', error);
      if (error instanceof Error) {
        console.error('エラーメッセージ:', error.message);
        console.error('エラースタック:', error.stack);
      }
      return null;
    }
  }

  /**
   * 音声ファイルからテキストを抽出（将来実装用のプレースホルダー）
   */
  async processAudioFile(file: File): Promise<string | null> {
    try {
      // 現在はブラウザの音声認識APIを使用
      // 将来的にはWhisper APIなどを統合可能
      
      console.warn('音声ファイル処理は現在未実装です。リアルタイム音声入力をご利用ください。');
      return null;
    } catch (error) {
      console.error('音声ファイル処理エラー:', error);
      return null;
    }
  }

  /**
   * マイクの権限を要求
   */
  async requestMicrophonePermission(): Promise<boolean> {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach(track => track.stop()); // 即座に停止
      return true;
    } catch (error) {
      console.error('マイク権限エラー:', error);
      return false;
    }
  }

  /**
   * ブラウザサポート情報を取得
   */
  getSupportInfo(): {
    speechRecognition: boolean;
    mediaDevices: boolean;
    userAgent: string;
    recommendations: string[];
  } {
    const speechRecognition = this.isSupported;
    const mediaDevices = 'mediaDevices' in navigator && 'getUserMedia' in navigator.mediaDevices;
    const userAgent = navigator.userAgent;
    
    const recommendations: string[] = [];
    
    if (!speechRecognition) {
      recommendations.push('Chrome、Edge、Safariの最新版をご利用ください');
    }
    
    if (!mediaDevices) {
      recommendations.push('HTTPS環境でアクセスしてください');
    }
    
    // モバイルデバイスの判定
    const isMobile = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
    if (isMobile) {
      recommendations.push('モバイルデバイスでは「話す」ボタンを長押ししてください');
    }

    return {
      speechRecognition,
      mediaDevices,
      userAgent,
      recommendations
    };
  }
}

// シングルトンインスタンス
export const speechRecognitionService = new SpeechRecognitionService();