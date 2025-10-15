import React, { useState } from 'react';
import { FormData, Tone, Audience } from '../../types';
import { VariationType } from '../../types/abtest.types';

interface ABTestPanelProps {
  formData: FormData;
  onClose: () => void;
  onStart: (versionCount: number, variationTypes: VariationType[]) => void;
}

/**
 * A/Bテスト設定パネル
 * 複数バージョン生成の設定を行う
 */
const ABTestPanel: React.FC<ABTestPanelProps> = ({ formData, onClose, onStart }) => {
  const [versionCount, setVersionCount] = useState<number>(3);
  const [selectedTypes, setSelectedTypes] = useState<VariationType[]>([VariationType.TONE]);

  const variationOptions = [
    { 
      type: VariationType.TONE, 
      label: '文体のバリエーション', 
      description: '丁寧、フレンドリー、専門的な文体で生成',
      icon: '✍️'
    },
    { 
      type: VariationType.LENGTH, 
      label: '文字数のバリエーション', 
      description: '2,500字、5,000字、10,000字で生成',
      icon: '📏'
    },
    { 
      type: VariationType.STRUCTURE, 
      label: '構成のバリエーション', 
      description: '基本構成、問題解決型、ストーリー型',
      icon: '🏗️'
    },
    { 
      type: VariationType.ANGLE, 
      label: '切り口のバリエーション', 
      description: '実用重視、理論重視、体験重視',
      icon: '🎯'
    },
    { 
      type: VariationType.TARGET, 
      label: 'ターゲット読者のバリエーション', 
      description: '初心者向け、中級者向け、専門家向け',
      icon: '👥'
    },
  ];

  const handleTypeToggle = (type: VariationType) => {
    setSelectedTypes(prev => {
      if (prev.includes(type)) {
        // 最低1つは選択必須
        if (prev.length === 1) return prev;
        return prev.filter(t => t !== type);
      } else {
        return [...prev, type];
      }
    });
  };

  const handleStart = () => {
    onStart(versionCount, selectedTypes);
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        {/* ヘッダー */}
        <div className="sticky top-0 bg-gradient-to-r from-purple-600 to-pink-600 text-white p-6 rounded-t-2xl">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold mb-2">🧪 A/Bテスト設定</h2>
              <p className="text-purple-100">複数バージョンの記事を生成して比較</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* 現在の設定表示 */}
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 p-4 rounded-xl">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">📝 ベース設定</h3>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <span className="text-gray-600 dark:text-gray-400">キーワード:</span>
                <span className="ml-2 font-medium text-gray-900 dark:text-gray-100">{formData?.keyword || '-'}</span>
              </div>
              <div>
                <span className="text-gray-600 dark:text-gray-400">文体:</span>
                <span className="ml-2 font-medium text-gray-900 dark:text-gray-100">{formData?.tone || '-'}</span>
              </div>
              <div>
                <span className="text-gray-600 dark:text-gray-400">読者層:</span>
                <span className="ml-2 font-medium text-gray-900 dark:text-gray-100">{formData?.audience || '-'}</span>
              </div>
              <div>
                <span className="text-gray-600 dark:text-gray-400">目標文字数:</span>
                <span className="ml-2 font-medium text-gray-900 dark:text-gray-100">{formData?.targetLength?.toLocaleString() || '0'}字</span>
              </div>
            </div>
          </div>

          {/* バージョン数選択 */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
              📊 生成するバージョン数
            </label>
            <div className="flex gap-3">
              {[2, 3, 4, 5].map(count => (
                <button
                  key={count}
                  onClick={() => setVersionCount(count)}
                  className={`flex-1 py-3 px-4 rounded-xl font-bold transition-all ${
                    versionCount === count
                      ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg transform scale-105'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  {count}パターン
                </button>
              ))}
            </div>
          </div>

          {/* バリエーションタイプ選択 */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
              🎨 バリエーションタイプ（複数選択可）
            </label>
            <div className="space-y-3">
              {variationOptions.map(option => (
                <button
                  key={option.type}
                  onClick={() => handleTypeToggle(option.type)}
                  className={`w-full text-left p-4 rounded-xl border-2 transition-all ${
                    selectedTypes.includes(option.type)
                      ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20 shadow-md'
                      : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-purple-300 dark:hover:border-purple-700'
                  }`}
                >
                  <div className="flex items-start">
                    <div className="text-2xl mr-3">{option.icon}</div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <h4 className="font-bold text-gray-900 dark:text-gray-100">{option.label}</h4>
                        {selectedTypes.includes(option.type) && (
                          <svg className="w-5 h-5 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{option.description}</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* 推定生成時間 */}
          <div className="bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 p-4 rounded-xl">
            <div className="flex items-center">
              <svg className="w-5 h-5 text-orange-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-sm text-gray-700 dark:text-gray-300">
                推定生成時間: <strong className="text-orange-600 dark:text-orange-400">約{versionCount * 70}秒</strong>
                <span className="text-gray-500 ml-2">({versionCount}バージョン × 70秒/バージョン)</span>
              </span>
            </div>
          </div>

          {/* アクションボタン */}
          <div className="flex gap-3 pt-4">
            <button
              onClick={onClose}
              className="flex-1 py-3 px-6 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 font-bold rounded-xl transition-colors"
            >
              キャンセル
            </button>
            <button
              onClick={handleStart}
              disabled={selectedTypes.length === 0}
              className="flex-2 py-3 px-6 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-bold rounded-xl transition-all shadow-lg hover:shadow-xl transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              🚀 {versionCount}パターン生成を開始
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export { ABTestPanel };
export default ABTestPanel;
