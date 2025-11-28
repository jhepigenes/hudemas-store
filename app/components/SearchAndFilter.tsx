'use client';

import { Search } from 'lucide-react';

interface SearchAndFilterProps {
    searchTerm: string;
    setSearchTerm: (term: string) => void;
    selectedCategory: string;
    setSelectedCategory: (category: string) => void;
}

const CATEGORIES = ['All', 'Nature', 'Religious', 'Portraits', 'Flowers', 'Abstract'];

export default function SearchAndFilter({
    searchTerm,
    setSearchTerm,
    selectedCategory,
    setSelectedCategory,
}: SearchAndFilterProps) {
    return (
        <div className="mb-12 space-y-6">
            {/* Search Bar */}
            <div className="relative mx-auto max-w-md">
                <input
                    type="text"
                    placeholder="Search for a masterpiece..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full rounded-full border border-stone-200 bg-white py-3 pl-12 pr-4 text-stone-900 shadow-sm transition-all focus:border-stone-400 focus:outline-none focus:ring-2 focus:ring-stone-200"
                />
                <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-stone-400" />
            </div>

            {/* Categories */}
            <div className="flex flex-wrap justify-center gap-2">
                {CATEGORIES.map((category) => (
                    <button
                        key={category}
                        onClick={() => setSelectedCategory(category)}
                        className={`rounded-full px-4 py-1.5 text-sm font-medium transition-all ${selectedCategory === category
                                ? 'bg-stone-900 text-white shadow-md'
                                : 'bg-white text-stone-600 hover:bg-stone-100'
                            }`}
                    >
                        {category}
                    </button>
                ))}
            </div>
        </div>
    );
}
