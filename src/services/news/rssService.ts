import { NewsArticle, RSSFeed, RSSFeedItem, NewsSource, NewsCategory } from '../../types/news.types';

export class RSSService {
    private corsProxy = 'https://api.allorigins.win/get?url=';
    
    // 主要な日本語RSSフィード
    private defaultFeeds: NewsSource[] = [
        {
            id: 'yahoo-news-it',
            name: 'Yahoo!ニュース IT・科学',
            url: 'https://news.yahoo.co.jp/rss/categories/it.xml',
            type: 'rss',
            category: NewsCategory.TECHNOLOGY,
            language: 'ja',
            enabled: true
        },
        {
            id: 'yahoo-news-business',
            name: 'Yahoo!ニュース 経済',
            url: 'https://news.yahoo.co.jp/rss/categories/business.xml',
            type: 'rss',
            category: NewsCategory.BUSINESS,
            language: 'ja',
            enabled: true
        },
        {
            id: 'itmedia-news',
            name: 'ITmedia NEWS',
            url: 'https://rss.itmedia.co.jp/rss/2.0/news_bursts.xml',
            type: 'rss',
            category: NewsCategory.TECHNOLOGY,
            language: 'ja',
            enabled: true
        },
        {
            id: 'techcrunch-jp',
            name: 'TechCrunch Japan',
            url: 'https://jp.techcrunch.com/feed/',
            type: 'rss',
            category: NewsCategory.TECHNOLOGY,
            language: 'ja',
            enabled: true
        },
        {
            id: 'nikkei-tech',
            name: '日経 xTECH',
            url: 'https://xtech.nikkei.com/rss/index.rdf',
            type: 'rss',
            category: NewsCategory.TECHNOLOGY,
            language: 'ja',
            enabled: true
        }
    ];

    async fetchRSSFeed(feedUrl: string): Promise<RSSFeed> {
        try {
            const proxyUrl = `${this.corsProxy}${encodeURIComponent(feedUrl)}`;
            const response = await fetch(proxyUrl);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            const xmlContent = data.contents;
            
            return this.parseRSSXML(xmlContent);
        } catch (error) {
            console.error(`Failed to fetch RSS feed from ${feedUrl}:`, error);
            throw new Error(`RSS feed fetch failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    private parseRSSXML(xmlContent: string): RSSFeed {
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(xmlContent, 'text/xml');
        
        // パースエラーチェック
        const parseError = xmlDoc.querySelector('parsererror');
        if (parseError) {
            throw new Error('Invalid XML format');
        }

        const channel = xmlDoc.querySelector('channel');
        if (!channel) {
            throw new Error('Invalid RSS format: no channel element');
        }

        const title = this.getTextContent(channel, 'title') || 'Unknown Feed';
        const description = this.getTextContent(channel, 'description') || '';
        const link = this.getTextContent(channel, 'link') || '';
        const lastBuildDate = this.getTextContent(channel, 'lastBuildDate') || new Date().toISOString();

        const items: RSSFeedItem[] = [];
        const itemElements = channel.querySelectorAll('item');
        
        itemElements.forEach(item => {
            const rssItem = this.parseRSSItem(item);
            if (rssItem) {
                items.push(rssItem);
            }
        });

        return {
            title,
            description,
            link,
            lastBuildDate,
            items: items.slice(0, 20) // 最新20件に制限
        };
    }

    private parseRSSItem(item: Element): RSSFeedItem | null {
        try {
            const title = this.getTextContent(item, 'title');
            const description = this.getTextContent(item, 'description') || '';
            const link = this.getTextContent(item, 'link');
            const pubDate = this.getTextContent(item, 'pubDate') || new Date().toISOString();
            
            if (!title || !link) {
                return null;
            }

            // カテゴリー取得
            const categoryElements = item.querySelectorAll('category');
            const category: string[] = [];
            categoryElements.forEach(cat => {
                const catText = cat.textContent?.trim();
                if (catText) category.push(catText);
            });

            // エンクロージャー（画像など）取得
            const enclosureElement = item.querySelector('enclosure');
            let enclosure;
            if (enclosureElement) {
                enclosure = {
                    url: enclosureElement.getAttribute('url') || '',
                    type: enclosureElement.getAttribute('type') || '',
                    length: enclosureElement.getAttribute('length') || undefined
                };
            }

            return {
                title: this.cleanText(title),
                description: this.cleanText(description),
                link,
                pubDate,
                category: category.length > 0 ? category : undefined,
                author: this.getTextContent(item, 'author'),
                content: this.getTextContent(item, 'content:encoded') || undefined,
                enclosure
            };
        } catch (error) {
            console.warn('Failed to parse RSS item:', error);
            return null;
        }
    }

    private getTextContent(element: Element, tagName: string): string | null {
        const child = element.querySelector(tagName);
        return child?.textContent?.trim() || null;
    }

    private cleanText(text: string): string {
        // HTMLタグを除去し、エンティティをデコード
        const doc = new DOMParser().parseFromString(text, 'text/html');
        return doc.body.textContent || text;
    }

    async fetchMultipleFeeds(sources?: NewsSource[]): Promise<Map<string, RSSFeed>> {
        const feedSources = sources || this.defaultFeeds.filter(feed => feed.enabled);
        const results = new Map<string, RSSFeed>();
        
        const fetchPromises = feedSources.map(async (source) => {
            try {
                const feed = await this.fetchRSSFeed(source.url);
                results.set(source.id, feed);
            } catch (error) {
                console.error(`Failed to fetch feed ${source.name}:`, error);
                // エラーでも他のフィードの取得は続行
            }
        });

        await Promise.allSettled(fetchPromises);
        return results;
    }

    convertRSSToNewsArticles(feeds: Map<string, RSSFeed>): NewsArticle[] {
        const articles: NewsArticle[] = [];
        
        feeds.forEach((feed, sourceId) => {
            const sourceName = this.defaultFeeds.find(f => f.id === sourceId)?.name || 'Unknown Source';
            
            feed.items.forEach(item => {
                articles.push({
                    title: item.title,
                    description: item.description,
                    url: item.link,
                    urlToImage: item.enclosure?.url,
                    publishedAt: new Date(item.pubDate).toISOString(),
                    source: {
                        id: sourceId,
                        name: sourceName
                    },
                    author: item.author,
                    content: item.content
                });
            });
        });

        // 日付順でソート（新しい順）
        return articles.sort((a, b) => 
            new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
        );
    }

    getDefaultSources(): NewsSource[] {
        return [...this.defaultFeeds];
    }

    async getLatestNews(maxArticles: number = 50): Promise<NewsArticle[]> {
        try {
            const feeds = await this.fetchMultipleFeeds();
            const articles = this.convertRSSToNewsArticles(feeds);
            return articles.slice(0, maxArticles);
        } catch (error) {
            console.error('Failed to get latest news:', error);
            return [];
        }
    }
}