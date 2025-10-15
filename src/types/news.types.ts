export interface NewsArticle {
    title: string;
    description: string;
    url: string;
    urlToImage?: string;
    publishedAt: string;
    source: {
        id: string | null;
        name: string;
    };
    author?: string;
    content?: string;
}

export interface NewsApiResponse {
    status: string;
    totalResults: number;
    articles: NewsArticle[];
}

export interface RSSFeedItem {
    title: string;
    description: string;
    link: string;
    pubDate: string;
    category?: string[];
    author?: string;
    content?: string;
    enclosure?: {
        url: string;
        type: string;
        length?: string;
    };
}

export interface RSSFeed {
    title: string;
    description: string;
    link: string;
    lastBuildDate: string;
    items: RSSFeedItem[];
}

export interface NewsSource {
    id: string;
    name: string;
    url: string;
    type: 'rss' | 'newsapi';
    category: NewsCategory;
    language: 'ja' | 'en';
    enabled: boolean;
}

export enum NewsCategory {
    TECHNOLOGY = 'technology',
    BUSINESS = 'business',
    LIFESTYLE = 'lifestyle',
    HEALTH = 'health',
    ENTERTAINMENT = 'entertainment',
    SCIENCE = 'science',
    SPORTS = 'sports',
    GENERAL = 'general'
}

export interface TrendingTopic {
    keyword: string;
    relevanceScore: number;
    articles: NewsArticle[];
    suggestedTitle: string;
    suggestedAngle: string;
    category: NewsCategory;
    confidence: number;
}

export interface NewsInsight {
    trending: TrendingTopic[];
    categories: {
        [key in NewsCategory]?: {
            count: number;
            topics: string[];
        };
    };
    timeframe: {
        start: Date;
        end: Date;
    };
    totalArticles: number;
}

export interface ArticleGenerationSuggestion {
    keyword: string;
    title: string;
    angle: string;
    targetAudience: string;
    estimatedPopularity: number;
    relatedNews: NewsArticle[];
    urgency: 'high' | 'medium' | 'low';
    reasoningJa: string; // 日本語での推薦理由
}