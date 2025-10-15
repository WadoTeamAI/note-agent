import React, { createContext, useContext, useEffect, useState } from 'react';
import { Session, User, AuthError } from '@supabase/supabase-js';
import { supabase, isSupabaseAvailable } from '../../services/database/supabaseClient';

interface AuthContextType {
    user: User | null;
    session: Session | null;
    loading: boolean;
    signInWithGoogle: () => Promise<{ error: AuthError | null }>;
    signInWithEmail: (email: string, password: string) => Promise<{ error: AuthError | null }>;
    signUpWithEmail: (email: string, password: string) => Promise<{ error: AuthError | null }>;
    signOut: () => Promise<{ error: AuthError | null }>;
    isAuthenticated: boolean;
    isSupabaseEnabled: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

interface AuthProviderProps {
    children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [session, setSession] = useState<Session | null>(null);
    const [loading, setLoading] = useState(true);
    const isSupabaseEnabled = isSupabaseAvailable();

    useEffect(() => {
        if (!isSupabaseEnabled) {
            setLoading(false);
            return;
        }

        // 初期セッション取得
        const getSession = async () => {
            try {
                const { data: { session } } = await supabase!.auth.getSession();
                setSession(session);
                setUser(session?.user || null);
            } catch (error) {
                console.error('Error getting session:', error);
            } finally {
                setLoading(false);
            }
        };

        getSession();

        // 認証状態変化の監視
        const { data: { subscription } } = supabase!.auth.onAuthStateChange(
            async (event, session) => {
                console.log('Auth state changed:', event, session?.user?.email);
                setSession(session);
                setUser(session?.user || null);
                setLoading(false);
            }
        );

        return () => subscription.unsubscribe();
    }, [isSupabaseEnabled]);

    const signInWithGoogle = async () => {
        if (!isSupabaseEnabled) {
            return { error: new Error('Supabase is not configured') as AuthError };
        }

        try {
            const { error } = await supabase!.auth.signInWithOAuth({
                provider: 'google',
                options: {
                    redirectTo: window.location.origin
                }
            });
            return { error };
        } catch (error) {
            console.error('Google sign in error:', error);
            return { error: error as AuthError };
        }
    };

    const signInWithEmail = async (email: string, password: string) => {
        if (!isSupabaseEnabled) {
            return { error: new Error('Supabase is not configured') as AuthError };
        }

        try {
            const { error } = await supabase!.auth.signInWithPassword({
                email,
                password
            });
            return { error };
        } catch (error) {
            console.error('Email sign in error:', error);
            return { error: error as AuthError };
        }
    };

    const signUpWithEmail = async (email: string, password: string) => {
        if (!isSupabaseEnabled) {
            return { error: new Error('Supabase is not configured') as AuthError };
        }

        try {
            const { error } = await supabase!.auth.signUp({
                email,
                password,
                options: {
                    emailRedirectTo: window.location.origin
                }
            });
            return { error };
        } catch (error) {
            console.error('Email sign up error:', error);
            return { error: error as AuthError };
        }
    };

    const signOut = async () => {
        if (!isSupabaseEnabled) {
            return { error: new Error('Supabase is not configured') as AuthError };
        }

        try {
            const { error } = await supabase!.auth.signOut();
            return { error };
        } catch (error) {
            console.error('Sign out error:', error);
            return { error: error as AuthError };
        }
    };

    const value: AuthContextType = {
        user,
        session,
        loading,
        signInWithGoogle,
        signInWithEmail,
        signUpWithEmail,
        signOut,
        isAuthenticated: !!user,
        isSupabaseEnabled
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};