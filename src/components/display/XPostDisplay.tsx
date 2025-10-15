import React, { useState } from 'react';
import { XPostGenerationResult } from '../../types/social.types';

interface XPostDisplayProps {
  xPosts: XPostGenerationResult;
}

const XPostDisplay: React.FC<XPostDisplayProps> = ({ xPosts }) => {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    });
  };

  const handleCopyAllShort = () => {
    const allShort = xPosts.shortPosts
      .map((post, i) => `【パターン${i + 1}: ${post.target}】\n${post.text}`)
      .join('\n\n---\n\n');
    navigator.clipboard.writeText(allShort).then(() => {
      setCopiedId('all-short');
      setTimeout(() => setCopiedId(null), 2000);
    });
  };

  const handleCopyAllLong = () => {
    const allLong = xPosts.longPosts
      .map((post, i) => `【パターン${i + 1}: ${post.target}】\n${post.text}`)
      .join('\n\n---\n\n');
    navigator.clipboard.writeText(allLong).then(() => {
      setCopiedId('all-long');
      setTimeout(() => setCopiedId(null), 2000);
    });
  };

  const handleCopyThread = (threadId: string) => {
    const thread = xPosts.threads.find(t => t.id === threadId);
    if (thread) {
      const threadText = thread.tweets
        .map((tweet, i) => `【${i + 1}/${thread.tweets.length}】\n${tweet}`)
        .join('\n\n---\n\n');
      navigator.clipboard.writeText(threadText).then(() => {
        setCopiedId(threadId);
        setTimeout(() => setCopiedId(null), 2000);
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* 投稿時間提案 */}
      {xPosts.scheduleSuggestion && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-blue-800 mb-2 flex items-center">
            ⏰ おすすめ投稿時間
          </h3>
          <p className="text-blue-700">{xPosts.scheduleSuggestion}</p>
        </div>
      )}

      {/* 短文ポスト（140文字以内） */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold text-gray-800">
            📱 短文ポスト（140文字以内）
          </h3>
          <button
            onClick={handleCopyAllShort}
            className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded transition-colors text-sm"
          >
            {copiedId === 'all-short' ? '✓ コピー完了！' : '全てコピー'}
          </button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {xPosts.shortPosts.map((post) => (
            <div
              key={post.id}
              className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition-colors"
            >
              <div className="flex justify-between items-start mb-2">
                <span className="text-xs font-semibold text-gray-600 bg-gray-100 px-2 py-1 rounded">
                  {post.target}
                </span>
                <span className={`text-xs font-mono ${
                  post.characterCount <= 140 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {post.characterCount}/140
                </span>
              </div>
              
              <p className="text-gray-800 mb-3 whitespace-pre-wrap">{post.text}</p>
              
              {post.hashtags.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-3">
                  {post.hashtags.map((tag, i) => (
                    <span key={i} className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                      {tag}
                    </span>
                  ))}
                </div>
              )}
              
              <div className="flex justify-between items-center">
                {post.estimatedEngagement && (
                  <span className={`text-xs font-semibold ${
                    post.estimatedEngagement === 'high' ? 'text-green-600' :
                    post.estimatedEngagement === 'medium' ? 'text-yellow-600' :
                    'text-gray-600'
                  }`}>
                    エンゲージメント予測: {
                      post.estimatedEngagement === 'high' ? '高 🔥' :
                      post.estimatedEngagement === 'medium' ? '中 👍' :
                      '低 📊'
                    }
                  </span>
                )}
                
                <button
                  onClick={() => handleCopy(post.text, post.id)}
                  className="bg-indigo-500 hover:bg-indigo-600 text-white font-bold py-1 px-3 rounded text-sm transition-colors"
                >
                  {copiedId === post.id ? '✓' : 'コピー'}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 長文ポスト（300-500文字） */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold text-gray-800">
            📄 長文ポスト（300-500文字）
          </h3>
          <button
            onClick={handleCopyAllLong}
            className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded transition-colors text-sm"
          >
            {copiedId === 'all-long' ? '✓ コピー完了！' : '全てコピー'}
          </button>
        </div>
        
        <div className="space-y-4">
          {xPosts.longPosts.map((post) => (
            <div
              key={post.id}
              className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition-colors"
            >
              <div className="flex justify-between items-start mb-2">
                <span className="text-sm font-semibold text-gray-600 bg-gray-100 px-3 py-1 rounded">
                  {post.target}
                </span>
                <span className={`text-sm font-mono ${
                  post.characterCount >= 300 && post.characterCount <= 500
                    ? 'text-green-600'
                    : 'text-yellow-600'
                }`}>
                  {post.characterCount}文字
                </span>
              </div>
              
              <p className="text-gray-800 mb-3 whitespace-pre-wrap leading-relaxed">
                {post.text}
              </p>
              
              {post.hashtags.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-3">
                  {post.hashtags.map((tag, i) => (
                    <span key={i} className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                      {tag}
                    </span>
                  ))}
                </div>
              )}
              
              <div className="flex justify-between items-center">
                {post.estimatedEngagement && (
                  <span className={`text-xs font-semibold ${
                    post.estimatedEngagement === 'high' ? 'text-green-600' :
                    post.estimatedEngagement === 'medium' ? 'text-yellow-600' :
                    'text-gray-600'
                  }`}>
                    エンゲージメント予測: {
                      post.estimatedEngagement === 'high' ? '高 🔥' :
                      post.estimatedEngagement === 'medium' ? '中 👍' :
                      '低 📊'
                    }
                  </span>
                )}
                
                <button
                  onClick={() => handleCopy(post.text, post.id)}
                  className="bg-indigo-500 hover:bg-indigo-600 text-white font-bold py-2 px-4 rounded transition-colors"
                >
                  {copiedId === post.id ? '✓ コピー完了' : 'コピー'}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* スレッド形式 */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-xl font-bold text-gray-800 mb-4">
          🧵 スレッド形式（連続投稿）
        </h3>
        
        <div className="space-y-6">
          {xPosts.threads.map((thread) => (
            <div
              key={thread.id}
              className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition-colors"
            >
              <div className="flex justify-between items-center mb-4">
                <div className="flex items-center gap-3">
                  <span className="text-sm font-semibold text-gray-600 bg-gray-100 px-3 py-1 rounded">
                    {thread.tweetCount}ツイート
                  </span>
                  <span className="text-sm text-gray-500">
                    合計: {thread.totalCharacters}文字
                  </span>
                </div>
                <button
                  onClick={() => handleCopyThread(thread.id)}
                  className="bg-indigo-500 hover:bg-indigo-600 text-white font-bold py-2 px-4 rounded transition-colors"
                >
                  {copiedId === thread.id ? '✓ コピー完了' : 'スレッド全体をコピー'}
                </button>
              </div>
              
              <div className="space-y-3">
                {thread.tweets.map((tweet, index) => (
                  <div key={index} className="relative pl-8 pb-3">
                    {/* 連続線 */}
                    {index < thread.tweets.length - 1 && (
                      <div className="absolute left-3 top-8 bottom-0 w-0.5 bg-blue-200"></div>
                    )}
                    
                    {/* ツイート番号 */}
                    <div className="absolute left-0 top-0 w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-bold">
                      {index + 1}
                    </div>
                    
                    {/* ツイート内容 */}
                    <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                      <p className="text-gray-800 whitespace-pre-wrap text-sm">
                        {tweet}
                      </p>
                      <span className="text-xs text-gray-500 mt-2 inline-block">
                        {tweet.length}文字
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 使い方ガイド */}
      <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
        <h4 className="font-semibold text-gray-700 mb-2">💡 投稿のコツ</h4>
        <ul className="text-sm text-gray-600 space-y-1 list-disc list-inside">
          <li><strong>短文ポスト</strong>: すぐに投稿したい場合に最適。エンゲージメント予測を参考に選択</li>
          <li><strong>長文ポスト</strong>: 詳しく伝えたい場合に使用。ストーリー性があると反応が良い</li>
          <li><strong>スレッド形式</strong>: 段階的に情報を展開。1ツイート目で引きつけることが重要</li>
          <li><strong>投稿時間</strong>: 提案された時間帯が最もエンゲージメントが高い傾向</li>
          <li><strong>ハッシュタグ</strong>: 関連性の高いものを2-4個使用すると発見されやすい</li>
        </ul>
      </div>
    </div>
  );
};

export default XPostDisplay;

