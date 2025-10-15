import React, { useState } from 'react';
import { FinalOutput } from '../types';

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
        <div className="bg-white p-4 md:p-6 rounded-lg shadow-md space-y-4 md:space-y-6">
            <h2 className="text-xl md:text-2xl font-bold text-gray-800 border-b pb-2">生成結果</h2>
            
            <div>
                <h3 className="text-base md:text-lg font-semibold text-gray-700 mb-2">アイキャッチ画像</h3>
                <img src={output.imageUrl} alt="Generated eyecatch" className="w-full h-auto object-cover rounded-md shadow-lg mb-3" />
                 <a href={output.imageUrl} download="eyecatch.png" className="inline-block bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded transition-colors text-sm md:text-base">
                    画像をダウンロード
                </a>
            </div>

            <div>
                 <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-2 gap-2">
                    <h3 className="text-base md:text-lg font-semibold text-gray-700">メタディスクリプション</h3>
                    <button 
                        onClick={handleCopyMeta}
                        className="bg-sky-500 hover:bg-sky-600 text-white font-bold py-2 px-4 rounded transition-colors text-sm md:text-base whitespace-nowrap"
                    >
                        {copiedMeta ? 'コピーしました！' : 'メタディスクリプションをコピー'}
                    </button>
                </div>
                <div className="bg-gray-50 p-4 rounded-md border border-gray-200 text-sm">
                    {output.metaDescription}
                </div>
            </div>

            <div>
                 <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-2 gap-2">
                    <h3 className="text-base md:text-lg font-semibold text-gray-700">記事本文 (Markdown)</h3>
                    <button 
                        onClick={handleCopyContent}
                        className="bg-indigo-500 hover:bg-indigo-600 text-white font-bold py-2 px-4 rounded transition-colors text-sm md:text-base whitespace-nowrap"
                    >
                        {copiedContent ? 'コピーしました！' : '記事本文をコピー'}
                    </button>
                </div>
                <pre className="bg-gray-50 p-3 md:p-4 rounded-md border border-gray-200 text-xs md:text-sm overflow-x-auto max-h-80 md:max-h-96">
                    <code>{output.markdownContent}</code>
                </pre>
            </div>

             <div>
                <h3 className="text-base md:text-lg font-semibold text-gray-700 mb-2">利用ガイド</h3>
                 <div className="bg-gray-50 p-3 md:p-4 rounded-md border border-gray-200 text-xs md:text-sm">
                    <pre className="whitespace-pre-wrap font-sans">{noteGuide}</pre>
                 </div>
            </div>
        </div>
    );
};

export default OutputDisplay;