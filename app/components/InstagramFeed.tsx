'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';
import { Instagram } from 'lucide-react';

const INSTAGRAM_POSTS = [
    {
        id: 1,
        src: '/images/instagram/post1.jpg',
        alt: 'Hudemas Gobelin Art',
        caption: 'Discover the art of Gobelin. #Hudemas #Handmade'
    },
    {
        id: 2,
        src: '/images/instagram/post2.jpg',
        alt: 'New Collection',
        caption: 'Fresh designs for your next project. #Embroidery #Craft'
    },
    {
        id: 3,
        src: '/images/instagram/post3.jpg',
        alt: 'Detailed Stitching',
        caption: 'Quality in every stitch. #Needlepoint #Art'
    },
    {
        id: 4,
        src: '/images/instagram/post4.jpg',
        alt: 'Floral Patterns',
        caption: 'Bring nature into your home. #Floral #Decor'
    },
    {
        id: 5,
        src: '/images/instagram/post5.jpg',
        alt: 'Traditional Designs',
        caption: 'Preserving heritage through art. #Tradition #Romania'
    },
    {
        id: 6,
        src: '/images/instagram/post6.jpg',
        alt: 'Hudemas Workshop',
        caption: 'Created with passion. #Workshop #BehindTheScenes'
    }
];

export default function InstagramFeed() {
    return (
        <section className="bg-white py-24">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                <div className="mb-12 flex flex-col items-center text-center">
                    <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-stone-100 text-stone-900">
                        <Instagram className="h-6 w-6" />
                    </div>
                    <h2 className="font-serif text-3xl text-stone-900 md:text-4xl">Follow Our Journey</h2>
                    <p className="mt-4 text-lg text-stone-600">
                        Join our community of art lovers and creators.
                    </p>
                    <a
                        href="https://www.instagram.com/hudema.s/"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-stone-900 hover:text-stone-600 transition-colors"
                    >
                        @hudema.s
                    </a>
                </div>

                <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
                    {INSTAGRAM_POSTS.map((post, index) => (
                        <motion.div
                            key={post.id}
                            initial={{ opacity: 0, scale: 0.9 }}
                            whileInView={{ opacity: 1, scale: 1 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.5, delay: index * 0.1 }}
                            className="group relative aspect-square overflow-hidden rounded-lg bg-stone-100"
                        >
                            <Image
                                src={post.src}
                                alt={post.alt}
                                fill
                                className="object-cover transition-transform duration-500 group-hover:scale-110"
                                sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 16vw"
                            />
                            <div className="absolute inset-0 flex items-center justify-center bg-black/0 opacity-0 transition-all duration-300 group-hover:bg-black/40 group-hover:opacity-100">
                                <Instagram className="h-8 w-8 text-white" />
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
}
