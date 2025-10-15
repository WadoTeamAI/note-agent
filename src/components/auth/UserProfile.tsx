import React, { useState } from 'react';
import { useAuth } from './AuthProvider';

interface UserProfileProps {
    showFullProfile?: boolean;
    onEditProfile?: () => void;
}

export const UserProfile: React.FC<UserProfileProps> = ({ showFullProfile = false, onEditProfile }) => {
    const { user, signOut, updateUserProfile, isAuthenticated, isSupabaseEnabled, isEmailConfirmed } = useAuth();
    const [showDropdown, setShowDropdown] = useState(false);
    const [isSigningOut, setIsSigningOut] = useState(false);
    const [showEditForm, setShowEditForm] = useState(false);
    const [editForm, setEditForm] = useState({
        displayName: user?.user_metadata?.display_name || '',
        bio: user?.user_metadata?.bio || '',
        website: user?.user_metadata?.website || '',
        preferences: {
            newsletter: user?.user_metadata?.preferences?.newsletter || false,
            notifications: user?.user_metadata?.preferences?.notifications || true,
            theme: user?.user_metadata?.preferences?.theme || 'light'
        }
    });
    const [isUpdating, setIsUpdating] = useState(false);

    if (!isSupabaseEnabled) {
        return (
            <div className="flex items-center space-x-2 px-3 py-2 bg-yellow-50 border border-yellow-200 rounded-lg">
                <span className="text-yellow-600 text-sm">⚠️ ゲストモード</span>
            </div>
        );
    }

    if (!isAuthenticated || !user) {
        return null;
    }

    const handleSignOut = async () => {
        setIsSigningOut(true);
        try {
            const { error } = await signOut();
            if (error) {
                console.error('Sign out error:', error);
                alert('ログアウトに失敗しました');
            }
        } catch (err) {
            console.error('Sign out error:', err);
            alert('ログアウトに失敗しました');
        } finally {
            setIsSigningOut(false);
            setShowDropdown(false);
        }
    };

    const getDisplayName = () => {
        if (user?.user_metadata?.display_name) {
            return user.user_metadata.display_name;
        }
        if (user?.user_metadata?.full_name) {
            return user.user_metadata.full_name;
        }
        if (user?.user_metadata?.name) {
            return user.user_metadata.name;
        }
        return user?.email?.split('@')[0] || 'ユーザー';
    };

    const handleProfileUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsUpdating(true);

        try {
            const { error } = await updateUserProfile({
                display_name: editForm.displayName,
                bio: editForm.bio,
                website: editForm.website,
                preferences: editForm.preferences
            });

            if (error) {
                alert('プロフィール更新に失敗しました: ' + error.message);
            } else {
                alert('プロフィールを更新しました！');
                setShowEditForm(false);
            }
        } catch (err) {
            alert('プロフィール更新でエラーが発生しました');
        } finally {
            setIsUpdating(false);
        }
    };

    const getAvatarUrl = () => {
        return user.user_metadata?.avatar_url || user.user_metadata?.picture;
    };

    if (showFullProfile) {
        return (
            <div className="bg-white/60 backdrop-blur-lg rounded-xl border border-white/30 p-6">
                <div className="flex items-center space-x-4 mb-4">
                    {getAvatarUrl() ? (
                        <img 
                            src={getAvatarUrl()} 
                            alt="Profile" 
                            className="w-16 h-16 rounded-full border-2 border-indigo-200"
                        />
                    ) : (
                        <div className="w-16 h-16 bg-gradient-to-r from-indigo-400 to-purple-400 rounded-full flex items-center justify-center">
                            <span className="text-white text-xl font-bold">
                                {getDisplayName().charAt(0).toUpperCase()}
                            </span>
                        </div>
                    )}
                    <div>
                        <h3 className="text-lg font-bold text-gray-800">{getDisplayName()}</h3>
                        <p className="text-gray-600 text-sm">{user.email}</p>
                        <div className="flex items-center space-x-2 mt-1">
                            <span className="inline-block w-2 h-2 bg-green-400 rounded-full"></span>
                            <span className="text-xs text-gray-500">認証済み</span>
                        </div>
                    </div>
                </div>

                <div className="space-y-4">
                    {/* ユーザー統計 */}
                    <div className="bg-gray-50 rounded-lg p-3">
                        <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                                <span className="text-gray-600">プロバイダー:</span>
                                <span className="ml-2 font-medium">
                                    {user.app_metadata?.provider === 'google' ? '🌐 Google' : '📧 Email'}
                                </span>
                            </div>
                            <div>
                                <span className="text-gray-600">登録日:</span>
                                <span className="ml-2 font-medium">
                                    {new Date(user.created_at).toLocaleDateString('ja-JP')}
                                </span>
                            </div>
                            <div>
                                <span className="text-gray-600">認証状態:</span>
                                <span className={`ml-2 font-medium ${
                                    isEmailConfirmed ? 'text-green-600' : 'text-yellow-600'
                                }`}>
                                    {isEmailConfirmed ? '✅ 認証済み' : '⏳ 未認証'}
                                </span>
                            </div>
                            <div>
                                <span className="text-gray-600">最終ログイン:</span>
                                <span className="ml-2 font-medium">
                                    {new Date(user.last_sign_in_at || user.created_at).toLocaleDateString('ja-JP')}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* プロフィール詳細 */}
                    {user.user_metadata?.bio && (
                        <div>
                            <h4 className="text-sm font-medium text-gray-700 mb-1">自己紹介</h4>
                            <p className="text-sm text-gray-600">{user.user_metadata.bio}</p>
                        </div>
                    )}

                    {user.user_metadata?.website && (
                        <div>
                            <h4 className="text-sm font-medium text-gray-700 mb-1">ウェブサイト</h4>
                            <a 
                                href={user.user_metadata.website} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-sm text-indigo-600 hover:text-indigo-800"
                            >
                                {user.user_metadata.website}
                            </a>
                        </div>
                    )}

                    {/* アクションボタン */}
                    <div className="space-y-2">
                        <button
                            onClick={() => setShowEditForm(true)}
                            className="w-full px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white font-medium rounded-lg transition-colors"
                        >
                            ⚙️ プロフィール編集
                        </button>
                        
                        <button
                            onClick={handleSignOut}
                            disabled={isSigningOut}
                            className="w-full px-4 py-2 bg-red-500 hover:bg-red-600 text-white font-medium rounded-lg transition-colors disabled:opacity-50"
                        >
                            {isSigningOut ? 'ログアウト中...' : '🚪 ログアウト'}
                        </button>
                    </div>
                </div>

                {/* プロフィール編集フォーム */}
                {showEditForm && (
                    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                        <div className="bg-white/90 backdrop-blur-lg rounded-2xl shadow-2xl border border-white/30 w-full max-w-md max-h-[90vh] overflow-y-auto">
                            <div className="p-6">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-lg font-bold text-gray-800">プロフィール編集</h3>
                                    <button
                                        onClick={() => setShowEditForm(false)}
                                        className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
                                    >
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    </button>
                                </div>

                                <form onSubmit={handleProfileUpdate} className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            表示名
                                        </label>
                                        <input
                                            type="text"
                                            value={editForm.displayName}
                                            onChange={(e) => setEditForm(prev => ({ ...prev, displayName: e.target.value }))}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                            placeholder="表示名"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            自己紹介
                                        </label>
                                        <textarea
                                            value={editForm.bio}
                                            onChange={(e) => setEditForm(prev => ({ ...prev, bio: e.target.value }))}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                            placeholder="自己紹介（任意）"
                                            rows={3}
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            ウェブサイト
                                        </label>
                                        <input
                                            type="url"
                                            value={editForm.website}
                                            onChange={(e) => setEditForm(prev => ({ ...prev, website: e.target.value }))}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                            placeholder="https://example.com"
                                        />
                                    </div>

                                    <div className="space-y-3">
                                        <h4 className="text-sm font-medium text-gray-700">設定</h4>
                                        
                                        <label className="flex items-center">
                                            <input
                                                type="checkbox"
                                                checked={editForm.preferences.newsletter}
                                                onChange={(e) => setEditForm(prev => ({
                                                    ...prev,
                                                    preferences: { ...prev.preferences, newsletter: e.target.checked }
                                                }))}
                                                className="mr-2 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                                            />
                                            <span className="text-sm text-gray-700">ニュースレターを受け取る</span>
                                        </label>
                                        
                                        <label className="flex items-center">
                                            <input
                                                type="checkbox"
                                                checked={editForm.preferences.notifications}
                                                onChange={(e) => setEditForm(prev => ({
                                                    ...prev,
                                                    preferences: { ...prev.preferences, notifications: e.target.checked }
                                                }))}
                                                className="mr-2 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                                            />
                                            <span className="text-sm text-gray-700">通知を受け取る</span>
                                        </label>
                                    </div>

                                    <div className="flex space-x-3">
                                        <button
                                            type="button"
                                            onClick={() => setShowEditForm(false)}
                                            className="flex-1 px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white font-medium rounded-lg transition-colors"
                                        >
                                            キャンセル
                                        </button>
                                        <button
                                            type="submit"
                                            disabled={isUpdating}
                                            className="flex-1 px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white font-medium rounded-lg transition-colors disabled:opacity-50"
                                        >
                                            {isUpdating ? '更新中...' : '保存'}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        );
    }

    // コンパクト表示（ヘッダー用）
    return (
        <div className="relative">
            <button
                onClick={() => setShowDropdown(!showDropdown)}
                className="flex items-center space-x-2 px-3 py-2 bg-white/60 backdrop-blur-lg border border-white/30 rounded-lg hover:bg-white/80 transition-all"
            >
                {getAvatarUrl() ? (
                    <img 
                        src={getAvatarUrl()} 
                        alt="Profile" 
                        className="w-8 h-8 rounded-full"
                    />
                ) : (
                    <div className="w-8 h-8 bg-gradient-to-r from-indigo-400 to-purple-400 rounded-full flex items-center justify-center">
                        <span className="text-white text-sm font-bold">
                            {getDisplayName().charAt(0).toUpperCase()}
                        </span>
                    </div>
                )}
                <span className="text-sm font-medium text-gray-700 hidden sm:block">
                    {getDisplayName()}
                </span>
                <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
            </button>

            {showDropdown && (
                <div className="absolute right-0 mt-2 w-64 bg-white/90 backdrop-blur-lg rounded-xl shadow-2xl border border-white/30 z-50">
                    <div className="p-4">
                        <div className="flex items-center space-x-3 mb-3">
                            {getAvatarUrl() ? (
                                <img 
                                    src={getAvatarUrl()} 
                                    alt="Profile" 
                                    className="w-12 h-12 rounded-full"
                                />
                            ) : (
                                <div className="w-12 h-12 bg-gradient-to-r from-indigo-400 to-purple-400 rounded-full flex items-center justify-center">
                                    <span className="text-white text-lg font-bold">
                                        {getDisplayName().charAt(0).toUpperCase()}
                                    </span>
                                </div>
                            )}
                            <div>
                                <p className="font-bold text-gray-800">{getDisplayName()}</p>
                                <p className="text-sm text-gray-600">{user.email}</p>
                            </div>
                        </div>

                        <div className="border-t border-gray-200 pt-3 space-y-1">
                            {!isEmailConfirmed && (
                                <div className="px-3 py-2 bg-yellow-50 border border-yellow-200 rounded-lg">
                                    <p className="text-xs text-yellow-700">⚠️ メール認証が完了していません</p>
                                </div>
                            )}
                            
                            <button
                                onClick={() => {
                                    setShowEditForm(true);
                                    setShowDropdown(false);
                                }}
                                className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
                            >
                                ⚙️ プロフィール編集
                            </button>
                            
                            <button
                                onClick={handleSignOut}
                                disabled={isSigningOut}
                                className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                            >
                                {isSigningOut ? 'ログアウト中...' : '🚪 ログアウト'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};