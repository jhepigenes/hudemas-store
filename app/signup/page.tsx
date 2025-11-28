'use client';

import { createClient } from '@/lib/supabase';
import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';

function SignUpContent() {
    const supabase = createClient();
    const router = useRouter();
    const searchParams = useSearchParams();
    const returnUrl = searchParams.get('returnUrl') || '/marketplace/dashboard';
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setIsMounted(true);
        const { data: { subscription } } = supabase.auth.onAuthStateChange((event: string, session: any) => {
            if (event === 'SIGNED_IN') {
                router.push(returnUrl);
                router.refresh();
            }
        });

        return () => subscription.unsubscribe();
    }, [supabase, router, returnUrl]);

    if (!isMounted) return null;

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-md bg-white dark:bg-stone-900 rounded-2xl shadow-xl p-8 border border-stone-100 dark:border-stone-800"
        >
            <div className="text-center mb-8">
                <h1 className="font-serif text-3xl text-stone-900 dark:text-stone-50 mb-2">Join the Guild</h1>
                <p className="font-sans text-stone-600 dark:text-stone-400">Create an account to sell & collect art</p>
            </div>

            <Auth
                supabaseClient={supabase}
                view="sign_up"
                appearance={{
                    theme: ThemeSupa,
                    variables: {
                        default: {
                            colors: {
                                brand: '#1c1917',
                                brandAccent: '#44403c',
                                inputBackground: 'transparent',
                                inputText: 'inherit',
                                inputBorder: '#e7e5e4',
                                inputBorderFocus: '#1c1917',
                                inputBorderHover: '#a8a29e',
                            },
                            radii: {
                                borderRadiusButton: '0.5rem',
                                buttonBorderRadius: '0.5rem',
                                inputBorderRadius: '0.5rem',
                            },
                            fonts: {
                                bodyFontFamily: 'var(--font-inter)',
                                buttonFontFamily: 'var(--font-inter)',
                                inputFontFamily: 'var(--font-inter)',
                                labelFontFamily: 'var(--font-inter)',
                            },
                        },
                    },
                    className: {
                        container: 'font-sans',
                        button: 'bg-stone-900 dark:bg-stone-50 text-white dark:text-stone-900 hover:bg-stone-800 dark:hover:bg-stone-200 transition-colors font-medium',
                        input: 'bg-white dark:bg-stone-800 border-stone-200 dark:border-stone-700 text-stone-900 dark:text-stone-50 focus:border-stone-900 dark:focus:border-stone-50',
                        label: 'text-stone-600 dark:text-stone-400',
                        anchor: 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-50 transition-colors',
                    },
                }}
                providers={['google', 'apple']}
                redirectTo={`${window.location.origin}/auth/callback?next=${encodeURIComponent(returnUrl)}`}
            />
        </motion.div>
    );
}

export default function SignUpPage() {
    return (
        <div className="min-h-screen bg-stone-50 dark:bg-stone-950 flex items-center justify-center px-4 transition-colors duration-300">
            <Suspense fallback={<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-stone-900"></div>}>
                <SignUpContent />
            </Suspense>
        </div>
    );
}
