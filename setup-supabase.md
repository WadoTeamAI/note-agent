# Supabaseセットアップガイド

## 1. プロジェクト作成

1. **https://app.supabase.com** にアクセス
2. 「New project」をクリック
3. プロジェクト名: `note-article-generator`
4. データベースパスワードを設定
5. リージョン選択: `ap-northeast-1 (Tokyo)`

## 2. 認証情報取得

1. プロジェクトダッシュボードで **Settings > API** を開く
2. 以下をコピー:
   - **Project URL**: `https://[your-project-id].supabase.co`
   - **anon public key**: `eyJ...` (長いトークン文字列)

## 3. 環境変数設定

`.env.local`ファイルを以下のように更新:

```bash
# Gemini API Configuration
GEMINI_API_KEY=AIzaSyCC5KxR9A_6woRBgEYH8jEFUJM-5otNJbs

# Supabase Configuration
SUPABASE_URL=https://[your-project-id].supabase.co
SUPABASE_ANON_KEY=eyJ[your-anon-key]
```

## 4. データベーススキーマ作成

1. Supabase Dashboard > **SQL Editor** を開く
2. `supabase-schema.sql`の内容をコピー&ペースト
3. 「Run」ボタンを押してスキーマを作成

## 5. 動作確認

```bash
npm run dev
```

1. アプリケーションを起動
2. 記事を生成
3. 「📚 履歴」ボタンで履歴が保存されているか確認

## トラブルシューティング

### LocalStorageフォールバック
- Supabase未設定時は自動的にLocalStorageを使用
- 履歴パネルに「⚠️ LocalStorage使用中」と表示

### 接続エラー
- URLとAPIキーが正しいか確認
- Supabaseプロジェクトがアクティブか確認
- ブラウザのコンソールでエラーメッセージを確認