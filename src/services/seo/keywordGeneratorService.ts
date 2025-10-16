/**
 * SEOキーワード自動生成サービス
 * Gemini AIを使用してキーワードセットを生成
 */

import { GoogleGenAI } from "@google/genai";
import { 
  SEOKeywordSet, 
  SEOKeyword, 
  SEOKeywordGenerationOptions,
  SearchVolume,
  Competition,
  Difficulty,
  SearchIntent
} from '../../types/seo.types';

function getApiKey(): string {
  const apiKey = process.env.API_KEY || process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('Gemini APIキーが設定されていません');
  }
  return apiKey;
}

/**
 * SEOキーワードセットを自動生成
 */
export async function generateSEOKeywordSet(
  options: SEOKeywordGenerationOptions
): Promise<SEOKeywordSet> {
  const {
    mainKeyword,
    targetAudience = '一般',
    tone = 'フレンドリー',
    includeQuestions = true,
    includeLongTail = true,
    maxKeywords = 20,
  } = options;

  const ai = new GoogleGenAI({ apiKey: getApiKey() });

  // 関連キーワード生成
  const relatedKeywords = await generateRelatedKeywords(ai, mainKeyword, targetAudience, tone);

  // ロングテールキーワード生成
  const longTailKeywords = includeLongTail 
    ? await generateLongTailKeywords(ai, mainKeyword, targetAudience)
    : [];

  // 質問形式キーワード生成
  const questionKeywords = includeQuestions
    ? await generateQuestionKeywords(ai, mainKeyword)
    : [];

  // LSIキーワード生成
  const lsiKeywords = await generateLSIKeywords(ai, mainKeyword);

  // 推奨キーワードを選定（上位3個）
  const allKeywords = [...relatedKeywords, ...longTailKeywords, ...questionKeywords];
  const recommendedKeywords = selectRecommendedKeywords(allKeywords, 3);

  const keywordSet: SEOKeywordSet = {
    mainKeyword,
    relatedKeywords,
    longTailKeywords,
    questionKeywords,
    lsiKeywords,
    recommendedKeywords,
    totalKeywordCount: allKeywords.length,
    generatedAt: new Date().toISOString(),
  };

  return keywordSet;
}

/**
 * 関連キーワードを生成
 */
async function generateRelatedKeywords(
  ai: GoogleGenAI,
  mainKeyword: string,
  targetAudience: string,
  tone: string
): Promise<SEOKeyword[]> {
  const prompt = `
あなたはSEOとキーワードリサーチの専門家です。

メインキーワード: "${mainKeyword}"
ターゲット読者: ${targetAudience}
トーン: ${tone}

このキーワードに関連する効果的なSEOキーワードを5-10個生成してください。

各キーワードについて以下の情報を含めてください：
- keyword: キーワード本体
- searchVolume: 検索ボリューム（very_low/low/medium/high/very_high）
- competition: 競合性（low/medium/high）
- relevance: メインキーワードとの関連性（0.0-1.0）
- difficulty: SEO難易度（easy/moderate/hard/very_hard）
- intent: 検索意図（informational/navigational/transactional/commercial）

JSON形式で出力してください：
{
  "keywords": [
    {
      "keyword": "キーワード",
      "searchVolume": "medium",
      "competition": "low",
      "relevance": 0.9,
      "difficulty": "moderate",
      "intent": "informational"
    }
  ]
}
`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    const text = response.text || '';
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    
    if (!jsonMatch) {
      console.warn('関連キーワードのJSON抽出に失敗しました');
      return createFallbackRelatedKeywords(mainKeyword);
    }

    const parsed = JSON.parse(jsonMatch[0]);
    return parsed.keywords || [];
  } catch (error) {
    console.error('関連キーワード生成エラー:', error);
    return createFallbackRelatedKeywords(mainKeyword);
  }
}

/**
 * ロングテールキーワードを生成
 */
async function generateLongTailKeywords(
  ai: GoogleGenAI,
  mainKeyword: string,
  targetAudience: string
): Promise<SEOKeyword[]> {
  const prompt = `
あなたはSEOとキーワードリサーチの専門家です。

メインキーワード: "${mainKeyword}"
ターゲット読者: ${targetAudience}

このキーワードに関連するロングテールキーワード（3-5語の複合キーワード）を3-7個生成してください。
ロングテールキーワードは、より具体的で検索意図が明確なキーワードです。

例：
- メインキーワードが「副業」なら → 「副業 始め方 初心者 スマホ」
- メインキーワードが「ダイエット」なら → 「ダイエット 食事 メニュー 1週間」

各キーワードについて以下の情報を含めてください：
- keyword: キーワード本体（3-5語）
- searchVolume: 検索ボリューム（通常はlow/medium）
- competition: 競合性（通常はlow/medium）
- relevance: メインキーワードとの関連性（0.7-1.0）
- difficulty: SEO難易度（通常はeasy/moderate）
- intent: 検索意図

JSON形式で出力してください：
{
  "keywords": [
    {
      "keyword": "ロングテールキーワード",
      "searchVolume": "low",
      "competition": "low",
      "relevance": 0.85,
      "difficulty": "easy",
      "intent": "informational"
    }
  ]
}
`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    const text = response.text || '';
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    
    if (!jsonMatch) {
      console.warn('ロングテールキーワードのJSON抽出に失敗しました');
      return createFallbackLongTailKeywords(mainKeyword);
    }

    const parsed = JSON.parse(jsonMatch[0]);
    return parsed.keywords || [];
  } catch (error) {
    console.error('ロングテールキーワード生成エラー:', error);
    return createFallbackLongTailKeywords(mainKeyword);
  }
}

/**
 * 質問形式キーワードを生成
 */
async function generateQuestionKeywords(
  ai: GoogleGenAI,
  mainKeyword: string
): Promise<SEOKeyword[]> {
  const prompt = `
あなたはSEOとキーワードリサーチの専門家です。

メインキーワード: "${mainKeyword}"

このキーワードに関連する質問形式のキーワードを3-5個生成してください。
質問形式は、ユーザーが実際に検索しそうな疑問文です。

例：
- 「〜とは」「〜って何」
- 「〜 方法」「〜 やり方」
- 「〜 理由」「〜 なぜ」
- 「〜 おすすめ」「〜 どれ」
- 「〜 いつ」「〜 どこで」

各キーワードについて以下の情報を含めてください：
- keyword: 質問形式のキーワード
- searchVolume: 検索ボリューム
- competition: 競合性
- relevance: メインキーワードとの関連性（0.8-1.0）
- difficulty: SEO難易度
- intent: informational（ほぼ全て情報収集型）

JSON形式で出力してください：
{
  "keywords": [
    {
      "keyword": "質問形式キーワード",
      "searchVolume": "medium",
      "competition": "medium",
      "relevance": 0.9,
      "difficulty": "moderate",
      "intent": "informational"
    }
  ]
}
`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    const text = response.text || '';
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    
    if (!jsonMatch) {
      console.warn('質問形式キーワードのJSON抽出に失敗しました');
      return createFallbackQuestionKeywords(mainKeyword);
    }

    const parsed = JSON.parse(jsonMatch[0]);
    return parsed.keywords || [];
  } catch (error) {
    console.error('質問形式キーワード生成エラー:', error);
    return createFallbackQuestionKeywords(mainKeyword);
  }
}

/**
 * LSI（潜在意味インデックス）キーワードを生成
 */
async function generateLSIKeywords(
  ai: GoogleGenAI,
  mainKeyword: string
): Promise<string[]> {
  const prompt = `
あなたはSEOとキーワードリサーチの専門家です。

メインキーワード: "${mainKeyword}"

このキーワードに関連するLSI（Latent Semantic Indexing）キーワードを5-8個生成してください。
LSIキーワードは、メインキーワードと意味的に関連する単語やフレーズです。

例：
- メインキーワードが「副業」なら → 在宅ワーク、収入、フリーランス、スキルアップ、時間管理
- メインキーワードが「ダイエット」なら → 健康、体重、カロリー、運動、食事制限

JSON形式で出力してください：
{
  "lsiKeywords": ["キーワード1", "キーワード2", ...]
}
`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    const text = response.text || '';
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    
    if (!jsonMatch) {
      console.warn('LSIキーワードのJSON抽出に失敗しました');
      return createFallbackLSIKeywords(mainKeyword);
    }

    const parsed = JSON.parse(jsonMatch[0]);
    return parsed.lsiKeywords || [];
  } catch (error) {
    console.error('LSIキーワード生成エラー:', error);
    return createFallbackLSIKeywords(mainKeyword);
  }
}

/**
 * 推奨キーワードを選定
 */
function selectRecommendedKeywords(keywords: SEOKeyword[], count: number): SEOKeyword[] {
  // スコアリング: 関連性 + 難易度の低さ + 競合性の低さ
  const scored = keywords.map(kw => {
    let score = kw.relevance * 100;
    
    // 難易度スコア
    switch (kw.difficulty) {
      case Difficulty.EASY: score += 30; break;
      case Difficulty.MODERATE: score += 20; break;
      case Difficulty.HARD: score += 10; break;
      case Difficulty.VERY_HARD: score += 0; break;
    }
    
    // 競合性スコア
    switch (kw.competition) {
      case Competition.LOW: score += 20; break;
      case Competition.MEDIUM: score += 10; break;
      case Competition.HIGH: score += 0; break;
    }
    
    return { keyword: kw, score };
  });
  
  // スコアでソートして上位を返す
  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, count).map(s => s.keyword);
}

// フォールバック用の関数群
function createFallbackRelatedKeywords(mainKeyword: string): SEOKeyword[] {
  return [
    {
      keyword: `${mainKeyword} 方法`,
      searchVolume: SearchVolume.MEDIUM,
      competition: Competition.MEDIUM,
      relevance: 0.9,
      difficulty: Difficulty.MODERATE,
      intent: SearchIntent.INFORMATIONAL,
    },
    {
      keyword: `${mainKeyword} おすすめ`,
      searchVolume: SearchVolume.MEDIUM,
      competition: Competition.MEDIUM,
      relevance: 0.85,
      difficulty: Difficulty.MODERATE,
      intent: SearchIntent.COMMERCIAL,
    },
  ];
}

function createFallbackLongTailKeywords(mainKeyword: string): SEOKeyword[] {
  return [
    {
      keyword: `${mainKeyword} 初心者 始め方`,
      searchVolume: SearchVolume.LOW,
      competition: Competition.LOW,
      relevance: 0.85,
      difficulty: Difficulty.EASY,
      intent: SearchIntent.INFORMATIONAL,
    },
  ];
}

function createFallbackQuestionKeywords(mainKeyword: string): SEOKeyword[] {
  return [
    {
      keyword: `${mainKeyword}とは`,
      searchVolume: SearchVolume.MEDIUM,
      competition: Competition.MEDIUM,
      relevance: 0.9,
      difficulty: Difficulty.MODERATE,
      intent: SearchIntent.INFORMATIONAL,
    },
  ];
}

function createFallbackLSIKeywords(mainKeyword: string): string[] {
  return ['関連', '方法', '効果', '比較', 'おすすめ'];
}

