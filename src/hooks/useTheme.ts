'use client';

import { useContext } from 'react';
import { ThemeContext } from '../contexts/ThemeContext';
import { ThemeContextValue } from '../types/theme.types';

/**
 * テーマを管理するカスタムフック
 * 
 * @returns ThemeContextValue - テーマの状態と操作関数
 * @throws Error - ThemeProviderの外で使用された場合
 * 
 * @example
 * ```tsx
 * const { theme, isDark, toggleTheme } = useTheme();
 * 
 * return (
 *   <button onClick={toggleTheme}>
 *     {isDark ? '🌙' : '☀️'}
 *   </button>
 * );
 * ```
 */
export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext);
  
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  
  return context;
}

