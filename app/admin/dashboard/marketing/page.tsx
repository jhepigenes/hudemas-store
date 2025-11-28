'use client';

export default function MarketingPage() {
    return (
        <div className="space-y-8">
            <div>
                <h2 className="font-serif text-2xl font-medium text-stone-900 dark:text-white">SEO & Marketing</h2>
                <p className="text-stone-500">Optimize your visibility and manage ad campaigns.</p>
            </div>

            {/* SEO Global Settings */}
            <div className="rounded-xl border border-stone-200 bg-white p-6 dark:border-stone-800 dark:bg-stone-900">
                <h3 className="font-medium text-stone-900 dark:text-white">Global Metadata</h3>
                <div className="mt-4 grid grid-cols-1 gap-6">
                    <div>
                        <label className="block text-sm font-medium text-stone-700 dark:text-stone-300">Default Page Title</label>
                        <input 
                            type="text" 
                            defaultValue="Hudemas - The Art of Gobelin | Handcrafted Tapestries"
                            className="mt-1 block w-full rounded-md border-stone-300 shadow-sm focus:border-stone-500 focus:ring-stone-500 dark:bg-stone-800 dark:border-stone-700"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-stone-700 dark:text-stone-300">Meta Description</label>
                        <textarea 
                            rows={3}
                            defaultValue="Discover the finest collection of Gobelin tapestries in Romania. Handcrafted kits and finished masterpieces available."
                            className="mt-1 block w-full rounded-md border-stone-300 shadow-sm focus:border-stone-500 focus:ring-stone-500 dark:bg-stone-800 dark:border-stone-700"
                        />
                    </div>
                    <button className="w-max rounded-md bg-stone-900 px-4 py-2 text-sm text-white hover:bg-stone-800 dark:bg-white dark:text-stone-900">
                        Save Changes
                    </button>
                </div>
            </div>

            {/* Ads Manager Placeholder */}
            <div className="rounded-xl border border-stone-200 bg-stone-50 p-6 dark:border-stone-800 dark:bg-stone-900/50">
                <div className="flex items-center justify-between">
                    <div>
                        <h3 className="font-medium text-stone-900 dark:text-white">Ad Campaigns</h3>
                        <p className="text-sm text-stone-500">Connect Facebook Ads or Google Ads to boost sales.</p>
                    </div>
                    <button className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">
                        Connect Account
                    </button>
                </div>
            </div>
        </div>
    );
}
