import React, { useState } from 'react';
import { useAuth } from './AuthProvider';

interface AuthModalProps {
    isOpen: boolean;
    onClose: () => void;
}

type AuthMode = 'signin' | 'signup' | 'reset';

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose }) => {
    const { signInWithGoogle, signInWithEmail, signUpWithEmail, resetPassword, resendEmailConfirmation, isSupabaseEnabled } = useAuth();
    const [mode, setMode] = useState<AuthMode>('signin');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [displayName, setDisplayName] = useState('');
    const [acceptTerms, setAcceptTerms] = useState(false);
    const [newsletter, setNewsletter] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [message, setMessage] = useState<string | null>(null);

    if (!isOpen) return null;

    if (!isSupabaseEnabled) {
        return (
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                <div className="bg-white/90 backdrop-blur-lg rounded-2xl shadow-2xl border border-white/30 w-full max-w-md p-6">
                    <div className="text-center">
                        <div className="text-4xl mb-4">⚠️</div>
                        <h2 className="text-xl font-bold text-gray-800 mb-4">認証機能未設定</h2>
                        <p className="text-gray-600 mb-6">
                            Supabaseが設定されていないため、認証機能は利用できません。
                            現在はローカルストレージで記事履歴を管理しています。
                        </p>
                        <button
                            onClick={onClose}
                            className="px-6 py-2 bg-gray-500 hover:bg-gray-600 text-white font-bold rounded-lg transition-colors"
                        >
                            閉じる
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    const handleGoogleSignIn = async () => {
        setLoading(true);
        setError(null);
        
        try {
            const { error } = await signInWithGoogle();
            if (error) {
                setError(error.message);
            } else {
                // OAuth リダイレクトが発生するため、ここでは何もしない
            }
        } catch (err) {
            setError('Google認証でエラーが発生しました');
        } finally {
            setLoading(false);
        }
    };

    const handleEmailAuth = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setMessage(null);

        // バリデーション
        if (mode === 'reset') {
            if (!email) {
                setError('メールアドレスを入力してください');
                setLoading(false);
                return;
            }
        } else {
            if (!email || !password) {
                setError('メールアドレスとパスワードを入力してください');
                setLoading(false);
                return;
            }

            if (mode === 'signup') {
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
                if (!acceptTerms) {
                    setError('利用規約に同意してください');
                    setLoading(false);
                    return;
                }
            }
        }

        try {
            let result;
            
            if (mode === 'signin') {
                result = await signInWithEmail(email, password);
            } else if (mode === 'signup') {
                result = await signUpWithEmail(email, password, {
                    displayName: displayName || email.split('@')[0],
                    newsletter,
                    registrationDate: new Date().toISOString()
                });
            } else if (mode === 'reset') {
                result = await resetPassword(email);
            }

            if (result?.error) {
                // エラーメッセージを日本語化
                const errorMessage = translateAuthError(result.error.message);
                setError(errorMessage);
            } else {
                if (mode === 'signup') {
                    setMessage('登録確認メールを送信しました。メールを確認してアカウントを有効化してください。');
                } else if (mode === 'reset') {
                    setMessage('パスワードリセットのメールを送信しました。メールを確認してください。');
                } else {
                    setMessage('ログインしました！');
                    setTimeout(() => onClose(), 1000);
                }
            }
        } catch (err) {
            setError('認証でエラーが発生しました');
        } finally {
            setLoading(false);
        }
    };

    const handleResendConfirmation = async () => {
        if (!email) {
            setError('メールアドレスを入力してください');
            return;
        }

        setLoading(true);
        try {
            const { error } = await resendEmailConfirmation(email);
            if (error) {
                setError(translateAuthError(error.message));
            } else {
                setMessage('確認メールを再送信しました。');
            }
        } catch (err) {
            setError('確認メール送信でエラーが発生しました');
        } finally {
            setLoading(false);
        }
    };

    const translateAuthError = (errorMessage: string): string => {
        if (errorMessage.includes('Email not confirmed')) {
            return 'メールアドレスが確認されていません。確認メールをチェックしてください。';
        }
        if (errorMessage.includes('Invalid login credentials')) {
            return 'メールアドレスまたはパスワードが正しくありません。';
        }
        if (errorMessage.includes('User already registered')) {
            return 'このメールアドレスは既に登録されています。';
        }
        if (errorMessage.includes('Password should be')) {
            return 'パスワードは6文字以上で入力してください。';
        }
        if (errorMessage.includes('Invalid email')) {
            return '有効なメールアドレスを入力してください。';
        }
        return errorMessage;
    };

    const resetForm = () => {
        setEmail('');
        setPassword('');
        setConfirmPassword('');
        setDisplayName('');
        setAcceptTerms(false);
        setNewsletter(false);
        setError(null);
        setMessage(null);
    };

    const switchMode = (newMode: AuthMode) => {
        setMode(newMode);
        resetForm();
    };

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white/90 backdrop-blur-lg rounded-2xl shadow-2xl border border-white/30 w-full max-w-md">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-white/20">
                    <h2 className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                        {mode === 'signin' ? '🔑 ログイン' : mode === 'signup' ? '📝 新規登録' : '🔄 パスワードリセット'}
                    </h2>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <div className="p-6">
                    {/* Google認証 */}
                    <button
                        onClick={handleGoogleSignIn}
                        disabled={loading}
                        className="w-full mb-4 flex items-center justify-center px-4 py-3 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
                    >
                        <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
                            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                        </svg>
                        {loading ? '認証中...' : 'Googleでログイン'}
                    </button>

                    <div className="relative mb-4">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-gray-300"></div>
                        </div>
                        <div className="relative flex justify-center text-sm">
                            <span className="px-2 bg-white text-gray-500">または</span>
                        </div>
                    </div>

                    {/* メール認証フォーム */}
                    <form onSubmit={handleEmailAuth} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                メールアドレス
                            </label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                placeholder="example@email.com"
                                required
                            />
                        </div>

                        {mode === 'signup' && (
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    表示名（オプション）
                                </label>
                                <input
                                    type="text"
                                    value={displayName}
                                    onChange={(e) => setDisplayName(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                    placeholder="表示名"
                                />
                            </div>
                        )}

                        {mode !== 'reset' && (
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    パスワード
                                </label>
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                    placeholder="パスワード（6文字以上）"
                                    required
                                    minLength={6}
                                />
                            </div>
                        )}

                        {mode === 'signup' && (
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
                        )}

                        {mode === 'signup' && (
                            <div className="space-y-3">
                                <label className="flex items-center">
                                    <input
                                        type="checkbox"
                                        checked={acceptTerms}
                                        onChange={(e) => setAcceptTerms(e.target.checked)}
                                        className="mr-2 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                                        required
                                    />
                                    <span className="text-sm text-gray-700">
                                        <a href="#" className="text-indigo-600 hover:text-indigo-800">利用規約</a>と
                                        <a href="#" className="text-indigo-600 hover:text-indigo-800">プライバシーポリシー</a>に同意します
                                    </span>
                                </label>
                                <label className="flex items-center">
                                    <input
                                        type="checkbox"
                                        checked={newsletter}
                                        onChange={(e) => setNewsletter(e.target.checked)}
                                        className="mr-2 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                                    />
                                    <span className="text-sm text-gray-700">
                                        ニュースレターとアップデート情報を受け取る
                                    </span>
                                </label>
                            </div>
                        )}

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
                            {loading ? '処理中...' : 
                             mode === 'signin' ? 'ログイン' : 
                             mode === 'signup' ? '新規登録' : 
                             'パスワードリセット'}
                        </button>

                        {mode === 'signin' && (
                            <button
                                type="button"
                                onClick={() => switchMode('reset')}
                                className="w-full mt-2 text-indigo-600 hover:text-indigo-800 text-sm font-medium"
                            >
                                パスワードを忘れた方はこちら
                            </button>
                        )}

                        {message && message.includes('確認されていません') && (
                            <button
                                type="button"
                                onClick={handleResendConfirmation}
                                disabled={loading}
                                className="w-full mt-2 text-green-600 hover:text-green-800 text-sm font-medium disabled:opacity-50"
                            >
                                確認メールを再送信
                            </button>
                        )}
                    </form>

                    <div className="mt-4 text-center space-y-2">
                        {mode === 'signin' && (
                            <button
                                onClick={() => switchMode('signup')}
                                className="text-indigo-600 hover:text-indigo-800 text-sm font-medium block"
                            >
                                新規登録はこちら
                            </button>
                        )}
                        {mode === 'signup' && (
                            <button
                                onClick={() => switchMode('signin')}
                                className="text-indigo-600 hover:text-indigo-800 text-sm font-medium block"
                            >
                                すでにアカウントをお持ちですか？
                            </button>
                        )}
                        {mode === 'reset' && (
                            <button
                                onClick={() => switchMode('signin')}
                                className="text-indigo-600 hover:text-indigo-800 text-sm font-medium block"
                            >
                                ログインページに戻る
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};