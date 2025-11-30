'use client';

import { motion, useScroll, useTransform } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import { useRef } from 'react';
import { ArrowDown } from 'lucide-react';
import { useLanguage } from '@/app/context/LanguageContext';

export default function Hero() {
    const { t } = useLanguage();
    const ref = useRef(null);
    const { scrollYProgress } = useScroll({
        target: ref,
        offset: ["start start", "end start"]
    });

    const y = useTransform(scrollYProgress, [0, 1], ["0%", "50%"]);
    const opacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1,
                delayChildren: 0.3
            }
        }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: {
            opacity: 1,
            y: 0,
            transition: {
                duration: 0.8,
                ease: [0.2, 0.65, 0.3, 0.9] as const
            }
        }
    };

    return (
        <section ref={ref} className="relative h-screen w-full overflow-hidden bg-stone-900">
            {/* Background with Parallax & Ken Burns Effect */}
            <div className="absolute inset-0 -z-10 overflow-hidden">
                <motion.div
                    style={{ y }}
                    className="relative h-[120%] w-full -top-[10%]"
                >
                    <motion.div
                        initial={{ scale: 1.1 }}
                        animate={{ scale: 1 }}
                        transition={{ duration: 20, ease: "linear", repeat: Infinity, repeatType: "reverse" }}
                        className="relative h-full w-full"
                    >
                        <Image
                            src="https://images.unsplash.com/photo-1624526267942-ab0ff8a3e972?q=80&w=2667&auto=format&fit=crop"
                            alt="Hudemas Gobelin Art"
                            fill
                            className="object-cover brightness-[0.6]"
                            priority
                            sizes="100vw"
                        />
                    </motion.div>
                </motion.div>
                <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-stone-900/90" />
            </div>

            <div className="relative z-10 mx-auto flex h-full max-w-5xl flex-col items-center justify-center px-4 text-center sm:px-6 lg:px-8">
                <motion.div
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                >
                    <motion.h1 variants={itemVariants} className="font-serif text-5xl font-medium tracking-tight text-white sm:text-7xl md:text-8xl">
                        {t.hero.title1}
                    </motion.h1>
                    <motion.h1 variants={itemVariants} className="font-serif text-5xl font-medium italic tracking-tight text-stone-200 sm:text-7xl md:text-8xl mt-2">
                        {t.hero.title2}
                    </motion.h1>

                    <motion.div variants={itemVariants} className="mt-8 flex justify-center">
                        <div className="h-px w-24 bg-white/50" />
                    </motion.div>

                    <motion.p variants={itemVariants} className="mx-auto mt-8 max-w-2xl text-lg font-light text-stone-300 sm:text-xl leading-relaxed">
                        {t.hero.subtitle}
                    </motion.p>

                    <motion.div variants={itemVariants} className="mt-12 flex flex-col sm:flex-row justify-center gap-6">
                        <Link
                            href="#collection"
                            className="group relative overflow-hidden rounded-full bg-white px-10 py-4 text-sm font-medium tracking-widest text-stone-900 transition-all hover:bg-stone-200"
                        >
                            <span className="relative z-10 uppercase">{t.hero.explore}</span>
                        </Link>
                        <Link
                            href="/about"
                            className="group rounded-full border border-white/30 bg-white/5 px-10 py-4 text-sm font-medium tracking-widest text-white backdrop-blur-sm transition-all hover:bg-white/10 hover:border-white/50"
                        >
                            <span className="uppercase">{t.hero.story}</span>
                        </Link>
                    </motion.div>
                </motion.div>
            </div>

            {/* Scroll Indicator */}
            <motion.div
                style={{ opacity }}
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.5, duration: 1 }}
                className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-white/60"
            >
                <span className="text-[10px] uppercase tracking-widest">{t.hero.scroll}</span>
                <motion.div
                    animate={{ y: [0, 8, 0] }}
                    transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                >
                    <ArrowDown className="h-5 w-5" />
                </motion.div>
            </motion.div>
        </section>
    );
}
