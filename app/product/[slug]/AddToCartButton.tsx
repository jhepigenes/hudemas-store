'use client';

import { useCart } from '../../context/CartContext';
import { Product } from '../../types/product';
import { useState } from 'react';

export default function AddToCartButton({ product }: { product: Product }) {
    const { addItem } = useCart();
    const [isAdded, setIsAdded] = useState(false);

    const handleAdd = () => {
        addItem(product);
        setIsAdded(true);
        setTimeout(() => setIsAdded(false), 2000);
    };

    return (
        <button
            onClick={handleAdd}
            className="group relative w-full overflow-hidden rounded-full bg-stone-900 px-8 py-4 text-lg font-medium text-white transition-all hover:bg-stone-800 focus:outline-none focus:ring-2 focus:ring-stone-400 focus:ring-offset-2 disabled:opacity-70 sm:w-auto"
        >
            <span className={`block transition-transform duration-300 ${isAdded ? '-translate-y-[150%]' : 'translate-y-0'}`}>
                Add to Collection
            </span>
            <span className={`absolute inset-0 flex items-center justify-center transition-transform duration-300 ${isAdded ? 'translate-y-0' : 'translate-y-[150%]'}`}>
                Added to Cart
            </span>
        </button>
    );
}
