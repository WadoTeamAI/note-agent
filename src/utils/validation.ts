/**
 * バリデーション関連のユーティリティ関数
 */

/**
 * メールアドレスの検証
 * @param email - 検証するメールアドレス
 * @returns 有効な場合true
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * URLの検証
 * @param url - 検証するURL
 * @returns 有効な場合true
 */
export function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

/**
 * YouTube URLの検証
 * @param url - 検証するURL
 * @returns YouTube URLの場合true
 */
export function isYouTubeUrl(url: string): boolean {
  const youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube\.com\/(watch\?v=|embed\/|v\/)|youtu\.be\/)[\w\-]+/;
  return youtubeRegex.test(url.trim());
}

/**
 * 文字列が空でないか検証
 * @param value - 検証する文字列
 * @returns 空でない場合true
 */
export function isNotEmpty(value: string): boolean {
  return value.trim().length > 0;
}

/**
 * 文字数の範囲検証
 * @param text - 検証するテキスト
 * @param min - 最小文字数
 * @param max - 最大文字数
 * @returns 範囲内の場合true
 */
export function isInCharacterRange(text: string, min: number, max: number): boolean {
  const length = text.length;
  return length >= min && length <= max;
}

/**
 * 数値の範囲検証
 * @param value - 検証する数値
 * @param min - 最小値
 * @param max - 最大値
 * @returns 範囲内の場合true
 */
export function isInNumberRange(value: number, min: number, max: number): boolean {
  return value >= min && value <= max;
}

/**
 * APIキーの検証
 * @param apiKey - 検証するAPIキー
 * @returns 有効な場合true
 */
export function isValidApiKey(apiKey: string): boolean {
  // 基本的な検証: 空でない、プレースホルダーでない、最小長チェック
  if (!apiKey || apiKey.trim().length === 0) {
    return false;
  }
  
  const placeholders = ['PLACEHOLDER', 'YOUR_API_KEY', 'your_api_key_here'];
  if (placeholders.some(p => apiKey.includes(p))) {
    return false;
  }
  
  // 最小長チェック（一般的なAPIキーは少なくとも20文字以上）
  return apiKey.length >= 20;
}

/**
 * フォームデータの検証
 * @param data - 検証するフォームデータ
 * @returns エラーメッセージの配列（エラーがない場合は空配列）
 */
export function validateFormData(data: {
  keyword: string;
  targetLength: number;
}): string[] {
  const errors: string[] = [];

  if (!isNotEmpty(data.keyword)) {
    errors.push('キーワードを入力してください');
  }

  if (!isInNumberRange(data.targetLength, 500, 20000)) {
    errors.push('文字数は500〜20,000の範囲で指定してください');
  }

  return errors;
}

