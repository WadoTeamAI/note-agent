-- 記事生成履歴管理のためのSupabaseデータベーススキーマ
-- 使用方法: Supabase Dashboard > SQL Editor で実行

-- 記事生成履歴テーブル
CREATE TABLE IF NOT EXISTS article_history (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- 入力データ
    input_keyword TEXT,
    input_youtube_url TEXT,
    input_tone TEXT NOT NULL,
    input_audience TEXT NOT NULL,
    input_target_length INTEGER NOT NULL,
    input_image_theme TEXT,
    
    -- 生成結果
    title TEXT NOT NULL,
    meta_description TEXT NOT NULL,
    markdown_content TEXT NOT NULL,
    image_url TEXT,
    
    -- AI生成の中間データ（JSON形式）
    analysis_data JSONB,
    outline_data JSONB,
    
    -- メタデータ
    generation_time_ms INTEGER, -- 生成にかかった時間（ミリ秒）
    workflow_step TEXT[], -- 実行されたワークフロー手順
    error_messages TEXT[], -- エラーメッセージ（あれば）
    
    -- 検索・フィルタ用
    tags TEXT[], -- タグ（キーワードから自動生成）
    word_count INTEGER, -- 記事の文字数
    
    -- ユーザー管理（将来の拡張用）
    user_id UUID, -- 将来のユーザー認証機能用
    
    CONSTRAINT valid_input CHECK (
        (input_keyword IS NOT NULL AND input_youtube_url IS NULL) OR
        (input_keyword IS NULL AND input_youtube_url IS NOT NULL)
    )
);

-- インデックス作成（検索パフォーマンス向上）
CREATE INDEX IF NOT EXISTS idx_article_history_created_at ON article_history (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_article_history_keyword ON article_history (input_keyword);
CREATE INDEX IF NOT EXISTS idx_article_history_tags ON article_history USING GIN (tags);
CREATE INDEX IF NOT EXISTS idx_article_history_word_count ON article_history (word_count);
CREATE INDEX IF NOT EXISTS idx_article_history_user_id ON article_history (user_id);

-- 更新日時自動更新のトリガー
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_article_history_updated_at 
    BEFORE UPDATE ON article_history 
    FOR EACH ROW 
    EXECUTE PROCEDURE update_updated_at_column();

-- Row Level Security (RLS) 設定（セキュリティ強化）
ALTER TABLE article_history ENABLE ROW LEVEL SECURITY;

-- 匿名ユーザーでも読み書き可能（Phase 1用）
-- 将来的にはユーザー認証に応じて制限
CREATE POLICY "Allow anonymous access" ON article_history
    FOR ALL USING (true)
    WITH CHECK (true);

-- サンプルデータ挿入用のビュー（開発用）
CREATE OR REPLACE VIEW article_history_summary AS
SELECT 
    id,
    created_at,
    COALESCE(input_keyword, 'YouTube: ' || input_youtube_url) as input_source,
    title,
    input_audience,
    input_tone,
    word_count,
    generation_time_ms,
    array_length(workflow_step, 1) as workflow_steps_count
FROM article_history
ORDER BY created_at DESC;

-- 統計情報取得用のビュー
CREATE OR REPLACE VIEW article_generation_stats AS
SELECT 
    COUNT(*) as total_articles,
    AVG(generation_time_ms) as avg_generation_time_ms,
    AVG(word_count) as avg_word_count,
    COUNT(DISTINCT input_audience) as unique_audiences,
    COUNT(DISTINCT input_tone) as unique_tones,
    DATE_TRUNC('day', created_at) as generation_date,
    COUNT(*) as daily_count
FROM article_history
GROUP BY DATE_TRUNC('day', created_at)
ORDER BY generation_date DESC;