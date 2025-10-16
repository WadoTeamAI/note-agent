import { GoogleGenAI } from "@google/genai";
import { ArticleOutline, Audience, Tone } from '../../types';
import { analyzeSearchResults } from '../research/searchService';
import { diagramService, DiagramResult } from '../diagram/diagramService';

// 環境変数の確認とバリデーション
function validateEnvironment() {
    const apiKey = process.env.API_KEY || process.env.GEMINI_API_KEY;
    
    if (!apiKey) {
        throw new Error(
            "APIキーが設定されていません。.env.localファイルにGEMINI_API_KEYを設定してください。\n" +
            "例: GEMINI_API_KEY=your_api_key_here"
        );
    }
    
    if (apiKey === 'PLACEHOLDER_API_KEY' || apiKey.length < 10) {
        throw new Error(
            "有効なGemini APIキーを設定してください。\n" +
            "https://ai.google.dev/ でAPIキーを取得できます。"
        );
    }
    
    // Google Search APIの設定確認（オプション）
    const searchApiKey = process.env.GOOGLE_SEARCH_API_KEY || process.env.SEARCH_API_KEY;
    const searchEngineId = process.env.GOOGLE_SEARCH_ENGINE_ID || process.env.SEARCH_ENGINE_ID;
    
    if (!searchApiKey || !searchEngineId) {
        console.warn('Google Search API credentials not found. Search analysis will use mock data.');
        console.warn('To enable real search analysis, set GOOGLE_SEARCH_API_KEY and GOOGLE_SEARCH_ENGINE_ID in .env.local');
    }
    
    return apiKey;
}

const API_KEY = validateEnvironment();

const ai = new GoogleGenAI({ apiKey: API_KEY });

// リトライ設定（レート制限対応）
const RETRY_CONFIG = {
    maxRetries: 3,        // リトライ回数を戻す
    baseDelay: 2000,      // 2秒に延長（レート制限対応）
    maxDelay: 60000,      // 60秒に延長（クォータ制限対応）
    rateLimitDelay: 30000 // レート制限時の特別待機時間
};

// パフォーマンス最適化用のモデル設定
const MODELS = {
    fast: 'gemini-2.5-flash',      // 高速処理用
    balanced: 'gemini-2.5-flash',  // バランス型
};

// レート制限対応のリトライ機能
async function withRetry<T>(
    operation: () => Promise<T>,
    operationName: string,
    retries: number = RETRY_CONFIG.maxRetries
): Promise<T> {
    let lastError: Error;
    
    for (let attempt = 0; attempt <= retries; attempt++) {
        try {
            return await operation();
        } catch (error) {
            lastError = error as Error;
            const errorMessage = lastError.message;
            
            // 最終試行の場合
            if (attempt === retries) {
                if (errorMessage.includes('RATE_LIMIT_EXCEEDED') || errorMessage.includes('Quota exceeded')) {
                    throw new Error(
                        `${operationName}でAPI制限に達しました。しばらく待ってから再度お試しください。\n` +
                        'Gemini APIの無料枠では1分間に制限があります。\n' +
                        'より高い制限が必要な場合は、Google Cloud Consoleで課金を有効にしてください。'
                    );
                }
                throw new Error(`${operationName}に失敗しました (${retries + 1}回試行後): ${errorMessage}`);
            }
            
            // レート制限エラーの場合は長時間待機
            let delay: number;
            if (errorMessage.includes('RATE_LIMIT_EXCEEDED') || errorMessage.includes('Quota exceeded')) {
                delay = RETRY_CONFIG.rateLimitDelay; // 30秒待機
                console.warn(`${operationName} レート制限エラー (試行 ${attempt + 1}/${retries + 1}): ${delay}ms後にリトライします...`);
            } else {
                delay = Math.min(
                    RETRY_CONFIG.baseDelay * Math.pow(2, attempt),
                    RETRY_CONFIG.maxDelay
                );
                console.warn(`${operationName} 失敗 (試行 ${attempt + 1}/${retries + 1}): ${errorMessage}. ${delay}ms後にリトライします...`);
            }
            
            await new Promise(resolve => setTimeout(resolve, delay));
        }
    }
    
    throw lastError!;
}

export async function transcribeYouTubeVideo(url: string): Promise<string> {
    const prompt = `YouTube URL: "${url}"

以下の形式で簡潔に分析してください：
1. 推定テーマ:
2. 主要ポイント（3点）:
3. ターゲット層:
4. 重要キーワード（5個）:
5. 記事化の注意点:`;

    return await withRetry(async () => {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
        });
        return response.text || '';
    }, 'YouTube動画分析');
}

export async function analyzeSerpResults(keyword: string): Promise<string> {
    try {
        // Google Search APIを使用してリアルタイム検索分析
        const searchAnalysis = await analyzeSearchResults(keyword);
        
        // 検索結果をGemini AIで高度分析
        const prompt = `検索分析データ:
キーワード: "${keyword}"
検索意図: ${searchAnalysis.searchIntent}
共通見出し: ${searchAnalysis.commonHeadings.join(', ')}
差別化ポイント: ${searchAnalysis.differentiationPoints.join(', ')}
FAQ候補: ${searchAnalysis.faqSuggestions.join(', ')}
関連キーワード: ${searchAnalysis.relatedKeywords.join(', ')}
競合トップ結果: ${searchAnalysis.competitorAnalysis.topResults.map(r => r.title).join(', ')}

上記の検索分析データを基に、以下を簡潔にまとめてください：
1. 検索意図:
2. 共通見出し構成（3-4個）:
3. 差別化ポイント:
4. FAQ（3個）:`;

        return await withRetry(async () => {
            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: prompt,
            });
            return response.text || '';
        }, 'SEO分析');
    } catch (error) {
        // フォールバック: 基本的なプロンプトベース分析
        console.warn('Search API analysis failed, using basic analysis:', error);
        
        const fallbackPrompt = `キーワード: "${keyword}"

以下を簡潔に分析：
1. 検索意図:
2. 共通見出し構成（3-4個）:
3. 差別化ポイント:
4. FAQ（3個）:`;

        return await withRetry(async () => {
            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: fallbackPrompt,
            });
            return response.text || '';
        }, 'SEO分析');
    }
}

export async function createArticleOutline(analysis: string, audience: Audience, tone: Tone, keyword: string): Promise<ArticleOutline> {
    const prompt = `SEO分析: ${analysis}
キーワード: ${keyword} | 読者: ${audience} | 文体: ${tone}

JSON形式で記事構成を作成（体験談・事例・エピソードを含む見出し構成にすること）:`;

    const response = await withRetry(async () => {
        return await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
        });
    }, '記事構成案生成');

    const jsonText = (response.text || '').trim();
    return JSON.parse(jsonText);
}

export async function createArticleOutlineWithInstructions(
    analysis: any,
    audience: Audience,
    tone: Tone,
    keyword: string,
    specialInstructions: string
): Promise<ArticleOutline> {
    const prompt = `SEO分析結果: ${JSON.stringify(analysis, null, 2)}

キーワード: "${keyword}"
想定読者: ${audience}
文体: ${tone}
特別指示: ${specialInstructions}

上記の特別指示に従って、SEO分析結果を基に記事構成案を作成してください。

要件:
1. SEOキーワードを自然に組み込む
2. 読者のニーズを満たす内容構成
3. 特別指示の要件を満たす構成
4. FAQは3-5個程度

出力形式: JSON`;

    return await withRetry(async () => {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
        });

        const jsonText = (response.text || '').trim();
        return JSON.parse(jsonText);
    }, '特別指示付き記事構成案生成');
}

export async function writeArticle(outline: ArticleOutline, targetLength: number, tone: Tone, audience: Audience): Promise<string> {
    const sectionsText = outline.sections.map(s => `## ${s.heading}\n${s.content}`).join('\n\n');
    const faqText = outline.faq.map(f => `- Q: ${f.question}\n- A: ${f.answer}`).join('\n');

    const prompt = `構成: ${outline.title}
導入: ${outline.introduction}
本文: ${sectionsText}
FAQ: ${faqText}

条件: ${targetLength}文字、${audience}、${tone}

重要：以下のルールを必ず守ってMarkdown記事を作成
- 自然な日本語（「〜することができます」等の翻訳調表現禁止）
- 必須：以下のような具体的な体験談を1箇所以上挿入
  例1：「私自身も初めて○○に挑戦した時、△△で躓いてしまい、思わぬ時間を費やしてしまいました。」
  例2：「友人から聞いた話ですが、□□を始めた当初は××で困ってしまったそうです。」
  例3：「以前職場で○○の案件を担当した際、△△という課題に直面し、試行錯誤の結果...」
- 人間味：完璧すぎない表現、少しの「ゆらぎ」を含む
- 親近感：読者との距離を縮める表現（「実は...」「正直なところ...」等）`;

    return await withRetry(async () => {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
        });
        return response.text || '';
    }, '記事本文作成');
}

export async function createImagePrompt(articleTitle: string, articleContent: string, imageTheme?: string): Promise<string> {
    const summary = articleContent.substring(0, 1000); // Use first 1000 chars as summary
    
    let prompt: string;
    if (imageTheme && imageTheme.trim()) {
        prompt = `画像テーマ: "${imageTheme}" | 記事: "${articleTitle}"
簡潔な画像プロンプト作成:`;
    } else {
        prompt = `記事: "${articleTitle}" | 内容: ${summary.substring(0, 200)}
簡潔な画像プロンプト作成:`;
    }

    return await withRetry(async () => {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
        });
        return response.text || '';
    }, '画像プロンプト生成');
}

export async function generateImage(prompt: string): Promise<string> {
    try {
        return await withRetry(async () => {
            // Gemini 2.5 Flash Image APIを使用した画像生成
            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash-image',
                contents: `High-quality, professional eye-catching image for Japanese note article: ${prompt}

Style requirements:
- Clean, modern design
- Professional and appealing
- Suitable for Japanese blog/note platform
- High contrast and readable
- 16:9 aspect ratio
- No text overlays (text will be added separately)`,
                config: {
                    responseModalities: ['Image'],
                    imageConfig: {
                        aspectRatio: '16:9'
                    }
                }
            });

            // レスポンスから画像データを抽出
            if (response.candidates && 
                response.candidates[0] && 
                response.candidates[0].content && 
                response.candidates[0].content.parts) {
                
                // inlineDataを含むパートを探す
                for (const part of response.candidates[0].content.parts) {
                    if (part.inlineData && part.inlineData.data) {
                        const imageData = part.inlineData.data;
                        const mimeType = part.inlineData.mimeType || 'image/png';
                        return `data:${mimeType};base64,${imageData}`;
                    }
                }
                
                throw new Error('画像生成に失敗しました: レスポンスに画像データが含まれていません');
            } else {
                throw new Error('画像生成に失敗しました: レスポンス形式が不正です');
            }
        }, 'アイキャッチ画像生成');
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        
        // APIエラーの場合は代替画像を返す
        console.warn('Image generation failed, using placeholder. Error:', errorMessage);
        
        // プレースホルダー画像のSVGを生成
        const placeholderSvg = `<svg width="800" height="450" xmlns="http://www.w3.org/2000/svg">
            <defs>
                <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" style="stop-color:#f8fafc;stop-opacity:1" />
                    <stop offset="100%" style="stop-color:#e2e8f0;stop-opacity:1" />
                </linearGradient>
            </defs>
            <rect width="100%" height="100%" fill="url(#bg)"/>
            <rect x="50" y="50" width="700" height="350" fill="#ffffff" stroke="#cbd5e1" stroke-width="2" rx="12"/>
            <circle cx="400" cy="180" r="50" fill="#f1f5f9" stroke="#e2e8f0" stroke-width="2"/>
            <text x="400" y="195" text-anchor="middle" font-family="Arial, sans-serif" font-size="36" fill="#64748b">🎨</text>
            <text x="400" y="270" text-anchor="middle" font-family="Arial, sans-serif" font-size="24" fill="#334155" font-weight="bold">note記事アイキャッチ</text>
            <text x="400" y="300" text-anchor="middle" font-family="Arial, sans-serif" font-size="16" fill="#64748b">${prompt.substring(0, 35)}${prompt.length > 35 ? '...' : ''}</text>
            <text x="400" y="340" text-anchor="middle" font-family="Arial, sans-serif" font-size="13" fill="#94a3b8">画像生成機能を準備中です</text>
            <text x="400" y="360" text-anchor="middle" font-family="Arial, sans-serif" font-size="11" fill="#cbd5e1">Gemini 2.5 Flash Image API使用</text>
        </svg>`;
        
        // SVGをUTF-8対応でエンコード
        const encodedSvg = encodeURIComponent(placeholderSvg);
        return `data:image/svg+xml;charset=utf-8,${encodedSvg}`;
    }
}

/**
 * 記事コンテンツから図解を生成
 */
export async function generateDiagrams(content: string): Promise<DiagramResult[]> {
    try {
        // 記事内容を分析して図解を自動生成
        const diagrams = await diagramService.generateDiagramsFromContent(content);
        
        // 生成された図解が少ない場合は、AIに追加の図解を提案してもらう
        if (diagrams.length < 2) {
            const additionalDiagrams = await generateAdditionalDiagrams(content);
            diagrams.push(...additionalDiagrams);
        }

        return diagrams;
    } catch (error) {
        console.error('Error generating diagrams:', error);
        return [];
    }
}

/**
 * AIに図解の提案を依頼
 */
async function generateAdditionalDiagrams(content: string): Promise<DiagramResult[]> {
    return withRetry(async () => {
        const prompt = `以下の記事内容を分析し、読者の理解を深めるために効果的な図解を3つまで提案してください。

記事内容:
${content.substring(0, 2000)}...

各図解について以下の形式でJSON配列として回答してください:
[
  {
    "type": "flowchart|sequence|pie|timeline|mindmap",
    "title": "図解のタイトル",
    "description": "図解の説明",
    "mermaidCode": "実際のMermaidコード",
    "insertAfterParagraph": 挿入推奨段落番号
  }
]

条件:
- 記事内容に最も適した図解タイプを選択
- Mermaidの正しい構文を使用
- 日本語でわかりやすいラベルを付ける
- 記事の流れに沿った挿入位置を提案`;

        const result = await ai.models.generateContent({
            model: MODELS.fast,
            contents: prompt,
        });
        const responseText = result.text || '';
        
        try {
            const jsonMatch = responseText.match(/\[[\s\S]*\]/);
            if (!jsonMatch) return [];
            
            const proposedDiagrams = JSON.parse(jsonMatch[0]);
            const diagrams: DiagramResult[] = [];
            
            for (const proposed of proposedDiagrams) {
                try {
                    // Mermaidコードを検証してSVGに変換
                    const svgContent = await diagramService.renderMermaidToSVG(proposed.mermaidCode);
                    
                    diagrams.push({
                        type: proposed.type,
                        title: proposed.title,
                        description: proposed.description,
                        mermaidCode: proposed.mermaidCode,
                        svgContent,
                        insertPosition: proposed.insertAfterParagraph
                    });
                } catch (error) {
                    console.warn('Failed to render proposed diagram:', error);
                    // エラーが発生した図解はスキップ
                }
            }
            
            return diagrams;
        } catch (parseError) {
            console.warn('Failed to parse diagram proposals:', parseError);
            return [];
        }
    }, 'AI図解提案生成');
}

/**
 * 汎用的なテキスト生成関数
 */
export async function generateText(prompt: string): Promise<string> {
    return withRetry(async () => {
        validateEnvironment();
        
        const result = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
        });
        
        return result.text || '';
    }, 'テキスト生成');
}