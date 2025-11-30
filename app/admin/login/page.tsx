'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Lock, AlertCircle } from 'lucide-react';
import { createClient } from '@/lib/supabase';

export default function AdminLogin() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();
    const supabase = createClient();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');
        console.log(`Attempting login for ${email}`);

        try {
            const { data, error: signInError } = await supabase.auth.signInWithPassword({
                email,
                password,
            });

            if (signInError) {
                console.log(`Login Error: ${signInError.message}`);
                setError(signInError.message);
            } else {
                console.log('Login successful, checking session...');

                // Wait for session to be active
                let session = null;
                for (let i = 0; i < 5; i++) {
                    const { data: sessionData } = await supabase.auth.getSession();
                    console.log(`Session check ${i + 1}: ${sessionData.session ? 'Active' : 'Null'}`);

                    if (sessionData.session) {
                        session = sessionData.session;
                        break;
                    }
                    await new Promise(r => setTimeout(r, 500));
                }

                if (session) {
                    console.log('Session active, redirecting...');
                    router.refresh();
                    router.push('/admin/dashboard');
                } else {
                    const msg = 'Login successful but session failed to start.';
                    console.log(msg);
                    setError(msg);
                }
            }
        } catch (err: any) {
            console.error('Login error:', err);
            console.log(`Unexpected Error: ${err.message}`);
            setError('An unexpected error occurred');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex min-h-screen items-center justify-center bg-stone-50 dark:bg-stone-950 p-4">
            <div className="w-full max-w-md space-y-8">
                <div className="rounded-xl border border-stone-200 bg-white p-8 shadow-xl dark:border-stone-800 dark:bg-stone-900">
                    <div className="text-center">
                        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-stone-100 dark:bg-stone-800">
                            <Lock className="h-6 w-6 text-stone-900 dark:text-white" />
                        </div>
                        <h2 className="mt-4 font-serif text-2xl font-medium text-stone-900 dark:text-white">
                            Owner Access
                        </h2>
                        <p className="mt-2 text-sm text-stone-500">
                            Enter your master password to manage Hudemas.
                        </p>
                    </div>

                    <form onSubmit={handleLogin} className="mt-8 space-y-6">
                        <div className="space-y-4">
                            <div>
                                <label htmlFor="email" className="sr-only">Email address</label>
                                <input
                                    id="email"
                                    name="email"
                                    type="email"
                                    autoComplete="email"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="Email address"
                                    className="block w-full rounded-md border-stone-300 py-3 text-stone-900 shadow-sm focus:border-stone-500 focus:ring-stone-500 dark:bg-stone-950 dark:border-stone-700 dark:text-white"
                                />
                            </div>
                            <div>
                                <label htmlFor="password" className="sr-only">Password</label>
                                <input
                                    id="password"
                                    name="password"
                                    type="password"
                                    autoComplete="current-password"
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="Password"
                                    className="block w-full rounded-md border-stone-300 py-3 text-stone-900 shadow-sm focus:border-stone-500 focus:ring-stone-500 dark:bg-stone-950 dark:border-stone-700 dark:text-white"
                                />
                            </div>
                        </div>

                        {error && (
                            <div className="rounded-md bg-red-50 p-4 dark:bg-red-900/20">
                                <div className="flex">
                                    <div className="flex-shrink-0">
                                        <AlertCircle className="h-5 w-5 text-red-400" aria-hidden="true" />
                                    </div>
                                    <div className="ml-3">
                                        <h3 className="text-sm font-medium text-red-800 dark:text-red-200">
                                            Login Failed
                                        </h3>
                                        <div className="mt-2 text-sm text-red-700 dark:text-red-300">
                                            <p>{error}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full rounded-full bg-stone-900 py-3 text-sm font-medium text-white hover:bg-stone-800 disabled:opacity-50 dark:bg-white dark:text-stone-900 dark:hover:bg-stone-200"
                        >
                            {isLoading ? 'Signing in...' : 'Access Dashboard'}
                        </button>
                    </form>
                </div>


            </div>
        </div>
    );
}
