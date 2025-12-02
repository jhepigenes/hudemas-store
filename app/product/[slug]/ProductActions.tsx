'use client';

import { useState } from 'react';
import { ShoppingBag, Check } from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { useCurrency } from '../../context/CurrencyContext';
import { Product } from '../../types/index';

interface ProductActionsProps {
    product: Product;
}

export default function ProductActions({ product }: ProductActionsProps) {
    const { addItem, toggleCart } = useCart();
    const { formatPrice } = useCurrency();
    const [withThreads, setWithThreads] = useState(false);
    const [diagramType, setDiagramType] = useState<'bw' | 'color'>('bw');

    // Default to first format if available, otherwise 'Printed'
    // If formats is empty/undefined, we assume it's a standard printed canvas for now
    const [selectedFormat, setSelectedFormat] = useState<string>(
        product.formats && product.formats.length > 0 ? product.formats[0] : 'Printed'
    );

    // Parse base price (handle "91,08" format or number)
    const basePrice = typeof product.price === 'string'
        ? parseFloat(product.price.replace(',', '.'))
        : product.price;
    const threadsCost = 45.00; // Example fixed cost for threads
    const totalPrice = withThreads ? basePrice + threadsCost : basePrice;

    const handleAddToCart = () => {
        let productName = product.name;

        // Add format info if relevant
        if (product.formats && product.formats.length > 0) {
            productName += ` (${selectedFormat}`;
            if (selectedFormat === 'Diagram') {
                productName += ` - ${diagramType === 'bw' ? 'Black & White' : 'Color'}`;
            }
            productName += ')';
        }

        // Add threads info
        if (withThreads) {
            productName += ' + Threads';
        }

        addItem({
            name: productName,
            price: totalPrice.toFixed(2).replace('.', ','),
            image: product.image,
            currency: product.currency,
            category: product.category,
            product_type: product.product_type,
        });
        toggleCart();
    };

    return (
        <div className="space-y-8">
            {/* Price Display */}
            <div className="border-b border-stone-200 pb-6 dark:border-stone-800">
                <p className="text-3xl font-light text-stone-900 dark:text-white">
                    {formatPrice(totalPrice)}
                </p>
                {withThreads && (
                    <p className="text-sm text-stone-500 mt-1">
                        Includes complete set of threads (+{formatPrice(threadsCost)})
                    </p>
                )}
            </div>

            {/* Variant Selectors */}
            <div className="space-y-6">

                {/* Format Selector - Only if multiple formats exist */}
                {product.formats && product.formats.length > 1 && (
                    <div>
                        <h3 className="text-sm font-medium text-stone-900 dark:text-white mb-3">Format</h3>
                        <div className="flex flex-wrap gap-3">
                            {product.formats.map((format) => (
                                <button
                                    key={format}
                                    onClick={() => setSelectedFormat(format)}
                                    className={`relative flex items-center justify-center rounded-full border px-6 py-3 text-sm font-medium transition-all ${selectedFormat === format
                                        ? 'border-stone-900 bg-stone-900 text-white dark:border-white dark:bg-white dark:text-stone-900 shadow-md'
                                        : 'border-stone-200 bg-white text-stone-600 hover:bg-stone-50 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-400 dark:hover:bg-stone-800'
                                        }`}
                                >
                                    {format}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* Diagram Type Selector - Only if 'Diagram' is selected */}
                {selectedFormat === 'Diagram' && (
                    <div>
                        <h3 className="text-sm font-medium text-stone-900 dark:text-white mb-3">Diagram Type</h3>
                        <div className="grid grid-cols-2 gap-3">
                            <button
                                onClick={() => setDiagramType('bw')}
                                className={`relative flex items-center justify-center rounded-lg border px-4 py-3 text-sm font-medium transition-all ${diagramType === 'bw'
                                    ? 'border-stone-900 ring-1 ring-stone-900 bg-stone-50 text-stone-900 dark:border-white dark:ring-white dark:bg-stone-800 dark:text-white'
                                    : 'border-stone-200 bg-white text-stone-600 hover:bg-stone-50 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-400 dark:hover:bg-stone-800'
                                    }`}
                            >
                                Black & White Symbols
                                {diagramType === 'bw' && <div className="absolute top-0 right-0 -mt-2 -mr-2 rounded-full bg-stone-900 p-1 text-white dark:bg-white dark:text-stone-900"><Check className="h-3 w-3" /></div>}
                            </button>
                            <button
                                onClick={() => setDiagramType('color')}
                                className={`relative flex items-center justify-center rounded-lg border px-4 py-3 text-sm font-medium transition-all ${diagramType === 'color'
                                    ? 'border-stone-900 ring-1 ring-stone-900 bg-stone-50 text-stone-900 dark:border-white dark:ring-white dark:bg-stone-800 dark:text-white'
                                    : 'border-stone-200 bg-white text-stone-600 hover:bg-stone-50 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-400 dark:hover:bg-stone-800'
                                    }`}
                            >
                                Colored Symbols
                                {diagramType === 'color' && <div className="absolute top-0 right-0 -mt-2 -mr-2 rounded-full bg-stone-900 p-1 text-white dark:bg-white dark:text-stone-900"><Check className="h-3 w-3" /></div>}
                            </button>
                        </div>
                    </div>
                )}

                {/* Kit Type - Only for Kits */}
                {product.product_type === 'kit' && (
                    <div>
                        <h3 className="text-sm font-medium text-stone-900 dark:text-white mb-3">Kit Configuration</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <button
                                onClick={() => setWithThreads(false)}
                                className={`relative flex items-center justify-center rounded-lg border px-4 py-3 text-sm font-medium transition-all ${!withThreads
                                    ? 'border-stone-900 ring-1 ring-stone-900 bg-stone-50 text-stone-900 dark:border-white dark:ring-white dark:bg-stone-800 dark:text-white'
                                    : 'border-stone-200 bg-white text-stone-600 hover:bg-stone-50 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-400 dark:hover:bg-stone-800'
                                    }`}
                            >
                                {selectedFormat === 'Printed' ? 'Printed Canvas Only' : 'Canvas Only'}
                                {!withThreads && <div className="absolute top-0 right-0 -mt-2 -mr-2 rounded-full bg-stone-900 p-1 text-white dark:bg-white dark:text-stone-900"><Check className="h-3 w-3" /></div>}
                            </button>
                            <button
                                onClick={() => setWithThreads(true)}
                                className={`relative flex items-center justify-center rounded-lg border px-4 py-3 text-sm font-medium transition-all ${withThreads
                                    ? 'border-stone-900 ring-1 ring-stone-900 bg-stone-50 text-stone-900 dark:border-white dark:ring-white dark:bg-stone-800 dark:text-white'
                                    : 'border-stone-200 bg-white text-stone-600 hover:bg-stone-50 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-400 dark:hover:bg-stone-800'
                                    }`}
                            >
                                Complete Kit (+Threads)
                                {withThreads && <div className="absolute top-0 right-0 -mt-2 -mr-2 rounded-full bg-stone-900 p-1 text-white dark:bg-white dark:text-stone-900"><Check className="h-3 w-3" /></div>}
                            </button>
                        </div>
                    </div>
                )}

                {/* Size Display - If dimensions exist */}
                {product.dimensions && (
                    <div>
                        <h3 className="text-sm font-medium text-stone-900 dark:text-white mb-3">Size</h3>
                        <div className="flex flex-wrap gap-3">
                            <div
                                className="px-6 py-2 rounded-full text-sm font-medium border border-stone-900 bg-stone-900 text-white dark:bg-white dark:text-stone-900 cursor-default shadow-sm"
                            >
                                {product.dimensions}
                            </div>
                        </div>
                    </div>
                )}
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
