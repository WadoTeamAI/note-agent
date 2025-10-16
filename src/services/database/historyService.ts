/**
 * 記事生成履歴管理サービス
 * Supabaseを使用した履歴の保存・取得・検索機能
 */

import { supabase, isSupabaseAvailable, ArticleHistoryRecord, ArticleHistorySummary, ArticleGenerationStats } from './supabaseClient';

// 必要な型と関数を再エクスポート
export { isSupabaseAvailable } from './supabaseClient';
export type { ArticleHistoryRecord, ArticleHistorySummary, ArticleGenerationStats } from './supabaseClient';
import { FinalOutput, ArticleOutline } from '../../types/article.types';
import { Audience, Tone } from '../../types';

export interface SaveHistoryParams {
    // 入力データ
    inputKeyword?: string;
    inputYouTubeUrl?: string;
    inputTone: Tone;
    inputAudience: Audience;
    inputTargetLength: number;
    inputImageTheme?: string;
    
    // 生成結果
    finalOutput: FinalOutput;
    
    // AI生成の中間データ
    analysisData?: string;
    outlineData?: ArticleOutline;
    
    // メタデータ
    generationTimeMs?: number;
    workflowSteps?: string[];
    errorMessages?: string[];
}

export interface HistoryFilters {
    limit?: number;
    offset?: number;
    keyword?: string;
    audience?: Audience;
    tone?: Tone;
    minWordCount?: number;
    maxWordCount?: number;
    dateFrom?: string;
    dateTo?: string;
}

/**
 * 記事生成履歴を保存
 */
export async function saveArticleHistory(params: SaveHistoryParams): Promise<string | null> {
    if (!isSupabaseAvailable()) {
        console.warn('Supabase not available, skipping history save');
        return null;
    }

    try {
        // 文字数計算（Markdownから推定）
        const wordCount = params.finalOutput.markdownContent.length;
        
        // タグ生成（キーワードベース）
        const tags = generateTags(params.inputKeyword, params.finalOutput);
        
        const record: ArticleHistoryRecord = {
            // 入力データ
            input_keyword: params.inputKeyword,
            input_youtube_url: params.inputYouTubeUrl,
            input_tone: params.inputTone,
            input_audience: params.inputAudience,
            input_target_length: params.inputTargetLength,
            input_image_theme: params.inputImageTheme,
            
            // 生成結果
            title: params.outlineData?.title || 'Untitled',
            meta_description: params.finalOutput.metaDescription,
            markdown_content: params.finalOutput.markdownContent,
            image_url: params.finalOutput.imageUrl,
            
            // AI生成の中間データ
            analysis_data: params.analysisData ? JSON.parse(JSON.stringify(params.analysisData)) : null,
            outline_data: params.outlineData ? JSON.parse(JSON.stringify(params.outlineData)) : null,
            
            // メタデータ
            generation_time_ms: params.generationTimeMs,
            workflow_step: params.workflowSteps,
            error_messages: params.errorMessages,
            
            // 検索・フィルタ用
            tags,
            word_count: wordCount,
        };

        const { data, error } = await supabase!
            .from('article_history')
            .insert([record])
            .select('id')
            .single();

        if (error) {
            console.error('Error saving article history:', error);
            return null;
        }

        console.log('Article history saved with ID:', data.id);
        return data.id;
    } catch (error) {
        console.error('Error in saveArticleHistory:', error);
        return null;
    }
}

/**
 * 記事履歴一覧を取得
 */
export async function getArticleHistory(filters: HistoryFilters = {}): Promise<ArticleHistorySummary[]> {
    if (!isSupabaseAvailable()) {
        console.warn('Supabase not available, returning empty history');
        return [];
    }

    try {
        let query = supabase!
            .from('article_history_summary')
            .select('*');

        // フィルタ適用
        if (filters.keyword) {
            query = query.ilike('input_source', `%${filters.keyword}%`);
        }
        if (filters.audience) {
            query = query.eq('input_audience', filters.audience);
        }
        if (filters.tone) {
            query = query.eq('input_tone', filters.tone);
        }
        if (filters.minWordCount) {
            query = query.gte('word_count', filters.minWordCount);
        }
        if (filters.maxWordCount) {
            query = query.lte('word_count', filters.maxWordCount);
        }
        if (filters.dateFrom) {
            query = query.gte('created_at', filters.dateFrom);
        }
        if (filters.dateTo) {
            query = query.lte('created_at', filters.dateTo);
        }

        // ページネーション
        const limit = filters.limit || 20;
        const offset = filters.offset || 0;
        query = query.range(offset, offset + limit - 1);

        const { data, error } = await query;

        if (error) {
            console.error('Error fetching article history:', error);
            return [];
        }

        return data || [];
    } catch (error) {
        console.error('Error in getArticleHistory:', error);
        return [];
    }
}

/**
 * 特定の記事履歴詳細を取得
 */
export async function getArticleHistoryDetail(id: string): Promise<ArticleHistoryRecord | null> {
    if (!isSupabaseAvailable()) {
        return null;
    }

    try {
        const { data, error } = await supabase!
            .from('article_history')
            .select('*')
            .eq('id', id)
            .single();

        if (error) {
            console.error('Error fetching article history detail:', error);
            return null;
        }

        return data;
    } catch (error) {
        console.error('Error in getArticleHistoryDetail:', error);
        return null;
    }
}

/**
 * 記事履歴を削除
 */
export async function deleteArticleHistory(id: string): Promise<boolean> {
    if (!isSupabaseAvailable()) {
        return false;
    }

    try {
        const { error } = await supabase!
            .from('article_history')
            .delete()
            .eq('id', id);

        if (error) {
            console.error('Error deleting article history:', error);
            return false;
        }

        return true;
    } catch (error) {
        console.error('Error in deleteArticleHistory:', error);
        return false;
    }
}

/**
 * 統計情報を取得
 */
export async function getGenerationStats(): Promise<ArticleGenerationStats[]> {
    if (!isSupabaseAvailable()) {
        return [];
    }

    try {
        const { data, error } = await supabase!
            .from('article_generation_stats')
            .select('*')
            .order('generation_date', { ascending: false })
            .limit(30); // 直近30日分

        if (error) {
            console.error('Error fetching generation stats:', error);
            return [];
        }

        return data || [];
    } catch (error) {
        console.error('Error in getGenerationStats:', error);
        return [];
    }
}

/**
 * タグ生成ヘルパー関数
 */
function generateTags(keyword?: string, finalOutput?: FinalOutput): string[] {
    const tags: string[] = [];
    
    if (keyword) {
        tags.push(keyword);
        // キーワードから派生タグを生成
        const derivedTags = keyword.split(/\s+|[、。！？]/).filter(tag => tag.length > 1);
        tags.push(...derivedTags);
    }
    
    // 記事内容からキーワード抽出（簡易版）
    if (finalOutput?.markdownContent) {
        const content = finalOutput.markdownContent;
        const commonKeywords = ['方法', '使い方', '解説', '初心者', '基本', '応用', '実践', 'コツ', 'ポイント'];
        for (const kw of commonKeywords) {
            if (content.includes(kw)) {
                tags.push(kw);
            }
        }
    }
    
    // 重複除去と長さ制限
    return [...new Set(tags)].slice(0, 10);
}

/**
 * LocalStorageフォールバック（Supabase利用不可時）
 */
const LOCALSTORAGE_KEY = 'article-history';

export function saveToLocalStorage(params: SaveHistoryParams): string {
    try {
        const existingHistory = JSON.parse(localStorage.getItem(LOCALSTORAGE_KEY) || '[]');
        const id = Date.now().toString();
        const record = {
            id,
            created_at: new Date().toISOString(),
            ...params,
            title: params.outlineData?.title || 'Untitled',
            word_count: params.finalOutput.markdownContent.length
        };
        
        existingHistory.unshift(record);
        // 最大100件まで保存
        if (existingHistory.length > 100) {
            existingHistory.splice(100);
        }
        
        localStorage.setItem(LOCALSTORAGE_KEY, JSON.stringify(existingHistory));
        return id;
    } catch (error) {
        console.error('Error saving to localStorage:', error);
        return '';
    }
}

export function getFromLocalStorage(): any[] {
    try {
        return JSON.parse(localStorage.getItem(LOCALSTORAGE_KEY) || '[]');
    } catch (error) {
        console.error('Error reading from localStorage:', error);
        return [];
    }
}