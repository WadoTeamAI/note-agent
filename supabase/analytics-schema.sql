-- 記事分析・追跡機能のためのSupabaseデータベーススキーマ
-- 使用方法: Supabase Dashboard > SQL Editor で実行

-- 記事分析テーブル
CREATE TABLE IF NOT EXISTS article_analytics (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    article_id UUID NOT NULL,
    user_id UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- 生成メトリクス（JSON形式）
    generation_metrics JSONB NOT NULL DEFAULT '{}',
    
    -- 品質メトリクス（JSON形式）
    quality_metrics JSONB NOT NULL DEFAULT '{}',
    
    -- パフォーマンスメトリクス（JSON形式）
    performance_metrics JSONB NOT NULL DEFAULT '{}',
    
    -- ユーザーインタラクション（JSON配列）
    user_interactions JSONB DEFAULT '[]',
    
    -- 検索・集計用のフラットフィールド
    total_generation_time INTEGER, -- ミリ秒
    word_count INTEGER,
    quality_score DECIMAL(3,2), -- 0.00-10.00
    success_rate DECIMAL(5,2), -- 0.00-100.00
    
    -- インデックス用のタグ
    tags TEXT[],
    
    CONSTRAINT valid_quality_score CHECK (quality_score >= 0 AND quality_score <= 10),
    CONSTRAINT valid_success_rate CHECK (success_rate >= 0 AND success_rate <= 100)
);

-- 分析イベントテーブル
CREATE TABLE IF NOT EXISTS analytics_events (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    event_type TEXT NOT NULL,
    event_data JSONB NOT NULL DEFAULT '{}',
    user_id UUID,
    session_id UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- ユーザーエージェント情報
    user_agent TEXT,
    ip_address INET,
    
    -- 地理的情報（オプション）
    country_code CHAR(2),
    city TEXT,
    
    -- デバイス情報
    device_type TEXT, -- 'desktop', 'mobile', 'tablet'
    browser TEXT,
    os TEXT
);

-- ユーザーセッションテーブル
CREATE TABLE IF NOT EXISTS user_sessions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    session_id UUID UNIQUE NOT NULL,
    user_id UUID,
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    ended_at TIMESTAMP WITH TIME ZONE,
    duration_ms INTEGER,
    
    -- セッション統計
    page_views INTEGER DEFAULT 0,
    articles_generated INTEGER DEFAULT 0,
    interactions_count INTEGER DEFAULT 0,
    
    -- セッション品質
    bounce_rate DECIMAL(5,2),
    engagement_score DECIMAL(5,2),
    
    -- デバイス情報
    device_info JSONB DEFAULT '{}'
);

-- パフォーマンス指標テーブル
CREATE TABLE IF NOT EXISTS performance_metrics (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- システム指標
    avg_response_time INTEGER, -- ミリ秒
    throughput DECIMAL(10,2), -- リクエスト/分
    error_rate DECIMAL(5,2), -- パーセンテージ
    cpu_usage DECIMAL(5,2), -- パーセンテージ
    memory_usage INTEGER, -- MB
    
    -- API指標
    api_calls_gemini INTEGER DEFAULT 0,
    api_calls_news INTEGER DEFAULT 0,
    api_calls_tavily INTEGER DEFAULT 0,
    api_calls_image INTEGER DEFAULT 0,
    
    -- 品質指標
    avg_article_quality DECIMAL(3,2),
    avg_generation_time INTEGER,
    success_rate DECIMAL(5,2),
    
    -- 集計期間
    measurement_window TEXT NOT NULL DEFAULT 'hourly' -- 'hourly', 'daily', 'weekly'
);

-- インデックス作成（パフォーマンス向上）
CREATE INDEX IF NOT EXISTS idx_article_analytics_created_at ON article_analytics (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_article_analytics_user_id ON article_analytics (user_id);
CREATE INDEX IF NOT EXISTS idx_article_analytics_article_id ON article_analytics (article_id);
CREATE INDEX IF NOT EXISTS idx_article_analytics_quality_score ON article_analytics (quality_score DESC);
CREATE INDEX IF NOT EXISTS idx_article_analytics_generation_time ON article_analytics (total_generation_time);

CREATE INDEX IF NOT EXISTS idx_analytics_events_created_at ON analytics_events (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_analytics_events_event_type ON analytics_events (event_type);
CREATE INDEX IF NOT EXISTS idx_analytics_events_user_id ON analytics_events (user_id);
CREATE INDEX IF NOT EXISTS idx_analytics_events_session_id ON analytics_events (session_id);

CREATE INDEX IF NOT EXISTS idx_user_sessions_started_at ON user_sessions (started_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON user_sessions (user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_duration ON user_sessions (duration_ms DESC);

CREATE INDEX IF NOT EXISTS idx_performance_metrics_created_at ON performance_metrics (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_performance_metrics_window ON performance_metrics (measurement_window, created_at DESC);

-- 更新日時自動更新のトリガー
CREATE OR REPLACE FUNCTION update_analytics_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_article_analytics_updated_at 
    BEFORE UPDATE ON article_analytics 
    FOR EACH ROW 
    EXECUTE PROCEDURE update_analytics_updated_at_column();

-- Row Level Security (RLS) 設定
ALTER TABLE article_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE performance_metrics ENABLE ROW LEVEL SECURITY;

-- 分析データアクセスポリシー
CREATE POLICY "Users can read own analytics" ON article_analytics
    FOR SELECT USING (user_id = auth.uid() OR user_id IS NULL);

CREATE POLICY "Users can insert own analytics" ON article_analytics
    FOR INSERT WITH CHECK (user_id = auth.uid() OR user_id IS NULL);

CREATE POLICY "Users can read own events" ON analytics_events
    FOR SELECT USING (user_id = auth.uid() OR user_id IS NULL);

CREATE POLICY "Users can insert own events" ON analytics_events
    FOR INSERT WITH CHECK (user_id = auth.uid() OR user_id IS NULL);

CREATE POLICY "Users can read own sessions" ON user_sessions
    FOR SELECT USING (user_id = auth.uid() OR user_id IS NULL);

CREATE POLICY "Users can manage own sessions" ON user_sessions
    FOR ALL USING (user_id = auth.uid() OR user_id IS NULL);

-- パフォーマンス指標は管理者のみアクセス可能
CREATE POLICY "Admin only performance metrics" ON performance_metrics
    FOR ALL USING (false); -- 将来的に管理者ロールを実装する際に修正

-- 分析データ集計用のビュー
CREATE OR REPLACE VIEW analytics_summary AS
SELECT 
    DATE_TRUNC('day', created_at) as date,
    user_id,
    COUNT(*) as total_articles,
    AVG(quality_score) as avg_quality_score,
    AVG(total_generation_time) as avg_generation_time,
    AVG(word_count) as avg_word_count,
    AVG(success_rate) as avg_success_rate,
    SUM(CASE WHEN success_rate = 100 THEN 1 ELSE 0 END) as successful_articles,
    SUM(CASE WHEN success_rate < 100 THEN 1 ELSE 0 END) as failed_articles
FROM article_analytics
GROUP BY DATE_TRUNC('day', created_at), user_id
ORDER BY date DESC;

-- ユーザー行動分析ビュー
CREATE OR REPLACE VIEW user_behavior_summary AS
SELECT 
    user_id,
    COUNT(DISTINCT session_id) as total_sessions,
    COUNT(*) as total_events,
    COUNT(DISTINCT DATE_TRUNC('day', created_at)) as active_days,
    MIN(created_at) as first_activity,
    MAX(created_at) as last_activity,
    
    -- イベントタイプ別の集計
    COUNT(CASE WHEN event_type = 'article_generated' THEN 1 END) as articles_generated,
    COUNT(CASE WHEN event_type = 'article_viewed' THEN 1 END) as articles_viewed,
    COUNT(CASE WHEN event_type = 'article_copied' THEN 1 END) as articles_copied,
    COUNT(CASE WHEN event_type = 'approval_given' THEN 1 END) as approvals_given,
    COUNT(CASE WHEN event_type = 'error_occurred' THEN 1 END) as errors_encountered
FROM analytics_events
WHERE user_id IS NOT NULL
GROUP BY user_id;

-- パフォーマンストレンドビュー
CREATE OR REPLACE VIEW performance_trends AS
SELECT 
    DATE_TRUNC('hour', created_at) as hour,
    measurement_window,
    AVG(avg_response_time) as avg_response_time,
    AVG(throughput) as avg_throughput,
    AVG(error_rate) as avg_error_rate,
    AVG(cpu_usage) as avg_cpu_usage,
    AVG(memory_usage) as avg_memory_usage,
    AVG(avg_article_quality) as avg_article_quality,
    AVG(success_rate) as avg_success_rate,
    
    -- API使用量
    SUM(api_calls_gemini) as total_gemini_calls,
    SUM(api_calls_news) as total_news_calls,
    SUM(api_calls_tavily) as total_tavily_calls,
    SUM(api_calls_image) as total_image_calls
FROM performance_metrics
GROUP BY DATE_TRUNC('hour', created_at), measurement_window
ORDER BY hour DESC;

-- 品質トレンド分析ビュー
CREATE OR REPLACE VIEW quality_trends AS
SELECT 
    DATE_TRUNC('day', created_at) as date,
    COUNT(*) as articles_count,
    AVG(quality_score) as avg_quality,
    PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY quality_score) as median_quality,
    MIN(quality_score) as min_quality,
    MAX(quality_score) as max_quality,
    STDDEV(quality_score) as quality_stddev,
    
    -- 文字数統計
    AVG(word_count) as avg_word_count,
    PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY word_count) as median_word_count,
    
    -- 成功率統計
    AVG(success_rate) as avg_success_rate,
    COUNT(CASE WHEN success_rate = 100 THEN 1 END) as perfect_success_count,
    
    -- 生成時間統計
    AVG(total_generation_time) as avg_generation_time,
    PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY total_generation_time) as median_generation_time
FROM article_analytics
GROUP BY DATE_TRUNC('day', created_at)
ORDER BY date DESC;