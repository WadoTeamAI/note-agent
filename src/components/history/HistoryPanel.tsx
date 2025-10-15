/**
 * 記事生成履歴表示パネル
 * Supabaseから履歴データを取得・表示
 */

import React, { useState, useEffect } from 'react';
import { getArticleHistory, getArticleHistoryDetail, deleteArticleHistory, isSupabaseAvailable, ArticleHistorySummary, ArticleHistoryRecord } from '../../services/database/historyService';
import { getFromLocalStorage } from '../../services/database/historyService';

interface HistoryPanelProps {
    isOpen: boolean;
    onClose: () => void;
    onSelectHistory?: (history: ArticleHistoryRecord) => void;
}

const HistoryPanel: React.FC<HistoryPanelProps> = ({ isOpen, onClose, onSelectHistory }) => {
    const [histories, setHistories] = useState<ArticleHistorySummary[]>([]);
    const [loading, setLoading] = useState(false);
    const [selectedHistory, setSelectedHistory] = useState<ArticleHistoryRecord | null>(null);
    const [detailLoading, setDetailLoading] = useState(false);

    // 履歴一覧を取得
    const fetchHistories = async () => {
        setLoading(true);
        try {
            if (isSupabaseAvailable()) {
                const data = await getArticleHistory({ limit: 50 });
                setHistories(data);
            } else {
                // LocalStorageフォールバック
                const localData = getFromLocalStorage();
                const formattedData = localData.map(item => ({
                    id: item.id,
                    created_at: item.created_at,
                    input_source: item.inputKeyword || item.inputYouTubeUrl || 'Unknown',
                    title: item.title,
                    input_audience: item.inputAudience,
                    input_tone: item.inputTone,
                    word_count: item.word_count,
                    generation_time_ms: item.generationTimeMs,
                    workflow_steps_count: item.workflowSteps?.length || 0
                }));
                setHistories(formattedData);
            }
        } catch (error) {
            console.error('履歴取得エラー:', error);
        } finally {
            setLoading(false);
        }
    };

    // 履歴詳細を取得
    const fetchHistoryDetail = async (id: string) => {
        setDetailLoading(true);
        try {
            const detail = await getArticleHistoryDetail(id);
            setSelectedHistory(detail);
        } catch (error) {
            console.error('履歴詳細取得エラー:', error);
        } finally {
            setDetailLoading(false);
        }
    };

    // 履歴削除
    const handleDelete = async (id: string) => {
        if (!confirm('この履歴を削除しますか？')) return;
        
        try {
            const success = await deleteArticleHistory(id);
            if (success) {
                setHistories(prev => prev.filter(h => h.id !== id));
                if (selectedHistory?.id === id) {
                    setSelectedHistory(null);
                }
            }
        } catch (error) {
            console.error('履歴削除エラー:', error);
        }
    };

    useEffect(() => {
        if (isOpen) {
            fetchHistories();
        }
    }, [isOpen]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex">
            {/* 履歴一覧パネル */}
            <div className="w-1/3 bg-white shadow-2xl overflow-y-auto">
                <div className="p-6 border-b border-gray-200">
                    <div className="flex justify-between items-center">
                        <h2 className="text-2xl font-bold text-gray-800">生成履歴</h2>
                        <button
                            onClick={onClose}
                            className="text-gray-500 hover:text-gray-700 text-2xl"
                        >
                            ×
                        </button>
                    </div>
                    {!isSupabaseAvailable() && (
                        <p className="text-sm text-orange-600 mt-2">
                            ⚠️ LocalStorage使用中（Supabase未設定）
                        </p>
                    )}
                </div>
                
                <div className="p-4">
                    {loading ? (
                        <div className="text-center py-8">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
                            <p className="mt-2 text-gray-600">読み込み中...</p>
                        </div>
                    ) : histories.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">
                            <p>履歴がありません</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {histories.map((history) => (
                                <div
                                    key={history.id}
                                    className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                                        selectedHistory?.id === history.id 
                                            ? 'border-indigo-500 bg-indigo-50' 
                                            : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                                    }`}
                                    onClick={() => fetchHistoryDetail(history.id)}
                                >
                                    <h3 className="font-semibold text-gray-800 truncate">
                                        {history.title}
                                    </h3>
                                    <p className="text-sm text-gray-600 truncate mt-1">
                                        {history.input_source}
                                    </p>
                                    <div className="flex justify-between items-center mt-2 text-xs text-gray-500">
                                        <span>{new Date(history.created_at).toLocaleDateString('ja-JP')}</span>
                                        <div className="flex gap-2">
                                            <span>{history.word_count}文字</span>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleDelete(history.id);
                                                }}
                                                className="text-red-500 hover:text-red-700"
                                            >
                                                削除
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* 履歴詳細パネル */}
            <div className="flex-1 bg-white overflow-y-auto">
                {detailLoading ? (
                    <div className="flex items-center justify-center h-full">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
                    </div>
                ) : selectedHistory ? (
                    <div className="p-6">
                        <div className="mb-6">
                            <h3 className="text-3xl font-bold text-gray-800 mb-2">
                                {selectedHistory.title}
                            </h3>
                            <p className="text-gray-600 mb-4">
                                {selectedHistory.meta_description}
                            </p>
                            
                            {/* メタ情報 */}
                            <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg text-sm">
                                <div>
                                    <span className="font-semibold">入力:</span> {selectedHistory.input_keyword || selectedHistory.input_youtube_url}
                                </div>
                                <div>
                                    <span className="font-semibold">対象:</span> {selectedHistory.input_audience}
                                </div>
                                <div>
                                    <span className="font-semibold">文体:</span> {selectedHistory.input_tone}
                                </div>
                                <div>
                                    <span className="font-semibold">文字数:</span> {selectedHistory.word_count}文字
                                </div>
                                <div>
                                    <span className="font-semibold">生成時間:</span> {
                                        selectedHistory.generation_time_ms 
                                            ? `${(selectedHistory.generation_time_ms / 1000).toFixed(1)}秒`
                                            : '不明'
                                    }
                                </div>
                                <div>
                                    <span className="font-semibold">作成日時:</span> {
                                        new Date(selectedHistory.created_at || '').toLocaleString('ja-JP')
                                    }
                                </div>
                            </div>
                        </div>

                        {/* アクションボタン */}
                        <div className="mb-6 flex gap-3">
                            {onSelectHistory && (
                                <button
                                    onClick={() => {
                                        onSelectHistory(selectedHistory);
                                        onClose();
                                    }}
                                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                                >
                                    この記事を復元
                                </button>
                            )}
                            <button
                                onClick={() => {
                                    navigator.clipboard.writeText(selectedHistory.markdown_content);
                                    alert('記事内容をクリップボードにコピーしました');
                                }}
                                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                            >
                                記事をコピー
                            </button>
                        </div>

                        {/* 記事プレビュー */}
                        <div className="prose max-w-none">
                            <div className="bg-white border rounded-lg p-6">
                                <pre className="whitespace-pre-wrap font-sans text-sm text-gray-700 leading-relaxed">
                                    {selectedHistory.markdown_content}
                                </pre>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="flex items-center justify-center h-full text-gray-500">
                        <p>左の履歴を選択して詳細を表示</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default HistoryPanel;