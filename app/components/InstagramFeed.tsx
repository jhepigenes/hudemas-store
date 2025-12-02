'use client';

import Image from 'next/image';
import { Instagram } from 'lucide-react';

const INSTAGRAM_POSTS = [
    { id: 1, src: 'https://msepwdbzrzqotapgesnd.supabase.co/storage/v1/object/public/products/goblen-hudemas-023-vaza-cu-flori-526.jpg', link: 'https://www.instagram.com/hudema.s/' },
    { id: 2, src: 'https://msepwdbzrzqotapgesnd.supabase.co/storage/v1/object/public/products/goblen-hudemas-027-cocostarc-714.jpg', link: 'https://www.instagram.com/hudema.s/' },
    { id: 3, src: 'https://msepwdbzrzqotapgesnd.supabase.co/storage/v1/object/public/products/goblen-hudemas-024-doamna-in-mov-483.jpg', link: 'https://www.instagram.com/hudema.s/' },
    { id: 4, src: 'https://msepwdbzrzqotapgesnd.supabase.co/storage/v1/object/public/products/goblen-hudemas-431-pisicuta-cu-melc-346.jpg', link: 'https://www.instagram.com/hudema.s/' },
    { id: 5, src: 'https://msepwdbzrzqotapgesnd.supabase.co/storage/v1/object/public/products/goblen-hudemas-025-popas-la-camp-269.jpg', link: 'https://www.instagram.com/hudema.s/' },
    { id: 6, src: 'https://msepwdbzrzqotapgesnd.supabase.co/storage/v1/object/public/products/goblen-hudemas-012-hrist-663.jpg', link: 'https://www.instagram.com/hudema.s/' },
];

export default function InstagramFeed() {
    return (
        <section className="py-24 border-t border-stone-200 dark:border-stone-800">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex flex-col items-center text-center mb-12">
                    <div className="p-3 bg-stone-100 dark:bg-stone-800 rounded-full mb-4">
                        <Instagram className="h-6 w-6 text-stone-900 dark:text-white" />
                    </div>
                    <h2 className="font-serif text-3xl font-bold text-stone-900 dark:text-white mb-2">
                        @hudema.s
                    </h2>
                    <p className="text-stone-600 dark:text-stone-400 max-w-md">
                        Follow our journey in the studio. Tag your finished works with <span className="font-medium text-stone-900 dark:text-white">#HudemasArt</span> to be featured.
                    </p>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                    {INSTAGRAM_POSTS.map((post) => (
                        <a 
                            key={post.id} 
                            href={post.link}
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="group relative aspect-square overflow-hidden rounded-xl bg-stone-100 dark:bg-stone-800"
                        >
                            <Image
                                src={post.src}
                                alt="Instagram moment"
                                fill
                                className="object-cover transition-transform duration-500 group-hover:scale-110"
                            />
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300 flex items-center justify-center">
                                <Instagram className="text-white opacity-0 group-hover:opacity-100 transform scale-50 group-hover:scale-100 transition-all duration-300 h-8 w-8" />
                            </div>
                        </a>
                    ))}
                </div>
                
                <div className="mt-12 text-center">
                    <a 
                        href="https://www.instagram.com/hudema.s/" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 text-sm font-medium text-stone-900 dark:text-white hover:opacity-60 transition-opacity underline decoration-stone-300 underline-offset-4"
                    >
                        View full gallery on Instagram
                    </a>
                </div>
            </div>
        </section>
    );
}
