'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { Product } from '../types/index';
import { createClient } from '@/lib/supabase';

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
    applyCoupon: (code: string) => Promise<{ success: boolean; message: string }>;
    removeCoupon: () => void;
    couponCode: string | null;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
    const [items, setItems] = useState<CartItem[]>([]);
    const [isCartOpen, setIsCartOpen] = useState(false);
    const [couponCode, setCouponCode] = useState<string | null>(null);
    const [couponDetails, setCouponDetails] = useState<{ type: 'percentage' | 'fixed', value: number } | null>(null);

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
            // Try to find by ID first if available, otherwise by name
            const existing = prev.find((item) => {
                if (product.id && item.id) {
                    return item.id === product.id;
                }
                return item.name === product.name;
            });

            if (existing) {
                return prev.map((item) => {
                    const isMatch = (product.id && item.id)
                        ? item.id === product.id
                        : item.name === product.name;

                    return isMatch
                        ? { ...item, quantity: item.quantity + 1 }
                        : item;
                });
            }
            return [...prev, { ...product, quantity: 1 }];
        });
        setIsCartOpen(true);
    };

    const removeItem = (identifier: string) => {
        setItems((prev) => prev.filter((item) => {
            if (item.id) return item.id !== identifier;
            return item.name !== identifier;
        }));
    };

    const updateQuantity = (identifier: string, quantity: number) => {
        if (quantity < 1) {
            removeItem(identifier);
            return;
        }
        setItems((prev) =>
            prev.map((item) => {
                const isMatch = item.id ? item.id === identifier : item.name === identifier;
                return isMatch ? { ...item, quantity } : item;
            })
        );
    };

    const toggleCart = () => setIsCartOpen((prev) => !prev);

    const cartCount = items.reduce((acc, item) => acc + item.quantity, 0);

    const subtotal = items.reduce((acc, item) => {
        const price = typeof item.price === 'string' ? parseFloat(item.price.replace(',', '.')) : item.price;
        return acc + price * item.quantity;
    }, 0);

    const applyCoupon = async (code: string) => {
        const supabase = createClient();
        const { data, error } = await supabase
            .from('coupons')
            .select('*')
            .eq('code', code)
            .eq('is_active', true)
            .single();

        if (error || !data) {
            return { success: false, message: 'Invalid or expired coupon.' };
        }

        // Check expiry
        if (data.expires_at && new Date(data.expires_at) < new Date()) {
            return { success: false, message: 'Coupon has expired.' };
        }

        // Check Usage Limit
        if (data.max_uses !== null && data.used_count >= data.max_uses) {
            return { success: false, message: 'Coupon usage limit reached.' };
        }

        // Check min order
        if (subtotal < data.min_order_amount) {
            return { success: false, message: `Minimum order of ${data.min_order_amount} required.` };
        }

        setCouponCode(code);
        setCouponDetails({ type: data.discount_type, value: data.discount_value });
        return { success: true, message: 'Coupon applied successfully!' };
    };

    const removeCoupon = () => {
        setCouponCode(null);
        setCouponDetails(null);
    };

    // Calculate Discount
    let discount = 0;
    if (couponDetails) {
        if (couponDetails.type === 'percentage') {
            discount = subtotal * (couponDetails.value / 100);
        } else {
            discount = couponDetails.value;
        }
    } else {
        // Default Black Friday Logic: 20% OFF (Fallback/Auto)
        // Only apply if no specific coupon is used? Or verify strategy.
        // For now, let's say Coupon overrides Auto-Discount.
        // Or we can keep it cumulative? No, risky.
        // Let's keep it simple: Coupon OR Black Friday.
        // Actually, to increase sales "massively", let's enable coupons.
        // If coupon is applied, use it. If not, use default 20%.
        // Wait, if coupon is 10% and BF is 20%, user loses money.
        // Let's say: Base discount is 0. Coupons apply on top?
        // Let's remove the hardcoded 20% BF deal for now, or make it a default coupon 'BF2025'.
        // I will comment out the hardcoded one to test the dynamic one fully.
        // discount = subtotal * 0.20; 
    }
    
    // Ensure discount doesn't exceed subtotal
    if (discount > subtotal) discount = subtotal;

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
                subtotal,
                applyCoupon,
                removeCoupon,
                couponCode
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
