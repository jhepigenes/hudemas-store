'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Product } from '../types/product';
import { slugify } from '../utils/slug';

interface RelatedProductsProps {
    currentProduct: Product;
    allProducts: Product[];
}

export default function RelatedProducts({ currentProduct, allProducts }: RelatedProductsProps) {
    // Filter out current product and pick 4 random ones
    const others = allProducts.filter(p => p.name !== currentProduct.name);
    const randomSelection = others.sort(() => 0.5 - Math.random()).slice(0, 4);

    if (randomSelection.length === 0) return null;

    return (
        <section className="mt-24 border-t border-stone-200 pt-16 dark:border-stone-800">
            <h2 className="font-serif text-3xl text-stone-900 dark:text-white mb-12 text-center">You Might Also Like</h2>
            <div className="grid grid-cols-1 gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-4 xl:gap-x-8">
                {randomSelection.map((product) => (
                    <Link key={product.name} href={`/product/${slugify(product.name)}`} className="group">
                        <div className="aspect-[4/5] w-full overflow-hidden rounded-lg bg-stone-200 dark:bg-stone-800 relative">
                            <Image
                                src={product.image}
                                alt={product.name}
                                fill
                                className="object-cover object-center group-hover:scale-105 transition-transform duration-500"
                            />
                        </div>
                        <h3 className="mt-4 text-lg font-serif text-stone-900 dark:text-white group-hover:text-stone-600 dark:group-hover:text-stone-300">
                            {product.name}
                        </h3>
                        <p className="mt-1 text-sm font-medium text-stone-500 dark:text-stone-400">
                            {product.price} {product.currency}
                        </p>
                    </Link>
                ))}
            </div>
        </section>
    );
}
