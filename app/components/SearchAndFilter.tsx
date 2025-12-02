'use client';

import { Search } from 'lucide-react';
import { useLanguage } from '@/app/context/LanguageContext';
import { CATEGORY_CONFIG } from '@/app/utils/categories';

interface SearchAndFilterProps {
    searchTerm: string;
    setSearchTerm: (term: string) => void;
    selectedCategory: string;
    setSelectedCategory: (category: string) => void;
}

export default function SearchAndFilter({
    searchTerm,
    setSearchTerm,
    selectedCategory,
    setSelectedCategory,
}: SearchAndFilterProps) {
    const { t } = useLanguage();

    return (
        <div className="mb-12 space-y-6">
            {/* Search Bar */}
            <div className="relative mx-auto max-w-md">
                <input
                    type="text"
                    placeholder={t.shop.searchPlaceholder}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full rounded-full border border-stone-200 bg-white py-3 pl-12 pr-4 text-stone-900 shadow-sm transition-all focus:border-stone-400 focus:outline-none focus:ring-2 focus:ring-stone-200 dark:bg-stone-900 dark:border-stone-800 dark:text-white dark:focus:border-stone-600"
                />
                <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-stone-400" />
            </div>

            {/* Categories */}
            <div className="flex w-full overflow-x-auto pb-4 sm:flex-wrap sm:justify-center sm:overflow-visible sm:pb-0 gap-2 px-4 sm:px-0 -mx-4 sm:mx-0 scrollbar-hide">
                {CATEGORY_CONFIG.map((cat) => (
                    <button
                        key={cat.id}
                        onClick={() => setSelectedCategory(cat.id)}
                        className={`shrink-0 rounded-full px-4 py-1.5 text-sm font-medium transition-all border ${selectedCategory === cat.id
                            ? 'bg-stone-900 text-white border-stone-900 shadow-sm dark:bg-white dark:text-stone-900 dark:border-white'
                            : 'bg-white text-stone-600 border-stone-200 hover:bg-stone-50 dark:bg-stone-900 dark:text-stone-400 dark:border-stone-800 dark:hover:bg-stone-800'
                            }`}
                    >
                        {/* @ts-ignore - Dynamic key access */}
                        {t.shop.categories[cat.id]}
                    </button>
                ))}
            </div>
        </div>
    );
}
