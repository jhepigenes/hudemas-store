'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { createClient } from '@/lib/supabase';
import { useLanguage } from '@/app/context/LanguageContext';

export default function CampaignBanner() {
    const [isVisible, setIsVisible] = useState(true);
    const [bannerText, setBannerText] = useState('Free Shipping on all orders over 200 RON');
    const supabase = createClient();
    const { language } = useLanguage();

    // ... (useEffect logic remains the same)

    useEffect(() => {
        const fetchBanner = async () => {
            // 1. Check Local Storage (Fastest/Demo Persistence)
            const localText = localStorage.getItem('hudemas_banner_text');
            if (localText) {
                setBannerText(localText);
            }

            // 2. Check Database (Source of Truth)
            try {
                const { data } = await supabase
                    .from('site_settings')
                    .select('value')
                    .eq('key', 'banner_text')
                    .single();

                if (data?.value) {
                    setBannerText(data.value);
                    // Sync to local to keep them updated
                    localStorage.setItem('hudemas_banner_text', data.value);
                }
            } catch (e) {
                console.log('Banner fetch silent fail');
            }
        };

        fetchBanner();

        // Optional: Listen for storage events to update immediately if changed in another tab
        const handleStorage = () => {
            const localText = localStorage.getItem('hudemas_banner_text');
            if (localText) setBannerText(localText);
        };
        window.addEventListener('storage', handleStorage);
        return () => window.removeEventListener('storage', handleStorage);
    }, []);

    if (!isVisible) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="relative bg-stone-900 px-4 py-3 text-white"
            >
                <div className="mx-auto flex max-w-7xl flex-col items-center justify-center gap-2 text-center sm:flex-row sm:gap-6">
                    <span className="bg-white px-2 py-0.5 text-xs font-bold uppercase tracking-wider text-black">
                        {language === 'ro' ? 'Noutăți' : 'News'}
                    </span>
                    <p className="text-sm font-medium font-serif tracking-wide">
                        {bannerText}
                    </p>
                </div>
                <button
                    onClick={() => setIsVisible(false)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-stone-400 hover:text-white"
                >
                    <X className="h-4 w-4" />
                </button>
            </motion.div>
        </AnimatePresence>
    );
}
