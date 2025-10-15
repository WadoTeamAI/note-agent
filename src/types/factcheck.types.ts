/**
 * ファクトチェック関連の型定義
 */

export interface FactCheckResult {
  id: string;
  claim: string;                    // チェック対象の主張・事実
  isVerified: boolean;              // 検証済みかどうか
  confidence: 'high' | 'medium' | 'low'; // 信頼度
  sources: FactCheckSource[];       // 参照ソース
  verdict: 'correct' | 'incorrect' | 'partially-correct' | 'unverified'; // 判定
  explanation: string;              // 説明
  suggestedCorrection?: string;     // 修正提案（incorrectの場合）
}

export interface FactCheckSource {
  title: string;
  url: string;
  snippet: string;
  publishedDate?: string;
  domain: string;
  relevanceScore: number;           // 関連性スコア（0-1）
}

export interface TavilySearchResult {
  query: string;
  results: TavilyResult[];
  answer?: string;                  // Tavilyの要約回答
}

export interface TavilyResult {
  title: string;
  url: string;
  content: string;
  score: number;
  published_date?: string;
}

export interface FactCheckRequest {
  articleContent: string;           // 記事全文
  claims: string[];                 // チェック対象の主張リスト
  keyword: string;                  // 記事のキーワード
}

export interface FactCheckSummary {
  totalClaims: number;
  verifiedClaims: number;
  unverifiedClaims: number;
  incorrectClaims: number;
  overallConfidence: 'high' | 'medium' | 'low';
  needsReview: boolean;             // レビューが必要かどうか
  results: FactCheckResult[];
}

