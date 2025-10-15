# 📦 Note Agent AI - インストールガイド

**バージョン**: 1.5.0  
**最終更新**: 2025年10月15日

---

## 🔧 システム要件

### 必須環境
- **Node.js**: 18.0.0以上
- **npm**: 8.0.0以上
- **Git**: 2.0以上
- **ブラウザ**: Chrome/Edge/Safari最新版推奨（音声入力にはChrome/Edge推奨）

### 推奨環境
- **OS**: macOS, Windows 10/11, Linux (Ubuntu 20.04+)
- **メモリ**: 4GB以上（8GB推奨）
- **ストレージ**: 500MB以上の空き容量

---

## 📥 インストール手順

### 1. リポジトリのクローン

```bash
# HTTPSでクローン
git clone https://github.com/WadoTeamAI/note-agent.git

# SSHでクローン（推奨）
git clone git@github.com:WadoTeamAI/note-agent.git

# プロジェクトディレクトリに移動
cd note-agent
```

### 2. 依存パッケージのインストール

```bash
npm install
```

**インストールされる主要パッケージ**:
- `next@15.1.0` - フレームワーク
- `react@19.2.0` - UI
- `@google/genai@1.23.0` - Gemini AI
- `@supabase/supabase-js@2.75.0` - 認証・DB
- `playwright@1.56.0` - ブラウザ自動化
- `react-markdown@10.1.0` - Markdownレンダリング
- `mermaid@11.12.0` - 図解生成
- `tailwindcss@3.4.16` - スタイリング

### 3. 環境変数の設定

#### 3.1 環境変数ファイルの作成

```bash
# .env.localファイルを作成
cp .env.example .env.local
```

`.env.example`が存在しない場合は、新規作成：

```bash
touch .env.local
```

#### 3.2 必須環境変数の設定

`.env.local`を開き、以下を設定：

```bash
# ===== 必須 =====
# Gemini AI API Key（必須）
GEMINI_API_KEY=your_gemini_api_key_here

# ===== 認証・データベース（Supabase） =====
# Phase 2以降で必要（認証・履歴保存）
SUPABASE_URL=your_supabase_project_url
SUPABASE_ANON_KEY=your_supabase_anon_key

# ===== ファクトチェック =====
# Tavily API（ファクトチェック機能を使う場合）
TAVILY_API_KEY=your_tavily_api_key

# ===== 統合リサーチ強化（オプション） =====
# Google Search API（リサーチ精度向上）
GOOGLE_SEARCH_API_KEY=your_google_search_api_key
GOOGLE_SEARCH_ENGINE_ID=your_google_search_engine_id

# YouTube Data API（動画分析強化）
YOUTUBE_API_KEY=your_youtube_api_key

# Unsplash API（高品質画像取得）
UNSPLASH_API_KEY=your_unsplash_api_key
```

---

## 🔑 API キーの取得方法

### 1. Gemini API Key（必須）

**取得手順**:
1. [Google AI Studio](https://makersuite.google.com/app/apikey) にアクセス
2. Googleアカウントでログイン
3. 「Create API Key」をクリック
4. APIキーをコピーして`.env.local`に貼り付け

**無料枠**:
- 60リクエスト/分
- 1,500リクエスト/日

### 2. Supabase（Phase 2以降で必要）

**取得手順**:
1. [Supabase](https://supabase.com/)にアクセス
2. アカウント作成（GitHub連携推奨）
3. 「New Project」で新規プロジェクト作成
4. Project Settings → API から以下を取得:
   - `Project URL` → `SUPABASE_URL`
   - `anon public` key → `SUPABASE_ANON_KEY`

**無料枠**:
- 500MB データベース
- 1GBファイルストレージ
- 2GBデータ転送/月

### 3. Tavily API（ファクトチェック用）

**取得手順**:
1. [Tavily](https://tavily.com/)にアクセス
2. サインアップ
3. ダッシュボードからAPIキーを取得

**無料枠**:
- 1,000リクエスト/月

### 4. Google Search API（オプション）

**取得手順**:
1. [Google Cloud Console](https://console.cloud.google.com/)にアクセス
2. 新規プロジェクト作成
3. 「APIs & Services」→「Enable APIs and Services」
4. 「Custom Search API」を検索して有効化
5. 「Credentials」→「Create Credentials」→「API Key」
6. [Programmable Search Engine](https://programmablesearchengine.google.com/)で検索エンジンIDを取得

**料金**:
- 100クエリ/日は無料
- 追加は$5 per 1,000クエリ

---

## 🚀 起動方法

### 開発サーバーの起動

```bash
npm run dev
```

**アクセス**: http://localhost:3000

### プロダクションビルド

```bash
# ビルド
npm run build

# プロダクションサーバー起動
npm run start
```

### その他のコマンド

```bash
# 型チェック
npm run type-check

# Linter実行
npm run lint

# ビルド解析
npm run analyze
```

---

## ✅ 動作確認

### 1. 基本機能のテスト

1. http://localhost:3000 にアクセス
2. **キーワード入力**: 「副業 始め方」などを入力
3. **設定選択**:
   - 文体: 丁寧
   - 対象: 初心者
   - 文字数: 2,500文字
4. **生成実行**: 「記事を生成する」ボタンをクリック
5. **結果確認**: 約60秒後、記事が生成されることを確認

### 2. 各機能の確認

- **ダークモード**: 右上のテーマ切り替えボタン
- **音声入力**: ヘッダーの「🎙️ 音声入力」ボタン（マイク権限が必要）
- **A/Bテスト**: ヘッダーの「🧪 A/Bテスト」ボタン
- **リアルタイムプレビュー**: 生成後、「note風プレビュー」タブ
- **ファクトチェック**: 生成後、「ファクトチェック結果」セクション
- **SEOキーワード**: 生成後、「SEOキーワードセット」セクション

---

## 🐛 トラブルシューティング

### よくある問題と解決策

#### 1. `npm install` が失敗する

**原因**: Node.jsバージョンが古い

**解決策**:
```bash
# Node.jsバージョン確認
node -v

# 18.0.0未満の場合はアップデート
# nvm使用の場合
nvm install 18
nvm use 18

# 再インストール
rm -rf node_modules package-lock.json
npm install
```

#### 2. APIキーエラー

**エラー**: `Error: APIキーが設定されていません`

**解決策**:
- `.env.local`ファイルが存在するか確認
- `GEMINI_API_KEY`が正しく設定されているか確認
- ファイル名が`.env.local`（`.env`ではない）であることを確認
- サーバーを再起動（`Ctrl+C` → `npm run dev`）

#### 3. 画像生成エラー

**原因**: Imagen API未対応 or 請求設定未完了

**解決策**:
- 自動的にUnsplash APIのフォールバックが動作
- Unsplash APIキーを設定すると高品質な画像が取得可能

#### 4. ファクトチェックが動作しない

**原因**: Tavily APIキー未設定

**解決策**:
- `.env.local`に`TAVILY_API_KEY`を追加
- または、モックモードで動作確認（開発用）

#### 5. 音声入力が動作しない

**原因**: ブラウザがWeb Speech APIに未対応 or マイク権限なし

**解決策**:
- Chrome/Edgeを使用（最も安定）
- ブラウザのマイク権限を許可
- HTTPSまたはlocalhostでアクセス（HTTP不可）

#### 6. Next.js起動エラー

**エラー**: `Error: Cannot find module 'next'`

**解決策**:
```bash
# node_modulesを削除して再インストール
rm -rf node_modules .next
npm install
```

#### 7. Playwrightエラー

**エラー**: `browserType.launch: Executable doesn't exist`

**解決策**:
```bash
# Playwrightブラウザをインストール
npx playwright install
```

---

## 📊 オプション設定

### Supabaseデータベースのセットアップ

**Phase 2機能（認証・履歴管理）を使用する場合**:

1. Supabaseダッシュボードにアクセス
2. SQL Editorを開く
3. `supabase-schema.sql`の内容を実行

```bash
# スキーマファイルの場所
./supabase-schema.sql
```

### Playwrightのセットアップ

**note自動投稿を使用する場合**:

```bash
# Playwrightブラウザのインストール
npx playwright install chromium

# ヘッドレスモードをオフにしてテスト（開発時）
# noteService.ts内で headless: false に設定
```

---

## 🔒 セキュリティに関する注意

### 環境変数の管理
- **絶対にコミットしない**: `.env.local`は`.gitignore`に含まれています
- **チーム共有**: 安全な方法で共有（1Password, LastPassなど）
- **本番環境**: Vercel, Cloudflare Pagesの環境変数設定を使用

### APIキーの保護
- クライアントサイドでAPIキーを直接使用しない
- Next.js Server Actionsを使用してサーバーサイドで処理

---

## 📚 次のステップ

インストール完了後:

1. **[README.md](./README.md)** - プロジェクト概要を確認
2. **[ARCHITECTURE.md](./ARCHITECTURE.md)** - アーキテクチャを理解
3. **[CONTRIBUTING.md](./CONTRIBUTING.md)** - 開発に参加する方法
4. **[requirements.md](./requirements.md)** - 詳細な要件定義

---

## 🆘 サポート

問題が解決しない場合:

- **GitHub Issues**: https://github.com/WadoTeamAI/note-agent/issues
- **ディスカッション**: https://github.com/WadoTeamAI/note-agent/discussions
- **メール**: support@note-agent.example.com (架空)

---

**Happy Coding! 🚀**

