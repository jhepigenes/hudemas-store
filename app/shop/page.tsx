'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Filter, Search, Grid3X3, Grid2X2, LayoutGrid } from 'lucide-react';
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
    const [visibleCount, setVisibleCount] = useState(48);
    const [searchQuery, setSearchQuery] = useState('');
    const [gridCols, setGridCols] = useState<3 | 4>(4);
    const { t } = useLanguage();
    const { formatPrice } = useCurrency();
    const supabase = createClient();

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
            <div className="mx-auto max-w-[1920px] px-6 lg:px-12">
                <div className="mb-16 text-center">
                    <h1 className="font-serif text-5xl text-stone-900 dark:text-white md:text-6xl tracking-tight">
                        {t.nav.shop}
                    </h1>
                    <p className="mt-4 text-lg text-stone-600 dark:text-stone-400 font-light max-w-2xl mx-auto">
                        {t.shop.discover}
                    </p>
                </div>

                <div className="flex flex-col lg:flex-row gap-12">
                    {/* Sidebar Filters (Desktop) */}
                    <aside className="hidden lg:block w-64 shrink-0 space-y-8">
                        <div>
                            <h3 className="font-serif text-xl text-stone-900 dark:text-white mb-4 border-b border-stone-200 dark:border-stone-800 pb-2">
                                Categories
                            </h3>
                            <div className="flex flex-col gap-2">
                                <button
                                    onClick={() => { setCategory('all'); setVisibleCount(24); }}
                                    className={`text-left text-sm transition-colors py-1 ${category === 'all'
                                        ? 'font-medium text-stone-900 dark:text-white'
                                        : 'text-stone-500 hover:text-stone-900 dark:text-stone-400 dark:hover:text-white'
                                        }`}
                                >
                                    All Works
                                </button>
                                {CATEGORY_CONFIG.map((cat) => (
                                    <button
                                        key={cat.id}
                                        onClick={() => { setCategory(cat.id); setVisibleCount(24); }}
                                        className={`text-left text-sm transition-colors py-1 ${category === cat.id
                                            ? 'font-medium text-stone-900 dark:text-white'
                                            : 'text-stone-500 hover:text-stone-900 dark:text-stone-400 dark:hover:text-white'
                                            }`}
                                    >
                                        {/* @ts-ignore - Dynamic key access */}
                                        {t.shop.categories[cat.id]}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </aside>

                    {/* Main Content Area */}
                    <div className="flex-1">
                        {/* Mobile Filters & Search */}
                        <div className="lg:hidden mb-8 flex flex-col gap-6">
                            <div className="relative w-full">
                                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
                                <input
                                    type="text"
                                    placeholder={t.shop.searchPlaceholder}
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full rounded-none border-b border-stone-200 bg-transparent pl-10 pr-4 py-2 text-sm focus:border-stone-900 focus:outline-none dark:border-stone-800 dark:text-white dark:focus:border-white transition-colors placeholder:text-stone-400"
                                />
                            </div>

                            {/* Mobile Category Pills */}
                            <div className="flex overflow-x-auto pb-2 gap-3 no-scrollbar">
                                <button
                                    onClick={() => { setCategory('all'); setVisibleCount(24); }}
                                    className={`whitespace-nowrap rounded-full px-4 py-1.5 text-sm transition-colors border ${category === 'all'
                                        ? 'border-stone-900 bg-stone-900 text-white dark:border-white dark:bg-white dark:text-stone-900'
                                        : 'border-stone-200 text-stone-600 dark:border-stone-800 dark:text-stone-400'
                                        }`}
                                >
                                    All Works
                                </button>
                                {CATEGORY_CONFIG.map((cat) => (
                                    <button
                                        key={cat.id}
                                        onClick={() => { setCategory(cat.id); setVisibleCount(24); }}
                                        className={`whitespace-nowrap rounded-full px-4 py-1.5 text-sm transition-colors border ${category === cat.id
                                            ? 'border-stone-900 bg-stone-900 text-white dark:border-white dark:bg-white dark:text-stone-900'
                                            : 'border-stone-200 text-stone-600 dark:border-stone-800 dark:text-stone-400'
                                            }`}
                                    >
                                        {/* @ts-ignore */}
                                        {t.shop.categories[cat.id]}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Product Grid */}
                        <div className={`grid grid-cols-1 gap-8 sm:grid-cols-2 ${gridCols === 4 ? 'xl:grid-cols-4' : 'xl:grid-cols-3'}`}>
                            {visibleProducts.map((product, index) => (
                                <ProductCard
                                    key={product.id}
                                    index={index}
                                    product={product}
                                />
                            ))}
                        </div>

                        {/* Load More */}
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
                    </div>
                </div>
            </div>
        </div>
    );
}
