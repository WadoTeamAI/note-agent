import { 
    ArticleAnalytics, 
    GenerationMetrics, 
    QualityMetrics, 
    UserInteraction, 
    PerformanceMetrics,
    InteractionType,
    AnalyticsDashboard,
    OverviewStats,
    TimeSeriesData,
    UserAnalysisData,
    QualityTrendData,
    PerformanceAnalysisData,
    AnalyticsQuery,
    AnalyticsEvent
} from '../../types/analytics.types';
import { FinalOutput, FormData, ProcessStep } from '../../types';
import { supabase, isSupabaseAvailable } from '../database/supabaseClient';
import { v4 as uuidv4 } from 'uuid';

export class AnalyticsService {
    private static readonly LOCAL_STORAGE_KEY = 'note_analytics';
    private static readonly MAX_LOCAL_EVENTS = 1000;
    private sessionId: string;
    private events: AnalyticsEvent[] = [];

    constructor() {
        this.sessionId = uuidv4();
        this.initializeSession();
    }

    private initializeSession() {
        this.trackEvent('session_start', {
            userAgent: navigator.userAgent,
            timestamp: new Date(),
            screen: {
                width: window.screen.width,
                height: window.screen.height
            },
            viewport: {
                width: window.innerWidth,
                height: window.innerHeight
            }
        });
    }

    /**
     * 記事生成の分析データを記録
     */
    async trackArticleGeneration(
        formData: FormData,
        output: FinalOutput,
        stepTimings: Record<string, number>,
        errors: any[] = [],
        userId?: string
    ): Promise<void> {
        const articleId = uuidv4();
        const generationMetrics = this.createGenerationMetrics(stepTimings, errors);
        const qualityMetrics = this.createQualityMetrics(formData, output);
        const performanceMetrics = this.createPerformanceMetrics();

        const analytics: ArticleAnalytics = {
            id: uuidv4(),
            articleId,
            userId,
            generationMetrics,
            qualityMetrics,
            userInteractions: [],
            performanceMetrics,
            createdAt: new Date(),
            updatedAt: new Date()
        };

        // イベント追跡
        this.trackEvent('article_generated', {
            articleId,
            formData,
            generationTime: generationMetrics.totalDuration,
            qualityScore: this.calculateOverallQualityScore(qualityMetrics),
            wordCount: qualityMetrics.wordCount
        }, userId);

        if (isSupabaseAvailable()) {
            await this.saveToSupabase(analytics);
        } else {
            this.saveToLocalStorage(analytics);
        }
    }

    /**
     * ユーザーインタラクションを追跡
     */
    trackUserInteraction(
        type: InteractionType, 
        data?: any, 
        userId?: string
    ): void {
        const interaction: UserInteraction = {
            type,
            timestamp: new Date(),
            data
        };

        this.trackEvent(type, data, userId);

        // リアルタイムでの保存は重要でないため、バッチで処理
        this.queueInteraction(interaction, userId);
    }

    /**
     * イベントを追跡
     */
    trackEvent(eventType: string, eventData: any, userId?: string): void {
        const event: AnalyticsEvent = {
            eventType,
            eventData,
            userId,
            sessionId: this.sessionId,
            timestamp: new Date(),
            userAgent: navigator.userAgent,
            ip: undefined // クライアントサイドでは取得不可
        };

        this.events.push(event);

        // イベント数が上限を超えた場合、古いものを削除
        if (this.events.length > AnalyticsService.MAX_LOCAL_EVENTS) {
            this.events = this.events.slice(-AnalyticsService.MAX_LOCAL_EVENTS);
        }

        // ローカルストレージに保存
        this.saveEventsToLocalStorage();
    }

    /**
     * 分析ダッシュボードデータを取得
     */
    async getDashboardData(query: AnalyticsQuery = {}): Promise<AnalyticsDashboard> {
        const data = await this.getAnalyticsData(query);
        
        return {
            overview: this.calculateOverviewStats(data),
            timeSeriesData: this.generateTimeSeriesData(data, query),
            userAnalysis: this.analyzeUserData(data),
            qualityTrends: this.generateQualityTrends(data, query),
            performanceAnalysis: this.analyzePerformance(data)
        };
    }

    /**
     * パフォーマンス指標を記録
     */
    trackPerformance(metrics: Partial<PerformanceMetrics>): void {
        this.trackEvent('performance_metrics', metrics);
    }

    /**
     * エラーを追跡
     */
    trackError(error: Error, context?: any, userId?: string): void {
        this.trackEvent('error_occurred', {
            message: error.message,
            stack: error.stack,
            context,
            timestamp: new Date()
        }, userId);
    }

    // Private methods
    private createGenerationMetrics(
        stepTimings: Record<string, number>, 
        errors: any[]
    ): GenerationMetrics {
        const totalDuration = Object.values(stepTimings).reduce((sum, time) => sum + time, 0);
        
        return {
            stepDurations: {
                analyzing: stepTimings.analyzing || 0,
                outlining: stepTimings.outlining || 0,
                writing: stepTimings.writing || 0,
                factChecking: stepTimings.factChecking || 0,
                imageGeneration: stepTimings.imageGeneration || 0,
                xPostGeneration: stepTimings.xPostGeneration || 0
            },
            totalDuration,
            apiCalls: {
                gemini: this.countApiCalls('gemini'),
                newsApi: this.countApiCalls('newsApi'),
                tavily: this.countApiCalls('tavily'),
                imageGeneration: this.countApiCalls('imageGeneration')
            },
            errors: {
                count: errors.length,
                types: [...new Set(errors.map(e => e.type || 'unknown'))],
                retryCount: errors.filter(e => e.isRetry).length
            },
            successRate: errors.length === 0 ? 100 : ((Object.keys(stepTimings).length - errors.length) / Object.keys(stepTimings).length) * 100
        };
    }

    private createQualityMetrics(formData: FormData, output: FinalOutput): QualityMetrics {
        const wordCount = output.markdownContent.length;
        const wordCountAccuracy = Math.min(100, (wordCount / formData.targetLength) * 100);

        return {
            wordCount,
            targetWordCount: formData.targetLength,
            wordCountAccuracy,
            readabilityScore: this.calculateReadabilityScore(output.markdownContent),
            contentQuality: {
                structureScore: this.calculateStructureScore(output.markdownContent),
                coherenceScore: this.calculateCoherenceScore(output.markdownContent),
                originalityScore: this.calculateOriginalityScore(output.markdownContent)
            },
            seoMetrics: {
                titleLength: this.extractTitle(output.markdownContent).length,
                metaDescriptionLength: output.metaDescription.length,
                headingStructure: this.calculateHeadingStructure(output.markdownContent),
                keywordDensity: this.calculateKeywordDensity(formData.keyword, output.markdownContent)
            },
            factCheckResults: output.factCheckSummary ? {
                claimsCount: output.factCheckSummary.totalClaims || 0,
                verifiedClaims: output.factCheckSummary.verifiedClaims || 0,
                flaggedClaims: output.factCheckSummary.incorrectClaims || 0,
                confidenceScore: output.factCheckSummary.overallConfidence === 'high' ? 0.9 
                    : output.factCheckSummary.overallConfidence === 'medium' ? 0.6 
                    : 0.3
            } : {
                claimsCount: 0,
                verifiedClaims: 0,
                flaggedClaims: 0,
                confidenceScore: 0
            }
        };
    }

    private createPerformanceMetrics(): PerformanceMetrics {
        return {
            memoryUsage: this.getMemoryUsage(),
            networkRequests: {
                count: this.getNetworkRequestCount(),
                totalSize: this.getNetworkDataSize(),
                averageLatency: this.getAverageLatency()
            },
            userExperience: {
                loadTime: performance.now(),
                interactionDelay: this.calculateInteractionDelay(),
                errorRate: this.calculateErrorRate()
            }
        };
    }

    private calculateOverallQualityScore(metrics: QualityMetrics): number {
        const structureWeight = 0.3;
        const coherenceWeight = 0.3;
        const originalityWeight = 0.2;
        const wordCountWeight = 0.2;

        return (
            metrics.contentQuality.structureScore * structureWeight +
            metrics.contentQuality.coherenceScore * coherenceWeight +
            metrics.contentQuality.originalityScore * originalityWeight +
            metrics.wordCountAccuracy * wordCountWeight
        );
    }

    // Calculation methods (simplified implementations)
    private calculateReadabilityScore(content: string): number {
        // 簡易的な可読性スコア計算
        const sentences = content.split(/[。！？]/).length;
        const words = content.length;
        const avgWordsPerSentence = words / sentences;
        
        // 日本語の場合、1文あたり30-50文字が理想的
        if (avgWordsPerSentence >= 30 && avgWordsPerSentence <= 50) return 10;
        if (avgWordsPerSentence >= 20 && avgWordsPerSentence <= 60) return 8;
        if (avgWordsPerSentence >= 15 && avgWordsPerSentence <= 70) return 6;
        return 4;
    }

    private calculateStructureScore(content: string): number {
        const h1Count = (content.match(/^# /gm) || []).length;
        const h2Count = (content.match(/^## /gm) || []).length;
        const h3Count = (content.match(/^### /gm) || []).length;
        
        // 構造の良さを評価（H1: 1個、H2: 3-5個、H3: 適度）
        let score = 10;
        if (h1Count !== 1) score -= 3;
        if (h2Count < 3 || h2Count > 7) score -= 2;
        if (h3Count > h2Count * 2) score -= 1;
        
        return Math.max(0, score);
    }

    private calculateCoherenceScore(content: string): number {
        // 簡易的な一貫性チェック（接続詞の使用状況など）
        const coherenceWords = ['しかし', 'また', 'さらに', 'そして', 'ところで', 'つまり', '例えば'];
        const coherenceCount = coherenceWords.reduce((count, word) => 
            count + (content.match(new RegExp(word, 'g')) || []).length, 0
        );
        
        const sentences = content.split(/[。！？]/).length;
        const coherenceRatio = coherenceCount / sentences;
        
        // 適度な接続詞使用率（5-15%）が理想的
        if (coherenceRatio >= 0.05 && coherenceRatio <= 0.15) return 10;
        if (coherenceRatio >= 0.03 && coherenceRatio <= 0.20) return 8;
        return 6;
    }

    private calculateOriginalityScore(content: string): number {
        // 簡易的な独創性チェック（定型文の使用頻度など）
        const cliches = ['と思います', 'ではないでしょうか', 'かもしれません', '〜することができます'];
        const clicheCount = cliches.reduce((count, phrase) => 
            count + (content.match(new RegExp(phrase, 'g')) || []).length, 0
        );
        
        const sentences = content.split(/[。！？]/).length;
        const clicheRatio = clicheCount / sentences;
        
        // 定型文の使用率が低いほど独創性が高い
        if (clicheRatio <= 0.1) return 10;
        if (clicheRatio <= 0.2) return 8;
        if (clicheRatio <= 0.3) return 6;
        return 4;
    }

    private calculateHeadingStructure(content: string): number {
        const h1Count = (content.match(/^# /gm) || []).length;
        const h2Count = (content.match(/^## /gm) || []).length;
        const h3Count = (content.match(/^### /gm) || []).length;
        
        // 理想的な構造: H1=1, H2=3-5, H3は各H2につき0-2個
        let score = 0;
        if (h1Count === 1) score += 3;
        if (h2Count >= 3 && h2Count <= 5) score += 4;
        if (h3Count <= h2Count * 2) score += 3;
        
        return score;
    }

    private calculateKeywordDensity(keyword: string, content: string): number {
        if (!keyword || keyword.startsWith('http')) return 0;
        
        const keywordCount = (content.match(new RegExp(keyword, 'gi')) || []).length;
        const totalWords = content.length;
        
        return (keywordCount / totalWords) * 100;
    }

    private extractTitle(content: string): string {
        const titleMatch = content.match(/^# (.+)$/m);
        return titleMatch ? titleMatch[1] : '';
    }

    // Utility methods
    private countApiCalls(service: string): number {
        // イベントログから特定サービスのAPI呼び出し数を計算
        return this.events.filter(e => 
            e.eventType === 'api_call' && e.eventData?.service === service
        ).length;
    }

    private getMemoryUsage(): number {
        if ('memory' in performance) {
            const memInfo = (performance as any).memory;
            return memInfo.usedJSHeapSize / 1024 / 1024; // MB
        }
        return 0;
    }

    private getNetworkRequestCount(): number {
        return this.events.filter(e => e.eventType === 'api_call').length;
    }

    private getNetworkDataSize(): number {
        return this.events
            .filter(e => e.eventType === 'api_call')
            .reduce((sum, e) => sum + (e.eventData?.responseSize || 0), 0);
    }

    private getAverageLatency(): number {
        const apiCalls = this.events.filter(e => e.eventType === 'api_call');
        if (apiCalls.length === 0) return 0;
        
        const totalLatency = apiCalls.reduce((sum, e) => sum + (e.eventData?.latency || 0), 0);
        return totalLatency / apiCalls.length;
    }

    private calculateInteractionDelay(): number {
        // ユーザーインタラクションの遅延を計算
        const interactions = this.events.filter(e => e.eventType.includes('interaction'));
        if (interactions.length < 2) return 0;
        
        const delays = interactions.slice(1).map((current, index) => {
            const previous = interactions[index];
            return new Date(current.timestamp).getTime() - new Date(previous.timestamp).getTime();
        });
        
        return delays.reduce((sum, delay) => sum + delay, 0) / delays.length;
    }

    private calculateErrorRate(): number {
        const totalEvents = this.events.length;
        const errorEvents = this.events.filter(e => e.eventType === 'error_occurred').length;
        
        return totalEvents > 0 ? (errorEvents / totalEvents) * 100 : 0;
    }

    // Data persistence methods
    private async saveToSupabase(analytics: ArticleAnalytics): Promise<void> {
        try {
            const { error } = await supabase!
                .from('article_analytics')
                .insert([analytics]);

            if (error) {
                console.error('Failed to save analytics to Supabase:', error);
                this.saveToLocalStorage(analytics);
            }
        } catch (error) {
            console.error('Supabase analytics save error:', error);
            this.saveToLocalStorage(analytics);
        }
    }

    private saveToLocalStorage(analytics: ArticleAnalytics): void {
        try {
            const existing = this.getLocalStorageAnalytics();
            existing.unshift(analytics);
            
            // 最大50件まで保存
            const limited = existing.slice(0, 50);
            localStorage.setItem(AnalyticsService.LOCAL_STORAGE_KEY, JSON.stringify(limited));
        } catch (error) {
            console.error('Failed to save analytics to localStorage:', error);
        }
    }

    private getLocalStorageAnalytics(): ArticleAnalytics[] {
        try {
            const data = localStorage.getItem(AnalyticsService.LOCAL_STORAGE_KEY);
            return data ? JSON.parse(data) : [];
        } catch {
            return [];
        }
    }

    private saveEventsToLocalStorage(): void {
        try {
            localStorage.setItem(`${AnalyticsService.LOCAL_STORAGE_KEY}_events`, JSON.stringify(this.events));
        } catch (error) {
            console.error('Failed to save events to localStorage:', error);
        }
    }

    private queueInteraction(interaction: UserInteraction, userId?: string): void {
        // バッチ処理用のキューに追加（実装簡略化）
        setTimeout(() => {
            this.saveInteractionBatch([interaction], userId);
        }, 1000);
    }

    private async saveInteractionBatch(interactions: UserInteraction[], userId?: string): Promise<void> {
        // インタラクションのバッチ保存（実装簡略化）
        interactions.forEach(interaction => {
            this.trackEvent(`interaction_${interaction.type}`, interaction.data, userId);
        });
    }

    // Analytics data retrieval and processing methods
    private async getAnalyticsData(query: AnalyticsQuery): Promise<ArticleAnalytics[]> {
        if (isSupabaseAvailable()) {
            return this.getAnalyticsFromSupabase(query);
        } else {
            return this.getAnalyticsFromLocalStorage(query);
        }
    }

    private async getAnalyticsFromSupabase(query: AnalyticsQuery): Promise<ArticleAnalytics[]> {
        // Supabaseからの分析データ取得（実装簡略化）
        return [];
    }

    private getAnalyticsFromLocalStorage(query: AnalyticsQuery): ArticleAnalytics[] {
        const data = this.getLocalStorageAnalytics();
        
        // クエリフィルタリング（簡易実装）
        let filtered = data;
        
        if (query.startDate) {
            filtered = filtered.filter(item => new Date(item.createdAt) >= query.startDate!);
        }
        
        if (query.endDate) {
            filtered = filtered.filter(item => new Date(item.createdAt) <= query.endDate!);
        }
        
        if (query.userId) {
            filtered = filtered.filter(item => item.userId === query.userId);
        }
        
        return filtered;
    }

    private calculateOverviewStats(data: ArticleAnalytics[]): OverviewStats {
        const totalArticles = data.length;
        const totalUsers = new Set(data.map(d => d.userId).filter(Boolean)).size;
        const averageGenerationTime = data.reduce((sum, d) => sum + d.generationMetrics.totalDuration, 0) / totalArticles;
        const averageQualityScore = data.reduce((sum, d) => sum + this.calculateOverallQualityScore(d.qualityMetrics), 0) / totalArticles;
        const successRate = data.reduce((sum, d) => sum + d.generationMetrics.successRate, 0) / totalArticles;

        return {
            totalArticles,
            totalUsers,
            averageGenerationTime,
            averageQualityScore,
            successRate,
            periodComparison: {
                articlesGrowth: 0, // 簡略化
                qualityImprovement: 0,
                performanceImprovement: 0
            }
        };
    }

    private generateTimeSeriesData(data: ArticleAnalytics[], query: AnalyticsQuery): TimeSeriesData[] {
        // 時系列データ生成（簡易実装）
        const grouped = data.reduce((acc, item) => {
            const date = new Date(item.createdAt).toISOString().split('T')[0];
            if (!acc[date]) {
                acc[date] = {
                    articles: [],
                    users: new Set()
                };
            }
            acc[date].articles.push(item);
            if (item.userId) acc[date].users.add(item.userId);
            return acc;
        }, {} as Record<string, { articles: ArticleAnalytics[], users: Set<string> }>);

        return Object.entries(grouped).map(([date, group]) => ({
            date,
            articleCount: group.articles.length,
            averageQuality: group.articles.reduce((sum, a) => sum + this.calculateOverallQualityScore(a.qualityMetrics), 0) / group.articles.length,
            averageGenerationTime: group.articles.reduce((sum, a) => sum + a.generationMetrics.totalDuration, 0) / group.articles.length,
            errorRate: group.articles.reduce((sum, a) => sum + (100 - a.generationMetrics.successRate), 0) / group.articles.length,
            userCount: group.users.size
        }));
    }

    private analyzeUserData(data: ArticleAnalytics[]): UserAnalysisData {
        // ユーザー分析（簡易実装）
        return {
            mostUsedTones: [],
            mostUsedAudiences: [],
            averageArticleLength: data.reduce((sum, d) => sum + d.qualityMetrics.wordCount, 0) / data.length,
            usagePatterns: {
                dailyActiveUsers: 0,
                weeklyActiveUsers: 0,
                monthlyActiveUsers: 0,
                averageSessionDuration: 0,
                averageArticlesPerUser: 0
            },
            userSegments: []
        };
    }

    private generateQualityTrends(data: ArticleAnalytics[], query: AnalyticsQuery): QualityTrendData[] {
        // 品質トレンド生成（簡易実装）
        return [];
    }

    private analyzePerformance(data: ArticleAnalytics[]): PerformanceAnalysisData {
        // パフォーマンス分析（簡易実装）
        return {
            systemMetrics: {
                averageResponseTime: 0,
                throughput: 0,
                errorRate: 0,
                uptime: 99.9
            },
            optimizationSuggestions: [],
            bottlenecks: []
        };
    }
}