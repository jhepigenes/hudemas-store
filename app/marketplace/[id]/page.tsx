'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { ArrowLeft, ShoppingBag, ShieldCheck, Truck, User } from 'lucide-react';
import { createClient } from '@/lib/supabase';
import { useCurrency } from '@/app/context/CurrencyContext';
import { useCart } from '@/app/context/CartContext';
import Link from 'next/link';

export default function MarketplaceListingPage() {
    const params = useParams();
    const router = useRouter();
    const { id } = params;
    const supabase = createClient();
    const { formatPrice } = useCurrency();
    const { addItem } = useCart();

    const [listing, setListing] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchListing = async () => {
            if (!id) return;

            try {
                const { data, error } = await supabase
                    .from('marketplace_listings')
                    .select(`
                        *,
                        artists (
                            full_name,
                            id
                        )
                    `)
                    .eq('id', id)
                    .single();

                if (error) throw error;
                setListing(data);
            } catch (err) {
                console.error('Error fetching listing:', err);
                setError('Listing not found or unavailable.');
            } finally {
                setLoading(false);
            }
        };

        fetchListing();
    }, [id]);

    const handleAddToCart = () => {
        if (!listing) return;

        addItem({
            id: listing.id,
            name: listing.title,
            price: listing.price.toString(),
            currency: listing.currency || 'RON',
            image: listing.image_url,
            type: 'marketplace',
            artist_id: listing.artist_id,
            description: listing.description
        });
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-stone-50 dark:bg-stone-950">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-stone-900 dark:border-white"></div>
            </div>
        );
    }

    if (error || !listing) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-stone-50 dark:bg-stone-950 px-4">
                <h1 className="font-serif text-3xl text-stone-900 dark:text-white mb-4">Listing Not Found</h1>
                <p className="text-stone-600 dark:text-stone-400 mb-8">{error}</p>
                <Link
                    href="/marketplace/browse"
                    className="px-6 py-3 bg-stone-900 text-white rounded-full hover:bg-stone-800 transition-colors"
                >
                    Back to Marketplace
                </Link>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-stone-50 dark:bg-stone-950 pt-32 pb-12 px-4 sm:px-6 lg:px-8 transition-colors duration-300">
            <div className="max-w-7xl mx-auto">
                {/* Back Button */}
                <Link
                    href="/marketplace/browse"
                    className="inline-flex items-center gap-2 text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-white mb-8 transition-colors"
                >
                    <ArrowLeft className="w-5 h-5" />
                    Back to Collection
                </Link>

                <div className="grid lg:grid-cols-2 gap-12 lg:gap-24">
                    {/* Image Section */}
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="relative aspect-[4/5] bg-stone-200 dark:bg-stone-800 rounded-lg overflow-hidden shadow-xl"
                    >
                        {listing.image_url ? (
                            <Image
                                src={listing.image_url}
                                alt={listing.title}
                                fill
                                className="object-cover"
                                priority
                                unoptimized
                            />
                        ) : (
                            <div className="h-full w-full flex items-center justify-center text-stone-400">
                                No Image Available
                            </div>
                        )}
                        <div className="absolute top-6 left-6">
                            <span className="px-4 py-2 bg-white/90 dark:bg-stone-900/90 backdrop-blur text-xs uppercase tracking-widest font-bold text-stone-900 dark:text-white border border-stone-200 dark:border-stone-700 shadow-sm">
                                Unique Masterpiece
                            </span>
                        </div>
                    </motion.div>

                    {/* Details Section */}
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="flex flex-col justify-center"
                    >
                        <div className="mb-2 text-stone-500 dark:text-stone-400 font-sans text-sm uppercase tracking-wide">
                            Finished Gobelin Tapestry
                        </div>
                        <h1 className="font-serif text-4xl md:text-5xl text-stone-900 dark:text-white mb-4">
                            {listing.title}
                        </h1>

                        <div className="flex items-center gap-3 mb-8 pb-8 border-b border-stone-200 dark:border-stone-800">
                            <div className="h-10 w-10 rounded-full bg-stone-200 dark:bg-stone-800 flex items-center justify-center">
                                <User className="w-5 h-5 text-stone-600 dark:text-stone-400" />
                            </div>
                            <div>
                                <p className="text-sm text-stone-500 dark:text-stone-400">Stitched by</p>
                                <p className="font-medium text-stone-900 dark:text-white">
                                    {listing.artists?.full_name || 'Unknown Artist'}
                                </p>
                            </div>
                        </div>

                        <div className="mb-8">
                            <p className="text-3xl font-serif text-stone-900 dark:text-white">
                                {formatPrice(listing.price)}
                            </p>
                            <p className="text-sm text-stone-500 dark:text-stone-400 mt-1">
                                Includes authenticity certificate
                            </p>
                        </div>

                        <div className="prose prose-stone dark:prose-invert mb-8 max-w-none">
                            <p className="text-lg leading-relaxed text-stone-600 dark:text-stone-300">
                                {listing.description || "A beautiful, hand-stitched masterpiece created with precision and care. This unique piece represents hours of dedicated craftsmanship."}
                            </p>
                        </div>

                        <div className="space-y-4 mb-12">
                            <div className="flex items-center gap-3 text-stone-600 dark:text-stone-300">
                                <ShieldCheck className="w-5 h-5 text-green-600 dark:text-green-400" />
                                <span>Verified by Hudemas Experts</span>
                            </div>
                            <div className="flex items-center gap-3 text-stone-600 dark:text-stone-300">
                                <Truck className="w-5 h-5" />
                                <span>Secure Shipping & Insurance Included</span>
                            </div>
                        </div>

                        <button
                            onClick={handleAddToCart}
                            className="w-full md:w-auto inline-flex items-center justify-center gap-3 bg-stone-900 dark:bg-white text-white dark:text-stone-900 px-8 py-4 rounded-full font-medium text-lg hover:bg-stone-800 dark:hover:bg-stone-200 transition-all transform hover:scale-[1.02] active:scale-[0.98] shadow-lg"
                        >
                            <ShoppingBag className="w-5 h-5" />
                            Add to Cart
                        </button>
                    </motion.div>
                </div>
            </div>
        </div>
    );
}
