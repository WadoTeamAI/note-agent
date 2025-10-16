/**
 * 図解生成サービス（Phase 1.5）
 * Mermaid.jsを使用してテキストから図解を自動生成
 */

import mermaid from 'mermaid';

export interface DiagramRequest {
  type: 'flowchart' | 'sequence' | 'gantt' | 'pie' | 'timeline' | 'mindmap' | 'gitgraph';
  content: string;
  title?: string;
  description?: string;
}

export interface DiagramResult {
  type: DiagramRequest['type'];
  title: string;
  description: string;
  mermaidCode: string;
  svgContent: string;
  insertPosition?: number; // 記事内の挿入位置（段落番号）
}

export class DiagramService {
  private isInitialized = false;

  constructor() {
    this.initializeMermaid();
  }

  /**
   * Mermaidを初期化
   */
  private initializeMermaid(): void {
    if (this.isInitialized) return;

    mermaid.initialize({
      startOnLoad: false,
      theme: 'default',
      securityLevel: 'loose',
      themeVariables: {
        primaryColor: '#3b82f6',
        primaryTextColor: '#1f2937',
        primaryBorderColor: '#e5e7eb',
        lineColor: '#6b7280',
        secondaryColor: '#f3f4f6',
        tertiaryColor: '#ffffff'
      },
      flowchart: {
        useMaxWidth: true,
        htmlLabels: true,
        curve: 'basis'
      },
      sequence: {
        useMaxWidth: true,
        showSequenceNumbers: true
      },
      gantt: {
        useMaxWidth: true
      }
    });

    this.isInitialized = true;
  }

  /**
   * 記事内容を分析して適切な図解を提案・生成
   */
  async generateDiagramsFromContent(content: string): Promise<DiagramResult[]> {
    const diagrams: DiagramResult[] = [];
    const paragraphs = content.split('\n\n');

    for (let i = 0; i < paragraphs.length; i++) {
      const paragraph = paragraphs[i].trim();
      
      // プロセス・手順を検出
      if (this.detectProcess(paragraph)) {
        const flowchart = await this.generateFlowchart(paragraph, i);
        if (flowchart) diagrams.push(flowchart);
      }

      // 比較要素を検出
      if (this.detectComparison(paragraph)) {
        const comparison = await this.generateComparisonChart(paragraph, i);
        if (comparison) diagrams.push(comparison);
      }

      // 時系列・スケジュールを検出
      if (this.detectTimeline(paragraph)) {
        const timeline = await this.generateTimeline(paragraph, i);
        if (timeline) diagrams.push(timeline);
      }

      // 関係性・構造を検出
      if (this.detectRelationship(paragraph)) {
        const mindmap = await this.generateMindmap(paragraph, i);
        if (mindmap) diagrams.push(mindmap);
      }
    }

    return diagrams;
  }

  /**
   * フローチャート生成
   */
  async generateFlowchart(content: string, position: number): Promise<DiagramResult | null> {
    try {
      const steps = this.extractSteps(content);
      if (steps.length < 2) return null;

      let mermaidCode = 'flowchart TD\n';
      
      for (let i = 0; i < steps.length; i++) {
        const stepId = `A${i + 1}`;
        const stepText = steps[i].replace(/["\n]/g, ' ').substring(0, 30);
        mermaidCode += `    ${stepId}["${stepText}"]\n`;
        
        if (i < steps.length - 1) {
          mermaidCode += `    ${stepId} --> A${i + 2}\n`;
        }
      }

      const svgContent = await this.renderMermaidToSVG(mermaidCode);

      return {
        type: 'flowchart',
        title: 'プロセスフロー',
        description: '手順を視覚的に表現したフローチャート',
        mermaidCode,
        svgContent,
        insertPosition: position
      };
    } catch (error) {
      console.error('Failed to generate flowchart:', error);
      return null;
    }
  }

  /**
   * 比較チャート生成
   */
  async generateComparisonChart(content: string, position: number): Promise<DiagramResult | null> {
    try {
      const comparisons = this.extractComparisons(content);
      if (comparisons.length < 2) return null;

      let mermaidCode = 'graph LR\n';
      
      comparisons.forEach((item, index) => {
        const itemId = `B${index + 1}`;
        const itemText = item.replace(/["\n]/g, ' ').substring(0, 25);
        mermaidCode += `    ${itemId}["${itemText}"]\n`;
      });

      // 比較関係を表現
      for (let i = 0; i < comparisons.length - 1; i++) {
        mermaidCode += `    B${i + 1} -.vs.- B${i + 2}\n`;
      }

      const svgContent = await this.renderMermaidToSVG(mermaidCode);

      return {
        type: 'flowchart',
        title: '比較チャート',
        description: '要素間の比較を視覚化',
        mermaidCode,
        svgContent,
        insertPosition: position
      };
    } catch (error) {
      console.error('Failed to generate comparison chart:', error);
      return null;
    }
  }

  /**
   * タイムライン生成
   */
  async generateTimeline(content: string, position: number): Promise<DiagramResult | null> {
    try {
      const timePoints = this.extractTimePoints(content);
      if (timePoints.length < 3) return null;

      let mermaidCode = 'timeline\n';
      mermaidCode += '    title 時系列プロセス\n';
      
      timePoints.forEach((point, index) => {
        const pointText = point.replace(/["\n]/g, ' ').substring(0, 40);
        mermaidCode += `    ${index + 1} : ${pointText}\n`;
      });

      const svgContent = await this.renderMermaidToSVG(mermaidCode);

      return {
        type: 'timeline',
        title: 'タイムライン',
        description: '時系列の流れを可視化',
        mermaidCode,
        svgContent,
        insertPosition: position
      };
    } catch (error) {
      console.error('Failed to generate timeline:', error);
      return null;
    }
  }

  /**
   * マインドマップ生成
   */
  async generateMindmap(content: string, position: number): Promise<DiagramResult | null> {
    try {
      const concepts = this.extractConcepts(content);
      if (concepts.length < 3) return null;

      let mermaidCode = 'mindmap\n';
      mermaidCode += '  root((概念マップ))\n';
      
      concepts.forEach((concept) => {
        const conceptText = concept.replace(/["\n]/g, ' ').substring(0, 20);
        mermaidCode += `    ${conceptText}\n`;
      });

      const svgContent = await this.renderMermaidToSVG(mermaidCode);

      return {
        type: 'mindmap',
        title: 'マインドマップ',
        description: '概念の関係性を整理',
        mermaidCode,
        svgContent,
        insertPosition: position
      };
    } catch (error) {
      console.error('Failed to generate mindmap:', error);
      return null;
    }
  }

  /**
   * カスタム図解生成
   */
  async generateCustomDiagram(request: DiagramRequest): Promise<DiagramResult | null> {
    try {
      let mermaidCode = '';

      switch (request.type) {
        case 'pie':
          mermaidCode = this.generatePieChart(request.content);
          break;
        case 'sequence':
          mermaidCode = this.generateSequenceDiagram(request.content);
          break;
        case 'gantt':
          mermaidCode = this.generateGanttChart(request.content);
          break;
        default:
          return null;
      }

      const svgContent = await this.renderMermaidToSVG(mermaidCode);

      return {
        type: request.type,
        title: request.title || '図解',
        description: request.description || '生成された図解',
        mermaidCode,
        svgContent
      };
    } catch (error) {
      console.error('Failed to generate custom diagram:', error);
      return null;
    }
  }

  /**
   * Mermaidコードを SVG に変換
   */
  async renderMermaidToSVG(mermaidCode: string): Promise<string> {
    try {
      // 一意のIDを生成
      const id = `mermaid-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      // SVGを生成
      const { svg } = await mermaid.render(id, mermaidCode);
      
      return svg;
    } catch (error) {
      console.error('Failed to render Mermaid to SVG:', error);
      throw error;
    }
  }

  // 検出メソッド
  private detectProcess(text: string): boolean {
    const processKeywords = ['手順', 'ステップ', '方法', 'プロセス', '流れ', '段階', 'やり方'];
    const stepIndicators = /[0-9]+[.。)）]|第[0-9]+|まず|次に|最後に|①|②|③/;
    
    return processKeywords.some(keyword => text.includes(keyword)) || stepIndicators.test(text);
  }

  private detectComparison(text: string): boolean {
    const comparisonKeywords = ['比較', '違い', 'vs', '対', 'メリット', 'デメリット', '優れ', '劣'];
    
    return comparisonKeywords.some(keyword => text.includes(keyword));
  }

  private detectTimeline(text: string): boolean {
    const timeKeywords = ['時期', '期間', '年', '月', '日', '前', '後', '歴史', '変遷'];
    const timePattern = /[0-9]+年|[0-9]+月|[0-9]+日/;
    
    return timeKeywords.some(keyword => text.includes(keyword)) || timePattern.test(text);
  }

  private detectRelationship(text: string): boolean {
    const relationKeywords = ['関係', '構造', '要素', '分類', '種類', '概念'];
    
    return relationKeywords.some(keyword => text.includes(keyword));
  }

  // 抽出メソッド
  private extractSteps(text: string): string[] {
    const steps: string[] = [];
    
    // 番号付きリストを抽出
    const numberedSteps = text.match(/[0-9]+[.。)）][^0-9]+?(?=[0-9]+[.。)）]|$)/g);
    if (numberedSteps) {
      steps.push(...numberedSteps.map(step => step.replace(/^[0-9]+[.。)）]/, '').trim()));
    }

    // まず、次に、最後にパターン
    const sequencePattern = /(まず[^。]*。|次に[^。]*。|最後に[^。]*。)/g;
    const sequenceSteps = text.match(sequencePattern);
    if (sequenceSteps) {
      steps.push(...sequenceSteps.map(step => step.trim()));
    }

    return steps.filter(step => step.length > 0);
  }

  private extractComparisons(text: string): string[] {
    const comparisons: string[] = [];
    
    // A vs B パターン
    const vsPattern = /([^、。]+)\s*vs\s*([^、。]+)/g;
    let match;
    while ((match = vsPattern.exec(text)) !== null) {
      comparisons.push(match[1].trim(), match[2].trim());
    }

    // メリット・デメリットパターン
    const meritsPattern = /(メリット|利点)[：:]\s*([^。]+)/g;
    const demeritsPattern = /(デメリット|欠点)[：:]\s*([^。]+)/g;
    
    while ((match = meritsPattern.exec(text)) !== null) {
      comparisons.push(`メリット: ${match[2].trim()}`);
    }
    while ((match = demeritsPattern.exec(text)) !== null) {
      comparisons.push(`デメリット: ${match[2].trim()}`);
    }

    return comparisons;
  }

  private extractTimePoints(text: string): string[] {
    const timePoints: string[] = [];
    
    // 年月日パターン
    const datePattern = /([0-9]+年[^。]*。|[0-9]+月[^。]*。|[0-9]+日[^。]*。)/g;
    let match;
    while ((match = datePattern.exec(text)) !== null) {
      timePoints.push(match[1].trim());
    }

    return timePoints;
  }

  private extractConcepts(text: string): string[] {
    const concepts: string[] = [];
    
    // リスト形式の概念を抽出
    const listPattern = /[・•]\s*([^。\n]+)/g;
    let match;
    while ((match = listPattern.exec(text)) !== null) {
      concepts.push(match[1].trim());
    }

    // 「〜とは」「〜の特徴」パターン
    const conceptPattern = /([^。]+?)(?:とは|の特徴|について)/g;
    while ((match = conceptPattern.exec(text)) !== null) {
      const concept = match[1].trim();
      if (concept.length < 30) {
        concepts.push(concept);
      }
    }

    return concepts;
  }

  // 特殊チャート生成メソッド
  private generatePieChart(content: string): string {
    const dataPattern = /([^:：]+)[：:]([0-9]+%?)/g;
    let mermaidCode = 'pie title データ分布\n';
    
    let match;
    while ((match = dataPattern.exec(content)) !== null) {
      const label = match[1].trim();
      const value = match[2].replace('%', '');
      mermaidCode += `    "${label}" : ${value}\n`;
    }

    return mermaidCode;
  }

  private generateSequenceDiagram(content: string): string {
    let mermaidCode = 'sequenceDiagram\n';
    
    // シンプルなシーケンス図
    const actors = ['ユーザー', 'システム', 'データベース'];
    actors.forEach(actor => {
      mermaidCode += `    participant ${actor}\n`;
    });

    // 基本的なフロー
    mermaidCode += `    ユーザー->>システム: リクエスト\n`;
    mermaidCode += `    システム->>データベース: データ取得\n`;
    mermaidCode += `    データベース-->>システム: レスポンス\n`;
    mermaidCode += `    システム-->>ユーザー: 結果表示\n`;

    return mermaidCode;
  }

  private generateGanttChart(content: string): string {
    let mermaidCode = 'gantt\n';
    mermaidCode += '    title プロジェクトスケジュール\n';
    mermaidCode += '    dateFormat  YYYY-MM-DD\n';
    mermaidCode += '    section フェーズ1\n';
    mermaidCode += '    計画    :done,    des1, 2024-01-01,2024-01-15\n';
    mermaidCode += '    開発    :active,  des2, 2024-01-16, 30d\n';
    mermaidCode += '    section フェーズ2\n';
    mermaidCode += '    テスト  :         des3, after des2, 20d\n';
    mermaidCode += '    公開    :         des4, after des3, 5d\n';

    return mermaidCode;
  }
}

// シングルトンインスタンス
export const diagramService = new DiagramService();