/**
 * Supabaseクライアント設定
 * 記事生成履歴の保存・取得を管理
 */

import { createClient } from '@supabase/supabase-js';

// 環境変数の確認とバリデーション
function validateSupabaseEnvironment() {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
    const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseAnonKey) {
        console.warn('Supabase credentials not found. History features will be disabled.');
        console.warn('To enable history features, set SUPABASE_URL and SUPABASE_ANON_KEY in .env.local');
        return null;
    }
    
    if (supabaseUrl === 'your_supabase_project_url_here' || 
        supabaseAnonKey === 'your_supabase_anon_key_here') {
        console.warn('Please set valid Supabase credentials in .env.local');
        return null;
    }
    
    return { supabaseUrl, supabaseAnonKey };
}

// Supabaseクライアントの初期化
const credentials = validateSupabaseEnvironment();
export const supabase = credentials 
    ? createClient(credentials.supabaseUrl, credentials.supabaseAnonKey)
    : null;

// Supabase利用可能かチェック
export const isSupabaseAvailable = (): boolean => {
    return supabase !== null;
};

// データベース型定義
export interface ArticleHistoryRecord {
    id?: string;
    created_at?: string;
    updated_at?: string;
    
    // 入力データ
    input_keyword?: string;
    input_youtube_url?: string;
    input_tone: string;
    input_audience: string;
    input_target_length: number;
    input_image_theme?: string;
    
    // 生成結果
    title: string;
    meta_description: string;
    markdown_content: string;
    image_url?: string;
    
    // AI生成の中間データ
    analysis_data?: any;
    outline_data?: any;
    
    // メタデータ
    generation_time_ms?: number;
    workflow_step?: string[];
    error_messages?: string[];
    
    // 検索・フィルタ用
    tags?: string[];
    word_count?: number;
    
    // ユーザー管理（将来用）
    user_id?: string;
}

export interface ArticleHistorySummary {
    id: string;
    created_at: string;
    input_source: string;
    title: string;
    input_audience: string;
    input_tone: string;
    word_count?: number;
    generation_time_ms?: number;
    workflow_steps_count?: number;
}

export interface ArticleGenerationStats {
    total_articles: number;
    avg_generation_time_ms: number;
    avg_word_count: number;
    unique_audiences: number;
    unique_tones: number;
    generation_date: string;
    daily_count: number;
}