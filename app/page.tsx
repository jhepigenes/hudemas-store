'use client';

import { useState } from 'react';
import productsData from './products.json';
import { Product } from './types/product';
import ProductCard from './components/ProductCard';
import Hero from './components/Hero';
import StorySection from './components/StorySection';
import Marquee from './components/Marquee';
import SearchAndFilter from './components/SearchAndFilter';
import FeaturedMasterpiece from './components/FeaturedMasterpiece';

// Cast the imported JSON to the Product type
const products: Product[] = productsData as Product[];

export default function Home() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  // Filter Logic
  const filteredProducts = products.filter((product) => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase());

    // Mock Category Logic based on keywords since JSON doesn't have categories
    let matchesCategory = true;
    if (selectedCategory !== 'All') {
      const name = product.name.toLowerCase();
      if (selectedCategory === 'Nature') matchesCategory = name.includes('peisaj') || name.includes('vara') || name.includes('iarna') || name.includes('munte');
      else if (selectedCategory === 'Religious') matchesCategory = name.includes('maria') || name.includes('hrist') || name.includes('madonna') || name.includes('ingeras') || name.includes('ruga');
      else if (selectedCategory === 'Portraits') matchesCategory = name.includes('feti') || name.includes('doamna') || name.includes('tigan') || name.includes('cap');
      else if (selectedCategory === 'Flowers') matchesCategory = name.includes('flori') || name.includes('maci') || name.includes('liliac') || name.includes('vaza');
      else if (selectedCategory === 'Abstract') matchesCategory = !name.includes('peisaj') && !name.includes('maria'); // Fallback
    }

    return matchesSearch && matchesCategory;
  });

  return (
    <div className="min-h-screen bg-stone-50 dark:bg-stone-950 selection:bg-stone-900 selection:text-white">
      <main>
        <Hero />
        <Marquee />
        <StorySection />
        <FeaturedMasterpiece />

        {/* Gallery Section */}
        <section className="px-4 py-24 sm:px-6 lg:px-8" id="collection">
          <div className="mx-auto max-w-7xl">
            <div className="mb-12 text-center">
              <h2 className="font-serif text-3xl text-stone-900 dark:text-stone-50 md:text-4xl">
                Curated Collection
              </h2>
              <div className="mx-auto mt-4 h-1 w-24 bg-stone-900 dark:bg-stone-50" />
            </div>

            <SearchAndFilter
              searchTerm={searchTerm}
              setSearchTerm={setSearchTerm}
              selectedCategory={selectedCategory}
              setSelectedCategory={setSelectedCategory}
            />

            <div className="grid grid-cols-1 gap-x-8 gap-y-16 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {filteredProducts.length > 0 ? (
                filteredProducts.map((product, index) => (
                  <ProductCard key={`${product.name}-${index}`} product={product} index={index} />
                ))
              ) : (
                <div className="col-span-full py-20 text-center text-stone-500">
                  <p className="font-serif text-xl">No masterpieces found.</p>
                  <button
                    onClick={() => { setSearchTerm(''); setSelectedCategory('All'); }}
                    className="mt-4 text-sm underline"
                  >
                    Clear Filters
                  </button>
                </div>
              )}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
