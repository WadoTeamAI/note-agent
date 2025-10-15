/**
 * X（Twitter）投稿エクスポート・準備サービス
 * X APIの代わりに、投稿準備とエクスポート機能を提供
 */

import { XPost, XThread, XPostGenerationResult } from '../../types/social.types';

export interface XPostExportOptions {
    format: 'csv' | 'json' | 'txt' | 'markdown';
    includeMetadata: boolean;
    includeSchedule: boolean;
}

export interface PreparedPost extends XPost {
    id: string;
    createdAt: Date;
    status: 'draft' | 'ready' | 'scheduled';
    scheduledFor?: Date;
    metadata: {
        articleTitle?: string;
        keyword?: string;
        characterCount: number;
        hashtagCount: number;
    };
}

export class XPostExporter {
    private posts: Map<string, PreparedPost> = new Map();

    /**
     * 生成された投稿を準備状態として保存
     */
    preparePosts(result: XPostGenerationResult, metadata: {
        articleTitle: string;
        keyword: string;
    }): PreparedPost[] {
        const preparedPosts: PreparedPost[] = [];

        // ショートポストの準備
        result.shortPosts.forEach((post, index) => {
            const preparedPost: PreparedPost = {
                ...post,
                id: `short_${Date.now()}_${index}`,
                createdAt: new Date(),
                status: 'draft',
                metadata: {
                    articleTitle: metadata.articleTitle,
                    keyword: metadata.keyword,
                    characterCount: post.text.length,
                    hashtagCount: post.hashtags?.length || 0
                }
            };
            preparedPosts.push(preparedPost);
            this.posts.set(preparedPost.id, preparedPost);
        });

        // ロングポストの準備
        result.longPosts.forEach((post, index) => {
            const preparedPost: PreparedPost = {
                ...post,
                id: `long_${Date.now()}_${index}`,
                createdAt: new Date(),
                status: 'draft',
                metadata: {
                    articleTitle: metadata.articleTitle,
                    keyword: metadata.keyword,
                    characterCount: post.text.length,
                    hashtagCount: post.hashtags?.length || 0
                }
            };
            preparedPosts.push(preparedPost);
            this.posts.set(preparedPost.id, preparedPost);
        });

        return preparedPosts;
    }

    /**
     * 投稿を更新
     */
    updatePost(id: string, updates: Partial<PreparedPost>): boolean {
        const post = this.posts.get(id);
        if (!post) return false;

        const updatedPost = { ...post, ...updates };
        this.posts.set(id, updatedPost);
        return true;
    }

    /**
     * 投稿を削除
     */
    deletePost(id: string): boolean {
        return this.posts.delete(id);
    }

    /**
     * 全投稿を取得
     */
    getAllPosts(): PreparedPost[] {
        return Array.from(this.posts.values()).sort((a, b) => 
            b.createdAt.getTime() - a.createdAt.getTime()
        );
    }

    /**
     * 投稿を検索
     */
    searchPosts(query: {
        keyword?: string;
        status?: PreparedPost['status'];
        type?: string;
    }): PreparedPost[] {
        const posts = this.getAllPosts();
        
        return posts.filter(post => {
            if (query.keyword && !post.metadata.keyword?.includes(query.keyword)) {
                return false;
            }
            if (query.status && post.status !== query.status) {
                return false;
            }
            if (query.type && !post.id.startsWith(query.type)) {
                return false;
            }
            return true;
        });
    }

    /**
     * CSV形式でエクスポート
     */
    exportToCSV(posts: PreparedPost[], options: XPostExportOptions): string {
        const headers = [
            'ID',
            'Text',
            'Character Count',
            'Target',
            'Hashtags',
            'Status',
            'Created At'
        ];

        if (options.includeMetadata) {
            headers.push('Article Title', 'Keyword');
        }

        if (options.includeSchedule) {
            headers.push('Scheduled For');
        }

        const rows = posts.map(post => {
            const row = [
                post.id,
                `"${post.text.replace(/"/g, '""')}"`,
                post.metadata.characterCount.toString(),
                post.target || '',
                post.hashtags?.join(';') || '',
                post.status,
                post.createdAt.toISOString()
            ];

            if (options.includeMetadata) {
                row.push(
                    post.metadata.articleTitle || '',
                    post.metadata.keyword || ''
                );
            }

            if (options.includeSchedule) {
                row.push(post.scheduledFor?.toISOString() || '');
            }

            return row.join(',');
        });

        return [headers.join(','), ...rows].join('\n');
    }

    /**
     * JSON形式でエクスポート
     */
    exportToJSON(posts: PreparedPost[], options: XPostExportOptions): string {
        const exportData = posts.map(post => {
            const data: any = {
                id: post.id,
                text: post.text,
                target: post.target,
                hashtags: post.hashtags,
                status: post.status,
                createdAt: post.createdAt.toISOString(),
                metadata: {
                    characterCount: post.metadata.characterCount,
                    hashtagCount: post.metadata.hashtagCount
                }
            };

            if (options.includeMetadata) {
                data.metadata.articleTitle = post.metadata.articleTitle;
                data.metadata.keyword = post.metadata.keyword;
            }

            if (options.includeSchedule && post.scheduledFor) {
                data.scheduledFor = post.scheduledFor.toISOString();
            }

            return data;
        });

        return JSON.stringify(exportData, null, 2);
    }

    /**
     * テキスト形式でエクスポート
     */
    exportToText(posts: PreparedPost[], options: XPostExportOptions): string {
        return posts.map((post, index) => {
            let text = `=== 投稿 ${index + 1} (${post.id}) ===\n`;
            text += `テキスト: ${post.text}\n`;
            text += `文字数: ${post.metadata.characterCount}\n`;
            text += `ターゲット: ${post.target || 'なし'}\n`;
            text += `ハッシュタグ: ${post.hashtags?.join(', ') || 'なし'}\n`;
            text += `ステータス: ${post.status}\n`;
            text += `作成日時: ${post.createdAt.toLocaleString('ja-JP')}\n`;

            if (options.includeMetadata) {
                text += `記事タイトル: ${post.metadata.articleTitle || 'なし'}\n`;
                text += `キーワード: ${post.metadata.keyword || 'なし'}\n`;
            }

            if (options.includeSchedule && post.scheduledFor) {
                text += `予約投稿日時: ${post.scheduledFor.toLocaleString('ja-JP')}\n`;
            }

            text += '\n';
            return text;
        }).join('');
    }

    /**
     * Markdown形式でエクスポート
     */
    exportToMarkdown(posts: PreparedPost[], options: XPostExportOptions): string {
        let markdown = '# X (Twitter) 投稿リスト\n\n';
        markdown += `生成日時: ${new Date().toLocaleString('ja-JP')}\n`;
        markdown += `投稿数: ${posts.length}\n\n`;

        posts.forEach((post, index) => {
            markdown += `## 投稿 ${index + 1}\n\n`;
            markdown += `**ID:** \`${post.id}\`\n\n`;
            markdown += `**テキスト:**\n`;
            markdown += `> ${post.text}\n\n`;
            markdown += `**詳細情報:**\n`;
            markdown += `- 文字数: ${post.metadata.characterCount}\n`;
            markdown += `- ターゲット: ${post.target || 'なし'}\n`;
            markdown += `- ハッシュタグ: ${post.hashtags?.join(', ') || 'なし'}\n`;
            markdown += `- ステータス: ${post.status}\n`;
            markdown += `- 作成日時: ${post.createdAt.toLocaleString('ja-JP')}\n`;

            if (options.includeMetadata) {
                markdown += `- 記事タイトル: ${post.metadata.articleTitle || 'なし'}\n`;
                markdown += `- キーワード: ${post.metadata.keyword || 'なし'}\n`;
            }

            if (options.includeSchedule && post.scheduledFor) {
                markdown += `- 予約投稿日時: ${post.scheduledFor.toLocaleString('ja-JP')}\n`;
            }

            markdown += '\n---\n\n';
        });

        return markdown;
    }

    /**
     * 指定フォーマットでエクスポート
     */
    export(posts: PreparedPost[], options: XPostExportOptions): string {
        switch (options.format) {
            case 'csv':
                return this.exportToCSV(posts, options);
            case 'json':
                return this.exportToJSON(posts, options);
            case 'txt':
                return this.exportToText(posts, options);
            case 'markdown':
                return this.exportToMarkdown(posts, options);
            default:
                throw new Error(`Unsupported export format: ${options.format}`);
        }
    }

    /**
     * ファイルダウンロード用のBlobを生成
     */
    createDownloadBlob(posts: PreparedPost[], options: XPostExportOptions): Blob {
        const content = this.export(posts, options);
        const mimeTypes = {
            csv: 'text/csv',
            json: 'application/json',
            txt: 'text/plain',
            markdown: 'text/markdown'
        };

        return new Blob([content], { 
            type: mimeTypes[options.format] + ';charset=utf-8' 
        });
    }

    /**
     * ファイルダウンロードを実行
     */
    downloadFile(posts: PreparedPost[], options: XPostExportOptions, filename?: string): void {
        const blob = this.createDownloadBlob(posts, options);
        const url = URL.createObjectURL(blob);
        
        const defaultFilename = `x-posts-${new Date().toISOString().split('T')[0]}.${options.format}`;
        const finalFilename = filename || defaultFilename;

        const link = document.createElement('a');
        link.href = url;
        link.download = finalFilename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    }

    /**
     * クリップボードにコピー（単一投稿）
     */
    async copyToClipboard(post: PreparedPost): Promise<boolean> {
        try {
            await navigator.clipboard.writeText(post.text);
            return true;
        } catch (error) {
            console.error('クリップボードコピーエラー:', error);
            return false;
        }
    }

    /**
     * クリップボードにコピー（複数投稿をまとめて）
     */
    async copyAllToClipboard(posts: PreparedPost[]): Promise<boolean> {
        try {
            const text = posts.map((post, index) => 
                `【投稿${index + 1}】\n${post.text}\n`
            ).join('\n');
            
            await navigator.clipboard.writeText(text);
            return true;
        } catch (error) {
            console.error('クリップボードコピーエラー:', error);
            return false;
        }
    }

    /**
     * 統計情報を取得
     */
    getStatistics(): {
        total: number;
        byStatus: Record<PreparedPost['status'], number>;
        byType: Record<string, number>;
        averageCharacterCount: number;
        totalHashtags: number;
    } {
        const posts = this.getAllPosts();
        
        const byStatus: Record<PreparedPost['status'], number> = {
            draft: 0,
            ready: 0,
            scheduled: 0
        };

        const byType: Record<string, number> = {};
        let totalCharacters = 0;
        let totalHashtags = 0;

        posts.forEach(post => {
            byStatus[post.status]++;
            
            const type = post.id.split('_')[0];
            byType[type] = (byType[type] || 0) + 1;
            
            totalCharacters += post.metadata.characterCount;
            totalHashtags += post.metadata.hashtagCount;
        });

        return {
            total: posts.length,
            byStatus,
            byType,
            averageCharacterCount: posts.length > 0 ? Math.round(totalCharacters / posts.length) : 0,
            totalHashtags
        };
    }

    /**
     * ローカルストレージに保存
     */
    saveToLocalStorage(): void {
        const data = Array.from(this.posts.entries()).map(([id, post]) => [id, {
            ...post,
            createdAt: post.createdAt.toISOString(),
            scheduledFor: post.scheduledFor?.toISOString()
        }]);
        
        localStorage.setItem('xPostExporter_posts', JSON.stringify(data));
    }

    /**
     * ローカルストレージから読み込み
     */
    loadFromLocalStorage(): void {
        try {
            const data = localStorage.getItem('xPostExporter_posts');
            if (!data) return;

            const parsed = JSON.parse(data);
            this.posts.clear();

            parsed.forEach(([id, post]: [string, any]) => {
                this.posts.set(id, {
                    ...post,
                    createdAt: new Date(post.createdAt),
                    scheduledFor: post.scheduledFor ? new Date(post.scheduledFor) : undefined
                });
            });
        } catch (error) {
            console.error('ローカルストレージ読み込みエラー:', error);
        }
    }
}

// シングルトンインスタンス
export const xPostExporter = new XPostExporter();