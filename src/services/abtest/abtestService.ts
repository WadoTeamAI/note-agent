/**
 * A/Bテスト機能サービス
 * 複数バージョンの記事を並行生成し、比較可能な形で提供
 */

import { v4 as uuidv4 } from 'uuid';
import { 
  ABTestRequest, 
  ABTestResult, 
  ABTestVersion, 
  ABTestStatus, 
  VariationType, 
  ABTestComparison 
} from '../../types/abtest.types';
import { Tone, Audience, FormData } from '../../types';
import * as geminiService from '../ai/geminiService';
import { generateXPosts } from '../social/xPostGenerator';
import { extractClaims, performFactCheck } from '../research/tavilyService';

export class ABTestService {
  /**
   * A/Bテストの実行
   */
  async runABTest(request: ABTestRequest): Promise<ABTestResult> {
    const testId = uuidv4();
    const startTime = Date.now();

    // バリエーションを生成
    const versions = this.generateVersions(request);

    const result: ABTestResult = {
      id: testId,
      originalRequest: request,
      versions,
      createdAt: new Date()
    };

    // 各バージョンを並行生成
    await Promise.allSettled(
      versions.map(version => this.generateVersion(version, request.keyword))
    );

    const endTime = Date.now();
    result.completedAt = new Date();
    result.totalGenerationTime = Math.round((endTime - startTime) / 1000);
    result.recommendedVersion = this.selectRecommendedVersion(versions);

    return result;
  }

  /**
   * バージョンのバリエーションを生成
   */
  private generateVersions(request: ABTestRequest): ABTestVersion[] {
    const versions: ABTestVersion[] = [];

    if (request.variationTypes.includes(VariationType.TONE)) {
      versions.push(...this.generateToneVariations(request));
    }

    if (request.variationTypes.includes(VariationType.LENGTH)) {
      versions.push(...this.generateLengthVariations(request));
    }

    if (request.variationTypes.includes(VariationType.STRUCTURE)) {
      versions.push(...this.generateStructureVariations(request));
    }

    if (request.variationTypes.includes(VariationType.ANGLE)) {
      versions.push(...this.generateAngleVariations(request));
    }

    if (request.variationTypes.includes(VariationType.TARGET)) {
      versions.push(...this.generateTargetVariations(request));
    }

    // 要求されたバージョン数に調整
    return versions.slice(0, request.versionCount);
  }

  /**
   * 文体バリエーション生成
   */
  private generateToneVariations(request: ABTestRequest): ABTestVersion[] {
    const tones = [Tone.POLITE, Tone.FRIENDLY, Tone.PROFESSIONAL];
    const variations: ABTestVersion[] = [];

    tones.forEach((tone, index) => {
      if (variations.length < request.versionCount) {
        variations.push({
          id: uuidv4(),
          versionName: String.fromCharCode(65 + index), // A, B, C
          description: `${tone}な文体で執筆`,
          parameters: {
            tone,
            audience: request.audience,
            targetLength: request.targetLength
          },
          status: ABTestStatus.PENDING
        });
      }
    });

    return variations;
  }

  /**
   * 文字数バリエーション生成
   */
  private generateLengthVariations(request: ABTestRequest): ABTestVersion[] {
    const lengths = [2500, 5000, 10000];
    const variations: ABTestVersion[] = [];

    lengths.forEach((length, index) => {
      if (variations.length < request.versionCount) {
        variations.push({
          id: uuidv4(),
          versionName: String.fromCharCode(65 + index),
          description: `${length.toLocaleString()}文字版`,
          parameters: {
            tone: request.tone,
            audience: request.audience,
            targetLength: length
          },
          status: ABTestStatus.PENDING
        });
      }
    });

    return variations;
  }

  /**
   * 構成バリエーション生成
   */
  private generateStructureVariations(request: ABTestRequest): ABTestVersion[] {
    const structures = [
      { name: 'A', desc: '基本構成', instruction: '導入→本論→結論の標準的な構成で執筆' },
      { name: 'B', desc: '問題解決型', instruction: '問題提起→解決策→実践方法の構成で執筆' },
      { name: 'C', desc: 'ストーリー型', instruction: '体験談から始まる物語形式の構成で執筆' }
    ];

    return structures.slice(0, request.versionCount).map(structure => ({
      id: uuidv4(),
      versionName: structure.name,
      description: structure.desc,
      parameters: {
        tone: request.tone,
        audience: request.audience,
        targetLength: request.targetLength,
        specialInstructions: structure.instruction
      },
      status: ABTestStatus.PENDING
    }));
  }

  /**
   * 切り口バリエーション生成
   */
  private generateAngleVariations(request: ABTestRequest): ABTestVersion[] {
    const angles = [
      { name: 'A', desc: '実用重視', instruction: '実践的な方法論と具体例を重視した切り口' },
      { name: 'B', desc: '理論重視', instruction: '背景理論と体系的な説明を重視した切り口' },
      { name: 'C', desc: '体験重視', instruction: '個人体験と感情的な共感を重視した切り口' }
    ];

    return angles.slice(0, request.versionCount).map(angle => ({
      id: uuidv4(),
      versionName: angle.name,
      description: angle.desc,
      parameters: {
        tone: request.tone,
        audience: request.audience,
        targetLength: request.targetLength,
        specialInstructions: angle.instruction
      },
      status: ABTestStatus.PENDING
    }));
  }

  /**
   * ターゲット読者バリエーション生成
   */
  private generateTargetVariations(request: ABTestRequest): ABTestVersion[] {
    const audiences = [Audience.BEGINNER, Audience.INTERMEDIATE, Audience.EXPERT];
    const variations: ABTestVersion[] = [];

    audiences.forEach((audience, index) => {
      if (variations.length < request.versionCount) {
        variations.push({
          id: uuidv4(),
          versionName: String.fromCharCode(65 + index),
          description: `${audience}読者向け`,
          parameters: {
            tone: request.tone,
            audience,
            targetLength: request.targetLength
          },
          status: ABTestStatus.PENDING
        });
      }
    });

    return variations;
  }

  /**
   * 個別バージョンの生成
   */
  private async generateVersion(version: ABTestVersion, keyword: string): Promise<void> {
    try {
      version.status = ABTestStatus.GENERATING;
      const startTime = Date.now();

      // SEO分析
      const analysis = await geminiService.analyzeSerpResults(keyword);

      // 記事構成生成（特別な指示がある場合は追加）
      let outline;
      if (version.parameters.specialInstructions) {
        outline = await geminiService.createArticleOutlineWithInstructions(
          analysis, 
          version.parameters.audience, 
          version.parameters.tone, 
          keyword,
          version.parameters.specialInstructions
        );
      } else {
        outline = await geminiService.createArticleOutline(
          analysis, 
          version.parameters.audience, 
          version.parameters.tone, 
          keyword
        );
      }

      // 本文生成
      const markdownContent = await geminiService.writeArticle(
        outline, 
        version.parameters.targetLength, 
        version.parameters.tone, 
        version.parameters.audience
      );

      // ファクトチェック
      const claims = await extractClaims(markdownContent, keyword);
      const factCheckSummary = await performFactCheck({
        articleContent: markdownContent,
        claims: claims,
        keyword: keyword,
      });

      // 画像生成
      const imagePrompt = await geminiService.createImagePrompt(outline.title, markdownContent, '記事内容に適した画像');
      const imageUrl = await geminiService.generateImage(imagePrompt);

      // X告知文生成
      const xPosts = await generateXPosts({
        keyword: keyword,
        articleTitle: outline.title,
        articleSummary: outline.metaDescription,
        tone: version.parameters.tone,
        targetAudiences: ['初心者', '中級者', 'ビジネスパーソン', '主婦・主夫', '学生'],
      });

      version.output = {
        markdownContent,
        imageUrl,
        metaDescription: outline.metaDescription,
        xPosts,
        factCheckSummary
      };

      const endTime = Date.now();
      version.generationTime = Math.round((endTime - startTime) / 1000);
      version.status = ABTestStatus.COMPLETED;

    } catch (error) {
      console.error(`Version ${version.versionName} generation failed:`, error);
      version.status = ABTestStatus.FAILED;
    }
  }

  /**
   * 推奨バージョンの選択
   */
  private selectRecommendedVersion(versions: ABTestVersion[]): string | undefined {
    const completedVersions = versions.filter(v => v.status === ABTestStatus.COMPLETED);
    
    if (completedVersions.length === 0) return undefined;

    // 簡単な評価ロジック（文字数と生成時間のバランス）
    const scored = completedVersions.map(version => {
      const wordCount = version.output?.markdownContent.length || 0;
      const generationTime = version.generationTime || Infinity;
      
      // スコア計算（文字数重視、生成時間は軽く考慮）
      const score = wordCount / Math.max(generationTime, 1);
      return { version, score };
    });

    scored.sort((a, b) => b.score - a.score);
    return scored[0].version.id;
  }

  /**
   * バージョン間比較分析
   */
  async compareVersions(versionA: ABTestVersion, versionB: ABTestVersion): Promise<ABTestComparison> {
    const comparison: ABTestComparison = {
      versionA,
      versionB,
      metrics: {
        readabilityScore: { 
          a: this.calculateReadabilityScore(versionA.output?.markdownContent || ''),
          b: this.calculateReadabilityScore(versionB.output?.markdownContent || '')
        },
        seoScore: { 
          a: this.calculateSEOScore(versionA.output?.markdownContent || ''),
          b: this.calculateSEOScore(versionB.output?.markdownContent || '')
        },
        engagementPrediction: { 
          a: this.predictEngagement(versionA),
          b: this.predictEngagement(versionB)
        },
        wordCount: { 
          a: versionA.output?.markdownContent.length || 0,
          b: versionB.output?.markdownContent.length || 0
        }
      },
      recommendation: ''
    };

    // 推奨を生成
    comparison.recommendation = this.generateRecommendation(comparison);

    return comparison;
  }

  /**
   * 読みやすさスコア計算（簡易版）
   */
  private calculateReadabilityScore(content: string): number {
    const sentences = content.split(/[。！？]/).length;
    const characters = content.length;
    const avgSentenceLength = characters / Math.max(sentences, 1);
    
    // 適度な文章長（50-100文字）を最適とする
    const optimalLength = 75;
    const penalty = Math.abs(avgSentenceLength - optimalLength) / optimalLength;
    return Math.max(0, 100 - penalty * 50);
  }

  /**
   * SEOスコア計算（簡易版）
   */
  private calculateSEOScore(content: string): number {
    const headings = (content.match(/^#+\s/gm) || []).length;
    const links = (content.match(/\[.*?\]\(.*?\)/g) || []).length;
    const images = (content.match(/!\[.*?\]\(.*?\)/g) || []).length;
    
    let score = 50; // ベーススコア
    score += Math.min(headings * 10, 30); // 見出し
    score += Math.min(links * 5, 15); // リンク
    score += Math.min(images * 5, 15); // 画像
    
    return Math.min(score, 100);
  }

  /**
   * エンゲージメント予測（簡易版）
   */
  private predictEngagement(version: ABTestVersion): number {
    let score = 50;
    
    // 文体による調整
    if (version.parameters.tone === Tone.FRIENDLY) score += 20;
    else if (version.parameters.tone === Tone.PROFESSIONAL) score += 10;
    
    // 文字数による調整
    const length = version.output?.markdownContent.length || 0;
    if (length >= 3000 && length <= 7000) score += 15;
    
    return Math.min(score, 100);
  }

  /**
   * 推奨文生成
   */
  private generateRecommendation(comparison: ABTestComparison): string {
    const { metrics } = comparison;
    
    if (metrics.readabilityScore.a > metrics.readabilityScore.b) {
      return `バージョン${comparison.versionA.versionName}の方が読みやすく、エンゲージメントが高いと予測されます。`;
    } else {
      return `バージョン${comparison.versionB.versionName}の方が読みやすく、エンゲージメントが高いと予測されます。`;
    }
  }
}

// createArticleOutlineWithInstructions関数をgeminiServiceに追加する必要があります
// 一時的にここで拡張
declare module '../ai/geminiService' {
  export function createArticleOutlineWithInstructions(
    analysis: any,
    audience: Audience,
    tone: Tone,
    keyword: string,
    specialInstructions: string
  ): Promise<any>;
}

export const abtestService = new ABTestService();