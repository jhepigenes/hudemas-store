'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Filter, Search } from 'lucide-react';
import { createClient } from '@/lib/supabase';
import { useLanguage } from '@/app/context/LanguageContext';
import { useCurrency } from '@/app/context/CurrencyContext';
import ProductCard from '@/app/components/ProductCard';
import { Product } from '@/app/types/index';

export default function ShopPage() {
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [category, setCategory] = useState('all');
    const [visibleCount, setVisibleCount] = useState(24);
    const [searchQuery, setSearchQuery] = useState('');
    const { t } = useLanguage();
    const { formatPrice } = useCurrency();
    const supabase = createClient();

    // Category Configuration (Maps Translation Key -> DB Value)
    const CATEGORY_CONFIG = [
        { id: 'all', dbValue: 'All' },
        { id: 'fruits', dbValue: 'Fructe' },
        { id: 'flowers', dbValue: 'Flori' },
        { id: 'landscapes', dbValue: 'Peisaje' },
        { id: 'religious', dbValue: 'Religioase' },
        { id: 'stillLife', dbValue: 'Natură moartă' },
        { id: 'animals', dbValue: 'Animale' },
        { id: 'kids', dbValue: 'Pentru copii' },
        { id: 'modern', dbValue: 'Moderne' },
        { id: 'marine', dbValue: 'Marine' },
        { id: 'characters', dbValue: 'Personaje' },
        { id: 'painters', dbValue: 'Pictori celebri' },
        { id: 'zodiac', dbValue: 'Zodii' },
        { id: 'patterns', dbValue: 'Modele 2-4 culori' },
        { id: 'allegories', dbValue: 'Alegorii' },
        { id: 'accessories', dbValue: 'Accesorii' }
    ] as const;

    useEffect(() => {
        fetchProducts();
    }, []);

    const fetchProducts = async () => {
        try {
            const { data, error } = await supabase
                .from('marketplace_listings')
                .select('*')
                .in('product_type', ['kit', 'accessory'])
                .eq('status', 'active');

            if (error) throw error;

            // Transform DB shape to Product type
            const mappedProducts: Product[] = (data || []).map((item: any) => ({
                id: item.id,
                name: item.title,
                image: item.image_url,
                price: item.price,
                currency: item.currency,
                product_type: item.product_type,
                status: item.status,
                description: item.description
            }));

            setProducts(mappedProducts);
        } catch (error) {
            console.error('Error fetching shop products:', error);
        } finally {
            setLoading(false);
        }
    };

    const filteredProducts = products.filter(product => {
        const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase());
        let matchesCategory = true;

        // Get the DB value for the current selected category ID
        const currentCategoryConfig = CATEGORY_CONFIG.find(c => c.id === category);
        const dbCategoryValue = currentCategoryConfig?.dbValue || 'All';

        if (category === 'all') {
            matchesCategory = true;
        } else if (category === 'accessories') {
            // Special case for Accessories
            matchesCategory = product.product_type === 'accessory';
        } else {
            // For all other categories (Goblenuri), check the description
            // We only want 'kit' types for these categories to avoid cross-contamination if any
            matchesCategory = product.product_type === 'kit' &&
                (product.description && product.description.includes(`Category: ${dbCategoryValue}`)) || false;
        }

        return matchesSearch && matchesCategory;
    });

    const visibleProducts = filteredProducts.slice(0, visibleCount);

    return (
        <div className="min-h-screen bg-stone-50 dark:bg-stone-950 pt-32 pb-20">
            <div className="mx-auto max-w-7xl px-6">
                <div className="mb-12 text-center">
                    <h1 className="font-serif text-4xl text-stone-900 dark:text-white md:text-5xl">
                        {t.nav.shop}
                    </h1>
                    <p className="mt-4 text-stone-600 dark:text-stone-400">
                        {t.shop.discover}
                    </p>
                </div>

                {/* Search & Filters */}
                <div className="mb-8 flex flex-col gap-6">
                    {/* Category Filters - Wrapped Layout */}
                    <div className="flex flex-wrap items-center justify-center gap-2 w-full">
                        {CATEGORY_CONFIG.map((cat) => (
                            <button
                                key={cat.id}
                                onClick={() => { setCategory(cat.id); setVisibleCount(24); }}
                                className={`whitespace-nowrap rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${category === cat.id
                                    ? 'bg-stone-900 text-white dark:bg-white dark:text-stone-900'
                                    : 'bg-white text-stone-600 hover:bg-stone-100 dark:bg-stone-900 dark:text-stone-400 dark:hover:bg-stone-800'
                                    }`}
                            >
                                {/* @ts-ignore - Dynamic key access */}
                                {t.shop.categories[cat.id]}
                            </button>
                        ))}
                    </div>

                    <div className="relative w-full sm:w-64 shrink-0">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
                        <input
                            type="text"
                            placeholder={t.shop.searchPlaceholder}
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full rounded-full border-stone-200 bg-white pl-10 pr-4 py-2 text-sm focus:border-stone-500 focus:ring-stone-500 dark:bg-stone-900 dark:border-stone-800 dark:text-white"
                        />
                    </div>
                </div>

                {/* Grid */}
                {loading ? (
                    <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
                        {[1, 2, 3, 4, 5, 6].map((i) => (
                            <div key={i} className="aspect-[4/5] animate-pulse rounded-2xl bg-stone-200 dark:bg-stone-800" />
                        ))}
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
                        {visibleProducts.map((product, index) => (
                            <ProductCard
                                key={product.id}
                                index={index}
                                product={product}
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
