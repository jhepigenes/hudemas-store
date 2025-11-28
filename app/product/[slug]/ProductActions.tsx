'use client';

import { useState } from 'react';
import { ShoppingBag, Check } from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { Product } from '../../types/product';

interface ProductActionsProps {
    product: Product;
}

export default function ProductActions({ product }: ProductActionsProps) {
    const { addItem, toggleCart } = useCart();
    const [withThreads, setWithThreads] = useState(false);
    const [selectedSize, setSelectedSize] = useState('Standard (40x50cm)');

    // Parse base price (handle "91,08" format)
    const basePrice = parseFloat(product.price.replace(',', '.'));
    const threadsCost = 45.00; // Example fixed cost for threads
    const totalPrice = withThreads ? basePrice + threadsCost : basePrice;

    const handleAddToCart = () => {
        addItem({
            name: product.name + (withThreads ? ' (+Threads)' : ''),
            price: totalPrice.toFixed(2).replace('.', ','),
            image: product.image,
            currency: product.currency,
        });
        toggleCart();
    };

    return (
        <div className="space-y-8">
            {/* Price Display */}
            <div className="border-b border-stone-200 pb-6 dark:border-stone-800">
                <p className="text-3xl font-light text-stone-900 dark:text-white">
                    {totalPrice.toFixed(2).replace('.', ',')} {product.currency}
                </p>
                {withThreads && (
                    <p className="text-sm text-stone-500 mt-1">
                        Includes complete set of threads (+{threadsCost} RON)
                    </p>
                )}
            </div>

            {/* Variant Selectors */}
            <div className="space-y-6">
                {/* Kit Type */}
                <div>
                    <h3 className="text-sm font-medium text-stone-900 dark:text-white mb-3">Kit Configuration</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <button
                            onClick={() => setWithThreads(false)}
                            className={`relative flex items-center justify-center rounded-lg border px-4 py-3 text-sm font-medium transition-all ${
                                !withThreads 
                                    ? 'border-stone-900 ring-1 ring-stone-900 bg-stone-50 text-stone-900 dark:border-white dark:ring-white dark:bg-stone-800 dark:text-white' 
                                    : 'border-stone-200 bg-white text-stone-600 hover:bg-stone-50 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-400 dark:hover:bg-stone-800'
                            }`}
                        >
                            Printed Canvas Only
                            {!withThreads && <div className="absolute top-0 right-0 -mt-2 -mr-2 rounded-full bg-stone-900 p-1 text-white dark:bg-white dark:text-stone-900"><Check className="h-3 w-3" /></div>}
                        </button>
                        <button
                            onClick={() => setWithThreads(true)}
                            className={`relative flex items-center justify-center rounded-lg border px-4 py-3 text-sm font-medium transition-all ${
                                withThreads 
                                    ? 'border-stone-900 ring-1 ring-stone-900 bg-stone-50 text-stone-900 dark:border-white dark:ring-white dark:bg-stone-800 dark:text-white' 
                                    : 'border-stone-200 bg-white text-stone-600 hover:bg-stone-50 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-400 dark:hover:bg-stone-800'
                            }`}
                        >
                            Complete Kit (+Threads)
                            {withThreads && <div className="absolute top-0 right-0 -mt-2 -mr-2 rounded-full bg-stone-900 p-1 text-white dark:bg-white dark:text-stone-900"><Check className="h-3 w-3" /></div>}
                        </button>
                    </div>
                </div>

                {/* Size Selector (Mock for now) */}
                <div>
                    <h3 className="text-sm font-medium text-stone-900 dark:text-white mb-3">Size</h3>
                    <div className="flex flex-wrap gap-3">
                        {['Standard (40x50cm)', 'Large (60x80cm)'].map((size) => (
                            <button
                                key={size}
                                onClick={() => setSelectedSize(size)}
                                className={`px-4 py-2 rounded-md text-sm font-medium border transition-colors ${
                                    selectedSize === size
                                        ? 'bg-stone-900 text-white border-stone-900 dark:bg-white dark:text-stone-900'
                                        : 'bg-white text-stone-600 border-stone-200 hover:bg-stone-50 dark:bg-stone-900 dark:text-stone-400 dark:border-stone-700 dark:hover:bg-stone-800'
                                }`}
                            >
                                {size}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Add to Cart */}
            <button
                onClick={handleAddToCart}
                className="w-full rounded-full bg-stone-900 py-4 text-white hover:bg-stone-800 dark:bg-white dark:text-stone-900 dark:hover:bg-stone-200 transition-colors flex items-center justify-center gap-2 font-medium text-lg"
            >
                <ShoppingBag className="h-5 w-5" />
                Add to Cart
            </button>
        </div>
    );
}
