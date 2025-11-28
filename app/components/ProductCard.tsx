import Link from 'next/link';
import { Product } from '../types/product';
import { motion, useMotionTemplate, useMotionValue } from 'framer-motion';
import { useCart } from '../context/CartContext';
import { slugify } from '../utils/slug';
import { MouseEvent } from 'react';
import SafeImage from './SafeImage';

interface ProductCardProps {
    product: Product;
    index: number;
}

export default function ProductCard({ product, index }: ProductCardProps) {
    const { addItem } = useCart();
    const slug = slugify(product.name);

    const mouseX = useMotionValue(0);
    const mouseY = useMotionValue(0);

    function handleMouseMove({ currentTarget, clientX, clientY }: MouseEvent) {
        const { left, top } = currentTarget.getBoundingClientRect();
        mouseX.set(clientX - left);
        mouseY.set(clientY - top);
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: index * 0.05, duration: 0.5 }}
            className="group relative"
            onMouseMove={handleMouseMove}
        >
            {/* Spotlight Overlay */}
            <motion.div
                className="pointer-events-none absolute -inset-px rounded-xl opacity-0 transition duration-300 group-hover:opacity-100"
                style={{
                    background: useMotionTemplate`
            radial-gradient(
              650px circle at ${mouseX}px ${mouseY}px,
              rgba(255,255,255,0.15),
              transparent 80%
            )
          `,
                }}
            />

            <div className="relative aspect-[4/5] overflow-hidden rounded-md bg-stone-100">
                <div className="absolute top-2 left-2 z-10">
                    <span className="bg-red-600 text-white text-[10px] font-bold px-2 py-1 uppercase tracking-widest">
                        Sale
                    </span>
                </div>
                <Link href={`/product/${slug}`}>
                    <SafeImage
                        src={product.image}
                        alt={product.name}
                        fill
                        className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
                    />
                </Link>

                {/* Quick Add Button (appears on hover) */}
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 translate-y-10 opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
                    <button
                        onClick={() => addItem(product)}
                        className="whitespace-nowrap rounded-full bg-stone-900 px-6 py-2 font-sans text-xs font-medium tracking-widest text-white shadow-xl backdrop-blur-sm hover:bg-black dark:bg-white dark:text-stone-900"
                    >
                        ADD TO CART
                    </button>
                </div>
            </div>

            <div className="mt-4 text-left">
                <Link href={`/product/${slug}`}>
                    <h3 className="font-serif text-xl font-medium text-stone-900 dark:text-stone-50 group-hover:text-stone-600 dark:group-hover:text-stone-300">
                        {product.name}
                    </h3>
                </Link>
                <div className="mt-1 flex items-center justify-start gap-3 font-sans text-sm">
                    {(() => {
                        const cleanPrice = product.price ? String(product.price).replace(',', '.') : '0';
                        const numericPrice = parseFloat(cleanPrice);
                        
                        if (isNaN(numericPrice)) {
                             return <span className="font-medium text-stone-900 dark:text-stone-50">{product.price} {product.currency}</span>;
                        }

                        const discountedPrice = (numericPrice * 0.8).toFixed(2).replace('.', ',');
                        
                        return (
                            <>
                                <span className="text-stone-400 dark:text-stone-500 line-through">
                                    {product.price} {product.currency}
                                </span>
                                <span className="font-medium text-red-600 dark:text-red-400">
                                    {discountedPrice} {product.currency}
                                </span>
                            </>
                        );
                    })()}
                </div>
            </div>
        </motion.div>
    );
}

