import { Page, Browser, chromium } from 'playwright';
import { FinalOutput } from '../../types';
import * as fs from 'fs-extra';

export interface NotePostConfig {
    email: string;
    password: string;
    headless?: boolean;
}

export interface NotePostData {
    title: string;
    content: string;
    imageUrl?: string;
    hashtags?: string[];
    publishImmediately?: boolean;
}

export class NoteAutoPostService {
    private browser: Browser | null = null;
    private page: Page | null = null;

    async initialize(config: NotePostConfig): Promise<void> {
        this.browser = await chromium.launch({ 
            headless: config.headless ?? true,
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });
        
        // Create browser context with custom user agent
        const context = await this.browser.newContext({
            userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        });
        this.page = await context.newPage();
        
        // Login to note
        await this.login(config.email, config.password);
    }

    private async login(email: string, password: string): Promise<void> {
        if (!this.page) throw new Error('Browser not initialized');

        await this.page.goto('https://note.com/login');
        await this.page.waitForLoadState('networkidle');

        // Fill login form
        await this.page.fill('input[type="email"]', email);
        await this.page.fill('input[type="password"]', password);
        
        // Click login button
        await this.page.click('button[type="submit"]');
        await this.page.waitForLoadState('networkidle');

        // Verify login success
        const isLoggedIn = await this.page.locator('[data-testid="header-user-menu"]').isVisible();
        if (!isLoggedIn) {
            throw new Error('ログインに失敗しました。メールアドレスとパスワードを確認してください。');
        }
    }

    async createPost(postData: NotePostData): Promise<string> {
        if (!this.page) throw new Error('Browser not initialized');

        try {
            // Navigate to create post page
            await this.page.goto('https://note.com/post');
            await this.page.waitForLoadState('networkidle');

            // Set title
            const titleSelector = 'input[placeholder*="タイトル"]';
            await this.page.waitForSelector(titleSelector);
            await this.page.fill(titleSelector, postData.title);

            // Set content
            const contentSelector = '.ProseMirror';
            await this.page.waitForSelector(contentSelector);
            await this.page.fill(contentSelector, postData.content);

            // Upload header image if provided
            if (postData.imageUrl) {
                await this.uploadHeaderImage(postData.imageUrl);
            }

            // Add hashtags if provided
            if (postData.hashtags && postData.hashtags.length > 0) {
                await this.addHashtags(postData.hashtags);
            }

            // Publish or save as draft
            if (postData.publishImmediately) {
                await this.publishPost();
            } else {
                await this.saveDraft();
            }

            // Get the post URL
            await this.page.waitForLoadState('networkidle');
            const currentUrl = this.page.url();
            
            return currentUrl;

        } catch (error) {
            console.error('記事投稿中にエラーが発生しました:', error);
            throw new Error(`記事投稿に失敗しました: ${error instanceof Error ? error.message : '不明なエラー'}`);
        }
    }

    private async uploadHeaderImage(imageUrl: string): Promise<void> {
        if (!this.page) return;

        try {
            // Look for header image upload button
            const imageUploadButton = this.page.locator('[data-testid="header-image-upload"]').first();
            
            if (await imageUploadButton.isVisible()) {
                // Download image and upload
                const response = await this.page.request.get(imageUrl);
                const buffer = await response.body();
                
                // Create a temporary file path for the image
                const tempImagePath = `/tmp/note_header_${Date.now()}.png`;
                await fs.writeFile(tempImagePath, buffer);
                
                // Upload the file
                await this.page.setInputFiles('input[type="file"]', tempImagePath);
                await this.page.waitForTimeout(2000); // Wait for upload
                
                // Clean up temp file
                await fs.unlink(tempImagePath);
            }
        } catch (error) {
            console.warn('ヘッダー画像のアップロードに失敗しました:', error);
            // Continue without image rather than failing the entire post
        }
    }

    private async addHashtags(hashtags: string[]): Promise<void> {
        if (!this.page) return;

        try {
            // Look for hashtag input field
            const hashtagInput = this.page.locator('input[placeholder*="ハッシュタグ"]').first();
            
            if (await hashtagInput.isVisible()) {
                for (const tag of hashtags) {
                    await hashtagInput.fill(tag.startsWith('#') ? tag : `#${tag}`);
                    await this.page.keyboard.press('Enter');
                    await this.page.waitForTimeout(500);
                }
            }
        } catch (error) {
            console.warn('ハッシュタグの追加に失敗しました:', error);
            // Continue without hashtags rather than failing the entire post
        }
    }

    private async publishPost(): Promise<void> {
        if (!this.page) return;

        // Look for publish button
        const publishButton = this.page.locator('button').filter({ hasText: '公開する' }).first();
        await publishButton.click();
        
        // Wait for confirmation dialog and confirm
        const confirmButton = this.page.locator('button').filter({ hasText: '公開' }).first();
        if (await confirmButton.isVisible()) {
            await confirmButton.click();
        }
        
        await this.page.waitForLoadState('networkidle');
    }

    private async saveDraft(): Promise<void> {
        if (!this.page) return;

        // Look for save as draft button
        const draftButton = this.page.locator('button').filter({ hasText: '下書き保存' }).first();
        if (await draftButton.isVisible()) {
            await draftButton.click();
            await this.page.waitForLoadState('networkidle');
        }
    }

    async close(): Promise<void> {
        if (this.browser) {
            await this.browser.close();
            this.browser = null;
            this.page = null;
        }
    }

    // Utility method to convert FinalOutput to NotePostData
    static convertFromFinalOutput(output: FinalOutput, title: string, publishImmediately: boolean = false): NotePostData {
        // Extract hashtags from content if present
        const hashtagMatches = output.markdownContent.match(/#[\w\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]+/g);
        const hashtags = hashtagMatches ? hashtagMatches.slice(0, 5) : []; // Limit to 5 hashtags

        return {
            title,
            content: output.markdownContent,
            imageUrl: output.imageUrl,
            hashtags,
            publishImmediately
        };
    }
}

// Factory function for easier usage
export async function createNoteAutoPostService(config: NotePostConfig): Promise<NoteAutoPostService> {
    const service = new NoteAutoPostService();
    await service.initialize(config);
    return service;
}

// High-level function to post directly from FinalOutput
export async function postToNote(
    output: FinalOutput, 
    title: string, 
    config: NotePostConfig, 
    publishImmediately: boolean = false
): Promise<string> {
    const service = await createNoteAutoPostService(config);
    
    try {
        const postData = NoteAutoPostService.convertFromFinalOutput(output, title, publishImmediately);
        const postUrl = await service.createPost(postData);
        return postUrl;
    } finally {
        await service.close();
    }
}