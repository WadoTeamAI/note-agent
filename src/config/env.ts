/**
 * 環境変数管理
 */

export const env = {
  geminiApiKey: import.meta.env.VITE_GEMINI_API_KEY || '',
  googleSearchApiKey: import.meta.env.VITE_GOOGLE_SEARCH_API_KEY || '',
  searchEngineId: import.meta.env.VITE_SEARCH_ENGINE_ID || '',
  isDevelopment: import.meta.env.DEV,
  isProduction: import.meta.env.PROD,
} as const;

/**
 * 環境変数の検証
 */
export function validateEnv(): { isValid: boolean; missingVars: string[] } {
  const missingVars: string[] = [];

  if (!env.geminiApiKey) {
    missingVars.push('VITE_GEMINI_API_KEY');
  }

  return {
    isValid: missingVars.length === 0,
    missingVars,
  };
}

