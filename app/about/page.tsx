'use client';

export const dynamic = 'force-dynamic';

import { motion } from 'framer-motion';
import Image from 'next/image';
import { useLanguage } from '@/app/context/LanguageContext';
import InstagramFeed from '@/app/components/InstagramFeed';

export default function About() {
    const { t } = useLanguage();

    return (
        <div className="min-h-screen bg-stone-50 selection:bg-stone-900 selection:text-white">

            <main className="pt-32">
                {/* Hero Section */}
                <section className="relative px-4 py-20 sm:px-6 lg:px-8">
                    <div className="mx-auto max-w-4xl text-center">
                        <motion.h1
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.8 }}
                            className="font-serif text-5xl text-stone-900 md:text-7xl"
                        >
                            {t.about.legacyTitle}
                        </motion.h1>
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.8, delay: 0.2 }}
                            className="mt-8 text-xl font-light leading-relaxed text-stone-600"
                        >
                            <p>
                                {t.about.legacyText}
                            </p>
                        </motion.div>
                    </div>
                </section>

                {/* The Origins */}
                <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
                    <div className="grid grid-cols-1 gap-16 lg:grid-cols-2 lg:items-center">
                        <motion.div
                            initial={{ opacity: 0, x: -50 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.8 }}
                        >
                            <h2 className="mb-6 font-serif text-3xl text-stone-900 md:text-4xl">{t.about.originsTitle}</h2>
                            <div className="space-y-6 font-sans text-lg text-stone-600">
                                <p>
                                    {t.about.originsText1}
                                </p>
                                <p>
                                    {t.about.originsText2}
                                </p>
                            </div>
                        </motion.div>
                        <div className="relative h-[400px] overflow-hidden rounded-2xl md:h-full">
                            <Image
                                src="/images/hudemas_origins_1985.png"
                                alt="The Hudema Workshop"
                                fill
                                className="object-cover"
                                sizes="(max-width: 768px) 100vw, 50vw"
                            />
                            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-6">
                                <p className="font-serif italic text-white">The Hudema Workshop</p>
                                <p className="text-xs text-stone-200 mt-1 uppercase tracking-widest">Timisoara, 1985</p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* The Family */}
                <section className="bg-stone-900 py-24 text-white">
                    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                        <div className="grid grid-cols-1 gap-16 lg:grid-cols-2 lg:items-center">
                            <div className="order-2 lg:order-1 relative aspect-[4/3] overflow-hidden rounded-2xl bg-stone-800 border border-stone-700">
                                <Image
                                    src="/images/hudemas_family_tradition.png"
                                    alt="Hands sewing a masterpiece"
                                    fill
                                    className="object-cover opacity-80"
                                    sizes="(max-width: 768px) 100vw, 50vw"
                                />
                                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-6">
                                    <p className="font-serif italic text-white">A Family Tradition</p>
                                    <p className="text-xs text-stone-300 mt-1 uppercase tracking-widest">1993 - Present</p>
                                </div>
                            </div>
                            <motion.div
                                initial={{ opacity: 0, x: 50 }}
                                whileInView={{ opacity: 1, x: 0 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.8 }}
                                className="order-1 lg:order-2"
                            >
                                <h2 className="mb-6 font-serif text-3xl text-white md:text-4xl">{t.about.familyTitle}</h2>
                                <div className="space-y-6 font-sans text-lg text-stone-300">
                                    <p>
                                        {t.about.familyText1}
                                    </p>
                                    <p>
                                        {t.about.familyText2}
                                    </p>
                                    <p>
                                        {t.about.familyText3}
                                    </p>
                                </div>
                            </motion.div>
                        </div>
                    </div>
                </section>

                {/* The Craft */}
                <section className="mx-auto max-w-4xl px-4 py-24 text-center sm:px-6 lg:px-8">
                    <h2 className="mb-8 font-serif text-3xl text-stone-900 md:text-4xl">{t.about.craftTitle}</h2>
                    <p className="mx-auto max-w-2xl text-lg text-stone-600">
                        {t.about.craftText}
                    </p>
                    <div className="mt-12 grid grid-cols-1 gap-8 sm:grid-cols-3">
                        {[
                            { title: t.about.precision, desc: t.about.precisionDesc },
                            { title: t.about.quality, desc: t.about.qualityDesc },
                            { title: t.about.heritage, desc: t.about.heritageDesc }
                        ].map((item, i) => (
                            <div key={i} className="rounded-xl border border-stone-200 p-6">
                                <h3 className="mb-2 font-serif text-xl text-stone-900">{item.title}</h3>
                                <p className="text-sm text-stone-500">{item.desc}</p>
                            </div>
                        ))}
                    </div>
                </section>

                {/* Instagram Feed */}
                <InstagramFeed />
            </main>
        </div >
    );
}
