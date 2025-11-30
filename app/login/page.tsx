'use client';

import { createClient } from '@/lib/supabase';
import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';

function LoginContent() {
    const supabase = createClient();
    const router = useRouter();
    const searchParams = useSearchParams();
    const returnUrl = searchParams.get('returnUrl') || '/marketplace/dashboard';
    const [isMounted, setIsMounted] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        setIsMounted(true);
        // Check active session immediately
        supabase.auth.getSession().then(({ data: { session } }: { data: { session: any } }) => {
            if (session) {
                router.push(returnUrl);
                router.refresh();
            }
        });
    }, [supabase, router, returnUrl]);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        const { error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });

        if (error) {
            setError(error.message);
            setLoading(false);
        } else {
            router.push(returnUrl);
            router.refresh();
        }
    };

    if (!isMounted) return null;

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-md bg-white dark:bg-stone-900 rounded-2xl shadow-xl p-8 border border-stone-100 dark:border-stone-800"
        >
            <div className="text-center mb-8">
                <h1 className="font-serif text-3xl text-stone-900 dark:text-stone-50 mb-2">Welcome Back</h1>
                <p className="font-sans text-stone-600 dark:text-stone-400">Sign in to manage your collection</p>
            </div>

            <form onSubmit={handleLogin} className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-1">Email</label>
                    <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full rounded-lg border-stone-200 bg-stone-50 px-4 py-3 text-stone-900 focus:border-stone-500 focus:ring-stone-500 dark:bg-stone-800 dark:border-stone-700 dark:text-white"
                        placeholder="email@example.com"
                        required
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-1">Password</label>
                    <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full rounded-lg border-stone-200 bg-stone-50 px-4 py-3 text-stone-900 focus:border-stone-500 focus:ring-stone-500 dark:bg-stone-800 dark:border-stone-700 dark:text-white"
                        placeholder="••••••••"
                        required
                    />
                </div>

                {error && (
                    <div className="text-red-500 text-sm bg-red-50 dark:bg-red-900/20 p-3 rounded-lg">
                        {error}
                    </div>
                )}

                <button
                    type="submit"
                    disabled={loading}
                    className="w-full rounded-full bg-stone-900 py-3 text-white hover:bg-stone-800 disabled:opacity-50 dark:bg-white dark:text-stone-900 transition-all font-medium"
                >
                    {loading ? 'Signing in...' : 'Sign In'}
                </button>

                <div className="relative my-6">
                    <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-stone-200 dark:border-stone-800"></div>
                    </div>
                    <div className="relative flex justify-center text-sm">
                        <span className="bg-white px-2 text-stone-500 dark:bg-stone-900">Or continue with</span>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                    <button
                        type="button"
                        onClick={async () => {
                            const { error } = await supabase.auth.signInWithOAuth({
                                provider: 'google',
                                options: { redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(returnUrl)}` }
                            });
                            if (error) setError(error.message);
                        }}
                        className="flex items-center justify-center gap-2 rounded-lg border border-stone-200 bg-white px-4 py-2 text-sm font-medium text-stone-700 hover:bg-stone-50 dark:border-stone-700 dark:bg-stone-800 dark:text-stone-200 dark:hover:bg-stone-700 transition-colors"
                    >
                        <svg className="h-5 w-5" viewBox="0 0 24 24">
                            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                            <path d="M5.84 14.17c-.22-.66-.35-1.36-.35-2.17s.13-1.51.35-2.17V7.01H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.99l3.66-2.82z" fill="#FBBC05" />
                            <path d="M12 4.81c1.6 0 3.04.55 4.19 1.64l3.15-3.15C17.45 1.45 14.97 0 12 0 7.7 0 3.99 2.47 2.18 7.01l3.66 2.82c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                        </svg>
                        Google
                    </button>
                    <button
                        type="button"
                        onClick={async () => {
                            const { error } = await supabase.auth.signInWithOAuth({
                                provider: 'apple',
                                options: { redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(returnUrl)}` }
                            });
                            if (error) setError(error.message);
                        }}
                        className="flex items-center justify-center gap-2 rounded-lg border border-stone-200 bg-white px-4 py-2 text-sm font-medium text-stone-700 hover:bg-stone-50 dark:border-stone-700 dark:bg-stone-800 dark:text-stone-200 dark:hover:bg-stone-700 transition-colors"
                    >
                        <svg className="h-5 w-5 text-black dark:text-white" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.74 1.18 0 2.45-1.62 4.37-1.62 1.71.12 3.08.84 3.95 2.17-3.26 1.88-2.61 6.52 1.05 7.91-.75 2.07-1.9 4.08-4.45 3.77zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
                        </svg>
                        Apple
                    </button>
                </div>
            </form>

            <div className="mt-6 text-center text-sm text-stone-500">
                Don't have an account?{' '}
                <a href={`/signup?returnUrl=${encodeURIComponent(returnUrl)}`} className="text-stone-900 dark:text-white hover:underline">
                    Sign up
                </a>
            </div>
        </motion.div>
    );
}

export default function LoginPage() {
    return (
        <div className="min-h-screen bg-stone-50 dark:bg-stone-950 flex items-center justify-center px-4 transition-colors duration-300">
            <Suspense fallback={<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-stone-900"></div>}>
                <LoginContent />
            </Suspense>
        </div>
    );
}
