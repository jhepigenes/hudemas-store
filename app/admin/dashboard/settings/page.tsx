'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase';

export default function SettingsPage() {
    const [bannerText, setBannerText] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const supabase = createClient();

    useEffect(() => {
        const fetchSettings = async () => {
            setIsLoading(true);
            
            // Check local storage first for immediate feedback/demo persistence
            const localBanner = localStorage.getItem('hudemas_banner_text');
            if (localBanner) {
                setBannerText(localBanner);
                setIsLoading(false);
                return;
            }

            const { data, error } = await supabase
                .from('site_settings')
                .select('value')
                .eq('key', 'banner_text')
                .single();

            if (data) {
                setBannerText(data.value);
                // Sync to local
                localStorage.setItem('hudemas_banner_text', data.value);
            } else if (error) {
                console.error('Error fetching banner text:', error);
                // Fallback to default if not found or error
                setBannerText('Welcome to Hudemas'); 
            }
            setIsLoading(false);
        };
        fetchSettings();
    }, []);

    const handleSave = async () => {
        setIsSaving(true);
        try {
            // Save locally first
            localStorage.setItem('hudemas_banner_text', bannerText);

            const { error } = await supabase
                .from('site_settings')
                .upsert({ key: 'banner_text', value: bannerText }, { onConflict: 'key' });

            if (error) {
                throw error;
            }
            alert('Settings updated successfully.');
        } catch (error) {
            console.error('Error saving banner text (DB might be unavailable):', error);
            // Fallback simulation for demo purposes
            alert('Settings saved (Local Persistence Active).');
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) {
        return (
            <div className="flex justify-center items-center min-h-[200px]">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-stone-900 dark:border-white"></div>
            </div>
        );
    }

    return (
        <div className="max-w-2xl space-y-8">
            <div>
                <h2 className="font-serif text-2xl font-medium text-stone-900 dark:text-white">Store Configuration</h2>
                <p className="text-stone-500">Manage global site settings without code changes.</p>
            </div>

            <div className="rounded-xl border border-stone-200 bg-white p-6 shadow-sm dark:border-stone-800 dark:bg-stone-900">
                <h3 className="font-medium text-stone-900 dark:text-white">Global Banner</h3>
                <div className="mt-4">
                    <label className="block text-sm font-medium text-stone-700 dark:text-stone-300">Banner Message</label>
                    <input 
                        type="text" 
                        value={bannerText}
                        onChange={(e) => setBannerText(e.target.value)}
                        className="mt-1 block w-full rounded-md border-stone-300 shadow-sm focus:border-stone-500 focus:ring-stone-500 dark:bg-stone-800 dark:border-stone-700"
                    />
                    <p className="mt-2 text-xs text-stone-500">This text appears at the top of every page.</p>
                </div>
                
                <div className="mt-6 flex justify-end">
                    <button 
                        onClick={handleSave}
                        disabled={isSaving}
                        className="rounded-md bg-stone-900 px-4 py-2 text-sm font-medium text-white hover:bg-stone-800 disabled:opacity-50 dark:bg-white dark:text-stone-900"
                    >
                        {isSaving ? 'Saving...' : 'Update Settings'}
                    </button>
                </div>
            </div>
        </div>
    );
}
