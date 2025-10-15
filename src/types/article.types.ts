/**
 * 記事関連の型定義
 */

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
  xPosts?: XPost[];
  researchData?: ResearchData;
}

export interface XPost {
  target: string;
  text: string;
  type: 'short' | 'long' | 'thread';
}

export interface ResearchData {
  trends: string;
  seoKeywords: string[];
  notePopularPatterns: string;
}

