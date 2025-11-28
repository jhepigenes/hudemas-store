'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, Palette, ShoppingBag } from 'lucide-react';
import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase';

export default function MarketplacePage() {
    const supabase = createClient();
    const [latestListings, setLatestListings] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchLatest = async () => {
            try {
                const { data, error } = await supabase
                    .from('marketplace_listings')
                    .select(`
                        *,
                        artists (full_name)
                    `)
                    .eq('status', 'active')
                    .order('created_at', { ascending: false })
                    .limit(3);

                if (!error && data) {
                    setLatestListings(data);
                }
            } catch (error) {
                console.error("Error fetching latest:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchLatest();
    }, []);

    return (
        <div className="min-h-screen bg-stone-50 dark:bg-stone-950 pt-24 pb-12 px-4 sm:px-6 lg:px-8 transition-colors duration-300">
            <div className="max-w-7xl mx-auto">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8 }}
                    className="text-center mb-16"
                >
                    <h1 className="font-serif text-5xl md:text-7xl text-stone-900 dark:text-stone-50 mb-6">
                        The Masterpiece Marketplace
                    </h1>
                    <p className="font-sans text-xl text-stone-600 dark:text-stone-300 max-w-2xl mx-auto">
                        A curated collection of finished Hudemas tapestries. Buy a piece of history, or sell your own completed masterpiece.
                    </p>
                </motion.div>

                <div className="grid md:grid-cols-2 gap-8 mb-24">
                    {/* Buy Section */}
                    <motion.div
                        initial={{ opacity: 0, x: -50 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.2, duration: 0.8 }}
                        className="group relative h-[600px] overflow-hidden rounded-lg bg-stone-900"
                    >
                        <Image
                            src="https://www.hudemas.ro/assets/images/products/large/goblen-hudemas-760-melancholy-492.jpg"
                            alt="Dusk - Finished Tapestry"
                            fill
                            sizes="(max-width: 768px) 100vw, 50vw"
                            priority
                            className="object-cover opacity-60 transition-transform duration-700 group-hover:scale-105"
                        />
                        <div className="absolute inset-0 flex flex-col justify-end p-12">
                            <h2 className="font-serif text-4xl text-stone-50 mb-4">Acquire Art</h2>
                            <p className="font-sans text-stone-200 mb-8 max-w-md">
                                Discover exquisite, hand-stitched tapestries ready to adorn your home. Each piece is a unique labor of love.
                            </p>
                            <Link
                                href="/marketplace/browse"
                                className="inline-flex items-center gap-2 bg-stone-50 text-stone-900 px-8 py-4 rounded-full font-sans font-medium hover:bg-stone-200 transition-colors w-fit"
                            >
                                <ShoppingBag className="w-5 h-5" />
                                Browse Collection
                            </Link>
                        </div>
                    </motion.div>

                    {/* Sell Section */}
                    <motion.div
                        initial={{ opacity: 0, x: 50 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.4, duration: 0.8 }}
                        className="group relative h-[600px] overflow-hidden rounded-lg bg-stone-900"
                    >
                        <Image
                            src="https://www.hudemas.ro/assets/images/products/large/goblen-hudemas-577-vaza-cu-anemone-580.jpg"
                            alt="Stitching Vaza cu anemone"
                            fill
                            sizes="(max-width: 768px) 100vw, 50vw"
                            priority
                            className="object-cover opacity-60 transition-transform duration-700 group-hover:scale-105"
                        />
                        <div className="absolute inset-0 flex flex-col justify-end p-12">
                            <h2 className="font-serif text-4xl text-stone-50 mb-4">Sell Your Masterpiece</h2>
                            <p className="font-sans text-stone-200 mb-8 max-w-md">
                                Turn your passion into profit. List your finished Hudemas tapestries and connect with collectors worldwide.
                            </p>
                            <Link
                                href="/marketplace/sell"
                                className="inline-flex items-center gap-2 bg-stone-50 text-stone-900 px-8 py-4 rounded-full font-sans font-medium hover:bg-stone-200 transition-colors w-fit"
                            >
                                <Palette className="w-5 h-5" />
                                Start Selling
                            </Link>
                        </div>
                    </motion.div>
                </div>

                {/* Featured Listings (Dynamic) */}
                {!loading && latestListings.length > 0 && (
                    <div className="mb-12">
                        <h3 className="font-serif text-3xl text-stone-900 dark:text-stone-50 mb-8 text-center">Latest Arrivals</h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                            {latestListings.map((item) => (
                                <div key={item.id} className="group cursor-pointer">
                                    <div className="relative aspect-[4/5] overflow-hidden rounded-lg mb-4 bg-stone-200 dark:bg-stone-800">
                                        {item.image_url && (
                                            <Image
                                                src={item.image_url}
                                                alt={item.title}
                                                fill
                                                sizes="(max-width: 768px) 100vw, 33vw"
                                                className="object-cover transition-transform duration-500 group-hover:scale-105"
                                                unoptimized
                                            />
                                        )}
                                    </div>
                                    <h4 className="font-serif text-xl text-stone-900 dark:text-stone-50">
                                        {item.title}
                                    </h4>
                                    <p className="font-sans text-stone-500 dark:text-stone-400 text-sm mb-2">
                                        Stitched by {item.artists?.full_name || 'Unknown'}
                                    </p>
                                    <p className="font-sans text-stone-900 dark:text-stone-50 font-medium">
                                        {item.price} RON
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
