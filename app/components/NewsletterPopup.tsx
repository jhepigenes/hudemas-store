'use client';

import { useState, useEffect } from 'react';
import { X, Mail } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function NewsletterPopup() {
    const [isOpen, setIsOpen] = useState(false);
    const [email, setEmail] = useState('');
    const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

    useEffect(() => {
        // Show after 5 seconds if not already subscribed/dismissed
        const hasSeen = localStorage.getItem('hudemas_newsletter_seen');
        if (!hasSeen) {
            const timer = setTimeout(() => setIsOpen(true), 5000);
            return () => clearTimeout(timer);
        }
    }, []);

    const handleClose = () => {
        setIsOpen(false);
        localStorage.setItem('hudemas_newsletter_seen', 'true');
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setStatus('loading');

        try {
            const res = await fetch('/api/newsletter/subscribe', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email })
            });

            if (res.ok) {
                setStatus('success');
                localStorage.setItem('hudemas_newsletter_seen', 'true');
                setTimeout(() => setIsOpen(false), 3000);
            } else {
                setStatus('error');
            }
        } catch (error) {
            setStatus('error');
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center px-4 sm:px-0">
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={handleClose}
                        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
                    />

                    {/* Modal */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        className="relative w-full max-w-lg bg-white dark:bg-stone-900 rounded-2xl shadow-2xl overflow-hidden"
                    >
                        <button
                            onClick={handleClose}
                            className="absolute top-4 right-4 p-2 text-stone-400 hover:text-stone-900 dark:hover:text-white z-10"
                        >
                            <X className="h-5 w-5" />
                        </button>

                        <div className="grid grid-cols-1 md:grid-cols-2">
                            <div className="hidden md:block relative h-full min-h-[300px]">
                                <img
                                    src="/stitched_gobelin_sample_1_1764415137741.png" // Use a nice image
                                    alt="Gobelin Art"
                                    className="absolute inset-0 h-full w-full object-cover"
                                />
                                <div className="absolute inset-0 bg-stone-900/20" />
                            </div>

                            <div className="p-8 flex flex-col justify-center">
                                <div className="text-center md:text-left">
                                    <h3 className="text-2xl font-serif font-medium text-stone-900 dark:text-white mb-2">
                                        Join our family
                                    </h3>
                                    <p className="text-sm text-stone-600 dark:text-stone-400 mb-6">
                                        Subscribe to get <strong>10% OFF</strong> your first kit (Code: WELCOME10) and exclusive updates.
                                    </p>
                                </div>

                                {status === 'success' ? (
                                    <div className="text-center py-4 bg-green-50 text-green-800 rounded-lg dark:bg-green-900/20 dark:text-green-400">
                                        <p className="font-medium">Welcome!</p>
                                        <p className="text-xs mt-1">Use code <strong>WELCOME10</strong></p>
                                    </div>
                                ) : (
                                    <form onSubmit={handleSubmit} className="space-y-3">
                                        <div>
                                            <label htmlFor="email" className="sr-only">Email address</label>
                                            <div className="relative">
                                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
                                                <input
                                                    type="email"
                                                    id="email"
                                                    required
                                                    placeholder="your@email.com"
                                                    value={email}
                                                    onChange={(e) => setEmail(e.target.value)}
                                                    className="block w-full pl-10 pr-3 py-2.5 border border-stone-200 rounded-lg text-sm focus:ring-stone-500 focus:border-stone-500 dark:bg-stone-800 dark:border-stone-700 dark:text-white"
                                                />
                                            </div>
                                        </div>
                                        <button
                                            type="submit"
                                            disabled={status === 'loading'}
                                            className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-stone-900 hover:bg-stone-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-stone-500 disabled:opacity-50 dark:bg-white dark:text-stone-900"
                                        >
                                            {status === 'loading' ? 'Signing up...' : 'Get my discount'}
                                        </button>
                                        {status === 'error' && (
                                            <p className="text-xs text-red-500 text-center">Something went wrong. Try again.</p>
                                        )}
                                    </form>
                                )}
                                <p className="mt-4 text-xs text-center md:text-left text-stone-400">
                                    We respect your inbox. Unsubscribe anytime.
                                </p>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
