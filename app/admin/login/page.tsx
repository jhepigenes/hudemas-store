'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Lock } from 'lucide-react';

export default function AdminLogin() {
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const router = useRouter();

    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault();
        if (password === 'admin') {
            // Set a mock cookie or local storage
            localStorage.setItem('admin_session', 'true');
            router.push('/admin/dashboard');
        } else {
            setError('Invalid credentials');
        }
    };

    return (
        <div className="flex min-h-screen items-center justify-center bg-stone-50 dark:bg-stone-950">
            <div className="w-full max-w-md rounded-xl border border-stone-200 bg-white p-8 shadow-xl dark:border-stone-800 dark:bg-stone-900">
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
                    <div>
                        <label htmlFor="password" className="sr-only">Password</label>
                        <input
                            type="password"
                            required
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Enter password"
                            className="block w-full rounded-md border-stone-300 py-3 text-stone-900 shadow-sm focus:border-stone-500 focus:ring-stone-500 dark:bg-stone-950 dark:border-stone-700 dark:text-white"
                        />
                    </div>

                    {error && (
                        <p className="text-center text-sm text-red-600">{error}</p>
                    )}

                    <button
                        type="submit"
                        className="w-full rounded-full bg-stone-900 py-3 text-sm font-medium text-white hover:bg-stone-800 dark:bg-white dark:text-stone-900 dark:hover:bg-stone-200"
                    >
                        Access Dashboard
                    </button>
                </form>
            </div>
        </div>
    );
}
