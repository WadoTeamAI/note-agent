import React, { useState } from 'react';
import { FinalOutput } from '../../types';

interface NoteAutoPostProps {
    output: FinalOutput;
    onPostComplete?: (postUrl: string) => void;
    onError?: (error: string) => void;
}

interface NotePostConfig {
    email: string;
    password: string;
    headless?: boolean;
}

const NoteAutoPost: React.FC<NoteAutoPostProps> = ({ output, onPostComplete, onError }) => {
    const [copiedAll, setCopiedAll] = useState(false);
    const [title, setTitle] = useState('');
    const [showGuide, setShowGuide] = useState(false);

    const extractTitleFromMarkdown = (markdown: string): string => {
        const titleMatch = markdown.match(/^#\s+(.+)/m);
        return titleMatch ? titleMatch[1] : '';
    };

    const suggestedTitle = extractTitleFromMarkdown(output.markdownContent);

    const handleCopyAll = async () => {
        const postTitle = title.trim() || suggestedTitle;
        const fullContent = `# ${postTitle}\n\n${output.markdownContent}`;
        
        try {
            await navigator.clipboard.writeText(fullContent);
            setCopiedAll(true);
            setTimeout(() => setCopiedAll(false), 2000);
        } catch (error) {
            onError?.('コピーに失敗しました。');
        }
    };

    const openNoteNewPost = () => {
        window.open('https://note.com/post', '_blank');
        onPostComplete?.('https://note.com/post');
    };


    return (
        <div className="backdrop-blur-sm bg-white/50 p-6 rounded-xl border border-white/30 space-y-6">
            <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent flex items-center">
                    <svg className="w-6 h-6 mr-2 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                    </svg>
                    📝 note簡単投稿
                </h3>
                <button
                    onClick={() => setShowGuide(!showGuide)}
                    className="text-sm text-gray-600 hover:text-gray-800 transition-colors"
                >
                    {showGuide ? 'ガイドを隠す' : 'ガイドを表示'}
                </button>
            </div>

            {/* Title suggestion */}
            {suggestedTitle && (
                <div className="p-4 backdrop-blur-sm bg-blue-50/60 rounded-xl border border-blue-200/30">
                    <div className="flex items-center space-x-2 text-sm text-blue-700 mb-2">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                        </svg>
                        <span>記事から抽出されたタイトル: <strong>{suggestedTitle}</strong></span>
                    </div>
                </div>
            )}

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    記事タイトル（カスタマイズ可能）
                </label>
                <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder={suggestedTitle || "記事のタイトルを入力してください"}
                    className="w-full px-4 py-3 backdrop-blur-sm bg-white/60 border border-white/30 rounded-xl shadow-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                />
            </div>

            {/* Copy and Open buttons */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <button
                    onClick={handleCopyAll}
                    className={`inline-flex items-center justify-center font-bold py-4 px-6 rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-[1.02] active:scale-[0.98] ${
                        copiedAll 
                            ? 'bg-gradient-to-r from-green-500 to-green-600 text-white' 
                            : 'bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 hover:from-indigo-600 hover:via-purple-600 hover:to-pink-600 text-white'
                    }`}
                >
                    {copiedAll ? (
                        <>
                            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            コピーしました！
                        </>
                    ) : (
                        <>
                            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                            </svg>
                            記事をコピー
                        </>
                    )}
                </button>

                <button
                    onClick={openNoteNewPost}
                    className="inline-flex items-center justify-center bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-bold py-4 px-6 rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-[1.02] active:scale-[0.98]"
                >
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                    noteを開く
                </button>
            </div>

            {/* Quick guide */}
            {showGuide && (
                <div className="p-4 backdrop-blur-sm bg-green-50/60 rounded-xl border border-green-200/30">
                    <h4 className="font-bold text-green-800 mb-3 flex items-center">
                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        簡単投稿手順
                    </h4>
                    <ol className="text-sm text-green-700 space-y-2 list-decimal list-inside">
                        <li>上記の「記事をコピー」ボタンをクリック</li>
                        <li>「noteを開く」ボタンでnoteの投稿画面を開く</li>
                        <li>noteの投稿画面で右クリック→貼り付け（Ctrl+V）</li>
                        <li>アイキャッチ画像をダウンロードして追加</li>
                        <li>プレビューで確認後、公開または下書き保存</li>
                    </ol>
                    <div className="mt-3 text-xs text-green-600 flex items-center">
                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 0h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                        セキュリティ: 投稿データはブラウザでのみ処理され、サーバーには送信されません
                    </div>
                </div>
            )}

            <div className="text-xs text-gray-500 bg-yellow-50/60 p-3 rounded-lg border border-yellow-200/30">
                <strong>注意:</strong> 生成された内容の正確性は保証されません。投稿前に内容を十分確認してください。
                ブラウザのコピー機能を使用し、データは外部に送信されません。
            </div>
        </div>
    );
};

export default NoteAutoPost;