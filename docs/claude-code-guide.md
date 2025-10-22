# 🤖 Claude Code 完全活用ガイド

> **目的**: note記事自動生成エージェント開発でのClaude Code実践活用法  
> **対象**: 実装編②勉強会 補足資料  
> **更新**: 2025年10月22日

---

## 📖 目次

1. [Claude Code基礎知識](#1-claude-code基礎知識)
2. [セットアップ・環境構築](#2-セットアップ環境構築)
3. [実践的プロンプト集](#3-実践的プロンプト集)
4. [開発ワークフロー統合](#4-開発ワークフロー統合)
5. [プロジェクト別活用事例](#5-プロジェクト別活用事例)
6. [トラブルシューティング](#6-トラブルシューティング)
7. [上級テクニック](#7-上級テクニック)

---

## 1. Claude Code基礎知識

### 🤖 Claude Codeとは

Claude CodeはAnthropic社が開発したAI開発アシスタントで、コード生成・解析・最適化を自然言語で指示できるツールです。

#### 主要機能
- **コード生成**: 仕様から実装コードを自動生成
- **バグ修正**: エラーメッセージから原因特定・修正案提示
- **リファクタリング**: 既存コードの改善・最適化
- **テスト作成**: 単体テスト・E2Eテストの自動生成
- **ドキュメント作成**: README・API仕様書の自動生成

#### 他のAIツールとの違い
| 機能 | Claude Code | GitHub Copilot | ChatGPT |
|------|-------------|----------------|---------|
| **プロジェクト理解** | ✅ 全体把握 | 🔶 局所的 | 🔶 コンテキスト限定 |
| **日本語対応** | ✅ 高精度 | 🔶 基本対応 | ✅ 高精度 |
| **複雑な設計** | ✅ 得意 | 🔶 簡単なもののみ | 🔶 説明中心 |
| **統合開発** | ✅ ワークフロー全体 | 🔶 エディタ内のみ | ❌ 非対応 |

---

## 2. セットアップ・環境構築

### 🔧 基本セットアップ

#### Claude Codeアカウント作成
1. [claude.ai/code](https://claude.ai/code) にアクセス
2. Anthropicアカウントでログイン
3. プロジェクト作成・設定

#### プロジェクト連携設定
```bash
# 1. GitHubリポジトリとの連携
# Claude Code UIでリポジトリURL指定
# https://github.com/username/note-agent

# 2. ローカルファイルとの同期設定
# プロジェクトルートで以下を実行
echo "Claude Code連携プロジェクト" > .claude-project

# 3. 環境変数設定（重要なものは.gitignoreに追加）
echo ".env.local
.claude-sessions
node_modules/
.next/" >> .gitignore
```

#### VS Code拡張機能（推奨）
```bash
# Claude Code連携拡張をインストール
code --install-extension anthropic.claude-code

# TypeScript関連拡張
code --install-extension bradlc.vscode-tailwindcss
code --install-extension ms-vscode.vscode-typescript-next
```

### 📁 プロジェクト構造最適化

Claude Codeが理解しやすいプロジェクト構造にします：

```
note-agent/
├── 📄 README.md                    # プロジェクト概要
├── 📄 CLAUDE.md                   # Claude用プロジェクト指示書
├── 📄 .claude-project             # Claude設定ファイル
├── 📁 docs/                       # ドキュメント
│   ├── architecture.md            # アーキテクチャ解説
│   ├── api-reference.md           # API仕様
│   └── development-guide.md       # 開発ガイド
├── 📁 src/
│   ├── 📁 types/                  # 型定義（重要：Claude理解の基盤）
│   ├── 📁 components/             # UIコンポーネント
│   ├── 📁 services/               # ビジネスロジック
│   └── 📁 utils/                  # ユーティリティ
└── 📁 examples/                   # 使用例・テンプレート
```

---

## 3. 実践的プロンプト集

### 🎯 シーン別プロンプトテンプレート

#### 🏗️ 新機能開発
```
【新機能実装プロンプト】

## 実装したい機能
{機能名}: {機能の概要説明}

## 要件
### 機能要件
- {具体的な動作1}
- {具体的な動作2}
- {具体的な動作3}

### 技術要件
- 使用技術: Next.js 14, TypeScript, Tailwind CSS
- 既存のコードスタイルに合わせる
- {プロジェクト固有の制約}

### UI/UX要件
- レスポンシブ対応
- アクセシビリティ考慮
- {デザイン指針}

## 参考情報
既存の類似コンポーネント: {ファイルパス}
型定義: {型定義の場所}

## 期待する出力
1. 型定義 (types/)
2. メイン実装 (components/ or services/)
3. テストコード (__tests__/)
4. 使用例
```

**実際の使用例**:
```
## 実装したい機能
音声入力進捗表示: 音声認識中の状態を視覚的に表示する機能

## 要件
### 機能要件
- マイクの音声レベルをリアルタイム表示
- 認識中/停止中の状態を明確に区別
- 認識テキストの途中経過表示

### 技術要件
- 使用技術: Next.js 14, TypeScript, Tailwind CSS
- Web Speech APIと連携
- 既存のVoiceIdeaProcessorコンポーネントを拡張

### UI/UX要件
- マイクアイコンのアニメーション
- 音声波形の視覚表示
- 色での状態表現（緑=認識中、赤=エラー、グレー=停止）

## 参考情報
既存の類似コンポーネント: src/components/audio/VoiceIdeaProcessor.tsx
型定義: src/types/speech.types.ts

## 期待する出力
1. 型定義更新 (types/speech.types.ts)
2. コンポーネント実装 (components/audio/VoiceProgressIndicator.tsx)
3. スタイル定義 (styles/)
4. 使用例とドキュメント
```

#### 🐛 バグ修正・デバッグ
```
【バグ修正プロンプト】

## 発生している問題
エラーメッセージ: {正確なエラーメッセージ}
発生条件: {エラーが起きる具体的な手順}
期待する動作: {本来どう動くべきか}

## 環境情報
- ブラウザ: {Chrome/Safari/Firefox + バージョン}
- Node.js: {バージョン}
- デバイス: {PC/スマホ/タブレット}

## 関連コード
```typescript
{エラーが発生しているコード}
```

## デバッグ情報
- コンソールエラー: {console.errorの内容}
- ネットワークエラー: {APIコールの失敗など}
- 状態の値: {エラー時のstate値}

## 求める解決策
1. 根本原因の特定
2. 修正コード
3. 今後同様のエラーを防ぐ方法
4. テストコード（再発防止）
```

#### ⚡ パフォーマンス最適化
```
【パフォーマンス最適化プロンプト】

## 現在の問題
パフォーマンス指標: {Lighthouse Score / 体感速度}
具体的な遅延: {初期読み込み時間 / インタラクション応答時間}

## 測定データ
- バンドルサイズ: {現在のサイズ}
- 読み込み時間: {現在の時間}
- FCP/LCP値: {Core Web Vitals}

## 最適化対象
- [ ] 初期読み込み速度
- [ ] インタラクション応答性
- [ ] メモリ使用量
- [ ] バンドルサイズ

## 制約条件
- 機能削減はNG
- UI/UXの劣化はNG
- {その他の制約}

## 期待する改善案
1. 具体的な最適化手法
2. 実装コード
3. 効果の測定方法
4. トレードオフの説明
```

#### 🧪 テスト作成
```
【テストコード生成プロンプト】

## テスト対象
ファイル: {テスト対象のファイルパス}
関数/コンポーネント: {テスト対象名}

## テスト要件
### テストタイプ
- [ ] ユニットテスト
- [ ] 統合テスト
- [ ] E2Eテスト

### カバレッジ要件
- 正常系: {期待する動作}
- 異常系: {エラーケース}
- エッジケース: {境界値テスト}

## 使用技術
- テストフレームワーク: {Jest / Vitest / Playwright}
- アサーションライブラリ: {期待するライブラリ}
- モック: {必要なモック対象}

## 期待する出力
1. テストファイル (__tests__/)
2. モック設定
3. テスト実行コマンド
4. CIでの実行設定
```

---

## 4. 開発ワークフロー統合

### 🔄 効率的な開発フロー

#### 日常的な開発サイクル
```bash
# 1. 朝一番：プロジェクト状況確認
# Claude Codeに以下をチェックしてもらう
echo "昨日のコミット以降の変更点を確認し、
今日の開発優先順位を提案してください。

Git log:
$(git log --oneline -10)

現在のブランチ: $(git branch --show-current)
未完了のTODO: $(grep -r "TODO\|FIXME" src/ || echo "なし")"

# 2. 新機能開発開始
git checkout -b feature/new-functionality

# Claude Codeに機能設計を依頼
# 3. 実装・テスト
# Claude Codeと協力してコード生成・レビュー

# 4. コミット前チェック
npm run lint
npm run type-check
npm run test

# 5. コミット（Claude Codeが生成したメッセージ使用）
git add .
git commit -m "feat: 新機能実装

🤖 Generated with Claude Code"

# 6. プッシュ・PR作成
git push -u origin feature/new-functionality
```

#### Claude Codeとの協力パターン

**パターン1: 段階的実装**
```
1. 「まず型定義を作成してください」
2. 「次にメインロジックを実装してください」
3. 「UIコンポーネントを作成してください」
4. 「エラーハンドリングを追加してください」
5. 「テストコードを作成してください」
```

**パターン2: 反復改善**
```
1. 「最初はシンプルな実装で」
2. 「動作確認できたら機能を拡張」
3. 「パフォーマンスを最適化」
4. 「エッジケースに対応」
```

**パターン3: レビュー型**
```
1. 自分で実装
2. Claude Codeにレビュー依頼
3. 改善提案を実装
4. 再度レビュー
```

### 📋 プロジェクト管理との連携

#### GitHub Issues活用
```markdown
## 新機能要望テンプレート
### 機能概要
{Claude Codeへの指示も含めて記載}

### 実装方針
Claude Codeに以下の順序で依頼予定:
1. [ ] 型定義設計
2. [ ] サービス層実装
3. [ ] UI実装
4. [ ] テスト作成

### 完了条件
- [ ] 機能動作確認
- [ ] テスト通過
- [ ] パフォーマンス確認
- [ ] ドキュメント更新
```

---

## 5. プロジェクト別活用事例

### 🎯 note記事自動生成エージェント での実践例

#### 音声入力機能の実装
**プロンプト例**:
```
Web Speech APIを使った音声入力機能を実装したいです。

## 要件
- ブラウザの音声認識機能を活用
- リアルタイムでテキスト変換表示
- 認識精度向上のための前処理
- エラーハンドリング（認識失敗、ブラウザ非対応）

## 既存コード情報
プロジェクト: Next.js 14 + TypeScript
既存型定義: src/types/speech.types.ts
スタイル: Tailwind CSS

## 期待する実装
1. SpeechRecognitionServiceクラス
2. VoiceIdeaProcessorコンポーネント
3. 型定義の拡張
4. エラーハンドリング
```

**Claude Codeの出力例**:
```typescript
// types/speech.types.ts
export interface SpeechRecognitionConfig {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  maxAlternatives: number;
}

export interface VoiceInputState {
  isListening: boolean;
  transcript: string;
  interimTranscript: string;
  error: string | null;
  isSupported: boolean;
}

// services/audio/speechRecognitionService.ts
export class SpeechRecognitionService {
  private recognition: SpeechRecognition | null = null;
  
  constructor(config: SpeechRecognitionConfig) {
    if (this.isBrowserSupported()) {
      this.initializeRecognition(config);
    }
  }
  
  private isBrowserSupported(): boolean {
    return 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window;
  }
  
  // ... 実装続く
}
```

#### A/Bテスト機能の実装
**プロンプト例**:
```
記事生成のA/Bテスト機能を実装したいです。

## 機能概要
- 同一条件で複数パターンの記事を生成
- 読みやすさ、SEOスコア、エンゲージメント予測の比較
- 最適なバージョンの自動選択

## 技術要件
- 既存のgeminiServiceを活用
- 並列処理でパフォーマンス最適化
- メトリクス計算の標準化

期待する構成:
1. ABTestService クラス
2. メトリクス計算ユーティリティ
3. 比較結果表示コンポーネント
4. 型定義
```

### 🏗️ 他のプロジェクトでの応用例

#### E-コマースサイト
```
【商品検索機能の実装】
- ElasticSearchとの連携
- リアルタイム検索サジェスト
- フィルタリング機能
- 検索結果のページネーション

Claude Codeへの指示:
「Shopifyライクな商品検索機能を実装してください。
React + TypeScript + TanStack Queryで、
商品名・カテゴリ・価格帯での絞り込み機能付き」
```

#### ダッシュボードアプリ
```
【データ可視化コンポーネント】
- Chart.js / Recharts での複数グラフ対応
- リアルタイムデータ更新
- レスポンシブ対応
- データエクスポート機能

Claude Codeへの指示:
「売上・ユーザー・PVの時系列データを表示する
ダッシュボードコンポーネントを作成してください。
リアルタイム更新とドリルダウン機能付き」
```

---

## 6. トラブルシューティング

### ❌ よくある問題と解決法

#### Claude Codeが期待通りのコードを生成しない
**問題**: 生成されたコードが要件を満たしていない

**解決策**:
```
【改善されたプロンプト例】
前回の出力では以下の点が期待と異なりました：
- {具体的な問題点1}
- {具体的な問題点2}

以下の要件を満たすよう修正してください：
- {明確な要件1}
- {明確な要件2}

参考として、期待する動作例：
```typescript
// 期待するインターフェース例
interface ExpectedInterface {
  // 具体的な型定義
}
```

**コツ**:
- 抽象的な表現を避け、具体例を示す
- 既存コードとの整合性を明示
- 段階的に要件を追加する

#### 生成されたコードが動作しない
**問題**: シンタックスエラーや実行時エラーが発生

**デバッグプロンプト**:
```
以下のコードでエラーが発生しています：

```typescript
{生成されたコード}
```

エラー内容：
{具体的なエラーメッセージ}

環境情報：
- Node.js: {version}
- TypeScript: {version}
- 関連パッケージ: {package versions}

修正版を提供し、エラーの原因も説明してください。
```

#### パフォーマンスが悪い生成コード
**問題**: Claude Codeが生成したコードが重い

**最適化プロンプト**:
```
先ほど生成していただいたコードのパフォーマンスを改善したいです：

現在の問題：
- {具体的なパフォーマンス問題}
- 測定値: {実際の数値}

最適化要件：
- メモリ使用量削減
- 実行速度向上
- バンドルサイズ最小化

制約：
- 機能は維持
- 既存APIとの互換性保持

最適化手法も含めて提案してください。
```

### 🔧 デバッグ支援機能

#### ログ出力の自動化
```typescript
// Claude Codeに以下のようなデバッグヘルパーを依頼
export class ClaudeDebugHelper {
  static createDebugLogger(componentName: string) {
    return {
      info: (message: string, data?: any) => {
        console.log(`[${componentName}] ${message}`, data);
      },
      error: (message: string, error?: Error) => {
        console.error(`[${componentName}] ERROR: ${message}`, error);
      },
      performance: (label: string, fn: () => any) => {
        console.time(`[${componentName}] ${label}`);
        const result = fn();
        console.timeEnd(`[${componentName}] ${label}`);
        return result;
      }
    };
  }
}
```

---

## 7. 上級テクニック

### 🎨 高度なプロンプト技法

#### コンテキスト連携プロンプト
```
【複雑な機能の段階的実装】

## フェーズ1: 基盤設計
前提として、以下のプロジェクト構造を把握してください：
{プロジェクト構造の説明}

まず、{機能名}の基盤となる型定義とインターフェースを設計してください。

## フェーズ2: コア実装
フェーズ1で設計した型定義を基に、メインロジックを実装してください。

## フェーズ3: UI統合
フェーズ2の実装をUIコンポーネントと統合してください。

## フェーズ4: 最適化
全体の実装をレビューし、パフォーマンス最適化を提案してください。
```

#### プロジェクト知識活用プロンプト
```
このプロジェクトの以下のパターンに従って実装してください：

## 既存パターンの参照
類似機能: {既存機能のファイルパス}
命名規則: {プロジェクトの命名規則}
アーキテクチャ: {アーキテクチャパターン}

## 一貫性の保持
- インポート順序: {既存のインポート順序}
- エラーハンドリング: {既存のエラーハンドリングパターン}
- スタイリング: {既存のスタイリング手法}

新機能も同様のパターンで実装してください。
```

### 🚀 開発効率最大化

#### テンプレート化プロンプト
よく使うプロンプトをテンプレート化して効率化：

```bash
# ~/.claude-templates/component.md
# React Component Template

## Component Name
{COMPONENT_NAME}

## Props Interface
```typescript
interface {COMPONENT_NAME}Props {
  // プロパティ定義
}
```

## Requirements
- TypeScript strict mode対応
- Tailwind CSS使用
- レスポンシブ対応
- アクセシビリティ考慮

## Expected Output
1. Component implementation
2. Props type definition
3. Storybook story
4. Unit tests
```

#### バッチ処理プロンプト
複数ファイルの一括処理：

```
以下のファイル群に対して同様の修正を適用してください：

## 修正内容
{修正の詳細}

## 対象ファイル
1. src/components/forms/InputGroup.tsx
2. src/components/forms/SelectGroup.tsx
3. src/components/forms/TextareaGroup.tsx

## 一貫性要件
- 同じインターフェース設計
- 同じエラーハンドリング
- 同じスタイリングパターン

各ファイルの修正版を順次提示してください。
```

### 📊 コード品質向上

#### 自動レビュープロンプト
```
以下のコードをレビューし、改善提案をしてください：

## レビュー観点
- [ ] 型安全性
- [ ] パフォーマンス
- [ ] 可読性
- [ ] 保守性
- [ ] セキュリティ
- [ ] アクセシビリティ

## コード
```typescript
{レビュー対象コード}
```

## 期待する出力
1. 改善点の特定
2. 修正コード
3. 改善理由の説明
4. ベストプラクティスの提案
```

#### アーキテクチャ分析プロンプト
```
現在のプロジェクト構造を分析し、改善提案をしてください：

## 分析対象
- ディレクトリ構造
- 依存関係
- 責務分散
- スケーラビリティ

## プロジェクト情報
{プロジェクトの現状説明}

## 期待する分析結果
1. 現在の問題点
2. 改善提案
3. 移行計画
4. リスク評価
```

---

## 🎯 実践チェックリスト

### 📋 日常業務での活用チェック

#### プロジェクト開始時
- [ ] Claude Codeプロジェクト設定完了
- [ ] CLAUDE.mdファイル作成
- [ ] 基本的なプロンプトテンプレート準備
- [ ] 開発ワークフロー定義

#### 開発中
- [ ] 機能実装前にClaude Codeで設計相談
- [ ] コード生成後に動作確認
- [ ] エラー発生時にClaude Codeでデバッグ
- [ ] 定期的なコードレビュー依頼

#### プロジェクト完了時
- [ ] Claude Codeとの会話履歴整理
- [ ] 有効だったプロンプトの保存
- [ ] 次回プロジェクトへの改善点メモ
- [ ] ドキュメント生成・更新

### 🚀 効率化のコツ

1. **具体的な指示**: 抽象的でなく具体例を示す
2. **段階的アプローチ**: 複雑な機能は段階的に実装
3. **既存コード参照**: プロジェクトの一貫性を保つ
4. **エラー情報共有**: 正確なエラーメッセージを提供
5. **反復改善**: 初回は簡単に、徐々に改善

---

**🤖 Claude Code × note記事自動生成エージェント で効率的な開発を実現しましょう！**

### 📞 サポート・質問
- **GitHub Issues**: 技術的な質問
- **Claude Code Community**: ベストプラクティス共有
- **次回勉強会**: より高度な活用法を解説予定

---

*この資料もClaude Codeを活用して作成されました*