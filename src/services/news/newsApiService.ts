import { NewsArticle, NewsCategory } from '../../types/news.types';

interface NewsApiResponse {
    status: string;
    totalResults: number;
    articles: NewsApiArticle[];
}

interface NewsApiArticle {
    source: {
        id: string | null;
        name: string;
    };
    author: string | null;
    title: string;
    description: string | null;
    url: string;
    urlToImage: string | null;
    publishedAt: string;
    content: string | null;
}

export class NewsApiService {
    private apiKey: string;
    private baseUrl = 'https://newsapi.org/v2';

    constructor() {
        this.apiKey = import.meta.env.VITE_NEWS_API_KEY || process.env.NEWS_API_KEY || '';
        if (!this.apiKey) {
            console.warn('News API key not found. News API functionality will be limited.');
        }
    }

    private async fetchFromNewsApi(endpoint: string, params: URLSearchParams): Promise<NewsApiResponse> {
        if (!this.apiKey) {
            throw new Error('News API key is not configured');
        }

        params.append('apiKey', this.apiKey);
        
        const url = `${this.baseUrl}/${endpoint}?${params.toString()}`;
        
        try {
            const response = await fetch(url);
            
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(`News API error: ${response.status} - ${errorData.message || response.statusText}`);
            }
            
            const data: NewsApiResponse = await response.json();
            
            if (data.status !== 'ok') {
                throw new Error(`News API returned status: ${data.status}`);
            }
            
            return data;
        } catch (error) {
            console.error('Failed to fetch from News API:', error);
            throw error;
        }
    }

    async getTopHeadlines(
        country: string = 'jp',
        category?: NewsCategory,
        pageSize: number = 50
    ): Promise<NewsArticle[]> {
        const params = new URLSearchParams({
            country,
            pageSize: pageSize.toString()
        });

        if (category) {
            // NewsAPIのカテゴリーマッピング
            const categoryMap: Record<NewsCategory, string> = {
                [NewsCategory.TECHNOLOGY]: 'technology',
                [NewsCategory.BUSINESS]: 'business',
                [NewsCategory.HEALTH]: 'health',
                [NewsCategory.SCIENCE]: 'science',
                [NewsCategory.SPORTS]: 'sports',
                [NewsCategory.ENTERTAINMENT]: 'entertainment',
                [NewsCategory.GENERAL]: 'general'
            };
            
            if (categoryMap[category]) {
                params.append('category', categoryMap[category]);
            }
        }

        try {
            const response = await this.fetchFromNewsApi('top-headlines', params);
            return this.convertToNewsArticles(response.articles);
        } catch (error) {
            console.error('Failed to get top headlines:', error);
            return [];
        }
    }

    async searchNews(
        query: string,
        language: string = 'ja',
        sortBy: 'relevancy' | 'popularity' | 'publishedAt' = 'publishedAt',
        pageSize: number = 50
    ): Promise<NewsArticle[]> {
        const params = new URLSearchParams({
            q: query,
            language,
            sortBy,
            pageSize: pageSize.toString()
        });

        try {
            const response = await this.fetchFromNewsApi('everything', params);
            return this.convertToNewsArticles(response.articles);
        } catch (error) {
            console.error('Failed to search news:', error);
            return [];
        }
    }

    async getLatestJapaneseNews(
        categories: NewsCategory[] = [NewsCategory.TECHNOLOGY, NewsCategory.BUSINESS],
        maxArticles: number = 100
    ): Promise<NewsArticle[]> {
        const articles: NewsArticle[] = [];
        
        try {
            // まず一般的なトップヘッドラインを取得
            const generalNews = await this.getTopHeadlines('jp', undefined, 50);
            articles.push(...generalNews);

            // 各カテゴリーから記事を取得
            for (const category of categories) {
                try {
                    const categoryNews = await this.getTopHeadlines('jp', category, 30);
                    articles.push(...categoryNews);
                } catch (error) {
                    console.warn(`Failed to get news for category ${category}:`, error);
                }
            }

            // 重複記事を除去（URLで判定）
            const uniqueArticles = articles.filter((article, index, self) => 
                index === self.findIndex(a => a.url === article.url)
            );

            // 日付順でソート（新しい順）
            uniqueArticles.sort((a, b) => 
                new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
            );

            return uniqueArticles.slice(0, maxArticles);
        } catch (error) {
            console.error('Failed to get latest Japanese news:', error);
            return [];
        }
    }

    private convertToNewsArticles(apiArticles: NewsApiArticle[]): NewsArticle[] {
        return apiArticles
            .filter(article => article.title && article.url) // 必須フィールドをチェック
            .map(article => ({
                title: article.title,
                description: article.description || '',
                url: article.url,
                urlToImage: article.urlToImage || undefined,
                publishedAt: article.publishedAt,
                source: {
                    id: article.source.id || undefined,
                    name: article.source.name
                },
                author: article.author || undefined,
                content: article.content || undefined
            }));
    }

    isApiKeyConfigured(): boolean {
        return !!this.apiKey;
    }

    async testConnection(): Promise<boolean> {
        if (!this.apiKey) {
            return false;
        }

        try {
            const params = new URLSearchParams({
                country: 'jp',
                pageSize: '1'
            });
            
            await this.fetchFromNewsApi('top-headlines', params);
            return true;
        } catch (error) {
            console.error('News API connection test failed:', error);
            return false;
        }
    }
}