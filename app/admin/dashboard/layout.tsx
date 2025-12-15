'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { LayoutDashboard, Package, Users, Settings, LogOut, TrendingUp, Contact, ClipboardList, Menu, X, Landmark, FileText, BarChart, Zap } from 'lucide-react';
import { useEffect, useState } from 'react';
import OnboardingTour from '../components/OnboardingTour';
import { ThemeToggle } from '@/app/components/ThemeToggle';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const router = useRouter();
    const [isAuthorized, setIsAuthorized] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    useEffect(() => {
        const checkAuth = async () => {
            try {
                const { createClient } = await import('@/lib/supabase');
                const supabase = createClient();
                const { data: { session }, error } = await supabase.auth.getSession();

                if (error || !session) {
                    // Double check if we have a user
                    const { data: { user } } = await supabase.auth.getUser();
                    if (!user) {
                        router.replace('/admin/login');
                        return;
                    }
                }

                // Optional: Check for admin role in profile if needed, 
                // but RLS will handle data access security.
                // For UI access, just being logged in is enough for now, 
                // or we can fetch profile.

                setIsAuthorized(true);
                setIsLoading(false);

            } catch (e) {
                console.error("Auth check failed", e);
                router.replace('/admin/login');
            }
        };

        checkAuth();
    }, [router]);

    // Close sidebar on route change (mobile)
    useEffect(() => {
        setIsSidebarOpen(false);
    }, [pathname]);

    const handleLogout = async () => {
        const { createClient } = await import('@/lib/supabase');
        const supabase = createClient();
        await supabase.auth.signOut();
        router.push('/');
    };

    if (isLoading) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-stone-50 dark:bg-stone-950">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-stone-900 dark:border-white"></div>
            </div>
        );
    }

    if (!isAuthorized) return null;

    const navItems = [
        { name: 'Overview', href: '/admin/dashboard', icon: LayoutDashboard, comingSoon: true },
        { name: 'Analytics', href: '/admin/dashboard/analytics', icon: BarChart, comingSoon: true },
        { name: 'Daily Operations', href: '/admin/dashboard/operations', icon: ClipboardList, comingSoon: false },
        { name: 'Financials', href: '/admin/dashboard/financials', icon: Landmark, comingSoon: true },
        { name: 'CRM', href: '/admin/dashboard/crm', icon: Contact, comingSoon: true },
        { name: 'Inventory & Bundles', href: '/admin/dashboard/inventory', icon: Package, comingSoon: true },
        { name: 'Marketplace & Fees', href: '/admin/dashboard/marketplace', icon: Users, comingSoon: true },
        { name: 'The Atelier (Blog)', href: '/admin/dashboard/blog', icon: FileText, comingSoon: true },
        { name: 'Automations', href: '/admin/dashboard/automations', icon: Zap, comingSoon: true },
        { name: 'Marketing & SEO', href: '/admin/dashboard/marketing', icon: TrendingUp, comingSoon: true },
        { name: 'Platform Settings', href: '/admin/dashboard/settings', icon: Settings, comingSoon: true },
    ];

    return (
        <div className="flex min-h-screen bg-stone-50 dark:bg-stone-950">
            <OnboardingTour />
            {/* Mobile Header */}
            <div className="fixed top-0 left-0 right-0 z-30 flex h-16 items-center justify-between border-b border-stone-200 bg-white px-4 dark:border-stone-800 dark:bg-stone-900 md:hidden">
                <button onClick={() => setIsSidebarOpen(true)} className="p-2 text-stone-600 dark:text-stone-300">
                    <Menu className="h-6 w-6" />
                </button>
                <span className="font-serif text-lg font-bold tracking-widest text-stone-900 dark:text-white">HUDEMAS</span>
                <div className="w-10" /> {/* Spacer for center alignment */}
            </div>

            {/* Sidebar Overlay */}
            {isSidebarOpen && (
                <div
                    className="fixed inset-0 z-30 bg-black/50 backdrop-blur-sm md:hidden"
                    onClick={() => setIsSidebarOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside
                className={`fixed inset-y-0 left-0 z-40 w-64 transform border-r border-stone-200 bg-white/80 backdrop-blur-xl transition-transform duration-300 ease-in-out dark:border-stone-800 dark:bg-stone-900/80 overflow-y-auto
                ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0`}
            >
                <div className="flex h-20 items-center justify-between px-6 border-b border-stone-100 dark:border-stone-800/50">
                    <h1 className="font-serif text-xl font-bold tracking-widest text-stone-900 dark:text-white">
                        HUDEMAS
                    </h1>
                    <button onClick={() => setIsSidebarOpen(false)} className="md:hidden text-stone-500">
                        <X className="h-5 w-5" />
                    </button>
                </div>
                <nav className="mt-6 px-4 space-y-1">
                    {navItems.map((item) => {
                        const isActive = pathname === item.href;
                        const Icon = item.icon;
                        return (
                            <Link
                                key={item.name}
                                href={item.href}
                                className={`flex items-center justify-between gap-2 rounded-lg px-4 py-3 text-sm font-medium transition-all duration-200 ${item.comingSoon ? 'opacity-50' : ''} ${isActive
                                    ? 'bg-stone-900 text-white shadow-md dark:bg-white dark:text-stone-900'
                                    : 'text-stone-500 hover:bg-stone-100 hover:text-stone-900 dark:text-stone-400 dark:hover:bg-stone-800 dark:hover:text-white'
                                    }`}
                            >
                                <span className="flex items-center gap-3">
                                    <Icon className="h-4 w-4" />
                                    {item.name}
                                </span>
                                {item.comingSoon && (
                                    <span className="text-[10px] font-bold uppercase tracking-wide px-1.5 py-0.5 bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 rounded">Soon</span>
                                )}
                            </Link>
                        );
                    })}
                </nav>
                <div className="absolute bottom-28 w-full px-4">
                    <div className="flex items-center justify-between px-4 py-2 text-sm font-medium text-stone-500 dark:text-stone-400 bg-stone-50 dark:bg-stone-800/50 rounded-lg">
                        <span>Theme</span>
                        <ThemeToggle />
                    </div>
                </div>
                <div className="absolute bottom-4 w-full px-4">
                    <button
                        onClick={handleLogout}
                        className="flex w-full items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/10 transition-colors"
                    >
                        <LogOut className="h-4 w-4" />
                        Logout
                    </button>
                </div>            </aside>

            {/* Main Content */}
            <main className="flex-1 p-4 pt-20 md:p-8 md:ml-64 transition-all duration-300">
                {children}
            </main>
        </div>
    );
}