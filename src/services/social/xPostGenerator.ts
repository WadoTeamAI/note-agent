/**
 * X（Twitter）投稿生成サービス
 * 短文、長文、スレッド形式のポストを自動生成
 */

import { GoogleGenAI } from "@google/genai";
import { XPost, XThread, XPostGenerationResult, XPostGenerationOptions } from '../../types/social.types';

// 環境変数からAPIキーを取得
function getApiKey(): string {
  const apiKey = process.env.API_KEY || process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('Gemini APIキーが設定されていません。.env.localファイルにGEMINI_API_KEYを設定してください。');
  }
  return apiKey;
}

/**
 * X投稿を生成
 */
export async function generateXPosts(options: XPostGenerationOptions): Promise<XPostGenerationResult> {
  const { keyword, articleTitle, articleSummary, tone, targetAudiences } = options;

  try {
    // 短文ポスト生成（140文字以内、5パターン）
    const shortPosts = await generateShortPosts(keyword, articleTitle, articleSummary, tone, targetAudiences);
    
    // 長文ポスト生成（300-500文字、2パターン）
    const longPosts = await generateLongPosts(keyword, articleTitle, articleSummary, tone);
    
    // スレッド形式生成（5-7ツイート、1-2パターン）
    const threads = await generateThreads(keyword, articleTitle, articleSummary, tone);
    
    // 投稿時間提案
    const scheduleSuggestion = suggestPostingTime();

    return {
      shortPosts,
      longPosts,
      threads,
      scheduleSuggestion,
    };
  } catch (error) {
    console.error('X投稿生成エラー:', error);
    throw new Error(`X投稿の生成に失敗しました: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * 短文ポスト生成（140文字以内）
 */
async function generateShortPosts(
  keyword: string,
  articleTitle: string,
  articleSummary: string,
  tone: string,
  targetAudiences: string[]
): Promise<XPost[]> {
  const prompt = `
以下の記事に関する、X（Twitter）用の短文投稿を5パターン生成してください。

記事情報:
- キーワード: ${keyword}
- タイトル: ${articleTitle}
- 概要: ${articleSummary}
- トーン: ${tone}

要件:
1. 各投稿は140文字以内（絵文字・ハッシュタグ含む）
2. ターゲット層ごとに訴求内容を変える: ${targetAudiences.join(', ')}
3. 絵文字を適度に使用（1-3個）
4. ハッシュタグは2-4個
5. クリックしたくなる訴求力のある文章
6. 各投稿は異なるアプローチで書く

JSON形式で出力してください:
{
  "posts": [
    {
      "target": "ターゲット層",
      "text": "投稿本文（ハッシュタグ含む）",
      "hashtags": ["ハッシュタグ1", "ハッシュタグ2"],
      "characterCount": 文字数
    }
  ]
}
`;

  const ai = new GoogleGenAI({ apiKey: getApiKey() });
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: prompt,
  });
  const text = response.text;
  
  // JSON抽出
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error('JSON形式のレスポンスが取得できませんでした');
  }
  
  const parsed = JSON.parse(jsonMatch[0]);
  
  return parsed.posts.map((post: any, index: number) => ({
    id: `short-${index + 1}`,
    type: 'short' as const,
    target: post.target,
    text: post.text,
    hashtags: post.hashtags || [],
    estimatedEngagement: estimateEngagement(post.text),
    characterCount: post.characterCount || post.text.length,
  }));
}

/**
 * 長文ポスト生成（300-500文字）
 */
async function generateLongPosts(
  keyword: string,
  articleTitle: string,
  articleSummary: string,
  tone: string
): Promise<XPost[]> {
  const prompt = `
以下の記事に関する、X（Twitter）用の長文投稿を2パターン生成してください。

記事情報:
- キーワード: ${keyword}
- タイトル: ${articleTitle}
- 概要: ${articleSummary}
- トーン: ${tone}

要件:
1. 各投稿は300-500文字
2. 記事の魅力を詳しく伝える
3. ストーリー性や具体例を含める
4. 読み手の興味を引く構成
5. 絵文字を適度に使用（3-5個）
6. ハッシュタグは3-5個
7. 2パターンは異なるアプローチ（例: ストーリー型 vs データ重視型）

JSON形式で出力してください:
{
  "posts": [
    {
      "target": "アプローチ（ストーリー型/データ型等）",
      "text": "投稿本文（ハッシュタグ含む）",
      "hashtags": ["ハッシュタグ1", "ハッシュタグ2"],
      "characterCount": 文字数
    }
  ]
}
`;

  const ai2 = new GoogleGenAI({ apiKey: getApiKey() });
  const response2 = await ai2.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: prompt,
  });
  const text = response2.text;
  
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error('JSON形式のレスポンスが取得できませんでした');
  }
  
  const parsed = JSON.parse(jsonMatch[0]);
  
  return parsed.posts.map((post: any, index: number) => ({
    id: `long-${index + 1}`,
    type: 'long' as const,
    target: post.target,
    text: post.text,
    hashtags: post.hashtags || [],
    estimatedEngagement: estimateEngagement(post.text),
    characterCount: post.characterCount || post.text.length,
  }));
}

/**
 * スレッド形式生成（5-7ツイート）
 */
async function generateThreads(
  keyword: string,
  articleTitle: string,
  articleSummary: string,
  tone: string
): Promise<XThread[]> {
  const prompt = `
以下の記事に関する、X（Twitter）用のスレッド投稿を2パターン生成してください。

記事情報:
- キーワード: ${keyword}
- タイトル: ${articleTitle}
- 概要: ${articleSummary}
- トーン: ${tone}

要件:
1. 各スレッドは5-7ツイート
2. 1ツイート目は引きのある導入（140文字以内）
3. 2-6ツイート目は内容の展開（各280文字以内）
4. 最終ツイートはCTA（行動喚起）と記事リンク誘導
5. 各ツイートは独立しても意味が通じる
6. 絵文字や番号で読みやすく
7. 2パターンは異なる構成（例: 問題提起型 vs ハウツー型）

JSON形式で出力してください:
{
  "threads": [
    {
      "type": "スレッドタイプ（問題提起型/ハウツー型等）",
      "tweets": [
        "1ツイート目（引き）",
        "2ツイート目（展開）",
        "3ツイート目（展開）",
        "..."
      ]
    }
  ]
}
`;

  const ai3 = new GoogleGenAI({ apiKey: getApiKey() });
  const response3 = await ai3.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: prompt,
  });
  const text = response3.text;
  
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error('JSON形式のレスポンスが取得できませんでした');
  }
  
  const parsed = JSON.parse(jsonMatch[0]);
  
  return parsed.threads.map((thread: any, index: number) => ({
    id: `thread-${index + 1}`,
    tweets: thread.tweets,
    totalCharacters: thread.tweets.join('').length,
    tweetCount: thread.tweets.length,
  }));
}

/**
 * エンゲージメント予測
 */
function estimateEngagement(text: string): 'low' | 'medium' | 'high' {
  let score = 0;
  
  // 絵文字の使用
  if (/[\u{1F300}-\u{1F9FF}]/u.test(text)) score += 1;
  
  // 問いかけ
  if (/？/.test(text)) score += 1;
  
  // 数字の使用
  if (/\d+/.test(text)) score += 1;
  
  // 「あなた」「みなさん」などの二人称
  if (/(あなた|みなさん|皆さん)/.test(text)) score += 1;
  
  // 適切な長さ（80-120文字が最適）
  if (text.length >= 80 && text.length <= 120) score += 1;
  
  if (score >= 4) return 'high';
  if (score >= 2) return 'medium';
  return 'low';
}

/**
 * 投稿時間提案
 */
function suggestPostingTime(): string {
  const now = new Date();
  const dayOfWeek = now.getDay(); // 0: 日曜, 1: 月曜, ...
  const hour = now.getHours();
  
  // 曜日判定
  const dayName = ['日', '月', '火', '水', '木', '金', '土'][dayOfWeek];
  
  // エンゲージメントが高い時間帯を提案
  // 平日: 12-13時（ランチタイム）、19-21時（帰宅後）
  // 休日: 10-12時（午前）、20-22時（夜）
  
  let suggestedHour: number;
  let reason: string;
  
  if (dayOfWeek >= 1 && dayOfWeek <= 5) {
    // 平日
    if (hour < 12) {
      suggestedHour = 12;
      reason = 'ランチタイム・エンゲージメント率高';
    } else if (hour < 19) {
      suggestedHour = 19;
      reason = '帰宅後・閲覧数増加時間帯';
    } else {
      suggestedHour = 12; // 翌日のランチタイム
      reason = '翌日ランチタイム・エンゲージメント率高';
    }
  } else {
    // 休日
    if (hour < 10) {
      suggestedHour = 10;
      reason = '休日午前・リラックスタイム';
    } else if (hour < 20) {
      suggestedHour = 20;
      reason = '休日夜・ゆっくり閲覧時間帯';
    } else {
      suggestedHour = 10; // 翌日の午前
      reason = '翌日午前・リラックスタイム';
    }
  }
  
  const suggestedDate = new Date(now);
  if (suggestedHour < hour || (suggestedHour === 12 && hour >= 19)) {
    suggestedDate.setDate(suggestedDate.getDate() + 1);
  }
  suggestedDate.setHours(suggestedHour, 0, 0, 0);
  
  const formattedDate = `${suggestedDate.getFullYear()}-${String(suggestedDate.getMonth() + 1).padStart(2, '0')}-${String(suggestedDate.getDate()).padStart(2, '0')}`;
  const formattedTime = `${String(suggestedHour).padStart(2, '0')}:00`;
  
  return `${formattedDate} ${formattedTime} (${dayName}曜・${reason})`;
}

