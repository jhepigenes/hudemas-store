'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase';
import { Star, Quote } from 'lucide-react';
import Image from 'next/image';

export default function RecentReviews() {
    const [reviews, setReviews] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const supabase = createClient();

    useEffect(() => {
        const fetchReviews = async () => {
            const { data } = await supabase
                .from('reviews')
                .select('*, products(title, image_url)')
                .eq('status', 'approved')
                .limit(3)
                .order('created_at', { ascending: false });
            
            if (data) setReviews(data);
            setLoading(false);
        };
        fetchReviews();
    }, []);

    if (reviews.length === 0) return null;

    return (
        <section className="bg-stone-100 dark:bg-stone-900 py-24">
            <div className="mx-auto max-w-7xl px-6 lg:px-8">
                <div className="mx-auto max-w-2xl text-center mb-16">
                    <h2 className="font-serif text-3xl font-bold tracking-tight text-stone-900 dark:text-white sm:text-4xl">
                        Community Masterpieces
                    </h2>
                    <p className="mt-4 text-lg leading-8 text-stone-600 dark:text-stone-400">
                        See what our artists have created.
                    </p>
                </div>
                <div className="mx-auto grid max-w-2xl grid-cols-1 gap-8 lg:mx-0 lg:max-w-none lg:grid-cols-3">
                    {reviews.map((review) => (
                        <div key={review.id} className="flex flex-col justify-between rounded-2xl bg-white dark:bg-stone-800 p-8 shadow-sm ring-1 ring-stone-200 dark:ring-stone-700">
                            <div>
                                <div className="flex items-center gap-x-4 text-xs">
                                    <time dateTime={review.created_at} className="text-stone-500">
                                        {new Date(review.created_at).toLocaleDateString()}
                                    </time>
                                    <span className="relative z-10 rounded-full bg-stone-50 dark:bg-stone-700 px-3 py-1.5 font-medium text-stone-600 dark:text-stone-300 hover:bg-stone-100">
                                        {review.products?.title}
                                    </span>
                                </div>
                                <div className="group relative">
                                    <div className="flex items-center gap-1 mt-4 text-yellow-400">
                                        {[...Array(5)].map((_, i) => (
                                            <Star key={i} className={`h-4 w-4 ${i < review.rating ? 'fill-current' : 'text-stone-200'}`} />
                                        ))}
                                    </div>
                                    <p className="mt-5 text-sm leading-6 text-stone-600 dark:text-stone-300 line-clamp-3">
                                        "{review.comment}"
                                    </p>
                                </div>
                            </div>
                            <div className="relative mt-8 flex items-center gap-x-4">
                                {review.image_url ? (
                                    <img src={review.image_url} alt="" className="h-10 w-10 rounded-full bg-stone-100 object-cover" />
                                ) : (
                                    <div className="h-10 w-10 rounded-full bg-stone-100 flex items-center justify-center text-stone-500">
                                        <Quote className="h-5 w-5" />
                                    </div>
                                )}
                                <div className="text-sm leading-6">
                                    <p className="font-semibold text-stone-900 dark:text-white">
                                        <span className="absolute inset-0" />
                                        {review.author_name}
                                    </p>
                                    <p className="text-stone-600 dark:text-stone-400">{review.is_verified ? 'Verified Artist' : 'Reviewer'}</p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
