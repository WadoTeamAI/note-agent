import React, { useState } from 'react';
import { FinalOutput } from '../../types';
import XPostDisplay from './XPostDisplay';

interface OutputDisplayProps {
    output: FinalOutput;
}

const OutputDisplay: React.FC<OutputDisplayProps> = ({ output }) => {
    const [copiedContent, setCopiedContent] = useState(false);
    const [copiedMeta, setCopiedMeta] = useState(false);

    const handleCopyContent = () => {
        navigator.clipboard.writeText(output.markdownContent).then(() => {
            setCopiedContent(true);
            setTimeout(() => setCopiedContent(false), 2000);
        });
    };

    const handleCopyMeta = () => {
        navigator.clipboard.writeText(output.metaDescription).then(() => {
            setCopiedMeta(true);
            setTimeout(() => setCopiedMeta(false), 2000);
        });
    };
    
    const noteGuide = `
### note投稿手順
1. 上記の「記事本文をコピー」ボタンをクリックします。
2. noteにログインし、「投稿」ボタンからテキスト投稿画面を開きます。
3. コピーした本文を貼り付けます。
4. アイキャッチ画像をダウンロードし、noteのヘッダー画像として設定します。
5. （任意）「メタディスクリプションをコピー」し、noteの「記事設定」→「詳細設定」→「記事の概要」に貼り付けます。
6. タイトルやハッシュタグなどを調整して公開します。

※生成された内容の正確性は保証されません。公開前に必ず内容を確認・修正してください。
    `;

    return (
        <div className="backdrop-blur-lg bg-white/70 p-6 md:p-8 rounded-2xl shadow-xl border border-white/20 space-y-6 md:space-y-8">
            <div className="text-center">
                <div className="w-16 h-16 mx-auto bg-gradient-to-r from-green-400 to-green-500 rounded-full flex items-center justify-center mb-4">
                    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                </div>
                <h2 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-green-600 via-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
                    生成完了！
                </h2>
                <p className="text-gray-600 text-lg">記事の生成が正常に完了しました</p>
            </div>
            
            {/* アイキャッチ画像 */}
            <div className="backdrop-blur-sm bg-white/50 p-6 rounded-xl border border-white/30">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                        🎨 アイキャッチ画像
                    </h3>
                </div>
                <div className="relative group">
                    <img 
                        src={output.imageUrl} 
                        alt="Generated eyecatch" 
                        className="w-full h-auto object-cover rounded-xl shadow-lg transition-transform duration-300 group-hover:scale-[1.02]" 
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                </div>
                <div className="mt-4">
                    <a 
                        href={output.imageUrl} 
                        download="eyecatch.png" 
                        className="inline-flex items-center bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-bold py-3 px-6 rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
                    >
                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        画像をダウンロード
                    </a>
                </div>
            </div>

            {/* メタディスクリプション */}
            <div className="backdrop-blur-sm bg-white/50 p-6 rounded-xl border border-white/30">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-4 gap-3">
                    <h3 className="text-xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                        📝 メタディスクリプション
                    </h3>
                    <button 
                        onClick={handleCopyMeta}
                        className={`inline-flex items-center font-bold py-3 px-6 rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 ${
                            copiedMeta 
                                ? 'bg-gradient-to-r from-green-500 to-green-600 text-white' 
                                : 'bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700 text-white'
                        }`}
                    >
                        {copiedMeta ? (
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
                                メタディスクリプションをコピー
                            </>
                        )}
                    </button>
                </div>
                <div className="backdrop-blur-sm bg-white/60 p-4 rounded-xl border border-white/20 text-gray-700 leading-relaxed">
                    {output.metaDescription}
                </div>
            </div>

            {/* 記事本文 */}
            <div className="backdrop-blur-sm bg-white/50 p-6 rounded-xl border border-white/30">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-4 gap-3">
                    <h3 className="text-xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                        ✍️ 記事本文 (Markdown)
                    </h3>
                    <button 
                        onClick={handleCopyContent}
                        className={`inline-flex items-center font-bold py-3 px-6 rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 ${
                            copiedContent 
                                ? 'bg-gradient-to-r from-green-500 to-green-600 text-white' 
                                : 'bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 hover:from-indigo-600 hover:via-purple-600 hover:to-pink-600 text-white'
                        }`}
                    >
                        {copiedContent ? (
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
                                記事本文をコピー
                            </>
                        )}
                    </button>
                </div>
                <div className="backdrop-blur-sm bg-white/60 p-4 rounded-xl border border-white/20 overflow-hidden">
                    <pre className="text-sm overflow-x-auto max-h-96 text-gray-700 font-mono leading-relaxed">
                        <code>{output.markdownContent}</code>
                    </pre>
                </div>
            </div>

            {/* X投稿 */}
            {output.xPosts && (
                <div className="backdrop-blur-sm bg-white/50 p-6 rounded-xl border border-white/30">
                    <h3 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-6 flex items-center">
                        <svg className="w-8 h-8 mr-3 text-blue-500" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                        </svg>
                        X（Twitter）投稿案
                    </h3>
                    <XPostDisplay xPosts={output.xPosts} />
                </div>
            )}

            {/* 利用ガイド */}
            <div className="backdrop-blur-sm bg-gradient-to-r from-blue-50/80 to-purple-50/80 p-6 rounded-xl border border-white/30">
                <h3 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-4 flex items-center">
                    <svg className="w-6 h-6 mr-2 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    📋 利用ガイド
                </h3>
                <div className="backdrop-blur-sm bg-white/60 p-4 rounded-xl border border-white/20">
                    <pre className="whitespace-pre-wrap font-sans text-sm text-gray-700 leading-relaxed">{noteGuide}</pre>
                </div>
            </div>
        </div>
    );
};

export default OutputDisplay;