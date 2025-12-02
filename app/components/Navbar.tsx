import Link from 'next/link';
import { ShoppingBag, Menu, X, User, Instagram, Facebook } from 'lucide-react';
import { useState, useEffect } from 'react';
import { motion, useScroll, useMotionValueEvent, AnimatePresence, Variants } from 'framer-motion';
import { useCart } from '../context/CartContext';
import { ThemeToggle } from './ThemeToggle';
import { useLanguage } from '../context/LanguageContext';
import { useCurrency } from '../context/CurrencyContext';
import LanguageSwitcher from './LanguageSwitcher';
import CurrencySwitcher from './CurrencySwitcher';
import { usePathname } from 'next/navigation';
import { createClient } from '@/lib/supabase';

export default function Navbar({ isFixed = true }: { isFixed?: boolean }) {
    const [isScrolled, setIsScrolled] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [user, setUser] = useState<any>(null);
    const { scrollY } = useScroll();
    const { toggleCart, cartCount } = useCart();
    const { t } = useLanguage();
    const { currency, setCurrency } = useCurrency();
    const pathname = usePathname();
    const isHomePage = pathname === '/';
    const supabase = createClient();

    useMotionValueEvent(scrollY, "change", (latest) => {
        setIsScrolled(latest > 50);
    });

    // Check auth state
    useEffect(() => {
        const getUser = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            setUser(session?.user || null);
        };
        getUser();

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event: string, session: any) => {
            setUser(session?.user || null);
        });

        return () => subscription.unsubscribe();
    }, [supabase]);

    // Close mobile menu on route change
    useEffect(() => {
        setIsMobileMenuOpen(false);
    }, [pathname]);

    const toggleCurrency = () => {
        setCurrency(currency === 'RON' ? 'EUR' : 'RON');
    };

    const showSolidNav = isScrolled || !isHomePage;
    const textColorClass = showSolidNav ? 'text-stone-900 dark:text-white' : 'text-white';

    const menuVariants: Variants = {
        closed: {
            opacity: 0,
            x: "100%",
            transition: {
                type: "spring",
                stiffness: 400,
                damping: 40,
                staggerChildren: 0.05,
                staggerDirection: -1
            }
        },
        open: {
            opacity: 1,
            x: 0,
            transition: {
                type: "spring",
                stiffness: 400,
                damping: 40,
                staggerChildren: 0.07,
                delayChildren: 0.2
            }
        }
    };

    const itemVariants: Variants = {
        closed: { opacity: 0, x: 50 },
        open: { opacity: 1, x: 0 }
    };

    return (
        <>
            <motion.nav
                className={`${isFixed ? 'fixed top-0 z-50' : 'relative'} w-full transition-all duration-500 ease-in-out ${showSolidNav
                    ? 'bg-white/90 dark:bg-stone-900/90 backdrop-blur-md shadow-sm border-b border-stone-200 dark:border-stone-800 py-2'
                    : 'bg-transparent py-4'
                    }`}
            >
                <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6 lg:px-12">

                    {/* Mobile Menu Icon (Left on Mobile) */}
                    <button
                        onClick={() => setIsMobileMenuOpen(true)}
                        className={`p-2 md:hidden mr-4 ${textColorClass}`}
                    >
                        <Menu className="h-6 w-6" />
                    </button>

                    {/* Logo */}
                    <Link href="/" className="shrink-0 mr-8">
                        <span className={`font-serif text-2xl lg:text-3xl font-bold tracking-[0.2em] ${textColorClass}`}>
                            HUDEMAS
                        </span>
                    </Link>

                    {/* Navigation Links (Center - Desktop Only) */}
                    <div className={`hidden md:flex flex-1 justify-center gap-6 lg:gap-8 items-center ${textColorClass}`}>
                        <Link href="/" className="text-[10px] lg:text-xs font-medium uppercase tracking-widest hover:opacity-60 transition-opacity whitespace-nowrap">
                            {t.nav.home}
                        </Link>
                        <Link href="/shop" className="text-[10px] lg:text-xs font-medium uppercase tracking-widest hover:opacity-60 transition-opacity whitespace-nowrap">
                            {t.nav.shop}
                        </Link>
                        <Link href="/marketplace" className="text-[10px] lg:text-xs font-medium uppercase tracking-widest hover:opacity-60 transition-opacity whitespace-nowrap">
                            Marketplace
                        </Link>
                        <Link href="/sell" className="text-[10px] lg:text-xs font-medium uppercase tracking-widest hover:opacity-60 transition-opacity whitespace-nowrap">
                            {t.nav.sell}
                        </Link>
                        <Link href="/blog" className="text-[10px] lg:text-xs font-medium uppercase tracking-widest hover:opacity-60 transition-opacity whitespace-nowrap">
                            The Atelier
                        </Link>
                        <Link href="/about" className="text-[10px] lg:text-xs font-medium uppercase tracking-widest hover:opacity-60 transition-opacity whitespace-nowrap">
                            {t.nav.about}
                        </Link>
                    </div>

                    {/* Right: Cart & Theme & Controls */}
                    <div className="flex items-center gap-2 shrink-0">
                        <Link href="/admin/login" className={`text-[10px] font-medium uppercase tracking-widest hover:opacity-60 transition-opacity hidden md:block ${textColorClass}`}>
                            {t.nav.admin}
                        </Link>

                        {/* Toggles - Hidden on Mobile, Visible on Desktop */}
                        <div className={`hidden md:block ${showSolidNav ? '' : 'text-white'}`}>
                            <CurrencySwitcher />
                        </div>
                        <div className={`hidden md:block ${showSolidNav ? '' : 'text-white'}`}>
                            <LanguageSwitcher />
                        </div>
                        <div className={`hidden md:block ${showSolidNav ? '' : 'text-white'}`}>
                            <ThemeToggle />
                        </div>

                        {/* User Profile Link */}
                        <Link href={user ? "/profile" : "/login"} className="p-2 flex items-center justify-center rounded-full bg-stone-100 dark:bg-stone-800 text-stone-900 dark:text-white shadow-sm hover:bg-stone-200 dark:hover:bg-stone-700 transition-colors">
                            <User className="h-5 w-5" />
                        </Link>

                        <button
                            onClick={toggleCart}
                            className={`relative p-2 ${textColorClass}`}
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

            {/* Mobile Menu Overlay */}
            <AnimatePresence>
                {isMobileMenuOpen && (
                    <motion.div
                        initial="closed"
                        animate="open"
                        exit="closed"
                        variants={menuVariants}
                        className="fixed inset-0 z-[60] bg-white/95 dark:bg-stone-950/95 backdrop-blur-xl md:hidden"
                    >
                        <div className="flex flex-col h-full p-6">
                            <div className="flex justify-between items-center mb-8">
                                <span className="font-serif text-xl font-bold tracking-widest text-stone-900 dark:text-white">
                                    HUDEMAS
                                </span>
                                <button
                                    onClick={() => setIsMobileMenuOpen(false)}
                                    className="p-2 text-stone-900 dark:text-white hover:opacity-60 transition-opacity"
                                >
                                    <X className="h-8 w-8" />
                                </button>
                            </div>

                            <div className="flex flex-col gap-6 items-start px-4 overflow-y-auto">
                                <motion.div variants={itemVariants} className="w-full">
                                    <Link href="/" className="text-3xl font-serif text-stone-900 dark:text-white hover:text-stone-600 dark:hover:text-stone-300 transition-colors block w-full">
                                        {t.nav.home}
                                    </Link>
                                </motion.div>
                                <motion.div variants={itemVariants} className="w-full">
                                    <Link href="/shop" className="text-3xl font-serif text-stone-900 dark:text-white hover:text-stone-600 dark:hover:text-stone-300 transition-colors block w-full">
                                        {t.nav.shop}
                                    </Link>
                                </motion.div>
                                <motion.div variants={itemVariants} className="w-full">
                                    <Link href="/marketplace" className="text-3xl font-serif text-stone-900 dark:text-white hover:text-stone-600 dark:hover:text-stone-300 transition-colors block w-full">
                                        Marketplace
                                    </Link>
                                </motion.div>
                                <motion.div variants={itemVariants} className="w-full">
                                    <Link href="/sell" className="text-3xl font-serif text-stone-900 dark:text-white hover:text-stone-600 dark:hover:text-stone-300 transition-colors block w-full">
                                        {t.nav.sell}
                                    </Link>
                                </motion.div>
                                <motion.div variants={itemVariants} className="w-full">
                                    <Link href="/blog" className="text-3xl font-serif text-stone-900 dark:text-white hover:text-stone-600 dark:hover:text-stone-300 transition-colors block w-full">
                                        The Atelier
                                    </Link>
                                </motion.div>
                                <motion.div variants={itemVariants} className="w-full">
                                    <Link href="/about" className="text-3xl font-serif text-stone-900 dark:text-white hover:text-stone-600 dark:hover:text-stone-300 transition-colors block w-full">
                                        {t.nav.about}
                                    </Link>
                                </motion.div>

                                <motion.div variants={itemVariants} className="w-full pt-6 border-t border-stone-200 dark:border-stone-800 mt-2">
                                    <Link href="/admin/login" className="text-lg font-sans text-stone-500 dark:text-stone-400 hover:text-stone-900 dark:hover:text-white transition-colors">
                                        {t.nav.admin}
                                    </Link>
                                </motion.div>

                                {/* Mobile Toggles */}
                                <motion.div variants={itemVariants} className="w-full flex flex-wrap gap-4 pt-4">
                                    <div className="text-stone-900 dark:text-white">
                                        <CurrencySwitcher />
                                    </div>
                                    <div className="text-stone-900 dark:text-white">
                                        <LanguageSwitcher />
                                    </div>
                                    <div className="text-stone-900 dark:text-white">
                                        <ThemeToggle />
                                    </div>
                                </motion.div>
                            </div>

                            {/* Social Links */}
                            <motion.div
                                variants={itemVariants}
                                className="mt-auto flex gap-6 justify-center pb-8 pt-4"
                            >
                                <a href="https://www.instagram.com/hudema.s/" target="_blank" rel="noopener noreferrer" className="text-stone-900 dark:text-white hover:opacity-60 transition-opacity">
                                    <Instagram className="h-6 w-6" />
                                </a>
                                <a href="https://www.facebook.com/hudemas" target="_blank" rel="noopener noreferrer" className="text-stone-900 dark:text-white hover:opacity-60 transition-opacity">
                                    <Facebook className="h-6 w-6" />
                                </a>
                            </motion.div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}
