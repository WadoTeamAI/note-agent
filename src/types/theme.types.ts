/**
 * テーマ関連の型定義
 */

export enum Theme {
  LIGHT = 'light',
  DARK = 'dark',
  SYSTEM = 'system',
}

export interface ThemeColors {
  // 背景色
  background: {
    primary: string;
    secondary: string;
    tertiary: string;
    elevated: string;
  };
  
  // テキスト色
  text: {
    primary: string;
    secondary: string;
    tertiary: string;
    inverse: string;
  };
  
  // ボーダー色
  border: {
    primary: string;
    secondary: string;
    focus: string;
  };
  
  // ブランドカラー
  brand: {
    primary: string;
    secondary: string;
    accent: string;
  };
  
  // ステータスカラー
  status: {
    success: string;
    warning: string;
    error: string;
    info: string;
  };
  
  // グラデーション
  gradient: {
    primary: string;
    secondary: string;
    accent: string;
  };
}

export interface ThemeConfig {
  theme: Theme;
  colors: ThemeColors;
  isDark: boolean;
  systemPreference: 'light' | 'dark';
}

export interface ThemeContextValue {
  theme: Theme;
  effectiveTheme: 'light' | 'dark';
  isDark: boolean;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
}

