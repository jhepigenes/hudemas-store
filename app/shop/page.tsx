'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Filter, Search } from 'lucide-react';
import { createClient } from '@/lib/supabase';
import { useLanguage } from '@/app/context/LanguageContext';
import { useCurrency } from '@/app/context/CurrencyContext';
import ProductCard from '@/app/components/ProductCard';
import { Product } from '@/app/types/index';
import { CATEGORY_CONFIG } from '@/app/utils/categories';

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
    // Category Configuration (Maps Translation Key -> DB Value)
    // Imported from @/app/utils/categories

    useEffect(() => {
        fetchProducts();
    }, []);

    const fetchProducts = async () => {
        try {
            let allProducts: any[] = [];
            let from = 0;
            const step = 1000;
            let more = true;

            while (more) {
                const { data, error } = await supabase
                    .from('products')
                    .select('*')
                    .range(from, from + step - 1);

                if (error) throw error;

                if (data && data.length > 0) {
                    allProducts = [...allProducts, ...data];
                    from += step;
                    if (data.length < step) {
                        more = false;
                    }
                } else {
                    more = false;
                }
            }

            // Transform DB shape to Product type
            const mappedProducts: Product[] = allProducts.map((item: any) => ({
                id: item.id,
                name: item.title,
                image: item.image_url,
                price: item.price,
                currency: item.currency,
                product_type: item.product_type,
                description: item.description,
                category: item.category,
                slug: item.slug,
                dimensions: item.dimensions,
                colors: item.colors,
                formats: item.formats
            }));

            setProducts(mappedProducts);

            // Debug: Log distinct categories
            const distinctCategories = Array.from(new Set(mappedProducts.map(p => p.category)));
            console.log('Fetched distinct categories:', distinctCategories);
            console.log('Total products:', mappedProducts.length);
        } catch (error) {
            console.error('Error fetching shop products:', error);
        } finally {
            setLoading(false);
        }
    };

    const filteredProducts = products.filter(product => {
        const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase());
        let matchesCategory = true;

        if (category !== 'all') {
            // Get the DB value for the current selected category ID
            const currentCategoryConfig = CATEGORY_CONFIG.find(c => c.id === category);
            const dbCategoryValue = currentCategoryConfig?.dbValue;

            if (dbCategoryValue) {
                matchesCategory = product.category === dbCategoryValue;
            }
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
                    <>
                        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
                            {visibleProducts.map((product, index) => (
                                <ProductCard
                                    key={product.id}
                                    index={index}
                                    product={product}
                                />
                            ))}
                        </div>

                        {visibleCount < filteredProducts.length && (
                            <div className="mt-16 flex justify-center">
                                <button
                                    onClick={() => setVisibleCount(prev => prev + 24)}
                                    className="rounded-full bg-stone-900 px-8 py-3 text-sm font-medium text-white transition-colors hover:bg-stone-800 dark:bg-white dark:text-stone-900 dark:hover:bg-stone-200"
                                >
                                    Load More
                                </button>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}
