export enum Tone {
  POLITE = '丁寧で落ち着いた',
  FRIENDLY = 'フレンドリーで親しみやすい',
  PROFESSIONAL = '専門的で論理的',
}

export enum Audience {
  BEGINNER = '初心者向け',
  INTERMEDIATE = '中級者向け',
  EXPERT = '専門家向け',
}

export interface FormData {
  keyword: string;
  tone: Tone;
  audience: Audience;
  targetLength: number;
}

export interface ArticleOutline {
  title: string;
  metaDescription: string;
  introduction: string;
  sections: {
    heading: string;
    content: string;
  }[];
  faq: {
    question: string;
    answer: string;
  }[];
}

export interface FinalOutput {
    markdownContent: string;
    imageUrl: string;
    metaDescription: string;
}

export enum ProcessStep {
    IDLE = 'IDLE',
    ANALYZING = 'Google検索結果の分析中...',
    OUTLINING = '記事構成案の作成中...',
    WRITING = '記事本文の執筆中...',
    GENERATING_IMAGE_PROMPT = '画像プロンプトの生成中...',
    GENERATING_IMAGE = 'アイキャッチ画像の生成中...',
    DONE = '完了',
    ERROR = 'エラー',
}