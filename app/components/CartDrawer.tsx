'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { X, Minus, Plus, Trash2 } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useCurrency } from '../context/CurrencyContext';
import Image from 'next/image';
import Link from 'next/link';

export default function CartDrawer() {
    const { isCartOpen, toggleCart, items, updateQuantity, removeItem, cartTotal, subtotal, discount } = useCart();
    const { formatPrice } = useCurrency();

    return (
        <AnimatePresence>
            {isCartOpen && (
                <>
                    {/* ... (Backdrop and Container remain same) ... */}
                    <motion.div
                        initial={{ x: '100%' }}
                        animate={{ x: 0 }}
                        exit={{ x: '100%' }}
                        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                        className="fixed right-0 top-0 z-[70] h-full w-full max-w-md bg-white shadow-2xl dark:bg-stone-900"
                    >
                        <div className="flex h-full flex-col">
                            {/* Header */}
                            <div className="flex items-center justify-between border-b border-stone-100 p-6 dark:border-stone-800">
                                <h2 className="font-serif text-2xl font-medium text-stone-900 dark:text-white">
                                    Your Collection
                                </h2>
                                <button
                                    onClick={toggleCart}
                                    className="rounded-full p-2 text-stone-500 hover:bg-stone-100 dark:text-stone-400 dark:hover:bg-stone-800"
                                >
                                    <X className="h-6 w-6" />
                                </button>
                            </div>

                            {/* Items */}
                            <div className="flex-1 overflow-y-auto p-6">
                                {items.length === 0 ? (
                                    <div className="flex h-full flex-col items-center justify-center text-center">
                                        <p className="font-serif text-lg text-stone-500">
                                            Your cart is empty.
                                        </p>
                                        <button
                                            onClick={toggleCart}
                                            className="mt-4 text-sm font-medium text-stone-900 underline underline-offset-4"
                                        >
                                            Continue Browsing
                                        </button>
                                    </div>
                                ) : (
                                    <ul className="space-y-8">
                                        {items.map((item) => {
                                            const priceNum = typeof item.price === 'string' ? parseFloat(item.price.replace(',', '.')) : item.price;
                                            return (
                                            <li key={item.name} className="flex gap-5">
                                                <div className="relative h-32 w-32 flex-shrink-0 overflow-hidden rounded-lg bg-white border border-stone-200 dark:border-stone-700">
                                                    <Image
                                                        src={item.image}
                                                        alt={item.name}
                                                        fill
                                                        className="object-cover"
                                                    />
                                                </div>
                                                <div className="flex flex-1 flex-col justify-between py-1">
                                                    <div>
                                                        <h3 className="font-serif text-xl font-bold text-stone-900 dark:text-white leading-tight">
                                                            {item.name}
                                                        </h3>
                                                        <p className="text-lg font-medium text-stone-600 dark:text-stone-300 mt-1">
                                                            {formatPrice(priceNum)}
                                                        </p>
                                                    </div>
                                                    <div className="flex items-center justify-between mt-3">
                                                        <div className="flex items-center gap-3 rounded-full border border-stone-200 px-4 py-2 dark:border-stone-700 bg-stone-50 dark:bg-stone-800">
                                                            <button
                                                                onClick={() => updateQuantity(item.name, item.quantity - 1)}
                                                                className="p-1 text-stone-600 hover:text-stone-900 dark:text-stone-400"
                                                                aria-label="Decrease quantity"
                                                            >
                                                                <Minus className="h-5 w-5" />
                                                            </button>
                                                            <span className="text-lg font-bold w-8 text-center tabular-nums">
                                                                {item.quantity}
                                                            </span>
                                                            <button
                                                                onClick={() => updateQuantity(item.name, item.quantity + 1)}
                                                                className="p-1 text-stone-600 hover:text-stone-900 dark:text-stone-400"
                                                                aria-label="Increase quantity"
                                                            >
                                                                <Plus className="h-5 w-5" />
                                                            </button>
                                                        </div>
                                                        <button
                                                            onClick={() => removeItem(item.name)}
                                                            className="p-3 text-stone-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full transition-colors"
                                                            aria-label="Remove item"
                                                        >
                                                            <Trash2 className="h-6 w-6" />
                                                        </button>
                                                    </div>
                                                </div>
                                            </li>
                                        )})}
                                    </ul>
                                )}
                            </div>

                            {/* Footer */}
                            {items.length > 0 && (
                                <div className="border-t border-stone-100 p-6 dark:border-stone-800">
                                    <div className="space-y-2 mb-4">
                                        <div className="flex items-center justify-between text-sm text-stone-500">
                                            <span>Subtotal</span>
                                            <span>{formatPrice(subtotal)}</span>
                                        </div>
                                        <div className="flex items-center justify-between text-sm font-medium text-green-600">
                                            <span>Black Friday (-20%)</span>
                                            <span>-{formatPrice(discount)}</span>
                                        </div>
                                        <div className="flex items-center justify-between text-lg font-medium pt-2 border-t border-stone-100">
                                            <span className="text-stone-900 dark:text-white">Total</span>
                                            <span className="font-serif text-stone-900 dark:text-white">
                                                {formatPrice(cartTotal)}
                                            </span>
                                        </div>
                                    </div>
                                    <Link
                                        href="/checkout"
                                        onClick={toggleCart}
                                        className="w-full rounded-full bg-stone-900 py-4 text-center font-medium text-white transition-colors hover:bg-stone-800 flex items-center justify-center gap-2 dark:bg-white dark:text-stone-900"
                                    >
                                        <span>Proceed to Checkout</span>
                                    </Link>
                                    <p className="mt-3 text-center text-xs text-stone-500">
                                        Secure checkout with Stripe or Cash on Delivery.
                                    </p>
                                </div>
                            )}
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
