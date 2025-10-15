/**
 * SEOキーワード関連の型定義
 */

export interface SEOKeyword {
  keyword: string;                   // キーワード
  searchVolume: SearchVolume;        // 検索ボリューム（推定）
  competition: Competition;          // 競合性
  relevance: number;                 // 関連性スコア（0-1）
  difficulty: Difficulty;            // SEO難易度
  intent: SearchIntent;              // 検索意図
}

export enum SearchVolume {
  VERY_LOW = 'very_low',    // 0-100
  LOW = 'low',              // 100-1,000
  MEDIUM = 'medium',        // 1,000-10,000
  HIGH = 'high',            // 10,000-100,000
  VERY_HIGH = 'very_high',  // 100,000+
}

export enum Competition {
  LOW = 'low',              // 低競合
  MEDIUM = 'medium',        // 中競合
  HIGH = 'high',            // 高競合
}

export enum Difficulty {
  EASY = 'easy',            // 容易（初心者向け）
  MODERATE = 'moderate',    // 中程度
  HARD = 'hard',            // 困難（上級者向け）
  VERY_HARD = 'very_hard',  // 非常に困難
}

export enum SearchIntent {
  INFORMATIONAL = 'informational',   // 情報収集型
  NAVIGATIONAL = 'navigational',     // ナビゲーション型
  TRANSACTIONAL = 'transactional',   // 取引型
  COMMERCIAL = 'commercial',         // 商業調査型
}

export interface SEOKeywordSet {
  mainKeyword: string;                    // メインキーワード
  relatedKeywords: SEOKeyword[];          // 関連キーワード（5-10個）
  longTailKeywords: SEOKeyword[];         // ロングテールキーワード（3-7個）
  questionKeywords: SEOKeyword[];         // 質問形式キーワード（3-5個）
  lsiKeywords: string[];                  // LSI（潜在意味インデックス）キーワード
  recommendedKeywords: SEOKeyword[];      // 推奨キーワード（上位3個）
  totalKeywordCount: number;              // 合計キーワード数
  generatedAt: string;                    // 生成日時
}

export interface KeywordAnalysisResult {
  keyword: string;
  analysis: {
    searchVolume: SearchVolume;
    competition: Competition;
    difficulty: Difficulty;
    intent: SearchIntent;
    relatedTerms: string[];
    commonQuestions: string[];
    trends: string;                       // トレンド情報
    seasonality: string;                  // 季節性
  };
}

export interface KeywordSuggestion {
  keyword: string;
  reason: string;                         // 推奨理由
  priority: 'high' | 'medium' | 'low';    // 優先度
}

export interface SEOKeywordGenerationOptions {
  mainKeyword: string;
  targetAudience?: string;                // ターゲット読者
  tone?: string;                          // トーン
  includeQuestions?: boolean;             // 質問形式を含めるか
  includeLongTail?: boolean;              // ロングテールを含めるか
  maxKeywords?: number;                   // 最大キーワード数
}

