import { NewsArticle, TrendingTopic, NewsInsight, ArticleGenerationSuggestion, NewsCategory } from '../../types/news.types';
import * as geminiService from '../ai/geminiService';

export class TrendAnalyzer {
    
    async analyzeTrends(articles: NewsArticle[], timeframeHours: number = 24): Promise<NewsInsight> {
        // 指定時間内の記事をフィルタリング
        const cutoffTime = new Date(Date.now() - timeframeHours * 60 * 60 * 1000);
        const recentArticles = articles.filter(article => 
            new Date(article.publishedAt) >= cutoffTime
        );

        // キーワード抽出とトレンド分析
        const trending = await this.extractTrendingTopics(recentArticles);
        const categories = this.categorizeArticles(recentArticles);

        return {
            trending,
            categories,
            timeframe: {
                start: cutoffTime,
                end: new Date()
            },
            totalArticles: recentArticles.length
        };
    }

    private async extractTrendingTopics(articles: NewsArticle[]): Promise<TrendingTopic[]> {
        // 記事をタイトルと説明で結合
        const articleTexts = articles.map(article => ({
            text: `${article.title} ${article.description}`,
            article
        }));

        // Geminiを使って日本語のトレンドキーワードを抽出
        try {
            const prompt = `
以下のニュース記事群から、日本で注目されているトレンドキーワードを抽出してください。

記事データ:
${articleTexts.slice(0, 20).map((item, index) => 
    `${index + 1}. ${item.text.substring(0, 200)}`
).join('\n')}

以下の条件で分析してください：
1. 頻出する重要なキーワードを特定
2. 技術、ビジネス、ライフスタイル、健康などカテゴリ別に整理
3. 各キーワードの注目度（1-10）を評価
4. ブログ記事として価値のあるキーワードを優先

JSONフォーマットで回答：
{
  "trends": [
    {
      "keyword": "具体的なキーワード",
      "category": "technology|business|lifestyle|health|entertainment|science|sports|general",
      "relevanceScore": 8.5,
      "suggestedTitle": "記事タイトル案",
      "suggestedAngle": "記事の切り口・角度",
      "confidence": 0.9
    }
  ]
}
`;

            const response = await geminiService.generateText(prompt);
            const parsedResponse = this.parseGeminiTrendResponse(response);
            
            // 実際の記事と紐付け
            return this.mapTrendsToArticles(parsedResponse.trends, articles);
        } catch (error) {
            console.error('Failed to extract trending topics:', error);
            // フォールバック: 単純な頻度分析
            return this.fallbackTrendExtraction(articles);
        }
    }

    private parseGeminiTrendResponse(response: string): { trends: any[] } {
        try {
            // JSONブロックを抽出
            const jsonMatch = response.match(/```json\s*([\s\S]*?)\s*```/) || 
                             response.match(/\{[\s\S]*\}/);
            
            if (jsonMatch) {
                return JSON.parse(jsonMatch[1] || jsonMatch[0]);
            }
            
            // 直接JSONとして解析を試行
            return JSON.parse(response);
        } catch (error) {
            console.warn('Failed to parse Gemini trend response:', error);
            return { trends: [] };
        }
    }

    private mapTrendsToArticles(trends: any[], articles: NewsArticle[]): TrendingTopic[] {
        return trends.map(trend => {
            // キーワードに関連する記事を検索
            const relatedArticles = articles.filter(article => {
                const searchText = `${article.title} ${article.description}`.toLowerCase();
                const keyword = trend.keyword.toLowerCase();
                return searchText.includes(keyword) || 
                       this.calculateSimilarity(searchText, keyword) > 0.3;
            });

            return {
                keyword: trend.keyword,
                relevanceScore: trend.relevanceScore || 5,
                articles: relatedArticles.slice(0, 5), // 最大5記事
                suggestedTitle: trend.suggestedTitle || `${trend.keyword}について知っておくべきこと`,
                suggestedAngle: trend.suggestedAngle || `${trend.keyword}の最新動向`,
                category: this.mapStringToCategory(trend.category),
                confidence: trend.confidence || 0.5
            };
        }).filter(topic => topic.articles.length > 0); // 関連記事がある項目のみ
    }

    private fallbackTrendExtraction(articles: NewsArticle[]): TrendingTopic[] {
        // 単純な頻度分析によるフォールバック
        const wordCounts = new Map<string, { count: number; articles: NewsArticle[] }>();
        
        // 日本語キーワード抽出（簡易版）
        articles.forEach(article => {
            const text = `${article.title} ${article.description}`;
            const words = this.extractJapaneseKeywords(text);
            
            words.forEach(word => {
                if (word.length >= 2) { // 2文字以上
                    const existing = wordCounts.get(word) || { count: 0, articles: [] };
                    existing.count += 1;
                    if (!existing.articles.find(a => a.url === article.url)) {
                        existing.articles.push(article);
                    }
                    wordCounts.set(word, existing);
                }
            });
        });

        // 頻度順でソートし、上位を返す
        return Array.from(wordCounts.entries())
            .filter(([_, data]) => data.count >= 2) // 2回以上出現
            .sort((a, b) => b[1].count - a[1].count)
            .slice(0, 10)
            .map(([keyword, data]) => ({
                keyword,
                relevanceScore: Math.min(data.count * 2, 10),
                articles: data.articles.slice(0, 3),
                suggestedTitle: `${keyword}の最新動向まとめ`,
                suggestedAngle: `${keyword}について初心者にもわかりやすく解説`,
                category: NewsCategory.GENERAL,
                confidence: Math.min(data.count / 10, 1)
            }));
    }

    private extractJapaneseKeywords(text: string): string[] {
        // 簡易的な日本語キーワード抽出
        // カタカナ・ひらがな・漢字の連続を抽出
        const keywords: string[] = [];
        
        // カタカナ連続（3文字以上）
        const katakanaMatches = text.match(/[ァ-ヶー]{3,}/g);
        if (katakanaMatches) keywords.push(...katakanaMatches);
        
        // アルファベット連続（2文字以上）
        const alphaMatches = text.match(/[A-Za-z]{2,}/g);
        if (alphaMatches) keywords.push(...alphaMatches);
        
        // 漢字連続（2文字以上）
        const kanjiMatches = text.match(/[一-龯]{2,}/g);
        if (kanjiMatches) keywords.push(...kanjiMatches);
        
        return keywords.filter(k => k.length <= 10); // 長すぎるものは除外
    }

    private calculateSimilarity(text1: string, text2: string): number {
        // 簡易的な類似度計算
        const words1 = new Set(text1.split(/\s+/));
        const words2 = new Set(text2.split(/\s+/));
        
        const intersection = new Set([...words1].filter(x => words2.has(x)));
        const union = new Set([...words1, ...words2]);
        
        return intersection.size / union.size;
    }

    private categorizeArticles(articles: NewsArticle[]): NewsInsight['categories'] {
        const categories: NewsInsight['categories'] = {};
        
        articles.forEach(article => {
            const category = this.inferCategory(article);
            if (!categories[category]) {
                categories[category] = { count: 0, topics: [] };
            }
            categories[category]!.count += 1;
            
            // トピック抽出（タイトルから）
            const topics = this.extractJapaneseKeywords(article.title);
            categories[category]!.topics.push(...topics);
        });

        // トピックを重複除去・制限
        Object.keys(categories).forEach(cat => {
            const category = cat as NewsCategory;
            const uniqueTopics = [...new Set(categories[category]!.topics)];
            categories[category]!.topics = uniqueTopics.slice(0, 10);
        });

        return categories;
    }

    private inferCategory(article: NewsArticle): NewsCategory {
        const text = `${article.title} ${article.description}`.toLowerCase();
        
        // 技術関連キーワード
        if (this.containsKeywords(text, ['ai', 'dxぷ', '技術', 'it', 'アプリ', 'システム', 'データ', 'クラウド', 'セキュリティ'])) {
            return NewsCategory.TECHNOLOGY;
        }
        
        // ビジネス関連
        if (this.containsKeywords(text, ['経済', 'ビジネス', '企業', '投資', '株', '市場', '売上', '業績'])) {
            return NewsCategory.BUSINESS;
        }
        
        // ライフスタイル関連
        if (this.containsKeywords(text, ['ライフスタイル', '生活', '暮らし', 'グルメ', 'ファッション', '旅行'])) {
            return NewsCategory.LIFESTYLE;
        }
        
        // 健康関連
        if (this.containsKeywords(text, ['健康', '医療', '病気', 'ワクチン', '薬', '治療', 'コロナ'])) {
            return NewsCategory.HEALTH;
        }
        
        return NewsCategory.GENERAL;
    }

    private containsKeywords(text: string, keywords: string[]): boolean {
        return keywords.some(keyword => text.includes(keyword));
    }

    private mapStringToCategory(categoryStr: string): NewsCategory {
        const mapping: { [key: string]: NewsCategory } = {
            'technology': NewsCategory.TECHNOLOGY,
            'business': NewsCategory.BUSINESS,
            'lifestyle': NewsCategory.LIFESTYLE,
            'health': NewsCategory.HEALTH,
            'entertainment': NewsCategory.ENTERTAINMENT,
            'science': NewsCategory.SCIENCE,
            'sports': NewsCategory.SPORTS,
            'general': NewsCategory.GENERAL
        };
        
        return mapping[categoryStr] || NewsCategory.GENERAL;
    }

    async generateArticleSuggestions(trends: TrendingTopic[]): Promise<ArticleGenerationSuggestion[]> {
        const suggestions: ArticleGenerationSuggestion[] = [];
        
        // 上位5つのトレンドに対して記事提案を生成
        for (const trend of trends.slice(0, 5)) {
            try {
                const suggestion = await this.createArticleSuggestion(trend);
                if (suggestion) {
                    suggestions.push(suggestion);
                }
            } catch (error) {
                console.error(`Failed to create suggestion for ${trend.keyword}:`, error);
            }
        }
        
        return suggestions.sort((a, b) => b.estimatedPopularity - a.estimatedPopularity);
    }

    private async createArticleSuggestion(trend: TrendingTopic): Promise<ArticleGenerationSuggestion | null> {
        const newsContext = trend.articles.slice(0, 3).map(article => 
            `- ${article.title}: ${article.description.substring(0, 100)}`
        ).join('\n');

        try {
            const prompt = `
キーワード「${trend.keyword}」について、以下のニュース情報を基に記事提案を作成してください：

最新ニュース:
${newsContext}

以下の要素を含む記事提案を作成：
1. 魅力的な記事タイトル
2. 記事の切り口・角度
3. 想定読者層
4. 人気度予測（1-10）
5. 緊急度（high/medium/low）
6. 推薦理由

JSONフォーマットで回答：
{
  "title": "記事タイトル",
  "angle": "記事の切り口",
  "targetAudience": "想定読者",
  "popularity": 7,
  "urgency": "medium",
  "reasoning": "この記事をおすすめする理由"
}
`;

            const response = await geminiService.generateText(prompt);
            const parsed = this.parseGeminiSuggestionResponse(response);
            
            if (parsed) {
                return {
                    keyword: trend.keyword,
                    title: parsed.title,
                    angle: parsed.angle,
                    targetAudience: parsed.targetAudience,
                    estimatedPopularity: parsed.popularity,
                    relatedNews: trend.articles,
                    urgency: parsed.urgency,
                    reasoningJa: parsed.reasoning
                };
            }
        } catch (error) {
            console.error(`Failed to generate suggestion for ${trend.keyword}:`, error);
        }
        
        return null;
    }

    private parseGeminiSuggestionResponse(response: string): any {
        try {
            const jsonMatch = response.match(/```json\s*([\s\S]*?)\s*```/) || 
                             response.match(/\{[\s\S]*\}/);
            
            if (jsonMatch) {
                return JSON.parse(jsonMatch[1] || jsonMatch[0]);
            }
            
            return JSON.parse(response);
        } catch (error) {
            console.warn('Failed to parse suggestion response:', error);
            return null;
        }
    }
}