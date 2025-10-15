/**
 * 図解表示コンポーネント
 * Mermaid.jsで生成された図解をレンダリング
 */

import React, { useEffect, useRef, useState } from 'react';
import mermaid from 'mermaid';
import { DiagramResult } from '../../services/diagram/diagramService';

interface DiagramDisplayProps {
  diagrams: DiagramResult[];
  onCopyDiagram?: (diagram: DiagramResult) => void;
  className?: string;
}

export const DiagramDisplay: React.FC<DiagramDisplayProps> = ({
  diagrams,
  onCopyDiagram,
  className = ''
}) => {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [expandedDiagrams, setExpandedDiagrams] = useState<Set<number>>(new Set());

  useEffect(() => {
    // Mermaidを初期化
    mermaid.initialize({
      startOnLoad: false,
      theme: 'default',
      securityLevel: 'loose',
      themeVariables: {
        primaryColor: '#3b82f6',
        primaryTextColor: '#1f2937',
        primaryBorderColor: '#e5e7eb',
        lineColor: '#6b7280',
        secondaryColor: '#f3f4f6',
        tertiaryColor: '#ffffff'
      }
    });
  }, []);

  const handleCopyDiagram = async (diagram: DiagramResult) => {
    try {
      await navigator.clipboard.writeText(diagram.mermaidCode);
      setCopiedId(`${diagram.type}-${diagram.insertPosition || 0}`);
      setTimeout(() => setCopiedId(null), 2000);
      
      if (onCopyDiagram) {
        onCopyDiagram(diagram);
      }
    } catch (error) {
      console.error('Failed to copy diagram:', error);
    }
  };

  const handleCopySVG = async (diagram: DiagramResult) => {
    try {
      await navigator.clipboard.writeText(diagram.svgContent);
      setCopiedId(`svg-${diagram.type}-${diagram.insertPosition || 0}`);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (error) {
      console.error('Failed to copy SVG:', error);
    }
  };

  const toggleExpanded = (index: number) => {
    const newExpanded = new Set(expandedDiagrams);
    if (newExpanded.has(index)) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
    }
    setExpandedDiagrams(newExpanded);
  };

  const getTypeIcon = (type: DiagramResult['type']): string => {
    switch (type) {
      case 'flowchart':
        return '📊';
      case 'sequence':
        return '🔄';
      case 'gantt':
        return '📅';
      case 'pie':
        return '🥧';
      case 'timeline':
        return '⏰';
      case 'mindmap':
        return '🧠';
      case 'gitgraph':
        return '🌿';
      default:
        return '📈';
    }
  };

  const getTypeLabel = (type: DiagramResult['type']): string => {
    switch (type) {
      case 'flowchart':
        return 'フローチャート';
      case 'sequence':
        return 'シーケンス図';
      case 'gantt':
        return 'ガントチャート';
      case 'pie':
        return '円グラフ';
      case 'timeline':
        return 'タイムライン';
      case 'mindmap':
        return 'マインドマップ';
      case 'gitgraph':
        return 'Git図';
      default:
        return '図解';
    }
  };

  if (diagrams.length === 0) {
    return (
      <div className={`bg-gray-50 border border-gray-200 rounded-lg p-6 text-center ${className}`}>
        <svg
          className="mx-auto h-12 w-12 text-gray-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
          />
        </svg>
        <p className="mt-2 text-sm text-gray-500">
          図解が生成されませんでした
        </p>
        <p className="text-xs text-gray-400 mt-1">
          記事内容にプロセス、比較、時系列などの要素がある場合に自動生成されます
        </p>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium text-gray-900">
          📊 生成された図解 ({diagrams.length}件)
        </h3>
        <div className="text-xs text-gray-500">
          記事内容から自動生成
        </div>
      </div>

      {diagrams.map((diagram, index) => {
        const isExpanded = expandedDiagrams.has(index);
        const diagramId = `${diagram.type}-${diagram.insertPosition || 0}`;
        const isCopied = copiedId === diagramId;
        const isSVGCopied = copiedId === `svg-${diagramId}`;

        return (
          <div
            key={index}
            className="bg-white border border-gray-200 rounded-lg overflow-hidden"
          >
            {/* ヘッダー */}
            <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <span className="text-2xl">{getTypeIcon(diagram.type)}</span>
                  <div>
                    <h4 className="text-sm font-medium text-gray-900">
                      {diagram.title}
                    </h4>
                    <p className="text-xs text-gray-500">
                      {getTypeLabel(diagram.type)} • {diagram.description}
                    </p>
                    {diagram.insertPosition !== undefined && (
                      <p className="text-xs text-blue-600">
                        段落 {diagram.insertPosition + 1} の後に挿入推奨
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handleCopyDiagram(diagram)}
                    className={`px-3 py-1 text-xs rounded transition-colors ${
                      isCopied
                        ? 'bg-green-100 text-green-800'
                        : 'bg-blue-100 text-blue-800 hover:bg-blue-200'
                    }`}
                  >
                    {isCopied ? '✓ コピー済み' : 'コードをコピー'}
                  </button>

                  <button
                    onClick={() => handleCopySVG(diagram)}
                    className={`px-3 py-1 text-xs rounded transition-colors ${
                      isSVGCopied
                        ? 'bg-green-100 text-green-800'
                        : 'bg-purple-100 text-purple-800 hover:bg-purple-200'
                    }`}
                  >
                    {isSVGCopied ? '✓ SVGコピー済み' : 'SVGをコピー'}
                  </button>

                  <button
                    onClick={() => toggleExpanded(index)}
                    className="p-1 text-gray-400 hover:text-gray-600 rounded"
                  >
                    <svg
                      className={`w-4 h-4 transform transition-transform ${
                        isExpanded ? 'rotate-180' : ''
                      }`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  </button>
                </div>
              </div>
            </div>

            {/* 図解表示 */}
            <div className="p-4">
              {/* SVG表示 */}
              <div className="bg-white border border-gray-200 rounded-lg p-4 mb-4 overflow-x-auto">
                <div
                  dangerouslySetInnerHTML={{ __html: diagram.svgContent }}
                  className="flex justify-center"
                />
              </div>

              {/* Mermaidコード表示（展開時） */}
              {isExpanded && (
                <div className="space-y-3">
                  <h5 className="text-sm font-medium text-gray-700">
                    Mermaidコード:
                  </h5>
                  <div className="bg-gray-50 border border-gray-200 rounded p-3">
                    <pre className="text-xs text-gray-700 whitespace-pre-wrap font-mono">
                      {diagram.mermaidCode}
                    </pre>
                  </div>

                  <div className="text-xs text-gray-500 space-y-1">
                    <p>💡 <strong>使い方:</strong></p>
                    <ul className="list-disc list-inside space-y-1 ml-2">
                      <li>「コードをコピー」でMermaidコードをコピーし、記事内に貼り付け</li>
                      <li>「SVGをコピー」で画像として貼り付け</li>
                      <li>noteの場合は画像として挿入してください</li>
                    </ul>
                  </div>
                </div>
              )}
            </div>
          </div>
        );
      })}

      {/* 使用方法ガイド */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="text-sm font-medium text-blue-900 mb-2">
          📋 図解の活用方法
        </h4>
        <div className="text-xs text-blue-800 space-y-1">
          <p>• <strong>プロセス図</strong>: 手順や流れを視覚的に説明</p>
          <p>• <strong>比較図</strong>: 選択肢やメリット・デメリットを整理</p>
          <p>• <strong>タイムライン</strong>: 時系列の変化を表現</p>
          <p>• <strong>マインドマップ</strong>: 概念の関係性を整理</p>
        </div>
      </div>
    </div>
  );
};