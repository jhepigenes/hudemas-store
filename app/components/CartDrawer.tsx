'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { X, Minus, Plus, Trash2 } from 'lucide-react';
import { useCart } from '../context/CartContext';
import Image from 'next/image';
import Link from 'next/link';

export default function CartDrawer() {
    const { isCartOpen, toggleCart, items, updateQuantity, removeItem, cartTotal, subtotal, discount } = useCart();

    return (
        <AnimatePresence>
            {isCartOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={toggleCart}
                        className="fixed inset-0 z-[60] bg-black/40 backdrop-blur-sm"
                    />

                    {/* Drawer */}
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
                                        {items.map((item) => (
                                            <li key={item.name} className="flex gap-4">
                                                <div className="relative h-24 w-24 flex-shrink-0 overflow-hidden rounded-md bg-stone-100">
                                                    <Image
                                                        src={item.image}
                                                        alt={item.name}
                                                        fill
                                                        className="object-cover"
                                                    />
                                                </div>
                                                <div className="flex flex-1 flex-col justify-between">
                                                    <div>
                                                        <h3 className="font-serif text-lg font-medium text-stone-900 dark:text-white">
                                                            {item.name}
                                                        </h3>
                                                        <p className="text-sm text-stone-500">
                                                            {item.price} {item.currency}
                                                        </p>
                                                    </div>
                                                    <div className="flex items-center justify-between">
                                                        <div className="flex items-center gap-3 rounded-full border border-stone-200 px-2 py-1 dark:border-stone-700">
                                                            <button
                                                                onClick={() => updateQuantity(item.name, item.quantity - 1)}
                                                                className="p-1 text-stone-500 hover:text-stone-900 dark:text-stone-400"
                                                            >
                                                                <Minus className="h-3 w-3" />
                                                            </button>
                                                            <span className="text-sm font-medium w-4 text-center">
                                                                {item.quantity}
                                                            </span>
                                                            <button
                                                                onClick={() => updateQuantity(item.name, item.quantity + 1)}
                                                                className="p-1 text-stone-500 hover:text-stone-900 dark:text-stone-400"
                                                            >
                                                                <Plus className="h-3 w-3" />
                                                            </button>
                                                        </div>
                                                        <button
                                                            onClick={() => removeItem(item.name)}
                                                            className="text-stone-400 hover:text-red-500"
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </button>
                                                    </div>
                                                </div>
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </div>

                            {/* Footer */}
                            {items.length > 0 && (
                                <div className="border-t border-stone-100 p-6 dark:border-stone-800">
                                    <div className="space-y-2 mb-4">
                                        <div className="flex items-center justify-between text-sm text-stone-500">
                                            <span>Subtotal</span>
                                            <span>{subtotal.toFixed(2).replace('.', ',')} RON</span>
                                        </div>
                                        <div className="flex items-center justify-between text-sm font-medium text-green-600">
                                            <span>Black Friday (-20%)</span>
                                            <span>-{discount.toFixed(2).replace('.', ',')} RON</span>
                                        </div>
                                        <div className="flex items-center justify-between text-lg font-medium pt-2 border-t border-stone-100">
                                            <span className="text-stone-900 dark:text-white">Total</span>
                                            <span className="font-serif text-stone-900 dark:text-white">
                                                {cartTotal.toFixed(2).replace('.', ',')} RON
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
