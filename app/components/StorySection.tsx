'use client';

import { motion } from 'framer-motion';

export default function StorySection() {
    return (
        <section className="bg-stone-50 py-24 md:py-32">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                <div className="grid grid-cols-1 gap-16 lg:grid-cols-2 lg:items-center">
                    {/* Text Content */}
                    <motion.div
                        initial={{ opacity: 0, x: -50 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.8 }}
                        className="order-2 lg:order-1"
                    >
                        <h2 className="mb-6 font-serif text-4xl text-stone-900 md:text-5xl">
                            A Lineage of Artists
                        </h2>
                        <div className="space-y-6 font-sans text-lg leading-relaxed text-stone-600">
                            <p>
                                Hudemas is not just a store; it is the culmination of generations dedicated to the visual arts.
                                Born from a family where art is a language spoken fluently by all—from the founder to his wife,
                                son, and daughter—every piece we offer carries the weight of this heritage.
                            </p>
                            <p>
                                With roots deeply planted in formal art education, we bring a trained eye and a passionate heart
                                to the world of Gobelins.
                            </p>
                            <div className="pt-4">
                                <a href="/about" className="group inline-flex items-center gap-2 font-serif text-lg italic text-stone-900 transition-colors hover:text-stone-600">
                                    <span>Read our full story</span>
                                    <span className="transition-transform duration-300 group-hover:translate-x-1">→</span>
                                </a>
                            </div>
                        </div>
                    </motion.div>

                    {/* Abstract/Artistic Visual */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.8 }}
                        className="order-1 flex items-center justify-center lg:order-2"
                    >
                        <div className="relative h-[500px] w-full max-w-md overflow-hidden rounded-t-full bg-stone-200">
                            {/* Placeholder for a family photo or artistic shot. Using a product for now but styled differently */}
                            <div className="absolute inset-0 bg-[url('https://www.hudemas.ro/assets/images/products/small/goblen-hudemas-008-doamna-care-citeste-250.jpg')] bg-cover bg-center opacity-80 mix-blend-multiply" />
                            <div className="absolute inset-0 bg-gradient-to-t from-stone-50 via-transparent to-transparent" />
                        </div>
                    </motion.div>
                </div>
            </div>
        </section>
    );
}
