import React from 'react';
import { useAuth } from './AuthProvider';

interface AuthButtonProps {
    onOpenAuthModal: () => void;
}

export const AuthButton: React.FC<AuthButtonProps> = ({ onOpenAuthModal }) => {
    const { isAuthenticated, isSupabaseEnabled } = useAuth();

    // Supabaseが無効の場合は表示しない
    if (!isSupabaseEnabled) {
        return null;
    }

    // 認証済みの場合は表示しない（UserProfileが表示される）
    if (isAuthenticated) {
        return null;
    }

    return (
        <button
            onClick={onOpenAuthModal}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
        >
            🔑 ログイン
        </button>
    );
};