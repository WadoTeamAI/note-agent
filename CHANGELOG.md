# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added (Phase 1.5 予定)
- 差し込み図解生成（Mermaid.js統合）
- 複数バージョン生成（A/Bテスト対応）
- ダークモード
- リアルタイムプレビュー
- 音声入力対応
- SEOスコア・読みやすさ分析

## [0.3.0] - 2025-10-15

### Added
- ✨ **X投稿生成機能の完全実装**（Phase 1主力機能）
  - 短文ポスト生成（140文字以内×5パターン）
  - 長文ポスト生成（300-500文字×2パターン）
  - スレッド形式生成（5-7ツイート×2パターン）
  - エンゲージメント予測機能（高/中/低）
  - 投稿最適時間の自動提案
- 🎨 **XPostDisplayコンポーネント**
  - ワンクリックコピー機能
  - 一括コピー機能（短文/長文/スレッド）
  - エンゲージメント予測の可視化
  - ターゲット層別の表示
- 📝 **新規型定義**
  - `social.types.ts`: XPost, XThread, XPostGenerationResult
  - FinalOutputにxPosts追加
- 🔧 **サービス追加**
  - `xPostGenerator.ts`: X投稿生成ロジック
  - Gemini 2.0 Flash Exp統合

### Changed
- 📚 README.md更新
  - X投稿生成機能の詳細追加
  - ディレクトリ構造セクション追加
  - 使い方セクションの拡充
- 📄 requirements.md更新
  - X投稿生成の要件詳細化
  - エンゲージメント最適化の追加
- 🗂️ ディレクトリ構造の拡張
  - `src/services/social/` 追加
  - `src/types/social.types.ts` 追加
  - `src/components/display/XPostDisplay.tsx` 追加

### Technical Details
- Gemini APIを使用した多様なX投稿パターン生成
- JSON形式でのレスポンス解析
- エンゲージメント予測アルゴリズム実装
- 曜日・時間帯を考慮した投稿時間提案ロジック

### Planned (Phase 2)
- RAG統合（外部ナレッジベース参照）
- note自動投稿API連携
- X自動投稿API連携
- メモリ機能（投稿スタイル記憶）
- ユーザー認証（Supabase Auth）
- 記事履歴データベース化

## [0.2.0] - 2025-10-15

### Added
- ✨ 7段階ワークフローへの拡張
  - Step 0: 統合リサーチ機能（骨格実装）
  - Step 5: X告知文生成（骨格実装）
- 🏗️ ディレクトリ構造の最適化
  - src/配下への再編成
  - コンポーネントの機能別分類（forms/display/feedback）
  - サービスの責務分離（ai/research/api）
  - 型定義の整理（article.types.ts、api.types.ts）
- 📚 カスタムフック追加
  - useArticleGeneration
  - useLocalStorage
- 🎨 スタイル基盤
  - global.css
- 🛠️ ユーティリティ関数
  - formatting.ts
  - validation.ts
- 📝 ドキュメント強化
  - README.md大幅更新（2025年版）
  - requirements.md詳細化（486行）
  - CLAUDE.md開発者ガイド
  - CONTRIBUTING.mdコントリビューションガイド

### Changed
- 🔄 ProcessStep定義の更新（7段階対応）
- 📦 vite.config.ts設定の改善
- 🎯 importパスの一括更新（新ディレクトリ構造対応）

### Fixed
- 🐛 画像生成APIエラー時のフォールバック実装
- 🔧 型定義の整理と再エクスポート

## [0.1.0] - 2025-10-14

### Added
- 🎉 初期リリース
- 🤖 Gemini 2.5 Pro/Flash統合
- 📝 基本的な記事生成機能（5段階）
  - ANALYZING: SEO分析
  - OUTLINING: 記事構造生成
  - WRITING: 本文生成
  - GENERATING_IMAGE: 画像生成
  - DONE: 完了
- 🎨 UIコンポーネント
  - InputGroup（入力フォーム）
  - OutputDisplay（結果表示）
  - StepIndicator（進捗表示）
- 🧠 AIっぽくないライティング
  - 翻訳調の排除
  - 体験談挿入
  - 共感性重視

---

## リリース予定

- **v0.3.0** (Phase 1.5) - 2025年11月予定
  - 差し込み図解、複数バージョン生成、ダークモード等
  
- **v1.0.0** (Phase 2) - 2025年12月〜2026年1月予定
  - RAG統合、自動投稿、メモリ機能等
  
- **v2.0.0** (Phase 3) - 2026年Q1予定
  - 分析ダッシュボード、A/Bテスト機能等

---

[Unreleased]: https://github.com/your-repo/compare/v0.2.0...HEAD
[0.2.0]: https://github.com/your-repo/compare/v0.1.0...v0.2.0
[0.1.0]: https://github.com/your-repo/releases/tag/v0.1.0

