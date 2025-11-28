'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { Product } from '../types/product';

export interface CartItem extends Product {
    quantity: number;
}

interface CartContextType {
    items: CartItem[];
    addItem: (product: Product) => void;
    removeItem: (productName: string) => void;
    updateQuantity: (productName: string, quantity: number) => void;
    toggleCart: () => void;
    isCartOpen: boolean;
    cartTotal: number;
    cartCount: number;
    discount: number;
    subtotal: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
    const [items, setItems] = useState<CartItem[]>([]);
    const [isCartOpen, setIsCartOpen] = useState(false);

    // Load from local storage on mount
    useEffect(() => {
        const savedCart = localStorage.getItem('hudemas-cart');
        if (savedCart) {
            try {
                setItems(JSON.parse(savedCart));
            } catch (e) {
                console.error('Failed to parse cart', e);
            }
        }
    }, []);

    // Save to local storage on change
    useEffect(() => {
        localStorage.setItem('hudemas-cart', JSON.stringify(items));
    }, [items]);

    const addItem = (product: Product) => {
        setItems((prev) => {
            const existing = prev.find((item) => item.name === product.name);
            if (existing) {
                return prev.map((item) =>
                    item.name === product.name
                        ? { ...item, quantity: item.quantity + 1 }
                        : item
                );
            }
            return [...prev, { ...product, quantity: 1 }];
        });
        setIsCartOpen(true);
    };

    const removeItem = (productName: string) => {
        setItems((prev) => prev.filter((item) => item.name !== productName));
    };

    const updateQuantity = (productName: string, quantity: number) => {
        if (quantity < 1) {
            removeItem(productName);
            return;
        }
        setItems((prev) =>
            prev.map((item) =>
                item.name === productName ? { ...item, quantity } : item
            )
        );
    };

    const toggleCart = () => setIsCartOpen((prev) => !prev);

    const cartCount = items.reduce((acc, item) => acc + item.quantity, 0);

    const subtotal = items.reduce((acc, item) => {
        const price = parseFloat(item.price.replace(',', '.'));
        return acc + price * item.quantity;
    }, 0);

    // Black Friday Logic: 20% OFF
    const discount = subtotal * 0.20;
    const cartTotal = subtotal - discount;

    return (
        <CartContext.Provider
            value={{
                items,
                addItem,
                removeItem,
                updateQuantity,
                toggleCart,
                isCartOpen,
                cartTotal,
                cartCount,
                discount,
                subtotal
            }}
        >
            {children}
        </CartContext.Provider>
    );
}

export function useCart() {
    const context = useContext(CartContext);
    if (context === undefined) {
        throw new Error('useCart must be used within a CartProvider');
    }
    return context;
}
