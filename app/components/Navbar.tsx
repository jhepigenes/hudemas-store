import Link from 'next/link';
import { ShoppingBag, Menu, X, User } from 'lucide-react';
import { useState, useEffect } from 'react';
import { motion, useScroll, useMotionValueEvent, AnimatePresence } from 'framer-motion';
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

                    {/* Logo (Left on Desktop, Center on Mobile via flex-1/absolute if needed, but let's keep it simple left for now or left-aligned) */}
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
                        <Link href="/about" className="text-[10px] lg:text-xs font-medium uppercase tracking-widest hover:opacity-60 transition-opacity whitespace-nowrap">
                            {t.nav.about}
                        </Link>
                    </div>

                    {/* Right: Cart & Theme & Controls */}
                    <div className="flex items-center gap-2 shrink-0">
                        <Link href="/admin/login" className={`text-[10px] font-medium uppercase tracking-widest hover:opacity-60 transition-opacity hidden md:block ${textColorClass}`}>
                            {t.nav.admin}
                        </Link>
                        
                        <div className={showSolidNav ? '' : 'text-white'}>
                            <CurrencySwitcher />
                        </div>
                        <div className={showSolidNav ? '' : 'text-white'}>
                            <LanguageSwitcher />
                        </div>
                        <div className={showSolidNav ? '' : 'text-white'}>
                            <ThemeToggle />
                        </div>
                        
                        {/* User Profile Link - High Contrast */}
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
                        initial={{ opacity: 0, x: '100%' }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: '100%' }}
                        transition={{ type: "spring", damping: 25, stiffness: 200 }}
                        className="fixed inset-0 z-[60] bg-white dark:bg-stone-950 md:hidden"
                    >
                        <div className="flex flex-col h-full p-6">
                            <div className="flex justify-end mb-8">
                                <button
                                    onClick={() => setIsMobileMenuOpen(false)}
                                    className="p-2 text-stone-900 dark:text-white"
                                >
                                    <X className="h-8 w-8" />
                                </button>
                            </div>

                            <div className="flex flex-col gap-8 items-center text-center">
                                <Link href="/" className="text-2xl font-serif text-stone-900 dark:text-white">
                                    {t.nav.home}
                                </Link>
                                <Link href="/shop" className="text-2xl font-serif text-stone-900 dark:text-white">
                                    {t.nav.shop}
                                </Link>
                                <Link href="/marketplace" className="text-2xl font-serif text-stone-900 dark:text-white">
                                    Marketplace
                                </Link>
                                <Link href="/sell" className="text-2xl font-serif text-stone-900 dark:text-white">
                                    {t.nav.sell}
                                </Link>
                                <Link href="/about" className="text-2xl font-serif text-stone-900 dark:text-white">
                                    {t.nav.about}
                                </Link>
                                <Link href="/admin/login" className="text-lg font-sans text-stone-500 dark:text-stone-400 mt-4">
                                    {t.nav.admin}
                                </Link>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}
