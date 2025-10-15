/**
 * X (Twitter) API v2 Integration Service
 * X APIを使用した自動投稿機能
 */

import { XPost, XThread, XPostStatus, XApiCredentials, XApiError } from '../../types/social.types';

// 環境変数からX API認証情報を取得
function getXApiCredentials(): XApiCredentials | null {
    const bearerToken = process.env.X_BEARER_TOKEN || process.env.TWITTER_BEARER_TOKEN;
    const apiKey = process.env.X_API_KEY || process.env.TWITTER_API_KEY;
    const apiSecret = process.env.X_API_SECRET || process.env.TWITTER_API_SECRET;
    const accessToken = process.env.X_ACCESS_TOKEN || process.env.TWITTER_ACCESS_TOKEN;
    const accessTokenSecret = process.env.X_ACCESS_TOKEN_SECRET || process.env.TWITTER_ACCESS_TOKEN_SECRET;

    // Bearer TokenまたはOAuth1.0a認証情報のいずれかが必要
    if (bearerToken) {
        return { bearerToken };
    }

    if (apiKey && apiSecret && accessToken && accessTokenSecret) {
        return { apiKey, apiSecret, accessToken, accessTokenSecret };
    }

    return null;
}

export class XApiService {
    private credentials: XApiCredentials | null;
    private baseUrl = 'https://api.twitter.com/2';

    constructor() {
        this.credentials = getXApiCredentials();
    }

    /**
     * X API利用可能性をチェック
     */
    isAvailable(): boolean {
        return this.credentials !== null;
    }

    /**
     * 認証情報設定状況を取得
     */
    getAuthStatus(): { available: boolean; authType: string | null; message: string } {
        if (!this.credentials) {
            return {
                available: false,
                authType: null,
                message: 'X API認証情報が設定されていません。Bearer TokenまたはOAuth認証情報を設定してください。'
            };
        }

        if ('bearerToken' in this.credentials) {
            return {
                available: true,
                authType: 'Bearer Token',
                message: 'Bearer Token認証が設定されています（読み取り専用）'
            };
        }

        return {
            available: true,
            authType: 'OAuth 1.0a',
            message: 'OAuth 1.0a認証が設定されています（読み書き可能）'
        };
    }

    /**
     * 単一ポストを投稿
     */
    async postTweet(post: XPost): Promise<{ success: boolean; tweetId?: string; error?: XApiError }> {
        if (!this.credentials) {
            return {
                success: false,
                error: {
                    code: 'NO_AUTH',
                    message: 'X API認証情報が設定されていません'
                }
            };
        }

        // Bearer Token認証では投稿不可
        if ('bearerToken' in this.credentials) {
            return {
                success: false,
                error: {
                    code: 'INSUFFICIENT_PERMISSIONS',
                    message: 'Bearer Token認証では投稿できません。OAuth認証が必要です。'
                }
            };
        }

        try {
            const response = await this.makeApiRequest('/tweets', 'POST', {
                text: post.text
            });

            if (response.data?.id) {
                return {
                    success: true,
                    tweetId: response.data.id
                };
            }

            return {
                success: false,
                error: {
                    code: 'API_ERROR',
                    message: 'ツイート投稿に失敗しました'
                }
            };

        } catch (error) {
            console.error('X API投稿エラー:', error);
            return {
                success: false,
                error: {
                    code: 'API_ERROR',
                    message: error instanceof Error ? error.message : 'ツイート投稿でエラーが発生しました'
                }
            };
        }
    }

    /**
     * スレッド形式で連続投稿
     */
    async postThread(thread: XThread): Promise<{ success: boolean; tweetIds?: string[]; error?: XApiError }> {
        if (!this.credentials) {
            return {
                success: false,
                error: {
                    code: 'NO_AUTH',
                    message: 'X API認証情報が設定されていません'
                }
            };
        }

        if ('bearerToken' in this.credentials) {
            return {
                success: false,
                error: {
                    code: 'INSUFFICIENT_PERMISSIONS',
                    message: 'Bearer Token認証では投稿できません。OAuth認証が必要です。'
                }
            };
        }

        const tweetIds: string[] = [];
        let previousTweetId: string | undefined;

        try {
            for (const tweet of thread.tweets) {
                const requestBody: any = {
                    text: tweet.text
                };

                // 2番目以降のツイートは前のツイートに返信する形で投稿
                if (previousTweetId) {
                    requestBody.reply = {
                        in_reply_to_tweet_id: previousTweetId
                    };
                }

                const response = await this.makeApiRequest('/tweets', 'POST', requestBody);

                if (response.data?.id) {
                    const tweetId = response.data.id;
                    tweetIds.push(tweetId);
                    previousTweetId = tweetId;

                    // API制限を避けるために少し待機
                    if (tweet !== thread.tweets[thread.tweets.length - 1]) {
                        await new Promise(resolve => setTimeout(resolve, 1000));
                    }
                } else {
                    throw new Error(`ツイート ${tweetIds.length + 1} の投稿に失敗しました`);
                }
            }

            return {
                success: true,
                tweetIds
            };

        } catch (error) {
            console.error('X APIスレッド投稿エラー:', error);
            return {
                success: false,
                error: {
                    code: 'API_ERROR',
                    message: error instanceof Error ? error.message : 'スレッド投稿でエラーが発生しました'
                }
            };
        }
    }

    /**
     * 投稿予約（実際のスケジューリング機能は制限されているため、タイミング計算のみ）
     */
    async schedulePost(post: XPost, scheduledTime: Date): Promise<{ success: boolean; message: string; error?: XApiError }> {
        const now = new Date();
        const delay = scheduledTime.getTime() - now.getTime();

        if (delay <= 0) {
            return {
                success: false,
                error: {
                    code: 'INVALID_TIME',
                    message: '予約時刻は未来の時刻を指定してください'
                }
            };
        }

        // 実際のアプリケーションでは、ジョブキューやcronジョブを使用
        // ここでは簡易的にsetTimeoutを使用（ブラウザ環境では推奨されない）
        setTimeout(async () => {
            await this.postTweet(post);
        }, delay);

        return {
            success: true,
            message: `${scheduledTime.toLocaleString('ja-JP')}に投稿予約しました`
        };
    }

    /**
     * ユーザー情報を取得
     */
    async getUserInfo(): Promise<{ success: boolean; user?: any; error?: XApiError }> {
        if (!this.credentials) {
            return {
                success: false,
                error: {
                    code: 'NO_AUTH',
                    message: 'X API認証情報が設定されていません'
                }
            };
        }

        try {
            const response = await this.makeApiRequest('/users/me', 'GET');
            
            return {
                success: true,
                user: response.data
            };

        } catch (error) {
            console.error('X APIユーザー情報取得エラー:', error);
            return {
                success: false,
                error: {
                    code: 'API_ERROR',
                    message: error instanceof Error ? error.message : 'ユーザー情報取得でエラーが発生しました'
                }
            };
        }
    }

    /**
     * API制限情報を取得
     */
    async getRateLimitStatus(): Promise<{ success: boolean; limits?: any; error?: XApiError }> {
        if (!this.credentials) {
            return {
                success: false,
                error: {
                    code: 'NO_AUTH',
                    message: 'X API認証情報が設定されていません'
                }
            };
        }

        try {
            // X API v2では直接的なレート制限確認エンドポイントが限定的
            // ヘッダー情報で制限状況を確認
            const response = await fetch(`${this.baseUrl}/users/me`, {
                method: 'GET',
                headers: await this.getAuthHeaders()
            });

            const rateLimitInfo = {
                remaining: response.headers.get('x-rate-limit-remaining'),
                reset: response.headers.get('x-rate-limit-reset'),
                limit: response.headers.get('x-rate-limit-limit')
            };

            return {
                success: true,
                limits: rateLimitInfo
            };

        } catch (error) {
            console.error('X APIレート制限確認エラー:', error);
            return {
                success: false,
                error: {
                    code: 'API_ERROR',
                    message: error instanceof Error ? error.message : 'レート制限確認でエラーが発生しました'
                }
            };
        }
    }

    /**
     * API リクエストを実行
     */
    private async makeApiRequest(endpoint: string, method: 'GET' | 'POST' | 'PUT' | 'DELETE', body?: any): Promise<any> {
        const url = `${this.baseUrl}${endpoint}`;
        const headers = await this.getAuthHeaders();

        if (body && (method === 'POST' || method === 'PUT')) {
            headers['Content-Type'] = 'application/json';
        }

        const response = await fetch(url, {
            method,
            headers,
            body: body ? JSON.stringify(body) : undefined
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`X API Error: ${response.status} ${errorText}`);
        }

        return await response.json();
    }

    /**
     * 認証ヘッダーを生成
     */
    private async getAuthHeaders(): Promise<Record<string, string>> {
        if (!this.credentials) {
            throw new Error('認証情報が設定されていません');
        }

        if ('bearerToken' in this.credentials) {
            return {
                'Authorization': `Bearer ${this.credentials.bearerToken}`
            };
        }

        // OAuth 1.0a署名の生成（簡易実装）
        // 本格的な実装では、oauth-1.0aライブラリの使用を推奨
        const timestamp = Math.floor(Date.now() / 1000).toString();
        const nonce = Math.random().toString(36).substring(2, 15);

        return {
            'Authorization': `OAuth oauth_consumer_key="${this.credentials.apiKey}", oauth_token="${this.credentials.accessToken}", oauth_signature_method="HMAC-SHA1", oauth_timestamp="${timestamp}", oauth_nonce="${nonce}", oauth_version="1.0", oauth_signature="PLACEHOLDER"`
        };
    }
}

// シングルトンインスタンス
export const xApiService = new XApiService();