'use client';

import { useState, useEffect } from 'react';
import { Star, Check, X, Image as ImageIcon, Loader2 } from 'lucide-react';

export default function ReviewsManager() {
    const [reviews, setReviews] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchReviews();
    }, []);

    const fetchReviews = async () => {
        try {
            // We need an admin endpoint to fetch PENDING reviews (and all reviews)
            // For now, let's reuse the public GET but filter differently or create a new admin endpoint?
            // Public GET filters by productId and status='approved'.
            // We need a new endpoint or update the existing one to handle admin role.
            // Let's create a specific admin action in `api/admin/reviews`.
            const res = await fetch('/api/admin/reviews');
            const data = await res.json();
            if (Array.isArray(data)) setReviews(data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleStatus = async (id: string, status: 'approved' | 'rejected') => {
        try {
            const res = await fetch('/api/admin/reviews', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id, status })
            });
            if (res.ok) {
                setReviews(reviews.map(r => r.id === id ? { ...r, status } : r));
            }
        } catch (error) {
            console.error(error);
        }
    };

    return (
        <div className="rounded-xl border border-stone-200 bg-white p-6 dark:border-stone-800 dark:bg-stone-900 mt-8">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h3 className="font-medium text-stone-900 dark:text-white flex items-center gap-2">
                        <Star className="h-5 w-5" /> Reviews Moderation
                    </h3>
                    <p className="text-sm text-stone-500">Approve or reject customer feedback</p>
                </div>
            </div>

            <div className="space-y-4">
                {loading ? (
                    <p className="text-sm text-stone-500">Loading...</p>
                ) : reviews.length === 0 ? (
                    <p className="text-sm text-stone-500">No reviews pending moderation.</p>
                ) : (
                    reviews.map((review) => (
                        <div key={review.id} className="flex items-start justify-between p-4 bg-stone-50 dark:bg-stone-800/50 rounded-lg border border-stone-100 dark:border-stone-800">
                            <div className="flex gap-4">
                                {review.image_url && (
                                    <img src={review.image_url} alt="Review" className="w-16 h-16 object-cover rounded-md" />
                                )}
                                <div>
                                    <div className="flex items-center gap-2">
                                        <span className="font-medium text-stone-900 dark:text-white">{review.author_name}</span>
                                        <div className="flex text-yellow-400 text-xs">
                                            {[...Array(5)].map((_, i) => (
                                                <Star key={i} className={`h-3 w-3 ${i < review.rating ? 'fill-current' : 'text-stone-300'}`} />
                                            ))}
                                        </div>
                                        <span className={`text-xs px-2 py-0.5 rounded-full ${
                                            review.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                            review.status === 'approved' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                        }`}>
                                            {review.status}
                                        </span>
                                    </div>
                                    <p className="text-sm text-stone-600 dark:text-stone-300 mt-1">{review.comment}</p>
                                    <p className="text-xs text-stone-400 mt-1">Product ID: {review.product_id}</p>
                                </div>
                            </div>
                            <div className="flex gap-2">
                                {review.status === 'pending' && (
                                    <>
                                        <button onClick={() => handleStatus(review.id, 'approved')} className="p-2 bg-green-100 text-green-700 rounded-full hover:bg-green-200">
                                            <Check className="h-4 w-4" />
                                        </button>
                                        <button onClick={() => handleStatus(review.id, 'rejected')} className="p-2 bg-red-100 text-red-700 rounded-full hover:bg-red-200">
                                            <X className="h-4 w-4" />
                                        </button>
                                    </>
                                )}
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
