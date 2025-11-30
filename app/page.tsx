'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase';
import { Product } from './types/index';
import ProductCard from './components/ProductCard';
import Hero from './components/Hero';
import StorySection from './components/StorySection';
import Marquee from './components/Marquee';
import SearchAndFilter from './components/SearchAndFilter';
import FeaturedMasterpiece from './components/FeaturedMasterpiece';

export default function Home() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const supabase = createClient();

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const { data, error } = await supabase
          .from('marketplace_listings')
          .select('*')
          .in('product_type', ['kit']) // Only kits for homepage? Or both? Let's show kits mainly.
          .eq('status', 'active')
          .limit(50); // Limit for homepage

        if (error) throw error;

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
        console.error('Error fetching homepage products:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  // Filter Logic
  const filteredProducts = products.filter((product) => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase());

    // Category Logic
    let matchesCategory = true;
    if (selectedCategory !== 'All') {
      // Check description for category
      matchesCategory = (product.description && product.description.includes(`Category: ${selectedCategory}`)) || false;
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

            {loading ? (
              <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="aspect-[4/5] animate-pulse rounded-2xl bg-stone-200 dark:bg-stone-800" />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-x-8 gap-y-16 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {filteredProducts.length > 0 ? (
                  <>
                    {filteredProducts.slice(0, 12).map((product, index) => (
                      <ProductCard key={`${product.id}-${index}`} product={product} index={index} />
                    ))}
                  </>
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
            )}

            {filteredProducts.length > 12 && (
              <div className="mt-16 text-center">
                <a
                  href="/shop"
                  className="inline-block rounded-full bg-stone-900 px-8 py-3 text-sm font-medium text-white transition-colors hover:bg-stone-800 dark:bg-white dark:text-stone-900 dark:hover:bg-stone-200"
                >
                  View All Collection
                </a>
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
