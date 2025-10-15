/**
 * フォーマット関連のユーティリティ関数
 */

/**
 * 文字数をカウント
 * @param text - カウントするテキスト
 * @returns 文字数
 */
export function countCharacters(text: string): number {
  return text.length;
}

/**
 * Markdown形式のテキストから見出しを抽出
 * @param markdown - Markdownテキスト
 * @returns 見出しの配列
 */
export function extractHeadings(markdown: string): string[] {
  const headingRegex = /^#{1,6}\s+(.+)$/gm;
  const headings: string[] = [];
  let match;

  while ((match = headingRegex.exec(markdown)) !== null) {
    headings.push(match[1]);
  }

  return headings;
}

/**
 * テキストを指定文字数で切り詰め
 * @param text - 切り詰めるテキスト
 * @param maxLength - 最大文字数
 * @param ellipsis - 省略記号（デフォルト: '...'）
 * @returns 切り詰めたテキスト
 */
export function truncateText(text: string, maxLength: number, ellipsis: string = '...'): string {
  if (text.length <= maxLength) {
    return text;
  }
  return text.slice(0, maxLength - ellipsis.length) + ellipsis;
}

/**
 * 日付をフォーマット
 * @param date - フォーマットする日付
 * @param format - フォーマット形式（デフォルト: 'YYYY-MM-DD'）
 * @returns フォーマットされた日付文字列
 */
export function formatDate(date: Date, format: string = 'YYYY-MM-DD'): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');

  return format
    .replace('YYYY', String(year))
    .replace('MM', month)
    .replace('DD', day)
    .replace('HH', hours)
    .replace('mm', minutes);
}

/**
 * URLからドメイン名を抽出
 * @param url - URL文字列
 * @returns ドメイン名
 */
export function extractDomain(url: string): string {
  try {
    const urlObj = new URL(url);
    return urlObj.hostname;
  } catch {
    return '';
  }
}

