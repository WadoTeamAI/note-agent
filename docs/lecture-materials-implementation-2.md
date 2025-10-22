# 📚 note記事自動生成エージェント【実装編②】講義資料

> **📅 開催**: 2025年10月22日 21:30-22:30 (60分)  
> **🎯 テーマ**: アーキテクチャ深掘り・Claude Code活用・実装ノウハウ  
> **👥 対象**: 中級〜上級開発者向け

---

## 📖 講義概要

### 🎯 学習目標
- **アーキテクチャ理解**: Next.js 14 + Claude Code での効率的開発手法
- **実装ノウハウ**: 型安全性・コンポーネント設計・GitHub連携
- **実践スキル**: ライブコーディング・デバッグ・運用最適化

### ⏰ タイムテーブル
| 時間 | 内容 | 詳細 |
|------|------|------|
| 21:30-21:40 | **導入** | プロジェクト概要・Phase 1.5成果 |
| 21:40-21:55 | **Claude Code活用術** | 実践的プロンプト・効率化テクニック |
| 21:55-22:10 | **アーキテクチャ解説** | 設計思想・技術選定理由 |
| 22:10-22:25 | **実装パターン紹介** | コード例・ベストプラクティス |
| 22:25-22:30 | **Q&A・次回予告** | 質問対応・フォローアップ |

---

## 1️⃣ プロジェクト概要 & Phase 1.5 成果

### 📊 プロジェクト基本情報

**🎯 目的**: SEOに強く・読まれるnote記事の自動生成  
**🎨 特徴**: AIっぽくない自然な日本語表現  
**🔄 範囲**: 構成→執筆→画像→SNS の一気通貫自動化  

### ✅ Phase 1.5 完了成果

| 機能 | 説明 | 技術要素 |
|------|------|----------|
| **統合リサーチ** | Google Search + note分析 + SNSトレンド | Tavily API, 並列処理 |
| **音声入力対応** | Web Speech API でアイディア入力 | ブラウザAPI, リアルタイム処理 |
| **A/Bテスト機能** | 複数バージョン生成・比較・最適化 | メトリクス計測, 統計分析 |
| **Next.js 14移行** | App Router + SSR最適化 | 段階的移行, パフォーマンス向上 |

---

## 2️⃣ Claude Code 活用術（実演中心）

### 🤖 Claude Code とは
- **AI開発アシスタント**: コード生成・解析・最適化を支援
- **自然言語インターフェース**: 日本語での指示でコード作成
- **コンテキスト理解**: プロジェクト全体を把握した提案

### 💡 実践的プロンプト例

#### ✨ コード生成プロンプト
```
Next.js 14のApp Routerを使って、記事生成の進捗を表示する
StepIndicatorコンポーネントを作成してください。

要件:
- TypeScriptで型安全に実装
- Tailwind CSSでモダンなUI
- 各ステップにアニメーション効果
- レスポンシブ対応
- 以下のProcessStep enumに対応

enum ProcessStep {
  IDLE = 'IDLE',
  RESEARCH = '統合リサーチ中...',
  ANALYZING = 'SEO分析中...',
  WRITING = '記事本文の執筆中...',
  GENERATING_IMAGE = '画像生成中...',
  DONE = '完了'
}
```

#### 🐛 バグ修正プロンプト
```
以下のReactコンポーネントでエラーが発生しています。
原因を特定し、修正案を提示してください:

[エラーコード貼り付け]

エラーメッセージ:
TypeError: Cannot read properties of undefined (reading 'map')

コンポーネントの意図した動作と、
このエラーを防ぐためのベストプラクティスも教えてください。
```

#### ⚡ パフォーマンス最適化プロンプト
```
現在のNext.jsアプリのパフォーマンスを改善したいです。
以下の課題を解決する具体的な方法を教えてください:

1. 初期読み込みが3秒以上かかる
2. 画像の表示が遅い  
3. バンドルサイズが500KB超過

現在の構成:
- Next.js 14 App Router
- TypeScript
- Tailwind CSS
- 外部API: Gemini AI, Supabase
```

### 🔄 Claude Code 開発ワークフロー

```
開発フロー
├── 1. 機能要件をClaude Codeに相談
├── 2. 型定義・インターフェース設計
├── 3. コンポーネント・サービス実装
├── 4. テストコード生成
├── 5. バグ修正・リファクタリング
├── 6. パフォーマンス最適化
└── 7. ドキュメント生成
```

---

## 3️⃣ アーキテクチャ深掘り

### 🏗️ 設計思想

#### 🎯 設計原則
1. **単一責任の原則**: 1コンポーネント = 1責任
2. **開放閉鎖の原則**: 拡張に開き、修正に閉じる
3. **依存性逆転の原則**: 抽象に依存する
4. **関心の分離**: UI ↔ ビジネスロジック ↔ データ

#### 🧩 レイヤー構造
```
📱 Presentation Layer (UI)
├── app/ - Next.js App Router
├── components/ - React Components  
└── hooks/ - Custom Hooks

🧠 Business Logic Layer
├── services/ - ビジネスロジック
├── utils/ - ヘルパー関数
└── contexts/ - 状態管理

🗄️ Data Access Layer  
├── api/ - 外部API統合
├── database/ - DB操作
└── storage/ - ローカルストレージ

🔧 Infrastructure Layer
├── config/ - 設定管理
├── types/ - 型定義
└── constants/ - 定数定義
```

### 🎨 フロントエンド構成

#### Next.js 14 App Router
```typescript
// app/layout.tsx - ルートレイアウト
export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ja">
      <body>
        <ClientProviders>
          {children}
        </ClientProviders>
      </body>
    </html>
  )
}

// app/page.tsx - メインページ
'use client';
export default function HomePage() {
  const { state, generateArticle } = useArticleGeneration();
  
  return (
    <div className="container mx-auto px-4">
      <InputForm onSubmit={generateArticle} />
      <StepIndicator currentStep={state.currentStep} />
      <OutputDisplay output={state.output} />
    </div>
  );
}
```

#### SSR/CSR最適化パターン
```typescript
// Dynamic Import for Client-side Components
const VoiceIdeaProcessor = dynamic(
  () => import('@/components/audio/VoiceIdeaProcessor'),
  { 
    ssr: false,
    loading: () => <div>音声機能を読み込み中...</div>
  }
);

// Client Providers分離
'use client';
export function ClientProviders({ children }: ProvidersProps) {
  return (
    <ThemeProvider>
      <AudioProvider>
        {children}
      </AudioProvider>
    </ThemeProvider>
  );
}
```

### 🧠 サービス層設計

#### Gemini AI統合パターン
```typescript
// services/ai/geminiService.ts
import { GoogleGenAI } from "@google/genai";

class GeminiService {
  private genAI: GoogleGenAI;
  
  constructor(apiKey: string) {
    this.genAI = new GoogleGenAI(apiKey);
  }

  async createArticleOutline(
    keyword: string,
    tone: Tone,
    audience: Audience
  ): Promise<ArticleOutline> {
    const model = this.genAI.getGenerativeModel({ 
      model: "gemini-2.5-flash" 
    });
    
    const prompt = this.buildOutlinePrompt(keyword, tone, audience);
    
    return await this.withRetry(async () => {
      const result = await model.generateContent(prompt);
      return this.parseOutlineResponse(result.response.text());
    });
  }

  private async withRetry<T>(
    operation: () => Promise<T>,
    maxRetries: number = 3
  ): Promise<T> {
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        if (attempt === maxRetries) throw error;
        await this.delay(1000 * Math.pow(2, attempt));
      }
    }
    throw new Error('Max retries exceeded');
  }
}
```

---

## 4️⃣ 実装パターン & ベストプラクティス

### 🎪 AIワークフロー実装

#### ステップ管理パターン
```typescript
// 状態管理
enum ProcessStep {
  IDLE = 'IDLE',
  RESEARCH = '統合リサーチ中...',
  ANALYZING = 'SEO分析中...',
  WRITING = '記事本文の執筆中...',
  GENERATING_IMAGE = '画像生成中...',
  GENERATING_X_POSTS = 'X告知文生成中...',
  DONE = '完了',
  ERROR = 'エラー'
}

interface GenerationState {
  currentStep: ProcessStep;
  isGenerating: boolean;
  progress: number;
  output: FinalOutput | null;
  error: string | null;
}

// Custom Hook
function useArticleGeneration() {
  const [state, setState] = useState<GenerationState>(initialState);

  const generateArticle = useCallback(async (formData: FormData) => {
    setState(prev => ({ ...prev, isGenerating: true }));
    
    try {
      // Step 1: Research
      setState(prev => ({ ...prev, currentStep: ProcessStep.RESEARCH }));
      const research = await performResearch(formData.keyword);
      
      // Step 2: Analysis
      setState(prev => ({ ...prev, currentStep: ProcessStep.ANALYZING }));
      const analysis = await analyzeSEO(research);
      
      // Step 3: Writing
      setState(prev => ({ ...prev, currentStep: ProcessStep.WRITING }));
      const article = await writeArticle(analysis, formData);
      
      // Step 4: Image Generation
      setState(prev => ({ ...prev, currentStep: ProcessStep.GENERATING_IMAGE }));
      const image = await generateImage(article, formData.imageTheme);
      
      // Final Result
      setState(prev => ({ 
        ...prev, 
        currentStep: ProcessStep.DONE,
        output: { article, image, analysis }
      }));
      
    } catch (error) {
      setState(prev => ({ 
        ...prev, 
        currentStep: ProcessStep.ERROR,
        error: error.message 
      }));
    } finally {
      setState(prev => ({ ...prev, isGenerating: false }));
    }
  }, []);

  return { state, generateArticle };
}
```

### 🎵 音声入力実装パターン

```typescript
// services/audio/speechRecognitionService.ts
export class SpeechRecognitionService {
  private recognition: SpeechRecognition | null = null;
  private isListening = false;

  constructor() {
    if (this.isSpeechRecognitionSupported()) {
      this.setupRecognition();
    }
  }

  private isSpeechRecognitionSupported(): boolean {
    return 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window;
  }

  private setupRecognition(): void {
    const SpeechRecognition = window.webkitSpeechRecognition || window.SpeechRecognition;
    this.recognition = new SpeechRecognition();
    
    this.recognition.continuous = true;
    this.recognition.interimResults = true;
    this.recognition.lang = 'ja-JP';
    this.recognition.maxAlternatives = 1;
  }

  async startListening(
    onResult: (text: string, isFinal: boolean) => void,
    onError?: (error: string) => void
  ): Promise<void> {
    if (!this.recognition) {
      throw new Error('音声認識がサポートされていません');
    }

    if (this.isListening) {
      return;
    }

    this.isListening = true;

    this.recognition.onresult = (event) => {
      let interimTranscript = '';
      let finalTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        
        if (event.results[i].isFinal) {
          finalTranscript += transcript;
        } else {
          interimTranscript += transcript;
        }
      }

      if (finalTranscript) {
        onResult(finalTranscript, true);
      } else if (interimTranscript) {
        onResult(interimTranscript, false);
      }
    };

    this.recognition.onerror = (event) => {
      this.isListening = false;
      onError?.(event.error);
    };

    this.recognition.onend = () => {
      this.isListening = false;
    };

    this.recognition.start();
  }

  stopListening(): void {
    if (this.recognition && this.isListening) {
      this.recognition.stop();
      this.isListening = false;
    }
  }
}

// components/audio/VoiceIdeaProcessor.tsx
export function VoiceIdeaProcessor({ onIdeaGenerated }: Props) {
  const [isSupported, setIsSupported] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const speechService = useRef(new SpeechRecognitionService());

  useEffect(() => {
    setIsSupported(speechService.current.isSupported());
  }, []);

  const handleStartListening = async () => {
    try {
      setIsListening(true);
      setTranscript('');
      
      await speechService.current.startListening(
        (text, isFinal) => {
          setTranscript(prev => isFinal ? prev + text + ' ' : text);
        },
        (error) => {
          console.error('音声認識エラー:', error);
          setIsListening(false);
        }
      );
    } catch (error) {
      console.error('音声入力開始エラー:', error);
      setIsListening(false);
    }
  };

  const handleStopListening = () => {
    speechService.current.stopListening();
    setIsListening(false);
    
    if (transcript.trim()) {
      onIdeaGenerated(transcript.trim());
    }
  };

  if (!isSupported) {
    return (
      <div className="voice-not-supported">
        <p>音声認識に対応していないブラウザです</p>
        <p>Chrome、Edge、Safariをご利用ください</p>
      </div>
    );
  }

  return (
    <div className="voice-processor">
      <button
        onClick={isListening ? handleStopListening : handleStartListening}
        className={`voice-button ${isListening ? 'listening' : ''}`}
      >
        {isListening ? '🔴 停止' : '🎤 音声入力'}
      </button>
      
      {transcript && (
        <div className="transcript">
          <p>認識中: {transcript}</p>
        </div>
      )}
    </div>
  );
}
```

### 📊 A/Bテスト実装パターン

```typescript
// services/abtest/abtestService.ts
interface ABTestVariant {
  approach: 'data-driven' | 'story-driven' | 'problem-solving';
  tone: 'analytical' | 'personal' | 'practical';
}

export async function generateABTestVersions(
  formData: FormData,
  variantCount: number = 2
): Promise<ABTestResult[]> {
  const variants: ABTestVariant[] = [
    { approach: 'data-driven', tone: 'analytical' },
    { approach: 'story-driven', tone: 'personal' },
    { approach: 'problem-solving', tone: 'practical' }
  ];

  const results: ABTestResult[] = [];

  for (let i = 0; i < variantCount; i++) {
    const variant = variants[i % variants.length];
    
    const modifiedFormData = {
      ...formData,
      additionalInstructions: `
        ${variant.approach}アプローチで、${variant.tone}なトーンで執筆してください。
        
        ${variant.approach === 'data-driven' ? 
          '統計データや具体的な数値を重視し、論理的な構成で' :
          variant.approach === 'story-driven' ?
          '個人的な体験談やストーリーを中心に、感情に訴える形で' :
          '問題提起から解決策提示まで、実践的なアクション重視で'
        }
      `
    };

    const result = await generateSingleVersion(modifiedFormData, `Version ${i + 1}`);
    results.push(result);
  }

  return results;
}

// メトリクス計算
interface ABTestMetrics {
  readabilityScore: number;
  seoScore: number;
  engagementPrediction: number;
  keywordDensity: number;
  uniquenessScore: number;
}

async function calculateMetrics(
  content: string, 
  keyword: string
): Promise<ABTestMetrics> {
  return {
    readabilityScore: calculateReadabilityScore(content),
    seoScore: calculateSEOScore(content, keyword),
    engagementPrediction: await predictEngagement(content),
    keywordDensity: calculateKeywordDensity(content, keyword),
    uniquenessScore: calculateUniquenessScore(content)
  };
}

function calculateReadabilityScore(content: string): number {
  const sentences = content.split(/[。！？]/).length - 1;
  const words = content.length;
  const avgWordsPerSentence = words / sentences;
  
  // 日本語の場合、1文あたり20-30文字が読みやすい
  if (avgWordsPerSentence >= 20 && avgWordsPerSentence <= 30) {
    return 0.9;
  } else if (avgWordsPerSentence >= 15 && avgWordsPerSentence <= 35) {
    return 0.7;
  } else {
    return 0.5;
  }
}
```

---

## 5️⃣ GitHub連携ワークフロー

### 🌿 ブランチ戦略

#### Git Flow採用
```
main (本番環境)
├── develop (開発環境)
│   ├── feature/voice-input-enhancement
│   ├── feature/abtest-analytics
│   ├── feature/lecture-materials
│   └── feature/performance-optimization
└── hotfix/security-patch
```

#### 実際のワークフロー
```bash
# 1. developから新機能ブランチ作成
git checkout develop
git pull origin develop
git checkout -b feature/new-functionality

# 2. 機能開発・コミット
git add .
git commit -m "feat: 新機能実装

- コンポーネント追加
- 型定義更新
- テスト追加

🤖 Generated with Claude Code
Co-Authored-By: Claude <noreply@anthropic.com>"

# 3. プッシュ・プルリクエスト
git push -u origin feature/new-functionality
# GitHub UIでPR作成

# 4. レビュー後マージ
# 5. developからmainへのリリース
```

### 📝 コミット規約

#### Conventional Commits準拠
```
<type>(<scope>): <subject>

<body>

<footer>
```

#### 実用例
```bash
feat(audio): Web Speech API音声入力機能を追加

- VoiceIdeaProcessorコンポーネント実装
- ブラウザ互換性チェック機能
- リアルタイム文字起こし対応
- エラーハンドリング強化

Closes #123
🤖 Generated with Claude Code
Co-Authored-By: Claude <noreply@anthropic.com>
```

### 🚀 CI/CD パイプライン

```yaml
# .github/workflows/ci.yml
name: CI/CD Pipeline

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Type checking
        run: npm run type-check

      - name: Lint check
        run: npm run lint

      - name: Unit tests
        run: npm run test

      - name: E2E tests
        run: npm run test:e2e

      - name: Build check
        run: npm run build

  deploy:
    needs: test
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    steps:
      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.ORG_ID }}
          vercel-project-id: ${{ secrets.PROJECT_ID }}
```

---

## 6️⃣ デバッグ & パフォーマンス最適化

### 🐛 効果的なデバッグ手法

#### 段階的デバッグアプローチ
```typescript
// デバッグヘルパー
export class DebugHelper {
  static logStep(step: string, data?: any): void {
    if (process.env.NODE_ENV === 'development') {
      console.group(`🔍 Debug: ${step}`);
      if (data) {
        console.log('Data:', data);
        console.log('Type:', typeof data);
        console.log('Keys:', Object.keys(data));
      }
      console.trace('Call stack');
      console.groupEnd();
    }
  }

  static measurePerformance<T>(
    label: string, 
    fn: () => T
  ): T {
    if (process.env.NODE_ENV === 'development') {
      console.time(label);
      const result = fn();
      console.timeEnd(label);
      return result;
    }
    return fn();
  }

  static logApiCall(
    url: string, 
    params: any, 
    response: any
  ): void {
    if (process.env.NODE_ENV === 'development') {
      console.group(`🌐 API Call: ${url}`);
      console.log('Request params:', params);
      console.log('Response:', response);
      console.log('Status:', response.status || 'N/A');
      console.groupEnd();
    }
  }
}

// 実際の使用例
async function generateArticle(formData: FormData) {
  DebugHelper.logStep('Article generation started', formData);
  
  try {
    const outline = await DebugHelper.measurePerformance(
      'Outline generation',
      () => createArticleOutline(formData.keyword, formData.tone, formData.audience)
    );
    
    DebugHelper.logStep('Outline created', outline);
    
    const article = await writeArticle(outline, formData.targetLength);
    DebugHelper.logStep('Article completed', { length: article.length });
    
    return article;
  } catch (error) {
    DebugHelper.logStep('Error occurred', error);
    throw error;
  }
}
```

### ⚡ パフォーマンス最適化

#### コード分割戦略
```typescript
// 1. Route-based splitting (自動)
// Next.js App Routerが自動で各ページを分割

// 2. Component-based splitting
const HeavyComponent = lazy(() => import('./HeavyComponent'));
const AnalyticsComponent = lazy(() => import('./AnalyticsComponent'));

function App() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <HeavyComponent />
      <AnalyticsComponent />
    </Suspense>
  );
}

// 3. Library splitting (webpack設定)
// next.config.js
module.exports = {
  webpack: (config, { dev, isServer }) => {
    if (!dev && !isServer) {
      config.optimization.splitChunks = {
        chunks: 'all',
        cacheGroups: {
          vendor: {
            test: /[\\/]node_modules[\\/]/,
            name: 'vendors',
            chunks: 'all',
          },
          gemini: {
            test: /[\\/]node_modules[\\/]@google[\\/]genai/,
            name: 'gemini',
            chunks: 'all',
          }
        }
      };
    }
    return config;
  }
};
```

#### メモ化最適化
```typescript
// 重い計算のメモ化
const ExpensiveComponent = memo(function ExpensiveComponent({ 
  data, 
  onAction 
}: Props) {
  // 重い計算をメモ化
  const expensiveValue = useMemo(() => {
    return computeComplexValue(data);
  }, [data]);

  // コールバックをメモ化
  const handleAction = useCallback((id: string) => {
    onAction(id);
  }, [onAction]);

  return (
    <div>
      <div>Computed: {expensiveValue}</div>
      <button onClick={() => handleAction('test')}>
        Action
      </button>
    </div>
  );
});

// 条件付きメモ化（カスタムフック）
function useExpensiveCalculation(data: ComplexData) {
  return useMemo(() => {
    // データが複雑な場合のみメモ化
    if (data.items.length > 100) {
      return computeExpensiveValue(data);
    }
    return computeSimpleValue(data);
  }, [data]);
}
```

---

## 7️⃣ 運用・監視戦略

### 📊 エラー監視システム

```typescript
// Error Boundary実装
class ErrorBoundary extends Component<
  { children: ReactNode; fallback: ComponentType<{ error: Error }> },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // エラー追跡サービスに送信
    this.logErrorToService(error, errorInfo);
  }

  private logErrorToService(error: Error, errorInfo: ErrorInfo) {
    const errorDetails = {
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href
    };

    // Sentryやその他のサービスに送信
    if (window.Sentry) {
      window.Sentry.captureException(error, {
        extra: errorDetails
      });
    }

    // 自前のログシステムに送信
    fetch('/api/log-error', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(errorDetails)
    }).catch(console.error);
  }

  render() {
    if (this.state.hasError) {
      const FallbackComponent = this.props.fallback;
      return <FallbackComponent error={this.state.error!} />;
    }

    return this.props.children;
  }
}

// 使用例
function App() {
  return (
    <ErrorBoundary fallback={ErrorFallback}>
      <ArticleGenerator />
    </ErrorBoundary>
  );
}

function ErrorFallback({ error }: { error: Error }) {
  return (
    <div className="error-fallback">
      <h2>申し訳ございません。エラーが発生しました。</h2>
      <details>
        <summary>技術的な詳細</summary>
        <pre>{error.message}</pre>
      </details>
      <button onClick={() => window.location.reload()}>
        ページを再読み込み
      </button>
    </div>
  );
}
```

### 📈 パフォーマンス監視

```typescript
// カスタムパフォーマンス監視
export class PerformanceMonitor {
  private static metrics = new Map<string, number[]>();

  static measureAPICall<T>(
    apiName: string,
    apiCall: () => Promise<T>
  ): Promise<T> {
    const startTime = performance.now();
    
    return apiCall()
      .then(result => {
        const duration = performance.now() - startTime;
        this.recordMetric(`api_${apiName}`, duration);
        
        // 長時間のAPI呼び出しを警告
        if (duration > 10000) { // 10秒以上
          console.warn(`Slow API call detected: ${apiName} took ${duration}ms`);
        }
        
        return result;
      })
      .catch(error => {
        const duration = performance.now() - startTime;
        this.recordMetric(`api_${apiName}_error`, duration);
        throw error;
      });
  }

  static measureRender(componentName: string, renderFn: () => any) {
    const startTime = performance.now();
    const result = renderFn();
    const duration = performance.now() - startTime;
    
    this.recordMetric(`render_${componentName}`, duration);
    
    // 重いレンダリングを警告
    if (duration > 16) { // 16ms以上（60FPSを下回る）
      console.warn(`Slow render detected: ${componentName} took ${duration}ms`);
    }
    
    return result;
  }

  private static recordMetric(name: string, value: number) {
    const values = this.metrics.get(name) || [];
    values.push(value);
    
    // 最新100件のみ保持
    if (values.length > 100) {
      values.shift();
    }
    
    this.metrics.set(name, values);
  }

  static getPerformanceReport(): Record<string, {
    avg: number;
    min: number;
    max: number;
    count: number;
  }> {
    const report: any = {};
    
    for (const [name, values] of this.metrics.entries()) {
      report[name] = {
        avg: values.reduce((a, b) => a + b, 0) / values.length,
        min: Math.min(...values),
        max: Math.max(...values),
        count: values.length
      };
    }
    
    return report;
  }
}

// React Profilerとの連携
function PerformanceProfiler({ 
  name, 
  children 
}: { 
  name: string; 
  children: ReactNode 
}) {
  const onRender = useCallback((
    id: string,
    phase: 'mount' | 'update',
    actualDuration: number,
    baseDuration: number,
    startTime: number,
    commitTime: number
  ) => {
    PerformanceMonitor.recordMetric(
      `component_${id}_${phase}`,
      actualDuration
    );
  }, []);

  return (
    <Profiler id={name} onRender={onRender}>
      {children}
    </Profiler>
  );
}
```

---

## 8️⃣ 実践ハンズオン（ライブコーディング用）

### 🎯 デモシナリオ

#### 1. Claude Code活用実演（5分）
```
実演内容:
1. 新機能要求をClaude Codeに投げる
   「記事生成の進捗率を%で表示する機能を追加したい」

2. 型定義から実装まで一気に生成
   - ProgressBarコンポーネント
   - 進捗計算ロジック
   - アニメーション効果

3. バグ修正デモ
   - 意図的にエラーを発生させる
   - Claude Codeで原因分析・修正案提示
```

#### 2. GitHub連携ワークフロー（5分）
```bash
# 実際のコマンド実行
git checkout -b feature/progress-indicator
# Claude Code生成コードをコミット
git add .
git commit -m "feat: 記事生成進捗表示機能を追加

🤖 Generated with Claude Code"
git push -u origin feature/progress-indicator
# GitHub UIでPR作成画面を表示
```

#### 3. リアルタイム機能追加（10分）
```typescript
// ライブで実装するコンポーネント例
interface ProgressIndicatorProps {
  currentStep: ProcessStep;
  totalSteps: number;
  isGenerating: boolean;
}

export function ProgressIndicator({ 
  currentStep, 
  totalSteps, 
  isGenerating 
}: ProgressIndicatorProps) {
  // Claude Codeと一緒に実装
  const progress = calculateProgress(currentStep, totalSteps);
  
  return (
    <div className="progress-container">
      <div className="progress-bar">
        <div 
          className="progress-fill"
          style={{ width: `${progress}%` }}
        />
      </div>
      <span className="progress-text">
        {isGenerating ? currentStep : '待機中'}
      </span>
    </div>
  );
}

function calculateProgress(step: ProcessStep, total: number): number {
  const stepIndex = Object.values(ProcessStep).indexOf(step);
  return Math.round((stepIndex / total) * 100);
}
```

### 💡 参加者向けチャレンジ

```
フォローアップ課題:
□ 今回のリポジトリをfork
□ 自分なりの機能を1つ追加（例: ダークモード、音声速度調整）
□ GitHub Issuesで質問や改善提案を投稿
□ Claude Codeを使った開発体験をシェア

次回までの宿題:
□ 実際にClaude Codeでコンポーネントを1つ作成
□ パフォーマンス最適化を1つ実装
□ エラーハンドリングを改善
```

---

## 🔗 参考リンク & 継続学習

### 📚 公式ドキュメント
- [Next.js 14 Documentation](https://nextjs.org/docs)
- [React 19 Documentation](https://react.dev/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Claude Code Documentation](https://claude.ai/code)

### 🛠️ 開発ツール
- [Vercel](https://vercel.com/) - デプロイメント
- [Supabase](https://supabase.com/) - バックエンドサービス
- [Sentry](https://sentry.io/) - エラー監視
- [Lighthouse](https://developers.google.com/web/tools/lighthouse) - パフォーマンス監査

### 🎓 継続学習リソース
- [React Patterns](https://reactpatterns.com/) - Reactデザインパターン
- [Web.dev](https://web.dev/) - Webパフォーマンス最適化
- [TypeScript Deep Dive](https://basarat.gitbook.io/typescript/) - TypeScript詳解
- [Next.js Learn](https://nextjs.org/learn) - Next.js公式チュートリアル

---

**🚀 本日の目標達成: Claude Code × Next.js 14 で効率的な開発フローをマスターしよう！**

### 📞 質問・フォローアップ
- **GitHub Issues**: 技術的な質問や改善提案
- **Discord**: リアルタイムな質疑応答
- **次回予告**: Phase 2機能（外部API統合・リアルタイム協調）の実装編

---

*🤖 この講義資料はClaude Codeを活用して作成されました*

### 🎯 目的・コンセプト

| 項目 | 内容 |
|------|------|
| **目的** | SEOに強く・読まれるnote記事の自動生成 |
| **特徴** | AIっぽくない自然な日本語表現 |
| **範囲** | 構成→執筆→画像→SNS の一気通貫自動化 |

### 🏗️ Phase 1.5 完了状況

- ✅ **統合リサーチ機能**: Google Search + note分析 + SNSトレンド
- ✅ **音声入力対応**: Web Speech API でアイディア入力
- ✅ **A/Bテスト機能**: 複数バージョン生成・比較
- ✅ **Next.js 14 App Router移行**: SSR最適化・パフォーマンス向上

### 🚀 本日の実装テーマ

1. **アーキテクチャ深掘り**: 設計思想・技術選定理由
2. **開発効率化のノウハウ**: 型安全性・コンポーネント設計
3. **実装パターン紹介**: 具体的なコード例・ベストプラクティス

---

## 2. アーキテクチャ

### 🎨 フロントエンド (Next.js 14)

#### App Router構造
```
src/app/
├── page.tsx          # メインUI
├── layout.tsx        # ルートレイアウト
└── api/              # APIルート
    └── tavily-search/
```

#### コンポーネント設計
```
src/components/
├── forms/            # 入力フォーム
├── display/          # 結果表示
├── feedback/         # 進捗表示
└── providers/        # クライアント側プロバイダー
```

#### SSR/CSR最適化
- **Dynamic Import活用**: 音声認識などクライアント専用機能
- **Client Providers分離**: SSRエラー回避
- **段階的ハイドレーション**: パフォーマンス最適化

### 🧠 AIサービス層

#### Gemini 2.5 Flash統合
```typescript
// services/ai/geminiService.ts
export async function createArticleOutline(
  keyword: string, 
  tone: Tone, 
  audience: Audience
): Promise<ArticleOutline>

export async function writeArticle(
  outline: ArticleOutline, 
  targetLength: number
): Promise<string>

export async function generateImage(
  prompt: string
): Promise<string>
```

#### プロンプト最適化
- **アンチAIライティング規則**: 翻訳調表現の排除
- **自然な日本語表現**: 「〜することができます」→「〜できます」
- **パーソナルな体験談組み込み**: 人間らしい温かみ

#### エラーハンドリング
```typescript
async function withRetry<T>(
  operation: () => Promise<T>,
  maxRetries: number = 2
): Promise<T> {
  // 指数バックオフでリトライ
}
```

### 🔍 リサーチエンジン

- **Google Search API統合**: SEO分析・競合調査
- **noteプラットフォーム分析**: 人気記事トレンド
- **SNSトレンド調査**: X(Twitter)での話題性
- **Tavily APIファクトチェック**: 情報の正確性確保

### 📱 ソーシャル連携

#### X(Twitter)投稿生成
```typescript
export interface XPostGenerationResult {
  shortPosts: XPost[];      // 140文字 × 5パターン
  longPosts: XPost[];       // 300-500文字 × 2パターン
  threadPosts: XThread[];   // 5-7ツイート × 複数形式
}
```

#### エンゲージメント予測
- 各投稿の予想エンゲージメント率
- ターゲット層別の最適化

### 💾 データ管理

#### Supabase (メインDB)
- **PostgreSQL + Pgvector**: 将来のRAG機能用
- **Row Level Security**: セキュリティ強化
- **履歴・分析データ保存**: パフォーマンス追跡

#### LocalStorage (フォールバック)
- オフライン対応
- Supabase未設定時の代替

---

## 3. 技術スタック

### 🎯 コア技術

| 技術 | バージョン | 用途 |
|------|-----------|------|
| **Next.js** | 15.1.0 | App Router・SSR |
| **React** | 19.2.0 | UI構築 |
| **TypeScript** | 5.8.2 | 型安全性確保 |
| **Tailwind CSS** | 3.4.16 | スタイリング |

### 🤖 AI・外部API

```json
{
  "@google/genai": "^1.23.0",           // Gemini AI
  "@supabase/supabase-js": "^2.75.0",   // データベース
  "Web Speech API": "標準",              // 音声認識
  "Tavily Search API": "外部"            // ファクトチェック
}
```

### 📦 UI・機能ライブラリ

- **react-markdown**: Markdown表示・編集
- **mermaid**: 図解生成
- **recharts**: 分析結果のグラフ表示
- **yjs**: リアルタイム協調編集 (Phase 2)

### 🔨 開発・ビルドツール

- **@playwright/test**: E2Eテスト
- **ESLint + Next.js設定**: コード品質
- **Webpack最適化設定**: バンドルサイズ削減

---

## 4. ディレクトリ構造

### 📂 全体構造
```
src/
├── app/              # Next.js App Router
├── components/       # UIコンポーネント
├── services/         # ビジネスロジック
├── types/           # 型定義
├── config/          # 設定管理
├── hooks/           # カスタムフック
├── utils/           # ユーティリティ
└── styles/          # スタイル定義
```

### 📂 詳細構造

#### components/ - UIコンポーネント
```
components/
├── forms/           # 入力フォーム
│   ├── InputGroup.tsx
│   └── CollapsibleSection.tsx
├── display/         # 結果表示
│   ├── OutputDisplay.tsx
│   └── XPostDisplay.tsx
├── feedback/        # 進捗・ステータス
│   └── StepIndicator.tsx
├── audio/           # 音声入力
│   └── VoiceIdeaProcessor.tsx
├── history/         # 履歴管理
│   └── HistoryPanel.tsx
└── providers/       # クライアント側プロバイダー
    └── ClientProviders.tsx
```

#### services/ - ビジネスロジック
```
services/
├── ai/              # Gemini AI統合
│   └── geminiService.ts
├── research/        # リサーチエンジン
│   ├── searchService.ts
│   ├── noteAnalyzer.ts
│   └── trendAnalyzer.ts
├── social/          # SNS投稿生成
│   └── xPostGenerator.ts
├── database/        # Supabase連携
│   ├── supabaseClient.ts
│   └── historyService.ts
├── audio/           # 音声認識
│   └── speechRecognitionService.ts
└── abtest/          # A/Bテスト
    └── abtestService.ts
```

#### types/ - 型定義
```
types/
├── index.ts         # 共通型・再エクスポート
├── article.types.ts # 記事関連
├── api.types.ts     # API関連
├── social.types.ts  # SNS関連
├── speech.types.ts  # 音声認識関連
└── abtest.types.ts  # A/Bテスト関連
```

---

## 5. 開発効率化ノウハウ

### 🎯 型安全性の確保

#### 厳密なTypeScript設定
```json
// tsconfig.json
{
  "compilerOptions": {
    "strict": true,
    "noEmit": true,
    "forceConsistentCasingInFileNames": true,
    "noFallthroughCasesInSwitch": true
  }
}
```

#### ドメイン別型定義分割
```typescript
// types/article.types.ts
export interface ArticleOutline {
  title: string;
  metaDescription: string;
  sections: Section[];
  faq: FAQItem[];
}

// types/social.types.ts
export interface XPost {
  content: string;
  hashtags: string[];
  engagementPrediction: 'high' | 'medium' | 'low';
}
```

#### API レスポンスの型ガード
```typescript
function isValidArticleOutline(data: unknown): data is ArticleOutline {
  return typeof data === 'object' && 
         data !== null && 
         'title' in data && 
         'sections' in data;
}
```

### 🔄 状態管理パターン

#### useStateフック活用
```typescript
const [currentStep, setCurrentStep] = useState<ProcessStep>(ProcessStep.IDLE);
const [isGenerating, setIsGenerating] = useState(false);
const [output, setOutput] = useState<FinalOutput | null>(null);
```

#### Custom Hooks抽出
```typescript
// hooks/useArticleGeneration.ts
export function useArticleGeneration() {
  const [state, setState] = useState<GenerationState>(...);
  
  const generateArticle = useCallback(async (formData: FormData) => {
    // 生成ロジック
  }, []);
  
  return { state, generateArticle };
}
```

#### Provider分離戦略
```typescript
// components/providers/ClientProviders.tsx
'use client';
export function ClientProviders({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <AudioProvider>
        {children}
      </AudioProvider>
    </ThemeProvider>
  );
}
```

### 🎨 コンポーネント設計

#### 単一責任の原則
```typescript
// ❌ 悪い例: 複数の責任
function ArticleGenerator() {
  // フォーム処理 + API呼び出し + 結果表示
}

// ✅ 良い例: 責任分離
function InputForm({ onSubmit }: { onSubmit: (data: FormData) => void }) {}
function StepIndicator({ currentStep }: { currentStep: ProcessStep }) {}
function OutputDisplay({ output }: { output: FinalOutput }) {}
```

#### Props インターフェース定義
```typescript
interface InputGroupProps {
  keyword: string;
  onKeywordChange: (value: string) => void;
  tone: Tone;
  onToneChange: (value: Tone) => void;
  audience: Audience;
  onAudienceChange: (value: Audience) => void;
}
```

#### 再利用可能なUI部品化
```typescript
// components/forms/CollapsibleSection.tsx
interface CollapsibleSectionProps {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}

export function CollapsibleSection({ 
  title, 
  children, 
  defaultOpen = false 
}: CollapsibleSectionProps) {
  // 折りたたみ可能なセクション実装
}
```

### 🚦 エラーハンドリング

#### 段階的エラー処理
```typescript
try {
  const outline = await createArticleOutline(keyword, tone, audience);
  setCurrentStep(ProcessStep.WRITING);
  
  const article = await writeArticle(outline, targetLength);
  setCurrentStep(ProcessStep.GENERATING_IMAGE);
  
} catch (error) {
  if (error instanceof APIError) {
    // API固有のエラー処理
  } else if (error instanceof ValidationError) {
    // バリデーションエラー処理
  } else {
    // 予期しないエラー処理
  }
  setCurrentStep(ProcessStep.ERROR);
}
```

#### ユーザーフレンドリーなメッセージ
```typescript
function getErrorMessage(error: Error): string {
  if (error.message.includes('API_KEY')) {
    return 'APIキーの設定に問題があります。.env.localファイルを確認してください。';
  }
  if (error.message.includes('RATE_LIMIT')) {
    return 'API利用制限に達しました。少し時間をおいてから再試行してください。';
  }
  return '予期しないエラーが発生しました。もう一度お試しください。';
}
```

#### 復旧可能な処理設計
```typescript
async function withRetry<T>(
  operation: () => Promise<T>,
  maxRetries: number = 2,
  baseDelay: number = 500
): Promise<T> {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      if (attempt === maxRetries) throw error;
      
      const delay = baseDelay * Math.pow(2, attempt);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  throw new Error('Max retries exceeded');
}
```

### 📈 パフォーマンス最適化

#### Dynamic Import (コード分割)
```typescript
// 音声認識は必要時のみロード
const VoiceIdeaProcessor = dynamic(
  () => import('@/components/audio/VoiceIdeaProcessor').then(mod => ({ 
    default: mod.VoiceIdeaProcessor 
  })),
  { ssr: false }
);

// テーマ切り替えもクライアント専用
const ThemeToggle = dynamic(
  () => import('@/components/theme/ThemeToggle'),
  { ssr: false }
);
```

#### バンドルサイズ最適化
```javascript
// next.config.js
webpack: (config, { dev, isServer }) => {
  if (!dev && !isServer) {
    config.optimization.splitChunks = {
      chunks: 'all',
      cacheGroups: {
        vendor: {
          test: /[\\/]node_modules[\\/]/,
          name: 'vendors',
          chunks: 'all',
        },
        gemini: {
          test: /[\\/]node_modules[\\/]@google[\\/]genai/,
          name: 'gemini',
          chunks: 'all',
        },
      },
    };
  }
  return config;
}
```

#### 画像・リソース最適化
```javascript
// next.config.js
images: {
  formats: ['image/webp', 'image/avif'],
  deviceSizes: [640, 750, 828, 1080, 1200, 1920],
  imageSizes: [16, 32, 48, 64, 96, 128, 256],
}
```

---

## 6. 実装パターン

### 🎪 AIワークフロー実装

#### ステップ管理 (ProcessStep enum)
```typescript
export enum ProcessStep {
  IDLE = 'IDLE',
  RESEARCH = '統合リサーチ中...',
  ANALYZING = 'SEO分析中...',
  OUTLINING = '記事構成案の作成中...',
  WRITING = '記事本文の執筆中...',
  FACT_CHECKING = 'ファクトチェック中...',
  GENERATING_DIAGRAMS = '図解生成中...',
  GENERATING_IMAGE = '画像生成中...',
  GENERATING_X_POSTS = 'X告知文生成中...',
  DONE = '完了',
  ERROR = 'エラー',
}
```

#### 進捗表示の最適化
```typescript
// components/feedback/StepIndicator.tsx
export default function StepIndicator({ currentStep }: { currentStep: ProcessStep }) {
  const getStatusImage = (step: ProcessStep) => {
    const statusImages = {
      [ProcessStep.RESEARCH]: '/images/status/research.png',
      [ProcessStep.ANALYZING]: '/images/status/analyzing.png',
      [ProcessStep.WRITING]: '/images/status/writing.png',
      // ...
    };
    return statusImages[step] || '/images/status/default.png';
  };

  return (
    <div className="step-indicator">
      <img src={getStatusImage(currentStep)} alt={currentStep} />
      <p>{currentStep}</p>
    </div>
  );
}
```

#### エラー時の復旧処理
```typescript
const handleGenerateArticle = async (formData: FormData) => {
  try {
    setIsGenerating(true);
    setCurrentStep(ProcessStep.RESEARCH);
    
    // 各ステップを順次実行
    for (const step of GENERATION_STEPS) {
      await executeStep(step, formData);
    }
    
    setCurrentStep(ProcessStep.DONE);
  } catch (error) {
    console.error('Generation failed:', error);
    setCurrentStep(ProcessStep.ERROR);
    setErrorMessage(getErrorMessage(error));
  } finally {
    setIsGenerating(false);
  }
};
```

#### プロンプト最適化手法
```typescript
const ANTI_AI_WRITING_RULES = `
以下のルールに従って自然な日本語で執筆してください：

【禁止表現】
- 翻訳調: "〜することができます" → "〜できます"
- 機械的: "〜について説明します" → 直接的な内容
- 硬い表現: "あなたは〜" → 自然な呼びかけ

【必須要素】
- 個人的な体験談を1つ以上含める
- "実は..."、"正直なところ..."などの自然な表現
- 具体的な例やエピソード
- 読者との共感ポイント
`;

const PERSONAL_EXPERIENCE_PATTERNS = [
  "私自身も初めて{テーマ}に挑戦した時、{具体的な困難}で躓いてしまい...",
  "友人から聞いた話ですが、{状況説明}の時に{体験内容}だったそうです...",
  "以前職場で{テーマ}の案件を担当した際、{学んだこと}が印象的でした...",
];
```

### 🎵 音声入力実装

#### Web Speech API活用
```typescript
// services/audio/speechRecognitionService.ts
export class SpeechRecognitionService {
  private recognition: SpeechRecognition | null = null;

  constructor() {
    if (typeof window !== 'undefined' && 'webkitSpeechRecognition' in window) {
      this.recognition = new window.webkitSpeechRecognition();
      this.setupRecognition();
    }
  }

  private setupRecognition() {
    if (!this.recognition) return;

    this.recognition.continuous = true;
    this.recognition.interimResults = true;
    this.recognition.lang = 'ja-JP';
  }

  async startListening(onResult: (text: string) => void): Promise<void> {
    if (!this.recognition) {
      throw new Error('Speech recognition not supported');
    }

    this.recognition.onresult = (event) => {
      let finalTranscript = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript;
        }
      }
      if (finalTranscript) {
        onResult(finalTranscript);
      }
    };

    this.recognition.start();
  }
}
```

#### ブラウザ互換性対応
```typescript
// components/audio/VoiceIdeaProcessor.tsx
export function VoiceIdeaProcessor({ onIdeaGenerated }: Props) {
  const [isSupported, setIsSupported] = useState(false);
  const [isListening, setIsListening] = useState(false);

  useEffect(() => {
    // ブラウザサポート確認
    const checkSupport = () => {
      const hasWebkitSpeech = 'webkitSpeechRecognition' in window;
      const hasSpeech = 'SpeechRecognition' in window;
      setIsSupported(hasWebkitSpeech || hasSpeech);
    };

    checkSupport();
  }, []);

  if (!isSupported) {
    return (
      <div className="voice-not-supported">
        <p>お使いのブラウザは音声認識に対応していません。</p>
        <p>Chrome、Edge、Safariをご利用ください。</p>
      </div>
    );
  }

  // 音声認識UI実装...
}
```

#### リアルタイム文字起こし
```typescript
const handleVoiceInput = useCallback(async () => {
  setIsListening(true);
  setTranscript('');

  try {
    await speechService.startListening((text) => {
      setTranscript(prev => prev + text);
      
      // リアルタイム表示更新
      if (text.length > 50) {
        // 一定文字数で区切って処理
        processTranscriptChunk(text);
      }
    });
  } catch (error) {
    console.error('Voice input failed:', error);
    setError('音声認識エラーが発生しました');
  } finally {
    setIsListening(false);
  }
}, []);
```

#### 音声からアイディア抽出
```typescript
async function extractIdeasFromVoice(transcript: string): Promise<string[]> {
  const prompt = `
以下の音声入力から記事のアイディアを抽出してください：

音声入力: "${transcript}"

以下の形式で3-5個のアイディアを提案してください：
1. 具体的なキーワード
2. 想定される読者層
3. 記事の方向性

出力形式: JSON配列
`;

  const response = await geminiService.generateText(prompt);
  return JSON.parse(response);
}
```

### 📊 A/Bテスト実装

#### 複数バージョン生成
```typescript
// services/abtest/abtestService.ts
export async function generateABTestVersions(
  formData: FormData,
  versionCount: number = 2
): Promise<ABTestResult[]> {
  const variations = [
    { approach: 'data-driven', tone: 'analytical' },
    { approach: 'story-driven', tone: 'personal' },
    { approach: 'problem-solving', tone: 'practical' },
  ];

  const results: ABTestResult[] = [];

  for (let i = 0; i < versionCount; i++) {
    const variation = variations[i % variations.length];
    const modifiedFormData = {
      ...formData,
      additionalInstructions: `${variation.approach}アプローチで${variation.tone}なトーンで執筆`
    };

    const result = await generateSingleVersion(modifiedFormData, `Version ${i + 1}`);
    results.push(result);
  }

  return results;
}
```

#### パフォーマンス比較
```typescript
interface ABTestMetrics {
  readabilityScore: number;      // 読みやすさスコア
  seoScore: number;             // SEOスコア
  engagementPrediction: number; // エンゲージメント予測
  keywordDensity: number;       // キーワード密度
  uniquenessScore: number;      // 独自性スコア
}

async function analyzeVersionPerformance(
  content: string,
  keyword: string
): Promise<ABTestMetrics> {
  // 各種メトリクスを計算
  const readabilityScore = calculateReadability(content);
  const seoScore = analyzeSEOFactors(content, keyword);
  const engagementPrediction = predictEngagement(content);
  
  return {
    readabilityScore,
    seoScore,
    engagementPrediction,
    keywordDensity: calculateKeywordDensity(content, keyword),
    uniquenessScore: calculateUniqueness(content),
  };
}
```

#### 最適化指標の測定
```typescript
export function compareABTestVersions(results: ABTestResult[]): ABTestComparison {
  const comparison: ABTestComparison = {
    winner: null,
    metrics: {},
    recommendations: []
  };

  // 各メトリクスでの最高スコア版を特定
  const metricWinners = {
    readability: getBestByMetric(results, 'readabilityScore'),
    seo: getBestByMetric(results, 'seoScore'),
    engagement: getBestByMetric(results, 'engagementPrediction'),
  };

  // 総合的な勝者を決定
  comparison.winner = determineOverallWinner(results, metricWinners);
  
  // 改善提案を生成
  comparison.recommendations = generateRecommendations(results, metricWinners);

  return comparison;
}
```

### 🔍 統合リサーチ実装

#### 複数API並列処理
```typescript
// services/research/integratedResearch.ts
export async function performIntegratedResearch(keyword: string): Promise<ResearchResult> {
  try {
    // 並列で複数のリサーチを実行
    const [
      searchResults,
      noteAnalysis,
      trendData,
      factCheckData
    ] = await Promise.allSettled([
      analyzeSearchResults(keyword),
      analyzeNoteContent(keyword),
      analyzeTrends(keyword),
      performFactCheck(keyword)
    ]);

    // 結果を統合
    return integrateResearchResults({
      search: searchResults.status === 'fulfilled' ? searchResults.value : null,
      note: noteAnalysis.status === 'fulfilled' ? noteAnalysis.value : null,
      trends: trendData.status === 'fulfilled' ? trendData.value : null,
      factCheck: factCheckData.status === 'fulfilled' ? factCheckData.value : null,
    });
  } catch (error) {
    console.error('Integrated research failed:', error);
    throw new Error('リサーチ処理でエラーが発生しました');
  }
}
```

#### データ統合・正規化
```typescript
function integrateResearchResults(results: RawResearchResults): ResearchResult {
  const integrated: ResearchResult = {
    keyword: results.search?.keyword || '',
    insights: [],
    competitorAnalysis: [],
    trendingTopics: [],
    factCheckedClaims: [],
    seoRecommendations: [],
  };

  // Google Search結果から洞察を抽出
  if (results.search) {
    integrated.insights.push(...extractSearchInsights(results.search));
    integrated.competitorAnalysis = analyzeCompetitors(results.search.results);
  }

  // noteプラットフォーム分析
  if (results.note) {
    integrated.insights.push(...extractNoteInsights(results.note));
  }

  // トレンド分析
  if (results.trends) {
    integrated.trendingTopics = results.trends.topics;
  }

  // ファクトチェック結果
  if (results.factCheck) {
    integrated.factCheckedClaims = results.factCheck.verifiedClaims;
  }

  return integrated;
}
```

#### キャッシュ戦略
```typescript
class ResearchCache {
  private cache = new Map<string, CachedResult>();
  private readonly TTL = 30 * 60 * 1000; // 30分

  async get(key: string): Promise<ResearchResult | null> {
    const cached = this.cache.get(key);
    if (!cached) return null;

    if (Date.now() - cached.timestamp > this.TTL) {
      this.cache.delete(key);
      return null;
    }

    return cached.data;
  }

  set(key: string, data: ResearchResult): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });
  }

  // LRUスタイルでメモリ管理
  private evictOldEntries(): void {
    if (this.cache.size > 100) {
      const oldestKey = this.cache.keys().next().value;
      this.cache.delete(oldestKey);
    }
  }
}
```

### 📱 レスポンシブ対応

#### モバイルファースト設計
```css
/* styles/globals.css */
.input-group {
  @apply w-full px-4 py-2;
}

@media (min-width: 768px) {
  .input-group {
    @apply px-6 py-3;
  }
}

@media (min-width: 1024px) {
  .input-group {
    @apply px-8 py-4;
  }
}
```

#### タッチ操作対応
```typescript
// hooks/useTouch.ts
export function useTouch() {
  const [touchStart, setTouchStart] = useState<TouchEvent | null>(null);
  
  const handleTouchStart = (e: TouchEvent) => {
    setTouchStart(e);
  };

  const handleTouchEnd = (e: TouchEvent) => {
    if (!touchStart) return;

    const touchEnd = e.changedTouches[0];
    const touchStartPoint = touchStart.touches[0];
    
    const diffX = touchStartPoint.clientX - touchEnd.clientX;
    const diffY = touchStartPoint.clientY - touchEnd.clientY;

    // スワイプジェスチャー判定
    if (Math.abs(diffX) > Math.abs(diffY)) {
      if (diffX > 50) {
        // 左スワイプ
      } else if (diffX < -50) {
        // 右スワイプ
      }
    }
  };

  return { handleTouchStart, handleTouchEnd };
}
```

#### 画面サイズ適応UI
```typescript
// hooks/useResponsive.ts
export function useResponsive() {
  const [screenSize, setScreenSize] = useState<ScreenSize>('mobile');

  useEffect(() => {
    const checkScreenSize = () => {
      const width = window.innerWidth;
      if (width < 768) {
        setScreenSize('mobile');
      } else if (width < 1024) {
        setScreenSize('tablet');
      } else {
        setScreenSize('desktop');
      }
    };

    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  return {
    screenSize,
    isMobile: screenSize === 'mobile',
    isTablet: screenSize === 'tablet',
    isDesktop: screenSize === 'desktop',
  };
}
```

---

## 7. デプロイ・運用

### 🌐 Vercel設定

#### 自動デプロイメント
```json
// vercel.json
{
  "buildCommand": "npm run build",
  "outputDirectory": ".next",
  "framework": "nextjs",
  "functions": {
    "app/api/**/*.ts": {
      "maxDuration": 30
    }
  }
}
```

#### 環境変数管理
```bash
# Vercel環境変数設定
vercel env add GEMINI_API_KEY production
vercel env add SUPABASE_URL production
vercel env add SUPABASE_ANON_KEY production
vercel env add NEWS_API_KEY production
```

#### パフォーマンス監視
```javascript
// next.config.js
const { withSentryConfig } = require('@sentry/nextjs');

module.exports = withSentryConfig({
  // 既存設定...
  
  // パフォーマンス監視
  experimental: {
    instrumentationHook: true,
    monitoring: {
      relayRequestHeaders: ['user-agent'],
    },
  },
});
```

### 🔐 セキュリティ対策

#### APIキー保護
```typescript
// services/security/apiKeyValidator.ts
export function validateApiKey(apiKey: string): boolean {
  if (!apiKey || apiKey.length < 10) {
    throw new SecurityError('Invalid API key format');
  }
  
  if (apiKey.includes('PLACEHOLDER') || apiKey === 'your_api_key_here') {
    throw new SecurityError('Placeholder API key detected');
  }
  
  return true;
}

export function sanitizeApiKey(apiKey: string): string {
  return apiKey.replace(/[^a-zA-Z0-9_-]/g, '');
}
```

#### セキュリティヘッダー
```javascript
// next.config.js
async headers() {
  return [
    {
      source: '/:path*',
      headers: [
        {
          key: 'X-DNS-Prefetch-Control',
          value: 'on'
        },
        {
          key: 'X-XSS-Protection',
          value: '1; mode=block'
        },
        {
          key: 'X-Frame-Options',
          value: 'SAMEORIGIN'
        },
        {
          key: 'X-Content-Type-Options',
          value: 'nosniff'
        },
        {
          key: 'Referrer-Policy',
          value: 'origin-when-cross-origin'
        },
        {
          key: 'Content-Security-Policy',
          value: "default-src 'self'; script-src 'self' 'unsafe-eval'; style-src 'self' 'unsafe-inline';"
        }
      ]
    }
  ];
}
```

#### CSP設定
```typescript
// middleware.ts
import { NextResponse } from 'next/server';

export function middleware(request: Request) {
  const response = NextResponse.next();
  
  response.headers.set(
    'Content-Security-Policy',
    [
      "default-src 'self'",
      "script-src 'self' 'unsafe-eval' 'unsafe-inline'",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: https:",
      "connect-src 'self' https://generativelanguage.googleapis.com",
      "media-src 'self'",
      "font-src 'self'"
    ].join('; ')
  );
  
  return response;
}
```

### 📊 監視・分析

#### エラー追跡
```typescript
// utils/errorTracking.ts
export class ErrorTracker {
  static track(error: Error, context?: Record<string, any>) {
    const errorInfo = {
      message: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString(),
      context,
      userAgent: navigator.userAgent,
      url: window.location.href,
    };

    // Sentryに送信
    if (typeof window !== 'undefined' && window.Sentry) {
      window.Sentry.captureException(error, { extra: context });
    }

    // ローカルログ
    console.error('Error tracked:', errorInfo);
  }
}
```

#### パフォーマンス測定
```typescript
// utils/performanceMonitor.ts
export class PerformanceMonitor {
  static measureApiCall<T>(
    apiName: string,
    apiCall: () => Promise<T>
  ): Promise<T> {
    const startTime = performance.now();
    
    return apiCall()
      .then(result => {
        const duration = performance.now() - startTime;
        this.recordMetric(apiName, duration, 'success');
        return result;
      })
      .catch(error => {
        const duration = performance.now() - startTime;
        this.recordMetric(apiName, duration, 'error');
        throw error;
      });
  }

  private static recordMetric(
    name: string, 
    duration: number, 
    status: 'success' | 'error'
  ) {
    // Analytics に送信
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'api_call', {
        event_category: 'Performance',
        event_label: name,
        value: Math.round(duration),
        custom_map: { status }
      });
    }
  }
}
```

#### ユーザー行動分析
```typescript
// utils/analytics.ts
export class Analytics {
  static trackUserAction(action: string, category: string, label?: string) {
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', action, {
        event_category: category,
        event_label: label,
        value: 1
      });
    }
  }

  static trackPageView(page: string) {
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('config', 'GA_MEASUREMENT_ID', {
        page_path: page
      });
    }
  }

  static trackConversion(type: 'article_generated' | 'voice_used' | 'abtest_run') {
    this.trackUserAction('conversion', 'engagement', type);
  }
}
```

---

## 8. 実装ハンズオン

### 🎯 新機能追加の手順

#### 1. 型定義の追加
```typescript
// types/newfeature.types.ts
export interface NewFeatureConfig {
  enabled: boolean;
  settings: {
    option1: string;
    option2: number;
  };
}

export interface NewFeatureResult {
  success: boolean;
  data: any;
  metrics: {
    processingTime: number;
    accuracy: number;
  };
}

// types/index.ts に追加
export * from './newfeature.types';
```

#### 2. サービス層の実装
```typescript
// services/newfeature/newFeatureService.ts
import { NewFeatureConfig, NewFeatureResult } from '@/types';

export class NewFeatureService {
  async processNewFeature(
    input: string,
    config: NewFeatureConfig
  ): Promise<NewFeatureResult> {
    const startTime = performance.now();

    try {
      // 新機能のメインロジック
      const result = await this.executeFeature(input, config);
      
      const processingTime = performance.now() - startTime;
      
      return {
        success: true,
        data: result,
        metrics: {
          processingTime,
          accuracy: this.calculateAccuracy(result),
        },
      };
    } catch (error) {
      throw new Error(`New feature processing failed: ${error.message}`);
    }
  }

  private async executeFeature(input: string, config: NewFeatureConfig) {
    // 実装ロジック
  }

  private calculateAccuracy(result: any): number {
    // 精度計算ロジック
    return 0.95;
  }
}
```

#### 3. UIコンポーネント作成
```typescript
// components/newfeature/NewFeaturePanel.tsx
import { useState } from 'react';
import { NewFeatureConfig, NewFeatureResult } from '@/types';
import { NewFeatureService } from '@/services/newfeature/newFeatureService';

interface NewFeaturePanelProps {
  onResult: (result: NewFeatureResult) => void;
}

export function NewFeaturePanel({ onResult }: NewFeaturePanelProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [input, setInput] = useState('');
  const [config, setConfig] = useState<NewFeatureConfig>({
    enabled: true,
    settings: {
      option1: 'default',
      option2: 10,
    },
  });

  const handleProcess = async () => {
    if (!input.trim()) return;

    setIsProcessing(true);
    try {
      const service = new NewFeatureService();
      const result = await service.processNewFeature(input, config);
      onResult(result);
    } catch (error) {
      console.error('New feature error:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="new-feature-panel">
      <h3>新機能テスト</h3>
      
      <textarea
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder="入力してください..."
        disabled={isProcessing}
        rows={4}
        className="w-full p-3 border rounded-lg"
      />

      <div className="config-section mt-4">
        <label>
          <input
            type="checkbox"
            checked={config.enabled}
            onChange={(e) => setConfig({
              ...config,
              enabled: e.target.checked
            })}
          />
          機能を有効にする
        </label>
      </div>

      <button
        onClick={handleProcess}
        disabled={isProcessing || !input.trim()}
        className="mt-4 px-6 py-2 bg-blue-500 text-white rounded-lg disabled:opacity-50"
      >
        {isProcessing ? '処理中...' : '実行'}
      </button>
    </div>
  );
}
```

#### 4. 統合テスト
```typescript
// __tests__/newfeature.test.ts
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { NewFeaturePanel } from '@/components/newfeature/NewFeaturePanel';
import { NewFeatureService } from '@/services/newfeature/newFeatureService';

// モック化
jest.mock('@/services/newfeature/newFeatureService');
const mockService = NewFeatureService as jest.MockedClass<typeof NewFeatureService>;

describe('NewFeaturePanel', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('正常な入力で機能が実行される', async () => {
    const mockResult = {
      success: true,
      data: 'test result',
      metrics: { processingTime: 100, accuracy: 0.95 }
    };

    mockService.prototype.processNewFeature.mockResolvedValue(mockResult);

    const onResult = jest.fn();
    render(<NewFeaturePanel onResult={onResult} />);

    // 入力
    const textarea = screen.getByPlaceholderText('入力してください...');
    fireEvent.change(textarea, { target: { value: 'テスト入力' } });

    // 実行
    const button = screen.getByText('実行');
    fireEvent.click(button);

    // 結果確認
    await waitFor(() => {
      expect(onResult).toHaveBeenCalledWith(mockResult);
    });
  });

  test('エラーケースの処理', async () => {
    mockService.prototype.processNewFeature.mockRejectedValue(
      new Error('処理エラー')
    );

    const onResult = jest.fn();
    render(<NewFeaturePanel onResult={onResult} />);

    const textarea = screen.getByPlaceholderText('入力してください...');
    fireEvent.change(textarea, { target: { value: 'エラーテスト' } });

    const button = screen.getByText('実行');
    fireEvent.click(button);

    await waitFor(() => {
      expect(onResult).not.toHaveBeenCalled();
    });
  });
});
```

### 🐛 デバッグテクニック

#### 段階的な問題切り分け
```typescript
// utils/debugHelper.ts
export class DebugHelper {
  static logStep(step: string, data?: any) {
    if (process.env.NODE_ENV === 'development') {
      console.group(`🔍 Debug: ${step}`);
      if (data) {
        console.log('Data:', data);
      }
      console.trace('Call stack');
      console.groupEnd();
    }
  }

  static logPerformance(label: string, fn: () => any) {
    if (process.env.NODE_ENV === 'development') {
      console.time(label);
      const result = fn();
      console.timeEnd(label);
      return result;
    }
    return fn();
  }

  static logApiCall(url: string, params: any, response: any) {
    if (process.env.NODE_ENV === 'development') {
      console.group(`🌐 API Call: ${url}`);
      console.log('Parameters:', params);
      console.log('Response:', response);
      console.groupEnd();
    }
  }
}
```

#### ログ出力の最適化
```typescript
// utils/logger.ts
enum LogLevel {
  ERROR = 0,
  WARN = 1,
  INFO = 2,
  DEBUG = 3,
}

export class Logger {
  private static level = process.env.NODE_ENV === 'development' ? 
    LogLevel.DEBUG : LogLevel.WARN;

  static error(message: string, error?: Error) {
    if (this.level >= LogLevel.ERROR) {
      console.error(`❌ [ERROR] ${message}`, error);
    }
  }

  static warn(message: string, data?: any) {
    if (this.level >= LogLevel.WARN) {
      console.warn(`⚠️ [WARN] ${message}`, data);
    }
  }

  static info(message: string, data?: any) {
    if (this.level >= LogLevel.INFO) {
      console.info(`ℹ️ [INFO] ${message}`, data);
    }
  }

  static debug(message: string, data?: any) {
    if (this.level >= LogLevel.DEBUG) {
      console.debug(`🐛 [DEBUG] ${message}`, data);
    }
  }
}
```

#### 開発者ツール活用
```typescript
// utils/devtools.ts
export function setupDevtools() {
  if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
    // グローバルデバッグ関数を追加
    (window as any).debugApp = {
      // 現在の状態をログ出力
      logState: () => {
        console.log('App State:', {
          // アプリケーションの状態をここに
        });
      },
      
      // パフォーマンス情報を表示
      showPerformance: () => {
        const navigation = performance.getEntriesByType('navigation')[0];
        console.table(navigation);
      },
      
      // ローカルストレージの内容確認
      showStorage: () => {
        const storage = {};
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key) {
            storage[key] = localStorage.getItem(key);
          }
        }
        console.table(storage);
      },
    };

    console.log('🛠️ Dev tools loaded. Use window.debugApp for debugging.');
  }
}
```

### 🧪 テスト戦略

#### Playwright E2Eテスト
```typescript
// tests/e2e/article-generation.spec.ts
import { test, expect } from '@playwright/test';

test.describe('記事生成フロー', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('正常な記事生成フロー', async ({ page }) => {
    // 入力フォームの操作
    await page.fill('[data-testid="keyword-input"]', 'プログラミング学習');
    await page.selectOption('[data-testid="tone-select"]', '丁寧で落ち着いた');
    await page.selectOption('[data-testid="audience-select"]', '初心者向け');
    await page.fill('[data-testid="target-length"]', '2500');

    // 生成開始
    await page.click('[data-testid="generate-button"]');

    // 進捗表示の確認
    await expect(page.locator('[data-testid="step-indicator"]')).toBeVisible();

    // 結果の表示を待機（最大2分）
    await expect(page.locator('[data-testid="output-display"]')).toBeVisible({
      timeout: 120000
    });

    // 生成結果の確認
    await expect(page.locator('[data-testid="article-content"]')).toContainText('プログラミング');
    await expect(page.locator('[data-testid="cover-image"]')).toBeVisible();
    await expect(page.locator('[data-testid="x-posts"]')).toBeVisible();
  });

  test('エラーケースの処理', async ({ page }) => {
    // 空の入力で生成を試行
    await page.click('[data-testid="generate-button"]');

    // エラーメッセージの表示確認
    await expect(page.locator('[data-testid="error-message"]')).toBeVisible();
    await expect(page.locator('[data-testid="error-message"]')).toContainText('キーワードを入力してください');
  });
});
```

#### ユニットテストパターン
```typescript
// __tests__/services/geminiService.test.ts
import { createArticleOutline, writeArticle } from '@/services/ai/geminiService';
import { Tone, Audience } from '@/types';

// モック設定
jest.mock('@google/genai');

describe('geminiService', () => {
  describe('createArticleOutline', () => {
    test('正常なアウトライン生成', async () => {
      const outline = await createArticleOutline(
        'プログラミング学習',
        Tone.POLITE,
        Audience.BEGINNER
      );

      expect(outline).toHaveProperty('title');
      expect(outline).toHaveProperty('metaDescription');
      expect(outline.sections).toHaveLength.greaterThan(0);
      expect(outline.faq).toHaveLength.greaterThan(0);
    });

    test('不正な入力でエラー', async () => {
      await expect(
        createArticleOutline('', Tone.POLITE, Audience.BEGINNER)
      ).rejects.toThrow('キーワードが空です');
    });
  });

  describe('writeArticle', () => {
    test('記事生成の文字数確認', async () => {
      const mockOutline = {
        title: 'テストタイトル',
        metaDescription: 'テスト説明',
        sections: [{ title: 'セクション1', points: ['ポイント1'] }],
        faq: []
      };

      const article = await writeArticle(mockOutline, 2500);
      
      expect(article.length).toBeGreaterThan(2000);
      expect(article.length).toBeLessThan(3000);
      expect(article).toContain('テストタイトル');
    });
  });
});
```

#### APIテスト手法
```typescript
// __tests__/api/tavily-search.test.ts
import { POST } from '@/app/api/tavily-search/route';
import { NextRequest } from 'next/server';

describe('/api/tavily-search', () => {
  test('正常な検索リクエスト', async () => {
    const request = new NextRequest('http://localhost:3000/api/tavily-search', {
      method: 'POST',
      body: JSON.stringify({
        query: 'プログラミング学習',
        maxResults: 5
      }),
      headers: {
        'Content-Type': 'application/json'
      }
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toHaveProperty('results');
    expect(Array.isArray(data.results)).toBe(true);
    expect(data.results.length).toBeLessThanOrEqual(5);
  });

  test('不正なリクエストボディ', async () => {
    const request = new NextRequest('http://localhost:3000/api/tavily-search', {
      method: 'POST',
      body: JSON.stringify({}),
      headers: {
        'Content-Type': 'application/json'
      }
    });

    const response = await POST(request);
    expect(response.status).toBe(400);
  });
});
```

### 📈 スケーラビリティ対応

#### コンポーネント分割戦略
```typescript
// 大きなコンポーネントを機能別に分割
// Before: 巨大なArticleGenerator
// After: 責任分離

// components/article/ArticleGenerator.tsx
export function ArticleGenerator() {
  return (
    <div className="article-generator">
      <ArticleInputForm onSubmit={handleSubmit} />
      <ArticleProgressIndicator currentStep={currentStep} />
      <ArticleOutput output={output} />
    </div>
  );
}

// components/article/ArticleInputForm.tsx
export function ArticleInputForm({ onSubmit }: Props) {
  // フォームのみの責任
}

// components/article/ArticleProgressIndicator.tsx
export function ArticleProgressIndicator({ currentStep }: Props) {
  // 進捗表示のみの責任
}

// components/article/ArticleOutput.tsx
export function ArticleOutput({ output }: Props) {
  // 結果表示のみの責任
}
```

#### 状態管理の最適化
```typescript
// contexts/ArticleContext.tsx
interface ArticleContextType {
  state: ArticleState;
  actions: {
    startGeneration: (formData: FormData) => Promise<void>;
    updateStep: (step: ProcessStep) => void;
    setError: (error: string) => void;
    reset: () => void;
  };
}

export function ArticleProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<ArticleState>(initialState);

  const actions = useMemo(() => ({
    startGeneration: async (formData: FormData) => {
      // 生成ロジック
    },
    updateStep: (step: ProcessStep) => {
      setState(prev => ({ ...prev, currentStep: step }));
    },
    setError: (error: string) => {
      setState(prev => ({ ...prev, error, currentStep: ProcessStep.ERROR }));
    },
    reset: () => {
      setState(initialState);
    },
  }), []);

  return (
    <ArticleContext.Provider value={{ state, actions }}>
      {children}
    </ArticleContext.Provider>
  );
}

// hooks/useArticle.ts
export function useArticle() {
  const context = useContext(ArticleContext);
  if (!context) {
    throw new Error('useArticle must be used within ArticleProvider');
  }
  return context;
}
```

#### パフォーマンス監視
```typescript
// utils/performanceOptimizer.ts
export class PerformanceOptimizer {
  private static memoryUsage = new Map<string, number>();
  private static renderTimes = new Map<string, number[]>();

  static trackMemoryUsage(componentName: string) {
    if (typeof window !== 'undefined' && 'memory' in performance) {
      const memory = (performance as any).memory;
      this.memoryUsage.set(componentName, memory.usedJSHeapSize);
    }
  }

  static trackRenderTime(componentName: string, renderTime: number) {
    const times = this.renderTimes.get(componentName) || [];
    times.push(renderTime);
    
    // 最新100回分のみ保持
    if (times.length > 100) {
      times.shift();
    }
    
    this.renderTimes.set(componentName, times);
  }

  static getPerformanceReport(): PerformanceReport {
    const report: PerformanceReport = {
      memoryUsage: Object.fromEntries(this.memoryUsage),
      averageRenderTimes: {},
      recommendations: [],
    };

    // 平均レンダリング時間を計算
    for (const [component, times] of this.renderTimes) {
      const average = times.reduce((a, b) => a + b, 0) / times.length;
      report.averageRenderTimes[component] = average;

      // パフォーマンス改善提案
      if (average > 100) {
        report.recommendations.push(
          `${component}のレンダリング時間が長すぎます (${average.toFixed(2)}ms)`
        );
      }
    }

    return report;
  }
}

// React DevTools用のProfilerコンポーネント
export function PerformanceProfiler({ 
  name, 
  children 
}: { 
  name: string; 
  children: React.ReactNode; 
}) {
  const onRender = useCallback((
    id: string,
    phase: 'mount' | 'update',
    actualDuration: number
  ) => {
    PerformanceOptimizer.trackRenderTime(id, actualDuration);
  }, []);

  return (
    <Profiler id={name} onRender={onRender}>
      {children}
    </Profiler>
  );
}
```

---

## 📋 講義の流れ (60分構成)

### ⏰ タイムテーブル

| 時間 | 内容 | 詳細 |
|------|------|------|
| **0-10分** | **導入** | プロジェクト概要・Phase 1.5成果報告 |
| **10-25分** | **アーキテクチャ深掘り** | 技術スタック・設計思想・選定理由 |
| **25-35分** | **ディレクトリ構造解説** | ファイル構成・命名規則・保守性 |
| **35-50分** | **実装パターン紹介** | 具体的なコード例・ベストプラクティス |
| **50-60分** | **ハンズオン実演** | ライブコーディング・Q&A |

### 🎯 学習目標

参加者がこの講義で習得すること：

1. **アーキテクチャの理解**: なぜこの構成にしたのか、技術選定の背景
2. **実装ノウハウ**: 効率的な開発手法、コードの書き方
3. **運用知識**: デプロイ・監視・パフォーマンス最適化
4. **実践スキル**: 新機能追加・デバッグ・テストの具体的手順

---

**🚀 準備完了！21:30からの勉強会で、note-agentの深い実装知識を共有していきましょう！**