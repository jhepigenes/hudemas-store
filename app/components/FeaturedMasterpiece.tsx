'use client';

import { motion, useScroll, useTransform } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import { useRef } from 'react';

export default function FeaturedMasterpiece() {
    const ref = useRef(null);
    const { scrollYProgress } = useScroll({
        target: ref,
        offset: ["start end", "end start"]
    });

    const y = useTransform(scrollYProgress, [0, 1], ["0%", "20%"]);
    const opacity = useTransform(scrollYProgress, [0, 0.2, 0.8, 1], [0, 1, 1, 0]);

    return (
        <section ref={ref} className="relative overflow-hidden py-32">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                <div className="grid grid-cols-1 gap-16 lg:grid-cols-2 lg:items-center">
                    {/* Text Content */}
                    <motion.div
                        style={{ opacity }}
                        className="relative z-10 order-2 lg:order-1"
                    >
                        <span className="mb-4 block font-sans text-sm font-bold uppercase tracking-[0.2em] text-stone-500 dark:text-stone-400">
                            Masterpiece of the Month
                        </span>
                        <h2 className="mb-6 font-serif text-5xl leading-tight text-stone-900 dark:text-stone-50 md:text-6xl">
                            Dusk <br />
                            <span className="italic text-stone-600 dark:text-stone-300">by Alphonse Mucha</span>
                        </h2>
                        <p className="mb-8 max-w-lg text-lg leading-relaxed text-stone-600 dark:text-stone-300">
                            A masterpiece of Art Nouveau, capturing the ethereal beauty of twilight. This intricate Gobelin tapestry features 22 distinct colors, weaving a tale of elegance and melancholy.
                        </p>
                        <div className="flex flex-col gap-4 sm:flex-row">
                            <Link
                                href="/product/iarna"
                                className="group relative overflow-hidden rounded-full bg-stone-900 dark:bg-stone-50 px-8 py-4 text-white dark:text-stone-900 transition-all hover:bg-stone-800 dark:hover:bg-stone-200"
                            >
                                <span className="relative z-10 font-medium tracking-wide">View Details</span>
                                <div className="absolute inset-0 -translate-x-full bg-white/20 transition-transform duration-500 group-hover:translate-x-0" />
                            </Link>
                        </div>
                    </motion.div>

                    {/* Image with Parallax */}
                    <div className="relative order-1 aspect-[4/5] overflow-hidden rounded-2xl lg:order-2">
                        <motion.div style={{ y }} className="absolute inset-0 h-[120%] w-full">
                            <Image
                                src="https://www.hudemas.ro/assets/images/products/large/goblen-hudemas-760-melancholy-492.jpg"
                                alt="Dusk by Alphonse Mucha"
                                fill
                                className="object-cover"
                                sizes="(max-width: 768px) 100vw, 50vw"
                                unoptimized
                            />
                        </motion.div>
                        {/* Decorative Frame */}
                        <div className="pointer-events-none absolute inset-4 border border-white/30" />
                    </div>
                </div>
            </div>

            {/* Background Decor */}
            <div className="absolute right-0 top-1/2 -z-10 h-[600px] w-[600px] -translate-y-1/2 translate-x-1/3 rounded-full bg-stone-200/50 blur-[100px]" />
        </section>
    );
}
