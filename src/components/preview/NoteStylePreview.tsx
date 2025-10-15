import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import rehypeSanitize from 'rehype-sanitize';
import '../../styles/note-preview.css';

interface NoteStylePreviewProps {
  title?: string;
  content: string;
  imageUrl?: string;
  author?: string;
  publishedAt?: string;
  readingTime?: number;
}

/**
 * note風デザインのプレビューコンポーネント
 * Markdownコンテンツをnote.comのようなスタイルで表示
 */
const NoteStylePreview: React.FC<NoteStylePreviewProps> = ({
  title,
  content,
  imageUrl,
  author = '執筆者',
  publishedAt,
  readingTime,
}) => {
  // 推定読了時間を計算（文字数から）
  const estimatedReadingTime = readingTime || Math.ceil(content.length / 600);

  // 公開日をフォーマット
  const formattedDate = publishedAt || new Date().toLocaleDateString('ja-JP', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <article className="note-preview-container">
      {/* ヘッダー部分 */}
      <header className="note-preview-header">
        {title && <h1 className="note-preview-title">{title}</h1>}
        <div className="note-preview-meta">
          <span className="note-preview-author">{author}</span>
          <span className="note-preview-separator">•</span>
          <span className="note-preview-date">{formattedDate}</span>
          <span className="note-preview-separator">•</span>
          <span className="note-preview-reading-time">{estimatedReadingTime}分で読めます</span>
        </div>
      </header>

      {/* アイキャッチ画像 */}
      {imageUrl && (
        <div className="note-preview-eyecatch-wrapper">
          <img 
            src={imageUrl} 
            alt={title || '記事のアイキャッチ画像'} 
            className="note-preview-eyecatch"
            loading="lazy"
          />
        </div>
      )}

      {/* 本文コンテンツ */}
      <div className="note-preview-content">
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          rehypePlugins={[rehypeRaw, rehypeSanitize]}
          components={{
            // カスタムレンダラー
            h1: ({ children }) => <h1>{children}</h1>,
            h2: ({ children }) => <h2>{children}</h2>,
            h3: ({ children }) => <h3>{children}</h3>,
            h4: ({ children }) => <h4>{children}</h4>,
            p: ({ children }) => <p>{children}</p>,
            a: ({ href, children }) => (
              <a href={href} target="_blank" rel="noopener noreferrer">
                {children}
              </a>
            ),
            img: ({ src, alt }) => (
              <img src={src} alt={alt || ''} loading="lazy" />
            ),
            code: ({ inline, className, children, ...props }: any) => {
              const match = /language-(\w+)/.exec(className || '');
              return !inline ? (
                <pre className={className}>
                  <code className={className} {...props}>
                    {children}
                  </code>
                </pre>
              ) : (
                <code className={className} {...props}>
                  {children}
                </code>
              );
            },
          }}
        >
          {content}
        </ReactMarkdown>
      </div>
    </article>
  );
};

export default NoteStylePreview;

