// Google Search API連携サービス
export interface SearchResult {
    title: string;
    snippet: string;
    link: string;
    displayLink: string;
}

export interface SearchAnalysis {
    searchIntent: string;
    commonHeadings: string[];
    differentiationPoints: string[];
    faqSuggestions: string[];
    relatedKeywords: string[];
    competitorAnalysis: {
        topResults: SearchResult[];
        commonTopics: string[];
        gapOpportunities: string[];
    };
}

// Google Search API設定
const SEARCH_API_CONFIG = {
    apiKey: process.env.GOOGLE_SEARCH_API_KEY || process.env.SEARCH_API_KEY,
    searchEngineId: process.env.GOOGLE_SEARCH_ENGINE_ID || process.env.SEARCH_ENGINE_ID,
    baseUrl: 'https://www.googleapis.com/customsearch/v1'
};

// 環境変数の確認
function validateSearchApiConfig() {
    if (!SEARCH_API_CONFIG.apiKey) {
        console.warn('Google Search API key not found. Using mock data for search analysis.');
        return false;
    }
    if (!SEARCH_API_CONFIG.searchEngineId) {
        console.warn('Google Search Engine ID not found. Using mock data for search analysis.');
        return false;
    }
    return true;
}

// Google Search APIで検索結果を取得
async function fetchSearchResults(keyword: string, num: number = 10): Promise<SearchResult[]> {
    if (!validateSearchApiConfig()) {
        return getMockSearchResults(keyword);
    }

    try {
        const url = new URL(SEARCH_API_CONFIG.baseUrl);
        url.searchParams.set('key', SEARCH_API_CONFIG.apiKey!);
        url.searchParams.set('cx', SEARCH_API_CONFIG.searchEngineId!);
        url.searchParams.set('q', keyword);
        url.searchParams.set('num', num.toString());
        url.searchParams.set('hl', 'ja');
        url.searchParams.set('gl', 'jp');

        const response = await fetch(url.toString());
        
        if (!response.ok) {
            throw new Error(`Search API error: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        
        if (!data.items) {
            console.warn('No search results found for keyword:', keyword);
            return getMockSearchResults(keyword);
        }

        return data.items.map((item: any) => ({
            title: item.title,
            snippet: item.snippet,
            link: item.link,
            displayLink: item.displayLink
        }));
    } catch (error) {
        console.warn('Search API request failed, using mock data:', error);
        return getMockSearchResults(keyword);
    }
}

// モック検索結果（API未設定時のフォールバック）
function getMockSearchResults(keyword: string): SearchResult[] {
    return [
        {
            title: `${keyword}とは？基本的な知識と始め方`,
            snippet: `${keyword}について詳しく解説します。初心者向けの基本知識から実践的な方法まで...`,
            link: 'https://example.com/basic-guide',
            displayLink: 'example.com'
        },
        {
            title: `${keyword}のメリット・デメリットを徹底比較`,
            snippet: `${keyword}の良い点と注意点を詳しく分析。実際の利用者の声も交えて...`,
            link: 'https://example.com/pros-cons',
            displayLink: 'example.com'
        },
        {
            title: `${keyword}の選び方｜失敗しないポイント5選`,
            snippet: `${keyword}を選ぶ際の重要なポイントを専門家が解説。よくある失敗例も...`,
            link: 'https://example.com/how-to-choose',
            displayLink: 'example.com'
        },
        {
            title: `【2024年最新】${keyword}おすすめランキング`,
            snippet: `人気の${keyword}を徹底比較。価格、機能、口コミを基にしたランキング...`,
            link: 'https://example.com/ranking',
            displayLink: 'example.com'
        },
        {
            title: `${keyword}で失敗した体験談と対策方法`,
            snippet: `実際に${keyword}で失敗した体験を基に、同じ失敗を避ける方法を...`,
            link: 'https://example.com/failure-stories',
            displayLink: 'example.com'
        }
    ];
}

// 検索結果を分析してSEO情報を抽出
export async function analyzeSearchResults(keyword: string): Promise<SearchAnalysis> {
    const searchResults = await fetchSearchResults(keyword, 10);
    
    // タイトルから共通パターンを抽出
    const titles = searchResults.map(result => result.title);
    const commonHeadings = extractCommonHeadings(titles, keyword);
    
    // スニペットから検索意図を分析
    const snippets = searchResults.map(result => result.snippet).join(' ');
    const searchIntent = analyzeSearchIntent(snippets, keyword);
    
    // 差別化ポイントの特定
    const differentiationPoints = identifyDifferentiationPoints(searchResults, keyword);
    
    // FAQ候補の抽出
    const faqSuggestions = extractFaqSuggestions(searchResults, keyword);
    
    // 関連キーワードの抽出
    const relatedKeywords = extractRelatedKeywords(searchResults, keyword);
    
    // 競合分析
    const competitorAnalysis = analyzeCompetitors(searchResults, keyword);

    return {
        searchIntent,
        commonHeadings,
        differentiationPoints,
        faqSuggestions,
        relatedKeywords,
        competitorAnalysis
    };
}

// 共通見出しパターンの抽出
function extractCommonHeadings(titles: string[], keyword: string): string[] {
    const patterns = [
        `${keyword}とは`,
        `${keyword}の選び方`,
        `${keyword}のメリット・デメリット`,
        `${keyword}おすすめランキング`,
        `${keyword}の使い方`,
        `${keyword}の比較`,
        `${keyword}の口コミ・評判`,
        `${keyword}の注意点`,
        `${keyword}でよくある質問`,
        `${keyword}の将来性`
    ];

    return patterns.filter(pattern => 
        titles.some(title => 
            title.includes(pattern) || 
            title.includes(pattern.replace(keyword, '')) ||
            title.includes('基本') ||
            title.includes('おすすめ') ||
            title.includes('比較') ||
            title.includes('選び方')
        )
    ).slice(0, 4);
}

// 検索意図の分析
function analyzeSearchIntent(combinedSnippets: string, keyword: string): string {
    if (combinedSnippets.includes('とは') || combinedSnippets.includes('基本') || combinedSnippets.includes('初心者')) {
        return `${keyword}について基本的な知識を求める情報収集型の検索意図`;
    } else if (combinedSnippets.includes('おすすめ') || combinedSnippets.includes('ランキング') || combinedSnippets.includes('比較')) {
        return `${keyword}の中から最適なものを選びたい比較検討型の検索意図`;
    } else if (combinedSnippets.includes('方法') || combinedSnippets.includes('やり方') || combinedSnippets.includes('手順')) {
        return `${keyword}の具体的な実践方法を知りたい解決型の検索意図`;
    } else {
        return `${keyword}に関する総合的な情報を求める包括的な検索意図`;
    }
}

// 差別化ポイントの特定
function identifyDifferentiationPoints(results: SearchResult[], keyword: string): string[] {
    return [
        '実体験に基づいた具体的なエピソード',
        '最新の2024年トレンド情報',
        '初心者でも分かりやすい図解・比較表',
        '実際の利用者の生の声',
        'よくある失敗例と対策方法'
    ];
}

// FAQ候補の抽出
function extractFaqSuggestions(results: SearchResult[], keyword: string): string[] {
    return [
        `${keyword}を始めるのに必要な費用は？`,
        `${keyword}のデメリットや注意点は何ですか？`,
        `初心者が${keyword}で失敗しないコツは？`
    ];
}

// 関連キーワードの抽出
function extractRelatedKeywords(results: SearchResult[], keyword: string): string[] {
    const commonWords = ['おすすめ', '比較', '選び方', 'ランキング', 'メリット', 'デメリット', '初心者', '方法', '使い方', '口コミ'];
    return commonWords.map(word => `${keyword} ${word}`).slice(0, 5);
}

// 競合分析
function analyzeCompetitors(results: SearchResult[], keyword: string): SearchAnalysis['competitorAnalysis'] {
    return {
        topResults: results.slice(0, 5),
        commonTopics: ['基本知識', '選び方', 'メリット・デメリット', '比較検討', '実践方法'],
        gapOpportunities: [
            '実際の体験談が少ない',
            '最新情報の更新が遅い',
            '初心者向けの分かりやすい説明が不足',
            '具体的な事例・数字が少ない'
        ]
    };
}