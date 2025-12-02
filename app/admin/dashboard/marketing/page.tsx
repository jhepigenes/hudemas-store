'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase';
import { Check, AlertCircle, Loader2 } from 'lucide-react';
import { useLanguage } from '@/app/context/LanguageContext';
import CouponsManager from './CouponsManager';
import NewsletterManager from './NewsletterManager';
import ReviewsManager from './ReviewsManager';

export default function MarketingPage() {
    const [title, setTitle] = useState('Hudemas - The Art of Gobelin | Handcrafted Tapestries');
    const [description, setDescription] = useState('Discover the finest collection of Gobelin tapestries in Romania. Handcrafted kits and finished masterpieces available.');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
    const { t } = useLanguage();

    const supabase = createClient();

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        try {
            const { data, error } = await supabase
                .from('site_settings')
                .select('value')
                .eq('key', 'seo_metadata')
                .single();

            if (data) {
                setTitle(data.value.title || title);
                setDescription(data.value.description || description);
            }
        } catch (error) {
            console.error('Error fetching settings:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        setMessage(null);
        try {
            const { error } = await supabase
                .from('site_settings')
                .upsert({
                    key: 'seo_metadata',
                    value: { title, description }
                }, { onConflict: 'key' });

            if (error) throw error;
            setMessage({ type: 'success', text: t.admin.marketing.saved });
        } catch (error) {
            console.error('Error saving settings:', error);
            setMessage({ type: 'error', text: 'Failed to save settings.' });
        } finally {
            setSaving(false);
        }
    };

    // SEO Analysis
    const getTitleHealth = (text: string) => {
        const len = text.length;
        if (len === 0) return { color: 'text-red-500', message: 'Missing title' };
        if (len < 30) return { color: 'text-yellow-500', message: 'Too short (aim for 30-60 chars)' };
        if (len > 60) return { color: 'text-yellow-500', message: 'Too long (aim for 30-60 chars)' };
        return { color: 'text-green-500', message: 'Good length' };
    };

    const getDescriptionHealth = (text: string) => {
        const len = text.length;
        if (len === 0) return { color: 'text-red-500', message: 'Missing description' };
        if (len < 120) return { color: 'text-yellow-500', message: 'Too short (aim for 120-160 chars)' };
        if (len > 160) return { color: 'text-yellow-500', message: 'Too long (aim for 120-160 chars)' };
        return { color: 'text-green-500', message: 'Good length' };
    };

    const titleHealth = getTitleHealth(title);
    const descHealth = getDescriptionHealth(description);

    return (
        <div className="space-y-8">
            <div>
                <h2 className="font-serif text-2xl font-medium text-stone-900 dark:text-white">{t.admin.marketing.title}</h2>
                <p className="text-stone-500">{t.admin.marketing.subtitle}</p>
            </div>

            {/* SEO Global Settings */}
            <div className="rounded-xl border border-stone-200 bg-white p-6 dark:border-stone-800 dark:bg-stone-900">
                <h3 className="font-medium text-stone-900 dark:text-white">{t.admin.marketing.seoTitle}</h3>
                <div className="mt-4 grid grid-cols-1 gap-6">
                    <div>
                        <div className="flex justify-between">
                            <label className="block text-sm font-medium text-stone-700 dark:text-stone-300">{t.admin.marketing.pageTitle}</label>
                            <span className={`text-xs ${titleHealth.color}`}>{title.length} chars - {titleHealth.message}</span>
                        </div>
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            className="mt-1 block w-full rounded-md border-stone-300 shadow-sm focus:border-stone-500 focus:ring-stone-500 dark:bg-stone-800 dark:border-stone-700 dark:text-white"
                        />
                    </div>
                    <div>
                        <div className="flex justify-between">
                            <label className="block text-sm font-medium text-stone-700 dark:text-stone-300">{t.admin.marketing.metaDescription}</label>
                            <span className={`text-xs ${descHealth.color}`}>{description.length} chars - {descHealth.message}</span>
                        </div>
                        <textarea
                            rows={3}
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            className="mt-1 block w-full rounded-md border-stone-300 shadow-sm focus:border-stone-500 focus:ring-stone-500 dark:bg-stone-800 dark:border-stone-700 dark:text-white"
                        />
                    </div>

                    <div className="flex items-center gap-4">
                        <button
                            onClick={handleSave}
                            disabled={saving}
                            className="flex items-center gap-2 rounded-md bg-stone-900 px-4 py-2 text-sm text-white hover:bg-stone-800 disabled:opacity-50 dark:bg-white dark:text-stone-900"
                        >
                            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                            {saving ? t.admin.marketing.saving : t.admin.marketing.save}
                        </button>
                        {message && (
                            <span className={`text-sm flex items-center gap-1 ${message.type === 'success' ? 'text-green-600' : 'text-red-600'}`}>
                                {message.type === 'success' ? <Check className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
                                {message.text}
                            </span>
                        )}
                    </div>
                </div>
            </div>

            {/* Coupons Manager */}
            <CouponsManager />

            {/* Newsletter Manager */}
            <NewsletterManager />

            {/* Reviews Manager */}
            <ReviewsManager />

            {/* Ads Manager Placeholder */}
            <div className="rounded-xl border border-stone-200 bg-stone-50 p-6 dark:border-stone-800 dark:bg-stone-900/50">
                <div className="flex items-center justify-between">
                    <div>
                        <h3 className="font-medium text-stone-900 dark:text-white">{t.admin.marketing.campaigns}</h3>
                        <p className="text-sm text-stone-500">{t.admin.marketing.campaignsSubtitle}</p>
                    </div>
                    <a 
                        href="https://business.facebook.com/events_manager2" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
                    >
                        Manage Facebook Pixel
                    </a>
                </div>
            </div>
        </div>
    );
}
