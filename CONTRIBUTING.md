# コントリビューションガイド

ノート記事自動生成エージェントへのコントリビューションを検討いただき、ありがとうございます！

## 🤝 コントリビューション方法

### 1. Issue報告

バグや機能リクエストは[GitHub Issues](https://github.com/your-repo/issues)で報告してください。

#### バグ報告のテンプレート

```markdown
## バグの概要
（簡潔に説明）

## 再現手順
1. ...
2. ...
3. ...

## 期待される動作
（どうあるべきか）

## 実際の動作
（何が起きたか）

## 環境
- OS: 
- Node.js バージョン: 
- ブラウザ: 

## スクリーンショット
（あれば添付）
```

### 2. Pull Request

1. **フォーク**: このリポジトリをフォーク
2. **ブランチ作成**: 機能追加用のブランチを作成
   ```bash
   git checkout -b feature/your-feature-name
   ```
3. **変更実装**: コードを変更
4. **テスト**: 変更が正しく動作することを確認
5. **コミット**: わかりやすいコミットメッセージで変更をコミット
   ```bash
   git commit -m "feat: 新機能の説明"
   ```
6. **プッシュ**: フォークしたリポジトリにプッシュ
   ```bash
   git push origin feature/your-feature-name
   ```
7. **PR作成**: Pull Requestを作成

### 3. コミットメッセージ規約

[Conventional Commits](https://www.conventionalcommits.org/)に従ってください：

- `feat:` - 新機能追加
- `fix:` - バグ修正
- `docs:` - ドキュメント変更
- `style:` - コードスタイル変更（フォーマット、セミコロン等）
- `refactor:` - リファクタリング
- `test:` - テスト追加・修正
- `chore:` - ビルドプロセスやツール変更

例：
```bash
feat: X告知文生成機能を追加
fix: 画像生成時のエラーハンドリングを修正
docs: READMEのインストール手順を更新
```

## 📝 開発ガイドライン

### コーディング規約

1. **TypeScript**: 厳格な型付けを使用
2. **関数**: 単一責任の原則を守る
3. **コメント**: JSDocコメントで関数を文書化
4. **命名**: 
   - 変数・関数: camelCase
   - コンポーネント: PascalCase
   - 定数: UPPER_SNAKE_CASE
   - 型・インターフェース: PascalCase

### ディレクトリ構造

新しいファイルを追加する際は、以下の構造に従ってください：

```
src/
├── components/       # UIコンポーネント
│   ├── forms/       # フォーム関連
│   ├── display/     # 表示関連
│   └── feedback/    # フィードバック
├── services/        # 外部サービス連携
│   ├── ai/          # AI関連
│   ├── research/    # リサーチ
│   └── api/         # 外部API
├── hooks/           # カスタムフック
├── types/           # 型定義
├── config/          # 設定
├── utils/           # ユーティリティ
└── styles/          # スタイル
```

### テスト（Phase 1.5以降）

- ユニットテスト: Jest + React Testing Library
- E2Eテスト: Playwright（検討中）

## 🐛 バグを見つけた場合

1. 既存のIssueを確認（重複を避けるため）
2. 再現手順を明確に記載
3. 環境情報を提供（OS、Node.jsバージョン等）
4. 可能であればスクリーンショットを添付

## 💡 機能リクエスト

1. 既存のIssueを確認
2. ユースケースを説明
3. 期待される動作を記載
4. 代替案があれば提示

## 📚 ドキュメント改善

ドキュメントの改善も大歓迎です！

- README.md
- requirements.md
- CLAUDE.md
- コメント・JSDoc

## 🎯 優先度の高いコントリビューション

### Phase 1（現在）
- バグ修正
- パフォーマンス改善
- ドキュメント改善
- ユーザビリティ向上

### Phase 1.5（近日予定）
- 差し込み図解生成（Mermaid.js）
- 複数バージョン生成
- ダークモード
- 音声入力対応

### Phase 2以降
- RAG統合
- コラボレーション機能
- 自動投稿機能

## ⚖️ ライセンス

コントリビューションは MIT License の下でライセンスされます。

## 🙏 謝辞

コントリビューターの皆様に感謝します！

---

質問がある場合は、[Issue](https://github.com/your-repo/issues)で気軽にお尋ねください。

