/**
 * 環境変数管理
 */

export const env = {
  geminiApiKey: process.env.NEXT_PUBLIC_GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY || '',
  googleSearchApiKey: process.env.NEXT_PUBLIC_GOOGLE_SEARCH_API_KEY || process.env.VITE_GOOGLE_SEARCH_API_KEY || '',
  searchEngineId: process.env.NEXT_PUBLIC_SEARCH_ENGINE_ID || process.env.VITE_SEARCH_ENGINE_ID || '',
  isDevelopment: process.env.NODE_ENV === 'development',
  isProduction: process.env.NODE_ENV === 'production',
} as const;

/**
 * 環境変数の検証
 */
export function validateEnv(): { isValid: boolean; missingVars: string[] } {
  const missingVars: string[] = [];

  if (!env.geminiApiKey) {
    missingVars.push('NEXT_PUBLIC_GEMINI_API_KEY or VITE_GEMINI_API_KEY');
  }

  return {
    isValid: missingVars.length === 0,
    missingVars,
  };
}

