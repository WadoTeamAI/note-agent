/**
 * Tavily API サービス
 * ファクトチェックと検索機能を提供
 * 
 * Tavily API Documentation: https://docs.tavily.com/
 */

import { GoogleGenAI } from "@google/genai";
import { 
  TavilySearchResult, 
  TavilyResult, 
  FactCheckResult, 
  FactCheckRequest, 
  FactCheckSummary,
  FactCheckSource 
} from '../../types/factcheck.types';

// 環境変数からAPIキーを取得
function getTavilyApiKey(): string | null {
  return process.env.TAVILY_API_KEY || null;
}

function getGeminiApiKey(): string {
  const apiKey = process.env.API_KEY || process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('Gemini APIキーが設定されていません');
  }
  return apiKey;
}

const TAVILY_API_URL = 'https://api.tavily.com/search';

/**
 * Tavily APIで検索を実行
 */
export async function searchWithTavily(query: string): Promise<TavilySearchResult> {
  const apiKey = getTavilyApiKey();
  
  if (!apiKey) {
    console.warn('Tavily APIキーが設定されていません。モックデータを返します。');
    return createMockTavilyResult(query);
  }

  try {
    const response = await fetch(TAVILY_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        api_key: apiKey,
        query: query,
        search_depth: 'advanced',
        include_answer: true,
        include_raw_content: false,
        max_results: 5,
      }),
    });

    if (!response.ok) {
      throw new Error(`Tavily API error: ${response.status}`);
    }

    const data = await response.json();
    
    return {
      query: query,
      results: data.results.map((result: any) => ({
        title: result.title,
        url: result.url,
        content: result.content,
        score: result.score,
        published_date: result.published_date,
      })),
      answer: data.answer,
    };
  } catch (error) {
    console.error('Tavily API error:', error);
    // フォールバック: モックデータを返す
    return createMockTavilyResult(query);
  }
}

/**
 * 記事の主張を抽出
 */
export async function extractClaims(articleContent: string, keyword: string): Promise<string[]> {
  const ai = new GoogleGenAI({ apiKey: getGeminiApiKey() });
  
  const prompt = `
以下の記事から、事実確認が必要な具体的な主張・統計・事実を3〜5個抽出してください。

記事内容:
${articleContent.substring(0, 3000)}

キーワード: ${keyword}

抽出する主張の条件:
- 具体的な数字や統計を含む主張
- 検証可能な事実
- 重要な情報源からの引用
- 読者の判断に影響を与える主張

JSON形式で出力してください:
{
  "claims": [
    "主張1",
    "主張2",
    "主張3"
  ]
}
`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    const text = response.text;
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    
    if (!jsonMatch) {
      // フォールバック: 簡易的な主張抽出
      return extractClaimsSimple(articleContent);
    }

    const parsed = JSON.parse(jsonMatch[0]);
    return parsed.claims || [];
  } catch (error) {
    console.error('主張抽出エラー:', error);
    return extractClaimsSimple(articleContent);
  }
}

/**
 * 簡易的な主張抽出（フォールバック用）
 */
function extractClaimsSimple(content: string): string[] {
  const claims: string[] = [];
  
  // 数字を含む文を抽出
  const sentences = content.split(/[。.！!？?]/);
  for (const sentence of sentences) {
    if (/\d+/.test(sentence) && sentence.length > 20 && sentence.length < 200) {
      claims.push(sentence.trim());
      if (claims.length >= 3) break;
    }
  }
  
  return claims.length > 0 ? claims : ['記事の主張を自動抽出できませんでした'];
}

/**
 * ファクトチェックを実行
 */
export async function performFactCheck(request: FactCheckRequest): Promise<FactCheckSummary> {
  const results: FactCheckResult[] = [];
  
  for (const claim of request.claims) {
    // Tavilyで検索
    const searchResult = await searchWithTavily(claim);
    
    // Geminiで判定
    const factCheckResult = await verifyClaimWithGemini(claim, searchResult);
    
    results.push(factCheckResult);
  }
  
  // サマリーを生成
  const summary = generateSummary(results);
  
  return summary;
}

/**
 * Geminiを使って主張を検証
 */
async function verifyClaimWithGemini(
  claim: string, 
  searchResult: TavilySearchResult
): Promise<FactCheckResult> {
  const ai = new GoogleGenAI({ apiKey: getGeminiApiKey() });
  
  const prompt = `
以下の主張を検証してください。

主張: ${claim}

参照情報:
${searchResult.results.map((r, i) => `
${i + 1}. ${r.title}
   URL: ${r.url}
   内容: ${r.content.substring(0, 300)}
`).join('\n')}

${searchResult.answer ? `\nTavily要約: ${searchResult.answer}` : ''}

以下の形式でJSON出力してください:
{
  "isVerified": true/false,
  "confidence": "high"/"medium"/"low",
  "verdict": "correct"/"incorrect"/"partially-correct"/"unverified",
  "explanation": "判定理由の説明（日本語、100文字程度）",
  "suggestedCorrection": "修正提案（incorrectの場合のみ）"
}
`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    const text = response.text;
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    
    if (!jsonMatch) {
      throw new Error('JSON形式のレスポンスが取得できませんでした');
    }

    const parsed = JSON.parse(jsonMatch[0]);
    
    return {
      id: `fact-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      claim: claim,
      isVerified: parsed.isVerified,
      confidence: parsed.confidence,
      verdict: parsed.verdict,
      explanation: parsed.explanation,
      suggestedCorrection: parsed.suggestedCorrection,
      sources: searchResult.results.map(r => ({
        title: r.title,
        url: r.url,
        snippet: r.content.substring(0, 200),
        publishedDate: r.published_date,
        domain: new URL(r.url).hostname,
        relevanceScore: r.score,
      })),
    };
  } catch (error) {
    console.error('Gemini検証エラー:', error);
    
    // フォールバック
    return {
      id: `fact-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      claim: claim,
      isVerified: false,
      confidence: 'low',
      verdict: 'unverified',
      explanation: '自動検証に失敗しました。手動で確認してください。',
      sources: searchResult.results.map(r => ({
        title: r.title,
        url: r.url,
        snippet: r.content.substring(0, 200),
        publishedDate: r.published_date,
        domain: new URL(r.url).hostname,
        relevanceScore: r.score,
      })),
    };
  }
}

/**
 * ファクトチェック結果のサマリーを生成
 */
function generateSummary(results: FactCheckResult[]): FactCheckSummary {
  const totalClaims = results.length;
  const verifiedClaims = results.filter(r => r.isVerified && r.verdict === 'correct').length;
  const unverifiedClaims = results.filter(r => r.verdict === 'unverified').length;
  const incorrectClaims = results.filter(r => r.verdict === 'incorrect').length;
  
  // 全体的な信頼度を判定
  let overallConfidence: 'high' | 'medium' | 'low';
  const highConfidenceCount = results.filter(r => r.confidence === 'high').length;
  const lowConfidenceCount = results.filter(r => r.confidence === 'low').length;
  
  if (highConfidenceCount > totalClaims / 2) {
    overallConfidence = 'high';
  } else if (lowConfidenceCount > totalClaims / 2) {
    overallConfidence = 'low';
  } else {
    overallConfidence = 'medium';
  }
  
  // レビューが必要かどうか判定
  const needsReview = incorrectClaims > 0 || unverifiedClaims > totalClaims / 2 || overallConfidence === 'low';
  
  return {
    totalClaims,
    verifiedClaims,
    unverifiedClaims,
    incorrectClaims,
    overallConfidence,
    needsReview,
    results,
  };
}

/**
 * モックデータ生成（Tavily APIキーがない場合）
 */
function createMockTavilyResult(query: string): TavilySearchResult {
  return {
    query: query,
    results: [
      {
        title: 'モック検索結果1',
        url: 'https://example.com/1',
        content: `${query}に関する情報です。Tavily APIキーが設定されていないため、モックデータを表示しています。`,
        score: 0.8,
        published_date: new Date().toISOString().split('T')[0],
      },
      {
        title: 'モック検索結果2',
        url: 'https://example.com/2',
        content: `${query}についての参考情報。実際のファクトチェックにはTAVILY_API_KEYを.env.localに設定してください。`,
        score: 0.7,
        published_date: new Date().toISOString().split('T')[0],
      },
    ],
    answer: `${query}に関するモック回答です。Tavily APIを有効にするには、.env.localにTAVILY_API_KEYを設定してください。`,
  };
}

