export interface ArticleAnalytics {
    id: string;
    articleId: string;
    userId?: string;
    
    // 生成関連の統計
    generationMetrics: GenerationMetrics;
    
    // 品質指標
    qualityMetrics: QualityMetrics;
    
    // ユーザー行動
    userInteractions: UserInteraction[];
    
    // パフォーマンス指標
    performanceMetrics: PerformanceMetrics;
    
    // メタデータ
    createdAt: Date;
    updatedAt: Date;
}

export interface GenerationMetrics {
    // 生成時間（各ステップ別）
    stepDurations: {
        analyzing: number;
        outlining: number;
        writing: number;
        factChecking: number;
        imageGeneration: number;
        xPostGeneration: number;
    };
    
    // 総生成時間
    totalDuration: number;
    
    // API呼び出し回数
    apiCalls: {
        gemini: number;
        newsApi: number;
        tavily: number;
        imageGeneration: number;
    };
    
    // エラー情報
    errors: {
        count: number;
        types: string[];
        retryCount: number;
    };
    
    // 成功率
    successRate: number;
}

export interface QualityMetrics {
    // 文字数関連
    wordCount: number;
    targetWordCount: number;
    wordCountAccuracy: number; // 目標文字数に対する達成率
    
    // 可読性指標
    readabilityScore?: number; // 1-10
    
    // コンテンツ品質
    contentQuality: {
        structureScore: number; // 構成の良さ
        coherenceScore: number; // 一貫性
        originalityScore: number; // 独創性
    };
    
    // SEO指標
    seoMetrics: {
        titleLength: number;
        metaDescriptionLength: number;
        headingStructure: number; // H1, H2, H3の構造点数
        keywordDensity: number;
    };
    
    // ファクトチェック結果
    factCheckResults: {
        claimsCount: number;
        verifiedClaims: number;
        flaggedClaims: number;
        confidenceScore: number;
    };
}

export interface UserInteraction {
    type: InteractionType;
    timestamp: Date;
    data?: any;
}

export enum InteractionType {
    ARTICLE_GENERATED = 'article_generated',
    ARTICLE_VIEWED = 'article_viewed',
    ARTICLE_COPIED = 'article_copied',
    ARTICLE_DOWNLOADED = 'article_downloaded',
    ARTICLE_SHARED = 'article_shared',
    APPROVAL_GIVEN = 'approval_given',
    APPROVAL_REJECTED = 'approval_rejected',
    SETTINGS_CHANGED = 'settings_changed',
    FEEDBACK_PROVIDED = 'feedback_provided'
}

export interface PerformanceMetrics {
    // システムパフォーマンス
    memoryUsage: number; // MB
    cpuUsage?: number; // %
    
    // ネットワーク
    networkRequests: {
        count: number;
        totalSize: number; // bytes
        averageLatency: number; // ms
    };
    
    // ユーザーエクスペリエンス
    userExperience: {
        loadTime: number; // ms
        interactionDelay: number; // ms
        errorRate: number; // %
    };
}

export interface AnalyticsDashboard {
    // 概要統計
    overview: OverviewStats;
    
    // 時系列データ
    timeSeriesData: TimeSeriesData[];
    
    // ユーザー分析
    userAnalysis: UserAnalysisData;
    
    // 品質トレンド
    qualityTrends: QualityTrendData[];
    
    // パフォーマンス分析
    performanceAnalysis: PerformanceAnalysisData;
}

export interface OverviewStats {
    totalArticles: number;
    totalUsers: number;
    averageGenerationTime: number;
    averageQualityScore: number;
    successRate: number;
    
    // 期間比較
    periodComparison: {
        articlesGrowth: number; // %
        qualityImprovement: number; // %
        performanceImprovement: number; // %
    };
}

export interface TimeSeriesData {
    date: string;
    articleCount: number;
    averageQuality: number;
    averageGenerationTime: number;
    errorRate: number;
    userCount: number;
}

export interface UserAnalysisData {
    // ユーザー行動パターン
    mostUsedTones: Array<{ tone: string; count: number; percentage: number }>;
    mostUsedAudiences: Array<{ audience: string; count: number; percentage: number }>;
    averageArticleLength: number;
    
    // 使用頻度
    usagePatterns: {
        dailyActiveUsers: number;
        weeklyActiveUsers: number;
        monthlyActiveUsers: number;
        averageSessionDuration: number;
        averageArticlesPerUser: number;
    };
    
    // ユーザーセグメント
    userSegments: Array<{
        segment: string;
        userCount: number;
        characteristics: string[];
    }>;
}

export interface QualityTrendData {
    date: string;
    averageWordCount: number;
    averageReadability: number;
    averageSeoScore: number;
    factCheckAccuracy: number;
}

export interface PerformanceAnalysisData {
    // システム指標
    systemMetrics: {
        averageResponseTime: number;
        throughput: number; // requests per minute
        errorRate: number;
        uptime: number; // %
    };
    
    // 最適化提案
    optimizationSuggestions: Array<{
        category: string;
        suggestion: string;
        impact: 'high' | 'medium' | 'low';
        effort: 'high' | 'medium' | 'low';
    }>;
    
    // ボトルネック分析
    bottlenecks: Array<{
        component: string;
        metric: string;
        currentValue: number;
        threshold: number;
        severity: 'critical' | 'warning' | 'info';
    }>;
}

export interface AnalyticsQuery {
    startDate?: Date;
    endDate?: Date;
    userId?: string;
    groupBy?: 'day' | 'week' | 'month';
    metrics?: string[];
    filters?: Record<string, any>;
}

export interface AnalyticsExport {
    format: 'csv' | 'json' | 'pdf';
    data: any;
    filename: string;
    generatedAt: Date;
}

// 分析イベント
export interface AnalyticsEvent {
    eventType: string;
    eventData: any;
    userId?: string;
    sessionId: string;
    timestamp: Date;
    userAgent?: string;
    ip?: string;
}