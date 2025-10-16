import { supabase, isSupabaseAvailable, ArticleHistoryRecord, ArticleHistorySummary, ArticleGenerationStats } from './supabaseClient';
import { FinalOutput, FormData } from '../../types';

/**
 * 記事履歴管理サービス
 * Supabase利用可能時はクラウドDB、そうでなければLocalStorageを使用
 */
export class ArticleHistoryService {
    private static readonly LOCAL_STORAGE_KEY = 'note_article_history';
    private static readonly MAX_LOCAL_HISTORY = 50;

    /**
     * 記事履歴を保存
     */
    async saveArticle(
        formData: FormData, 
        output: FinalOutput, 
        metadata?: {
            generationTimeMs?: number;
            workflowSteps?: string[];
            errorMessages?: string[];
            userId?: string;
        }
    ): Promise<string | null> {
        const record: Omit<ArticleHistoryRecord, 'id' | 'created_at' | 'updated_at'> = {
            // 入力データ
            input_keyword: formData.keyword.startsWith('http') ? undefined : formData.keyword,
            input_youtube_url: formData.keyword.startsWith('http') ? formData.keyword : undefined,
            input_tone: formData.tone,
            input_audience: formData.audience,
            input_target_length: formData.targetLength,
            input_image_theme: formData.imageTheme,
            
            // 出力データ
            title: this.extractTitleFromMarkdown(output.markdownContent),
            meta_description: output.metaDescription,
            markdown_content: output.markdownContent,
            image_url: output.imageUrl,
            
            // メタデータ
            generation_time_ms: metadata?.generationTimeMs,
            workflow_step: metadata?.workflowSteps,
            error_messages: metadata?.errorMessages,
            word_count: output.markdownContent.length,
            tags: this.extractTags(formData.keyword, output.markdownContent),
            user_id: metadata?.userId
        };

        if (isSupabaseAvailable()) {
            return this.saveToSupabase(record);
        } else {
            return this.saveToLocalStorage(record);
        }
    }

    /**
     * 記事履歴一覧を取得
     */
    async getArticleHistory(
        limit: number = 20, 
        offset: number = 0,
        userId?: string
    ): Promise<ArticleHistorySummary[]> {
        if (isSupabaseAvailable()) {
            return this.getFromSupabase(limit, offset, userId);
        } else {
            return this.getFromLocalStorage(limit, offset);
        }
    }

    /**
     * 特定の記事詳細を取得
     */
    async getArticleById(id: string): Promise<ArticleHistoryRecord | null> {
        if (isSupabaseAvailable()) {
            return this.getByIdFromSupabase(id);
        } else {
            return this.getByIdFromLocalStorage(id);
        }
    }

    /**
     * 記事を削除
     */
    async deleteArticle(id: string, userId?: string): Promise<boolean> {
        if (isSupabaseAvailable()) {
            return this.deleteFromSupabase(id, userId);
        } else {
            return this.deleteFromLocalStorage(id);
        }
    }

    /**
     * 統計情報を取得
     */
    async getGenerationStats(userId?: string): Promise<ArticleGenerationStats[]> {
        if (isSupabaseAvailable()) {
            return this.getStatsFromSupabase(userId);
        } else {
            return this.getStatsFromLocalStorage();
        }
    }

    /**
     * 記事を検索
     */
    async searchArticles(
        query: string, 
        limit: number = 20,
        userId?: string
    ): Promise<ArticleHistorySummary[]> {
        if (isSupabaseAvailable()) {
            return this.searchInSupabase(query, limit, userId);
        } else {
            return this.searchInLocalStorage(query, limit);
        }
    }

    // Supabase実装
    private async saveToSupabase(record: Omit<ArticleHistoryRecord, 'id' | 'created_at' | 'updated_at'>): Promise<string | null> {
        try {
            const { data, error } = await supabase!
                .from('article_history')
                .insert([record])
                .select('id')
                .single();

            if (error) {
                console.error('Supabase save error:', error);
                return null;
            }

            return data.id;
        } catch (error) {
            console.error('Failed to save to Supabase:', error);
            return null;
        }
    }

    private async getFromSupabase(limit: number, offset: number, userId?: string): Promise<ArticleHistorySummary[]> {
        try {
            let query = supabase!
                .from('article_history_summary')
                .select('*')
                .order('created_at', { ascending: false })
                .range(offset, offset + limit - 1);

            if (userId) {
                query = query.eq('user_id', userId);
            }

            const { data, error } = await query;

            if (error) {
                console.error('Supabase fetch error:', error);
                return [];
            }

            return data || [];
        } catch (error) {
            console.error('Failed to fetch from Supabase:', error);
            return [];
        }
    }

    private async getByIdFromSupabase(id: string): Promise<ArticleHistoryRecord | null> {
        try {
            const { data, error } = await supabase!
                .from('article_history')
                .select('*')
                .eq('id', id)
                .single();

            if (error) {
                console.error('Supabase fetch by ID error:', error);
                return null;
            }

            return data;
        } catch (error) {
            console.error('Failed to fetch by ID from Supabase:', error);
            return null;
        }
    }

    private async deleteFromSupabase(id: string, userId?: string): Promise<boolean> {
        try {
            let query = supabase!
                .from('article_history')
                .delete()
                .eq('id', id);

            if (userId) {
                query = query.eq('user_id', userId);
            }

            const { error } = await query;

            if (error) {
                console.error('Supabase delete error:', error);
                return false;
            }

            return true;
        } catch (error) {
            console.error('Failed to delete from Supabase:', error);
            return false;
        }
    }

    private async getStatsFromSupabase(userId?: string): Promise<ArticleGenerationStats[]> {
        try {
            let query = supabase!
                .from('article_generation_stats')
                .select('*')
                .order('generation_date', { ascending: false })
                .limit(30);

            if (userId) {
                // 統計ビューにuser_idフィルターを追加する必要がある場合
                // ここでは全体統計を返す
            }

            const { data, error } = await query;

            if (error) {
                console.error('Supabase stats error:', error);
                return [];
            }

            return data || [];
        } catch (error) {
            console.error('Failed to fetch stats from Supabase:', error);
            return [];
        }
    }

    private async searchInSupabase(query: string, limit: number, userId?: string): Promise<ArticleHistorySummary[]> {
        try {
            let supabaseQuery = supabase!
                .from('article_history_summary')
                .select('*')
                .or(`title.ilike.%${query}%,input_source.ilike.%${query}%`)
                .order('created_at', { ascending: false })
                .limit(limit);

            if (userId) {
                supabaseQuery = supabaseQuery.eq('user_id', userId);
            }

            const { data, error } = await supabaseQuery;

            if (error) {
                console.error('Supabase search error:', error);
                return [];
            }

            return data || [];
        } catch (error) {
            console.error('Failed to search in Supabase:', error);
            return [];
        }
    }

    // LocalStorage実装
    private saveToLocalStorage(record: Omit<ArticleHistoryRecord, 'id' | 'created_at' | 'updated_at'>): string {
        try {
            const id = this.generateId();
            const fullRecord: ArticleHistoryRecord = {
                ...record,
                id,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            };

            const existing = this.getLocalStorageData();
            existing.unshift(fullRecord);

            // 最大保存数を制限
            const limited = existing.slice(0, ArticleHistoryService.MAX_LOCAL_HISTORY);
            localStorage.setItem(ArticleHistoryService.LOCAL_STORAGE_KEY, JSON.stringify(limited));

            return id;
        } catch (error) {
            console.error('Failed to save to localStorage:', error);
            return this.generateId();
        }
    }

    private getFromLocalStorage(limit: number, offset: number): ArticleHistorySummary[] {
        try {
            const data = this.getLocalStorageData();
            return data
                .slice(offset, offset + limit)
                .map(this.convertToSummary);
        } catch (error) {
            console.error('Failed to fetch from localStorage:', error);
            return [];
        }
    }

    private getByIdFromLocalStorage(id: string): ArticleHistoryRecord | null {
        try {
            const data = this.getLocalStorageData();
            return data.find(item => item.id === id) || null;
        } catch (error) {
            console.error('Failed to fetch by ID from localStorage:', error);
            return null;
        }
    }

    private deleteFromLocalStorage(id: string): boolean {
        try {
            const data = this.getLocalStorageData();
            const filtered = data.filter(item => item.id !== id);
            localStorage.setItem(ArticleHistoryService.LOCAL_STORAGE_KEY, JSON.stringify(filtered));
            return true;
        } catch (error) {
            console.error('Failed to delete from localStorage:', error);
            return false;
        }
    }

    private getStatsFromLocalStorage(): ArticleGenerationStats[] {
        try {
            const data = this.getLocalStorageData();
            
            // 日別の統計を計算
            const daily = data.reduce((acc, item) => {
                const date = new Date(item.created_at!).toISOString().split('T')[0];
                if (!acc[date]) {
                    acc[date] = {
                        count: 0,
                        totalTime: 0,
                        totalWords: 0,
                        audiences: new Set(),
                        tones: new Set()
                    };
                }
                
                acc[date].count++;
                acc[date].totalTime += item.generation_time_ms || 0;
                acc[date].totalWords += item.word_count || 0;
                acc[date].audiences.add(item.input_audience);
                acc[date].tones.add(item.input_tone);
                
                return acc;
            }, {} as Record<string, any>);

            return Object.entries(daily).map(([date, stats]) => ({
                total_articles: data.length,
                avg_generation_time_ms: stats.totalTime / stats.count,
                avg_word_count: stats.totalWords / stats.count,
                unique_audiences: stats.audiences.size,
                unique_tones: stats.tones.size,
                generation_date: date,
                daily_count: stats.count
            }));
        } catch (error) {
            console.error('Failed to get stats from localStorage:', error);
            return [];
        }
    }

    private searchInLocalStorage(query: string, limit: number): ArticleHistorySummary[] {
        try {
            const data = this.getLocalStorageData();
            const lowerQuery = query.toLowerCase();
            
            const filtered = data.filter(item => 
                item.title.toLowerCase().includes(lowerQuery) ||
                item.input_keyword?.toLowerCase().includes(lowerQuery) ||
                item.input_youtube_url?.toLowerCase().includes(lowerQuery)
            );

            return filtered
                .slice(0, limit)
                .map(this.convertToSummary);
        } catch (error) {
            console.error('Failed to search in localStorage:', error);
            return [];
        }
    }

    // ユーティリティ
    private getLocalStorageData(): ArticleHistoryRecord[] {
        try {
            const data = localStorage.getItem(ArticleHistoryService.LOCAL_STORAGE_KEY);
            return data ? JSON.parse(data) : [];
        } catch {
            return [];
        }
    }

    private convertToSummary(record: ArticleHistoryRecord): ArticleHistorySummary {
        return {
            id: record.id!,
            created_at: record.created_at!,
            input_source: record.input_keyword || `YouTube: ${record.input_youtube_url}`,
            title: record.title,
            input_audience: record.input_audience,
            input_tone: record.input_tone,
            word_count: record.word_count,
            generation_time_ms: record.generation_time_ms,
            workflow_steps_count: record.workflow_step?.length
        };
    }

    private extractTitleFromMarkdown(content: string): string {
        const titleMatch = content.match(/^#\s+(.+)$/m);
        return titleMatch ? titleMatch[1] : 'タイトルなし';
    }

    private extractTags(keyword: string, content: string): string[] {
        const tags = new Set<string>();
        
        // キーワードからタグを抽出
        if (keyword && !keyword.startsWith('http')) {
            keyword.split(/\s+/).forEach(word => {
                if (word.length > 1) tags.add(word);
            });
        }

        // コンテンツから頻出キーワードを抽出（簡易版）
        const words = content.match(/[ぁ-んァ-ンa-zA-Z一-龯]{2,}/g) || [];
        const wordCount = words.reduce((acc, word) => {
            acc[word] = (acc[word] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);

        // 頻出上位5つをタグとして追加
        Object.entries(wordCount)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 5)
            .forEach(([word]) => tags.add(word));

        return Array.from(tags).slice(0, 10); // 最大10個のタグ
    }

    private generateId(): string {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    /**
     * サービスの利用可能性をチェック
     */
    isAvailable(): boolean {
        return isSupabaseAvailable() || typeof localStorage !== 'undefined';
    }

    /**
     * 現在使用中のストレージタイプを取得
     */
    getStorageType(): 'supabase' | 'localStorage' | 'unavailable' {
        if (isSupabaseAvailable()) return 'supabase';
        if (typeof localStorage !== 'undefined') return 'localStorage';
        return 'unavailable';
    }
}