'use client';

import { useState, useEffect } from 'react';
import { Star, Image as ImageIcon, Check, User, Loader2 } from 'lucide-react';
import { createClient } from '@/lib/supabase';

interface Review {
    id: string;
    author_name: string;
    rating: number;
    comment: string;
    image_url?: string;
    created_at: string;
    is_verified: boolean;
}

export default function ProductReviews({ productId }: { productId: string }) {
    const [reviews, setReviews] = useState<Review[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [newReview, setNewReview] = useState({ rating: 5, comment: '', image: null as File | null });
    const [uploading, setUploading] = useState(false);

    const supabase = createClient();

    useEffect(() => {
        fetchReviews();
    }, [productId]);

    const fetchReviews = async () => {
        const res = await fetch(`/api/reviews?productId=${productId}`);
        const data = await res.json();
        if (Array.isArray(data)) setReviews(data);
        setLoading(false);
    };

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || e.target.files.length === 0) return;
        setNewReview({ ...newReview, image: e.target.files[0] });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
            alert('Please login to write a review.');
            return;
        }

        setSubmitting(true);
        try {
            let imageUrl = null;

            // Upload Image if present
            if (newReview.image) {
                setUploading(true);
                const fileExt = newReview.image.name.split('.').pop();
                const fileName = `${Math.random()}.${fileExt}`;
                const { error: uploadError } = await supabase.storage
                    .from('reviews') // Need to create this bucket!
                    .upload(fileName, newReview.image);
                
                if (uploadError) throw uploadError;
                
                const { data: { publicUrl } } = supabase.storage
                    .from('reviews')
                    .getPublicUrl(fileName);
                imageUrl = publicUrl;
                setUploading(false);
            }

            // Get user profile for name
            const { data: profile } = await supabase
                .from('profiles')
                .select('full_name')
                .eq('id', session.user.id)
                .single();

            const res = await fetch('/api/reviews', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    productId,
                    rating: newReview.rating,
                    comment: newReview.comment,
                    imageUrl,
                    authorName: profile?.full_name || 'Customer'
                })
            });

            if (res.ok) {
                alert('Review submitted for approval!');
                setShowForm(false);
                setNewReview({ rating: 5, comment: '', image: null });
            } else {
                const err = await res.json();
                alert('Failed: ' + err.error);
            }
        } catch (error: any) {
            console.error(error);
            alert('Error submitting review');
        } finally {
            setSubmitting(false);
            setUploading(false);
        }
    };

    return (
        <div className="mt-16 border-t border-stone-200 pt-16 dark:border-stone-800">
            <div className="flex items-center justify-between mb-8">
                <h2 className="font-serif text-2xl font-medium text-stone-900 dark:text-white">Customer Reviews</h2>
                <button
                    onClick={() => setShowForm(!showForm)}
                    className="rounded-full border border-stone-300 px-6 py-2 text-sm font-medium text-stone-700 hover:bg-stone-50 dark:border-stone-700 dark:text-stone-300 dark:hover:bg-stone-800"
                >
                    Write a Review
                </button>
            </div>

            {showForm && (
                <form onSubmit={handleSubmit} className="mb-12 bg-stone-50 dark:bg-stone-900 p-6 rounded-xl">
                    <div className="mb-4">
                        <label className="block text-sm font-medium mb-2 dark:text-white">Rating</label>
                        <div className="flex gap-1">
                            {[1, 2, 3, 4, 5].map((star) => (
                                <button
                                    key={star}
                                    type="button"
                                    onClick={() => setNewReview({ ...newReview, rating: star })}
                                    className={`p-1 ${star <= newReview.rating ? 'text-yellow-400' : 'text-stone-300'}`}
                                >
                                    <Star className="h-6 w-6 fill-current" />
                                </button>
                            ))}
                        </div>
                    </div>
                    <div className="mb-4">
                        <label className="block text-sm font-medium mb-2 dark:text-white">Your Review</label>
                        <textarea
                            required
                            rows={4}
                            value={newReview.comment}
                            onChange={(e) => setNewReview({ ...newReview, comment: e.target.value })}
                            className="w-full rounded-md border-stone-300 dark:bg-stone-800 dark:border-stone-700 dark:text-white"
                            placeholder="Share your experience..."
                        />
                    </div>
                    <div className="mb-6">
                        <label className="block text-sm font-medium mb-2 dark:text-white">Add a Photo (Optional)</label>
                        <div className="flex items-center gap-4">
                            <label className="cursor-pointer flex items-center gap-2 px-4 py-2 border border-stone-300 rounded-md bg-white dark:bg-stone-800 dark:border-stone-700 hover:bg-stone-50 text-sm">
                                <ImageIcon className="h-4 w-4" />
                                {newReview.image ? 'Change Photo' : 'Upload Photo'}
                                <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                            </label>
                            {newReview.image && <span className="text-sm text-stone-500">{newReview.image.name}</span>}
                        </div>
                    </div>
                    <div className="flex justify-end">
                        <button
                            type="submit"
                            disabled={submitting}
                            className="flex items-center gap-2 rounded-md bg-stone-900 px-6 py-2 text-white hover:bg-stone-800 disabled:opacity-50 dark:bg-white dark:text-stone-900"
                        >
                            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Submit Review'}
                        </button>
                    </div>
                </form>
            )}

            {loading ? (
                <p className="text-stone-500">Loading reviews...</p>
            ) : reviews.length === 0 ? (
                <p className="text-stone-500 italic">No reviews yet. Be the first to share your masterpiece!</p>
            ) : (
                <div className="space-y-8">
                    {reviews.map((review) => (
                        <div key={review.id} className="border-b border-stone-100 pb-8 last:border-0 dark:border-stone-800">
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-3">
                                    <div className="h-10 w-10 rounded-full bg-stone-200 flex items-center justify-center dark:bg-stone-800">
                                        <User className="h-5 w-5 text-stone-500" />
                                    </div>
                                    <div>
                                        <p className="font-medium text-stone-900 dark:text-white flex items-center gap-2">
                                            {review.author_name}
                                            {review.is_verified && (
                                                <span className="text-[10px] bg-green-100 text-green-700 px-2 py-0.5 rounded-full flex items-center gap-1 dark:bg-green-900/30 dark:text-green-400">
                                                    <Check className="h-3 w-3" /> Verified Buyer
                                                </span>
                                            )}
                                        </p>
                                        <div className="flex text-yellow-400 text-xs mt-0.5">
                                            {[...Array(5)].map((_, i) => (
                                                <Star key={i} className={`h-3 w-3 ${i < review.rating ? 'fill-current' : 'text-stone-200 dark:text-stone-700'}`} />
                                            ))}
                                        </div>
                                    </div>
                                </div>
                                <span className="text-sm text-stone-400">
                                    {new Date(review.created_at).toLocaleDateString()}
                                </span>
                            </div>
                            <p className="text-stone-600 dark:text-stone-300 leading-relaxed">
                                {review.comment}
                            </p>
                            {review.image_url && (
                                <div className="mt-4 relative h-48 w-48 rounded-lg overflow-hidden bg-stone-100 dark:bg-stone-800">
                                    <img src={review.image_url} alt="Review attachment" className="object-cover w-full h-full hover:scale-105 transition-transform" />
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
