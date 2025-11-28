'use client';

import Link from 'next/link';
import { ShoppingBag, Menu } from 'lucide-react';
import { useState } from 'react';
import { motion, useScroll, useMotionValueEvent } from 'framer-motion';
import { useCart } from '../context/CartContext';
import { ThemeToggle } from './ThemeToggle';
import { useLanguage } from '../context/LanguageContext';
import LanguageSwitcher from './LanguageSwitcher';

export default function Navbar({ isFixed = true }: { isFixed?: boolean }) {
    const [isScrolled, setIsScrolled] = useState(false);
    const { scrollY } = useScroll();
    const { toggleCart, cartCount } = useCart();
    const { t } = useLanguage();

    useMotionValueEvent(scrollY, "change", (latest) => {
        setIsScrolled(latest > 50);
    });

    return (
        <motion.nav
            className={`${isFixed ? 'fixed top-0 z-50' : 'relative'} w-full transition-all duration-500 ease-in-out ${isScrolled 
                ? 'bg-white/90 dark:bg-stone-900/90 backdrop-blur-md shadow-sm border-b border-stone-200 dark:border-stone-800 py-2' 
                : 'bg-transparent py-4'
            }`}
        >
            <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6 lg:px-12">
                {/* Left: Navigation Links (Desktop) */}
                <div className={`hidden md:flex gap-8 ${isScrolled ? 'text-stone-900 dark:text-white' : 'text-white'}`}>
                     <Link href="/" className="text-xs font-medium uppercase tracking-widest hover:opacity-60 transition-opacity">
                        {t.nav.home}
                    </Link>
                    <Link href="/#collection" className="text-xs font-medium uppercase tracking-widest hover:opacity-60 transition-opacity">
                        {t.nav.shop}
                    </Link>
                     <Link href="/marketplace/sell" className="text-xs font-medium uppercase tracking-widest hover:opacity-60 transition-opacity">
                        {t.nav.sell}
                    </Link>
                     <Link href="/about" className="text-xs font-medium uppercase tracking-widest hover:opacity-60 transition-opacity">
                        {t.nav.about}
                    </Link>
                    <Link href="/admin/login" className="text-xs font-medium uppercase tracking-widest hover:opacity-60 transition-opacity text-stone-500 dark:text-stone-400">
                        {t.nav.admin}
                    </Link>
                </div>

                {/* Mobile Menu Icon (only visible on small screens) */}
                <button className={`p-2 md:hidden ${isScrolled ? 'text-stone-900 dark:text-white' : 'text-white'}`}>
                    <Menu className="h-6 w-6" />
                </button>

                {/* Center: Logo */}
                <Link href="/" className="absolute left-1/2 -translate-x-1/2">
                    <span className={`font-serif text-3xl font-bold tracking-[0.2em] ${isScrolled ? 'text-stone-900 dark:text-white' : 'text-white'
                        }`}>
                        HUDEMAS
                    </span>
                </Link>

                {/* Right: Cart & Theme */}
                <div className="flex items-center gap-4">
                    <div className={isScrolled ? '' : 'text-white'}>
                        <LanguageSwitcher />
                    </div>
                    <div className={isScrolled ? '' : 'text-white'}>
                         <ThemeToggle />
                    </div>
                    <button
                        onClick={toggleCart}
                        className={`relative p-2 ${isScrolled ? 'text-stone-900 dark:text-white' : 'text-white'}`}
                    >
                        <ShoppingBag className="h-6 w-6" />
                        {cartCount > 0 && (
                            <span className="absolute right-0 top-0 flex h-4 w-4 items-center justify-center rounded-full bg-stone-900 dark:bg-white text-[10px] font-bold text-white dark:text-stone-900">
                                {cartCount}
                            </span>
                        )}
                    </button>
                </div>
            </div>
        </motion.nav>
    );
}
