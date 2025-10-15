import React, { useState } from 'react';
import { useTheme } from '../../hooks/useTheme';
import { Theme } from '../../types/theme.types';

interface ThemeToggleProps {
  showLabel?: boolean;
  className?: string;
}

const ThemeToggle: React.FC<ThemeToggleProps> = ({ 
  showLabel = false, 
  className = '' 
}) => {
  const { theme, effectiveTheme, isDark, setTheme, toggleTheme } = useTheme();
  const [showMenu, setShowMenu] = useState(false);

  const handleQuickToggle = () => {
    toggleTheme();
    setShowMenu(false);
  };

  const handleThemeSelect = (selectedTheme: Theme) => {
    setTheme(selectedTheme);
    setShowMenu(false);
  };

  const getThemeIcon = () => {
    switch (theme) {
      case Theme.LIGHT:
        return '☀️';
      case Theme.DARK:
        return '🌙';
      case Theme.SYSTEM:
        return effectiveTheme === 'dark' ? '🌙' : '☀️';
      default:
        return '☀️';
    }
  };

  const getThemeLabel = () => {
    switch (theme) {
      case Theme.LIGHT:
        return 'ライトモード';
      case Theme.DARK:
        return 'ダークモード';
      case Theme.SYSTEM:
        return 'システム設定';
      default:
        return 'ライトモード';
    }
  };

  return (
    <div className={`relative ${className}`}>
      {/* メインボタン */}
      <button
        onClick={handleQuickToggle}
        onContextMenu={(e) => {
          e.preventDefault();
          setShowMenu(!showMenu);
        }}
        className={`
          flex items-center gap-2 px-4 py-2 rounded-lg font-medium
          transition-all duration-200 transform hover:scale-105
          ${isDark 
            ? 'bg-gray-700 hover:bg-gray-600 text-gray-100' 
            : 'bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white'
          }
          shadow-lg hover:shadow-xl
        `}
        title={`現在: ${getThemeLabel()}（右クリックで詳細メニュー）`}
      >
        <span className="text-xl">{getThemeIcon()}</span>
        {showLabel && <span className="text-sm">{getThemeLabel()}</span>}
      </button>

      {/* ドロップダウンメニュー */}
      {showMenu && (
        <>
          {/* 背景オーバーレイ */}
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setShowMenu(false)}
          />
          
          {/* メニュー */}
          <div className={`
            absolute right-0 mt-2 w-48 rounded-lg shadow-2xl z-50 overflow-hidden
            ${isDark 
              ? 'bg-gray-800 border border-gray-700' 
              : 'bg-white border border-gray-200'
            }
          `}>
            <div className={`p-2 border-b ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
              <p className={`text-xs font-semibold ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                テーマ選択
              </p>
            </div>
            
            {/* ライトモード */}
            <button
              onClick={() => handleThemeSelect(Theme.LIGHT)}
              className={`
                w-full px-4 py-3 text-left flex items-center gap-3 transition-colors
                ${theme === Theme.LIGHT 
                  ? isDark 
                    ? 'bg-gray-700 text-white' 
                    : 'bg-indigo-50 text-indigo-700'
                  : isDark 
                    ? 'text-gray-300 hover:bg-gray-700' 
                    : 'text-gray-700 hover:bg-gray-50'
                }
              `}
            >
              <span className="text-xl">☀️</span>
              <div className="flex-1">
                <div className="font-medium">ライトモード</div>
                <div className={`text-xs ${theme === Theme.LIGHT ? 'opacity-100' : 'opacity-60'}`}>
                  明るいテーマ
                </div>
              </div>
              {theme === Theme.LIGHT && (
                <svg className="w-5 h-5 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              )}
            </button>

            {/* ダークモード */}
            <button
              onClick={() => handleThemeSelect(Theme.DARK)}
              className={`
                w-full px-4 py-3 text-left flex items-center gap-3 transition-colors
                ${theme === Theme.DARK 
                  ? isDark 
                    ? 'bg-gray-700 text-white' 
                    : 'bg-indigo-50 text-indigo-700'
                  : isDark 
                    ? 'text-gray-300 hover:bg-gray-700' 
                    : 'text-gray-700 hover:bg-gray-50'
                }
              `}
            >
              <span className="text-xl">🌙</span>
              <div className="flex-1">
                <div className="font-medium">ダークモード</div>
                <div className={`text-xs ${theme === Theme.DARK ? 'opacity-100' : 'opacity-60'}`}>
                  暗いテーマ
                </div>
              </div>
              {theme === Theme.DARK && (
                <svg className="w-5 h-5 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              )}
            </button>

            {/* システム設定 */}
            <button
              onClick={() => handleThemeSelect(Theme.SYSTEM)}
              className={`
                w-full px-4 py-3 text-left flex items-center gap-3 transition-colors
                ${theme === Theme.SYSTEM 
                  ? isDark 
                    ? 'bg-gray-700 text-white' 
                    : 'bg-indigo-50 text-indigo-700'
                  : isDark 
                    ? 'text-gray-300 hover:bg-gray-700' 
                    : 'text-gray-700 hover:bg-gray-50'
                }
              `}
            >
              <span className="text-xl">💻</span>
              <div className="flex-1">
                <div className="font-medium">システム設定</div>
                <div className={`text-xs ${theme === Theme.SYSTEM ? 'opacity-100' : 'opacity-60'}`}>
                  OS設定に従う
                </div>
              </div>
              {theme === Theme.SYSTEM && (
                <svg className="w-5 h-5 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              )}
            </button>

            {/* ヒント */}
            <div className={`p-3 border-t ${isDark ? 'border-gray-700 bg-gray-900' : 'border-gray-200 bg-gray-50'}`}>
              <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                💡 クリックで簡単切り替え<br />
                右クリックで詳細設定
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default ThemeToggle;

