import React, { useState, useEffect } from 'react';
import { useAuth } from './AuthProvider';

interface PasswordResetPageProps {
    onComplete: () => void;
}

export const PasswordResetPage: React.FC<PasswordResetPageProps> = ({ onComplete }) => {
    const { updatePassword, isSupabaseEnabled } = useAuth();
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [message, setMessage] = useState<string | null>(null);

    useEffect(() => {
        // URLパラメータからアクセストークンとリフレッシュトークンを取得
        const urlParams = new URLSearchParams(window.location.search);
        const accessToken = urlParams.get('access_token');
        const refreshToken = urlParams.get('refresh_token');
        
        if (!accessToken || !refreshToken) {
            setError('無効なリセットリンクです。再度パスワードリセットを申請してください。');
        }
    }, []);

    const handlePasswordReset = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setMessage(null);

        // バリデーション
        if (!password || !confirmPassword) {
            setError('新しいパスワードと確認パスワードを入力してください');
            setLoading(false);
            return;
        }

        if (password !== confirmPassword) {
            setError('パスワードが一致しません');
            setLoading(false);
            return;
        }

        if (password.length < 6) {
            setError('パスワードは6文字以上で入力してください');
            setLoading(false);
            return;
        }

        try {
            const { error } = await updatePassword(password);
            
            if (error) {
                setError(error.message);
            } else {
                setMessage('パスワードが正常に更新されました！');
                setTimeout(() => {
                    onComplete();
                }, 2000);
            }
        } catch (err) {
            setError('パスワード更新でエラーが発生しました');
        } finally {
            setLoading(false);
        }
    };

    if (!isSupabaseEnabled) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50 to-pink-50 flex items-center justify-center p-4">
                <div className="bg-white/90 backdrop-blur-lg rounded-2xl shadow-2xl border border-white/30 w-full max-w-md p-6">
                    <div className="text-center">
                        <div className="text-4xl mb-4">⚠️</div>
                        <h2 className="text-xl font-bold text-gray-800 mb-4">認証機能未設定</h2>
                        <p className="text-gray-600 mb-6">
                            Supabaseが設定されていないため、パスワードリセット機能は利用できません。
                        </p>
                        <button
                            onClick={onComplete}
                            className="px-6 py-2 bg-gray-500 hover:bg-gray-600 text-white font-bold rounded-lg transition-colors"
                        >
                            戻る
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50 to-pink-50 flex items-center justify-center p-4">
            <div className="bg-white/90 backdrop-blur-lg rounded-2xl shadow-2xl border border-white/30 w-full max-w-md">
                {/* Header */}
                <div className="p-6 border-b border-white/20">
                    <h2 className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent text-center">
                        🔒 パスワードリセット
                    </h2>
                    <p className="text-gray-600 text-sm text-center mt-2">
                        新しいパスワードを設定してください
                    </p>
                </div>

                <div className="p-6">
                    <form onSubmit={handlePasswordReset} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                新しいパスワード
                            </label>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                placeholder="新しいパスワード（6文字以上）"
                                required
                                minLength={6}
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                パスワード確認
                            </label>
                            <input
                                type="password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                placeholder="パスワードを再入力"
                                required
                                minLength={6}
                            />
                        </div>

                        <div className="text-xs text-gray-500 space-y-1">
                            <p>✓ 6文字以上の文字を含む</p>
                            <p>✓ 大文字と小文字を組み合わせることを推奨</p>
                            <p>✓ 数字や記号を含むことを推奨</p>
                        </div>

                        {error && (
                            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                                <p className="text-red-700 text-sm">{error}</p>
                            </div>
                        )}

                        {message && (
                            <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                                <p className="text-green-700 text-sm">{message}</p>
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-gradient-to-r from-indigo-500 to-purple-500 text-white font-bold py-3 px-4 rounded-lg hover:from-indigo-600 hover:to-purple-600 focus:outline-none focus:ring-4 focus:ring-purple-200 disabled:opacity-50 transition-all"
                        >
                            {loading ? '更新中...' : 'パスワードを更新'}
                        </button>
                    </form>

                    <div className="mt-4 text-center">
                        <button
                            onClick={onComplete}
                            className="text-indigo-600 hover:text-indigo-800 text-sm font-medium"
                        >
                            ログインページに戻る
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};