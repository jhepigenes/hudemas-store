'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase';
import { Check, X, Eye, Loader2 } from 'lucide-react';
import { useLanguage } from '@/app/context/LanguageContext';

export default function MarketplaceApprovalsPage() {
    const [submissions, setSubmissions] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showHistory, setShowHistory] = useState(false);
    const [selectedImage, setSelectedImage] = useState<string | null>(null);
    const { t } = useLanguage();

    const supabase = createClient();

    useEffect(() => {
        fetchSubmissions();
    }, [showHistory]); // Re-fetch when toggle changes

    const fetchSubmissions = async () => {
        setLoading(true);
        try {
            let query = supabase
                .from('marketplace_listings')
                .select(`
                    *,
                    artists (
                        full_name
                    )
                `)
                .order('created_at', { ascending: false });

            if (showHistory) {
                query = query.in('status', ['active', 'rejected']);
            } else {
                query = query.eq('status', 'pending');
            }

            const { data, error } = await query;

            if (error) throw error;
            setSubmissions(data || []);
        } catch (error) {
            console.error('Error fetching submissions:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleApprove = async (id: string) => {
        try {
            const { error } = await supabase
                .from('marketplace_listings')
                .update({ status: 'active' })
                .eq('id', id);

            if (!error) {
                setSubmissions(prev => prev.filter(sub => sub.id !== id));
            }
        } catch (error) {
            console.error('Error approving listing:', error);
        }
    };

    const handleReject = async (id: string) => {
        if (!confirm('Are you sure?')) return; // Basic confirm for now
        try {
            const { error } = await supabase
                .from('marketplace_listings')
                .update({ status: 'rejected' })
                .eq('id', id);

            if (!error) {
                setSubmissions(prev => prev.filter(sub => sub.id !== id));
            }
        } catch (error) {
            console.error('Error rejecting listing:', error);
        }
    };

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="font-serif text-2xl font-medium text-stone-900 dark:text-white">{t.admin.marketplace.title}</h2>
                    <p className="text-stone-500">{t.admin.marketplace.subtitle}</p>
                </div>
                <button
                    onClick={() => setShowHistory(!showHistory)}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-colors border ${
                        showHistory 
                        ? 'bg-stone-900 text-white border-stone-900 dark:bg-white dark:text-stone-900' 
                        : 'bg-white text-stone-600 border-stone-200 hover:bg-stone-50 dark:bg-stone-900 dark:text-stone-400 dark:border-stone-800'
                    }`}
                >
                    {showHistory ? 'Hide History' : 'Show History'}
                </button>
            </div>

            {loading ? (
                <div className="flex justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-stone-400" />
                </div>
            ) : submissions.length === 0 ? (
                <div className="rounded-xl border border-dashed border-stone-300 p-12 text-center dark:border-stone-700">
                    <p className="text-stone-500">{t.admin.marketplace.empty}</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {submissions.map((submission) => (
                        <div key={submission.id} className="overflow-hidden rounded-xl border border-stone-200 bg-white shadow-sm dark:border-stone-800 dark:bg-stone-900">
                            <div className="aspect-[4/3] w-full bg-stone-100 dark:bg-stone-800 relative group">
                                {submission.images && submission.images[0] ? (
                                    <>
                                        <img
                                            src={submission.images[0]}
                                            alt={submission.title}
                                            className="h-full w-full object-cover"
                                        />
                                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                            <button
                                                onClick={() => setSelectedImage(submission.images[0])}
                                                className="p-2 bg-white rounded-full text-stone-900 hover:bg-stone-100"
                                            >
                                                <Eye className="h-5 w-5" />
                                            </button>
                                        </div>
                                    </>
                                ) : (
                                    <div className="flex h-full items-center justify-center text-stone-400">No Image</div>
                                )}
                                <div className={`absolute top-2 right-2 rounded-full px-2 py-1 text-xs font-medium ${
                                    submission.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                    submission.status === 'active' ? 'bg-green-100 text-green-800' :
                                    'bg-red-100 text-red-800'
                                }`}>
                                    {submission.status.charAt(0).toUpperCase() + submission.status.slice(1)}
                                </div>
                            </div>
                            <div className="p-4">
                                <h3 className="font-medium text-stone-900 dark:text-white">{submission.title}</h3>
                                <p className="text-sm text-stone-500">
                                    {submission.artists?.full_name || 'Unknown Artist'}
                                </p>
                                <p className="mt-2 text-lg font-serif text-stone-900 dark:text-white">{submission.price} {submission.currency}</p>

                                {submission.status === 'pending' && (
                                    <div className="mt-4 flex gap-2">
                                        <button
                                            onClick={() => handleApprove(submission.id)}
                                            className="flex-1 rounded-md bg-stone-900 py-2 text-sm font-medium text-white hover:bg-stone-800 dark:bg-white dark:text-stone-900"
                                        >
                                            {t.admin.marketplace.approve}
                                        </button>
                                        <button
                                            onClick={() => handleReject(submission.id)}
                                            className="flex-1 rounded-md border border-stone-200 py-2 text-sm font-medium text-red-600 hover:bg-red-50 dark:border-stone-700 dark:hover:bg-red-900/20"
                                        >
                                            {t.admin.marketplace.reject}
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Image Modal */}
            {selectedImage && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4" onClick={() => setSelectedImage(null)}>
                    <img src={selectedImage} alt="Preview" className="max-h-[90vh] max-w-full rounded-lg" />
                    <button className="absolute top-4 right-4 text-white hover:text-stone-300">
                        <X className="h-8 w-8" />
                    </button>
                </div>
            )}
        </div>
    );
}
