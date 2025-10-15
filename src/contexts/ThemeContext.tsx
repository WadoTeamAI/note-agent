'use client';

import React, { createContext, useState, useEffect, ReactNode } from 'react';
import { Theme, ThemeContextValue } from '../types/theme.types';

const THEME_STORAGE_KEY = 'note-agent-theme';

export const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

interface ThemeProviderProps {
  children: ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  // LocalStorageから保存されたテーマを取得（デフォルトはsystem）
  const [theme, setThemeState] = useState<Theme>(() => {
    if (typeof window !== 'undefined') {
      const savedTheme = localStorage.getItem(THEME_STORAGE_KEY);
      return (savedTheme as Theme) || Theme.SYSTEM;
    }
    return Theme.SYSTEM;
  });

  // システムのダークモード設定を取得
  const [systemPreference, setSystemPreference] = useState<'light' | 'dark'>(() => {
    if (typeof window !== 'undefined') {
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return 'light';
  });

  // 実際に適用されるテーマ（systemの場合はシステム設定に従う）
  const effectiveTheme = theme === Theme.SYSTEM ? systemPreference : theme;
  const isDark = effectiveTheme === 'dark';

  // システムのダークモード設定を監視
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      
      const handleChange = (e: MediaQueryListEvent) => {
        setSystemPreference(e.matches ? 'dark' : 'light');
      };

      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    }
  }, []);

  // テーマをLocalStorageに保存
  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
    if (typeof window !== 'undefined') {
      localStorage.setItem(THEME_STORAGE_KEY, newTheme);
    }
  };

  // テーマをトグル（light <-> dark）
  const toggleTheme = () => {
    if (theme === Theme.SYSTEM) {
      // systemの場合は、現在のシステム設定の逆にする
      setTheme(systemPreference === 'dark' ? Theme.LIGHT : Theme.DARK);
    } else {
      setTheme(theme === Theme.LIGHT ? Theme.DARK : Theme.LIGHT);
    }
  };

  // HTMLのdata-theme属性を更新
  useEffect(() => {
    if (typeof window !== 'undefined') {
      document.documentElement.setAttribute('data-theme', effectiveTheme);
      
      // ダークモードクラスも追加（Tailwindとの互換性）
      if (isDark) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    }
  }, [effectiveTheme, isDark]);

  const value: ThemeContextValue = {
    theme,
    effectiveTheme,
    isDark,
    setTheme,
    toggleTheme,
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};

