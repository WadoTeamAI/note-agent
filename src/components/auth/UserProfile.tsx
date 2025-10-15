import React, { useState } from 'react';
import { useAuth } from './AuthProvider';

interface UserProfileProps {
    showFullProfile?: boolean;
}

export const UserProfile: React.FC<UserProfileProps> = ({ showFullProfile = false }) => {
    const { user, signOut, isAuthenticated, isSupabaseEnabled } = useAuth();
    const [showDropdown, setShowDropdown] = useState(false);
    const [isSigningOut, setIsSigningOut] = useState(false);

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
        if (user.user_metadata?.full_name) {
            return user.user_metadata.full_name;
        }
        if (user.user_metadata?.name) {
            return user.user_metadata.name;
        }
        return user.email?.split('@')[0] || 'ユーザー';
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

                <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                            <span className="text-gray-600">プロバイダー:</span>
                            <span className="ml-2 font-medium">
                                {user.app_metadata?.provider === 'google' ? 'Google' : 'Email'}
                            </span>
                        </div>
                        <div>
                            <span className="text-gray-600">登録日:</span>
                            <span className="ml-2 font-medium">
                                {new Date(user.created_at).toLocaleDateString('ja-JP')}
                            </span>
                        </div>
                    </div>

                    <button
                        onClick={handleSignOut}
                        disabled={isSigningOut}
                        className="w-full mt-4 px-4 py-2 bg-red-500 hover:bg-red-600 text-white font-medium rounded-lg transition-colors disabled:opacity-50"
                    >
                        {isSigningOut ? 'ログアウト中...' : 'ログアウト'}
                    </button>
                </div>
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

                        <div className="border-t border-gray-200 pt-3">
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