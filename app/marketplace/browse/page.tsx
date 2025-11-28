'use client';

import { motion } from 'framer-motion';
import { Search, Filter, SlidersHorizontal, Loader2 } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase';

const CATEGORIES = ['All', 'Gobelins', 'Frames', 'Landscape', 'Still Life', 'Portrait', 'Religious', 'Nature', 'Modern'];

export default function BrowsePage() {
    const supabase = createClient();
    const [listings, setListings] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedCategory, setSelectedCategory] = useState('All');
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        fetchListings();
    }, []);

    const fetchListings = async () => {
        try {
            setLoading(true);
            let query = supabase
                .from('marketplace_listings')
                .select(`
                    *,
                    artists (
                        full_name
                    )
                `)
                .eq('status', 'active')
                .order('created_at', { ascending: false });

            if (selectedCategory !== 'All') {
                // Map frontend categories to DB categories if needed
                // For now, assuming direct match or simple mapping
                // "Landscape", "Still Life" etc might not match "Goblenuri" directly
                // But "Accesorii" matches.
                // If the user selects "Landscape", we might need to search in description or title still
                // UNLESS we classify them.
                // The scraper sets category to "Goblenuri" or "Accesorii".
                // So for now, if category is "Goblenuri", we show all Gobelins.
                // If "Accesorii", we show accessories.
                // But the UI has "Landscape", "Still Life" etc.
                // These are sub-categories of Gobelins.
                // So we should keep the text search for these sub-categories, 
                // BUT use the DB category for "Frames" (Accesorii) if we add it to the UI list.

                // Let's update the CATEGORIES list to include "Frames" / "Accesorii"
                // And use text search for the others for now, as we don't have sub-category data yet.

                // However, for "Frames", we can use the category column.
                if (selectedCategory === 'Frames' || selectedCategory === 'Accesorii') {
                    query = query.eq('category', 'Accesorii');
                } else if (selectedCategory === 'Gobelins') {
                    query = query.eq('category', 'Goblenuri');
                } else {
                    // For other tags, we filter client-side or add text search to query
                    // Let's keep client-side filtering for now for sub-tags
                }
            }

            const { data, error } = await query;

            if (error) throw error;
            setListings(data || []);
        } catch (error) {
            console.error('Error fetching listings:', error);
        } finally {
            setLoading(false);
        }
    };

    const filteredItems = listings.filter((item: any) => {
        // Client-side filtering for sub-categories (Landscape, etc.)
        if (selectedCategory === 'All' || selectedCategory === 'Frames' || selectedCategory === 'Gobelins') return true;

        return (
            (item.description && item.description.toLowerCase().includes(selectedCategory.toLowerCase())) ||
            (item.title && item.title.toLowerCase().includes(selectedCategory.toLowerCase()))
        );
    }).filter((item: any) => {
        const artistName = item.artists?.full_name || 'Unknown Artist';
        return item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            artistName.toLowerCase().includes(searchQuery.toLowerCase());
    });

    return (
        <div className="min-h-screen bg-stone-50 dark:bg-stone-900 pt-32 pb-12 px-4 sm:px-6 lg:px-8 transition-colors duration-300">
            <div className="max-w-7xl mx-auto">
                <div className="text-center mb-16">
                    <h1 className="font-serif text-4xl md:text-6xl text-stone-900 dark:text-stone-50 mb-6">
                        Curated Collection
                    </h1>
                    <p className="font-sans text-stone-600 dark:text-stone-300 max-w-2xl mx-auto text-lg">
                        Browse finished masterpieces from our community of artisans. Each piece is unique.
                    </p>
                </div>

                {/* Filters & Search */}
                <div className="flex flex-col md:flex-row justify-between items-center gap-6 mb-12 sticky top-20 bg-stone-50/95 dark:bg-stone-900/95 backdrop-blur-md p-4 z-40 rounded-xl border border-stone-100 dark:border-stone-800 shadow-sm transition-all duration-300">
                    {/* Categories */}
                    <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-2 md:pb-0 no-scrollbar">
                        <Filter className="w-5 h-5 text-stone-400 flex-shrink-0" />
                        {CATEGORIES.map((category) => (
                            <button
                                key={category}
                                onClick={() => setSelectedCategory(category)}
                                className={`px-5 py-2 rounded-full text-sm font-medium transition-all duration-200 whitespace-nowrap
                  ${selectedCategory === category
                                        ? 'bg-stone-900 dark:bg-stone-50 text-stone-50 dark:text-stone-900 shadow-md'
                                        : 'bg-white dark:bg-stone-800 text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-700 border border-stone-200 dark:border-stone-700'}`}
                            >
                                {category}
                            </button>
                        ))}
                    </div>

                    {/* Search */}
                    <div className="relative w-full md:w-80">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400 w-5 h-5" />
                        <input
                            type="text"
                            placeholder="Search by title or artist..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-12 pr-4 py-2.5 rounded-full border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-50 focus:border-stone-900 dark:focus:border-stone-50 focus:ring-0 transition-all shadow-sm font-sans placeholder:text-stone-400 dark:placeholder:text-stone-500"
                        />
                    </div>
                </div>

                {/* Grid */}
                {loading ? (
                    <div className="flex justify-center py-24">
                        <Loader2 className="h-8 w-8 animate-spin text-stone-400" />
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-12">
                        {filteredItems.map((item: any) => (
                            <motion.div
                                key={item.id}
                                layout
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0 }}
                                className="group cursor-pointer"
                            >
                                <div className="relative aspect-[4/5] overflow-hidden rounded-sm mb-6 bg-stone-200 dark:bg-stone-800 border border-stone-200 dark:border-stone-800 shadow-sm group-hover:shadow-xl transition-all duration-500">
                                    <div className="absolute top-4 left-4 z-10">
                                        <span className="px-3 py-1 bg-white/90 dark:bg-stone-900/90 backdrop-blur text-[10px] uppercase tracking-widest font-bold text-stone-900 dark:text-stone-50 border border-stone-200 dark:border-stone-700">
                                            Unique
                                        </span>
                                    </div>
                                    {item.image_url ? (
                                        <Image
                                            src={item.image_url}
                                            alt={item.title}
                                            fill
                                            sizes="(max-width: 768px) 100vw, 33vw"
                                            className="object-cover transition-transform duration-1000 group-hover:scale-105"
                                            unoptimized
                                        />
                                    ) : (
                                        <div className="h-full w-full flex items-center justify-center text-stone-400">
                                            <span>No Image</span>
                                        </div>
                                    )}
                                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-500" />
                                    <div className="absolute bottom-6 left-0 right-0 flex justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-500 transform translate-y-2 group-hover:translate-y-0 px-4">
                                        <span className="w-full text-center bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-50 py-3 uppercase tracking-widest text-xs font-bold shadow-lg border border-stone-200 dark:border-stone-700">
                                            View Masterpiece
                                        </span>
                                    </div>
                                </div>
                                <div className="flex justify-between items-start px-1">
                                    <div>
                                        <h3 className="font-serif text-2xl text-stone-900 dark:text-stone-50 group-hover:text-stone-600 dark:group-hover:text-stone-300 transition-colors mb-1">
                                            {item.title}
                                        </h3>
                                        <p className="font-sans text-stone-500 dark:text-stone-400 text-sm tracking-wide uppercase">
                                            {item.artists?.full_name || 'Unknown Artist'}
                                        </p>
                                    </div>
                                    <p className="font-serif text-xl text-stone-900 dark:text-stone-50">
                                        {item.price} <span className="text-sm text-stone-500">RON</span>
                                    </p>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )}

                {!loading && filteredItems.length === 0 && (
                    <div className="text-center py-24">
                        <p className="text-stone-500 dark:text-stone-400 font-sans text-lg">No masterpieces found matching your criteria.</p>
                        <button
                            onClick={() => { setSelectedCategory('All'); setSearchQuery(''); }}
                            className="mt-4 text-stone-900 dark:text-stone-50 underline hover:text-stone-600 dark:hover:text-stone-300"
                        >
                            Clear filters
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
