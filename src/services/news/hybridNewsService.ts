import { NewsArticle, NewsCategory } from '../../types/news.types';
import { RSSService } from './rssService';
import { NewsApiService } from './newsApiService';

export class HybridNewsService {
    private rssService: RSSService;
    private newsApiService: NewsApiService;

    constructor() {
        this.rssService = new RSSService();
        this.newsApiService = new NewsApiService();
    }

    async getLatestNews(maxArticles: number = 100): Promise<NewsArticle[]> {
        const articles: NewsArticle[] = [];
        const errors: string[] = [];

        try {
            // NewsAPIが設定されている場合は優先的に使用
            if (this.newsApiService.isApiKeyConfigured()) {
                console.log('Using News API for latest news...');
                try {
                    const newsApiArticles = await this.newsApiService.getLatestJapaneseNews(
                        [NewsCategory.TECHNOLOGY, NewsCategory.BUSINESS, NewsCategory.GENERAL],
                        Math.ceil(maxArticles * 0.7) // NewsAPIから70%
                    );
                    articles.push(...newsApiArticles);
                    console.log(`Fetched ${newsApiArticles.length} articles from News API`);
                } catch (error) {
                    console.error('News API failed:', error);
                    errors.push(`News API: ${error instanceof Error ? error.message : 'Unknown error'}`);
                }
            }

            // RSSサービスから補完的に記事を取得
            try {
                console.log('Fetching articles from RSS feeds...');
                const rssArticles = await this.rssService.getLatestNews(
                    Math.ceil(maxArticles * 0.3) // RSSから30%
                );
                articles.push(...rssArticles);
                console.log(`Fetched ${rssArticles.length} articles from RSS feeds`);
            } catch (error) {
                console.error('RSS Service failed:', error);
                errors.push(`RSS Service: ${error instanceof Error ? error.message : 'Unknown error'}`);
            }

            // 記事が取得できなかった場合
            if (articles.length === 0) {
                const errorMessage = `All news sources failed: ${errors.join(', ')}`;
                console.error(errorMessage);
                throw new Error(errorMessage);
            }

            // 重複記事を除去（タイトルとURLで判定）
            const uniqueArticles = this.removeDuplicates(articles);

            // 日付順でソート（新しい順）
            uniqueArticles.sort((a, b) => 
                new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
            );

            const result = uniqueArticles.slice(0, maxArticles);
            console.log(`Returning ${result.length} unique articles`);
            return result;

        } catch (error) {
            console.error('HybridNewsService failed to get latest news:', error);
            
            // フォールバック：最低限のダミーデータを返す（開発時のテスト用）
            if (process.env.NODE_ENV === 'development') {
                return this.getFallbackNews();
            }
            
            throw error;
        }
    }

    async searchNews(query: string, maxArticles: number = 50): Promise<NewsArticle[]> {
        const articles: NewsArticle[] = [];

        try {
            // NewsAPIで検索（優先）
            if (this.newsApiService.isApiKeyConfigured()) {
                try {
                    const searchResults = await this.newsApiService.searchNews(
                        query, 
                        'ja', 
                        'relevancy', 
                        maxArticles
                    );
                    articles.push(...searchResults);
                } catch (error) {
                    console.error('News API search failed:', error);
                }
            }

            // 結果が少ない場合はRSSからも検索
            if (articles.length < maxArticles / 2) {
                try {
                    const allRssArticles = await this.rssService.getLatestNews(200);
                    const filteredArticles = allRssArticles.filter(article =>
                        article.title.toLowerCase().includes(query.toLowerCase()) ||
                        article.description.toLowerCase().includes(query.toLowerCase())
                    );
                    articles.push(...filteredArticles);
                } catch (error) {
                    console.error('RSS search failed:', error);
                }
            }

            return this.removeDuplicates(articles).slice(0, maxArticles);
        } catch (error) {
            console.error('Search failed:', error);
            return [];
        }
    }

    private removeDuplicates(articles: NewsArticle[]): NewsArticle[] {
        const seen = new Set<string>();
        return articles.filter(article => {
            // タイトルの正規化（特殊文字や空白を除去）
            const normalizedTitle = article.title
                .toLowerCase()
                .replace(/[^\w\s]/g, '')
                .replace(/\s+/g, ' ')
                .trim();
            
            const key = `${normalizedTitle}|${article.url}`;
            
            if (seen.has(key)) {
                return false;
            }
            
            seen.add(key);
            return true;
        });
    }

    private getFallbackNews(): NewsArticle[] {
        // 開発時のフォールバックデータ
        return [
            {
                title: 'サンプルニュース：最新のAI技術動向',
                description: 'AIとテクノロジーに関する最新動向をお届けします。',
                url: 'https://example.com/ai-trends',
                publishedAt: new Date().toISOString(),
                source: {
                    id: null,
                    name: 'サンプルニュース'
                }
            },
            {
                title: 'サンプルニュース：副業・起業トレンド',
                description: '副業や起業に関する最新トレンドを分析します。',
                url: 'https://example.com/side-business',
                publishedAt: new Date(Date.now() - 3600000).toISOString(), // 1時間前
                source: {
                    id: null,
                    name: 'サンプルニュース'
                }
            },
            {
                title: 'サンプルニュース：DX推進の現状',
                description: 'デジタルトランスフォーメーション推進の現状と課題。',
                url: 'https://example.com/dx-trends',
                publishedAt: new Date(Date.now() - 7200000).toISOString(), // 2時間前
                source: {
                    id: null,
                    name: 'サンプルニュース'
                }
            }
        ];
    }

    async testServices(): Promise<{
        newsApi: boolean;
        rss: boolean;
        overall: boolean;
    }> {
        const newsApiWorking = this.newsApiService.isApiKeyConfigured() && 
                              await this.newsApiService.testConnection();
        
        let rssWorking = false;
        try {
            const rssArticles = await this.rssService.getLatestNews(5);
            rssWorking = rssArticles.length > 0;
        } catch {
            rssWorking = false;
        }

        return {
            newsApi: newsApiWorking,
            rss: rssWorking,
            overall: newsApiWorking || rssWorking
        };
    }

    getServiceStatus(): {
        newsApiConfigured: boolean;
        fallbackMode: boolean;
    } {
        return {
            newsApiConfigured: this.newsApiService.isApiKeyConfigured(),
            fallbackMode: !this.newsApiService.isApiKeyConfigured()
        };
    }
}