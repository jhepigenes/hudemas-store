'use client';

import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { motion } from 'framer-motion';
import Image from 'next/image';

export default function About() {
    return (
        <div className="min-h-screen bg-stone-50 selection:bg-stone-900 selection:text-white">
            <Navbar />

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
                            A Legacy <span className="italic text-stone-500">Woven</span> in Time
                        </motion.h1>
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.8, delay: 0.2 }}
                            className="mt-8 text-xl font-light leading-relaxed text-stone-600"
                        >
                            <p>
                                From a small family workshop to a curator of fine textile art.
                                This is the story of Hudemas.
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
                            <h2 className="mb-6 font-serif text-3xl text-stone-900 md:text-4xl">The Origins</h2>
                            <div className="space-y-6 font-sans text-lg text-stone-600">
                                <p>
                                    The Hudemas story begins in <strong>Timisoara, Romania</strong>, with a profound passion for the visual arts. Though officially established in 1993, our journey in manufacturing gobelins dates back to <strong>1985</strong>.
                                </p>
                                <p>
                                    Founded on the principles of classical artistic training, our family business started not just as a workshop, but as a dedication to beauty. We envisioned a way to bring the grandeur of museum masterpieces into the intimacy of the home through the medium of the Gobelin.
                                </p>
                            </div>
                        </motion.div>
                        <div className="relative aspect-square overflow-hidden rounded-2xl bg-stone-200">
                            <Image 
                                src="https://images.unsplash.com/photo-1605218427368-35b476940a0e?q=80&w=1000&auto=format&fit=crop"
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
                                    src="https://images.unsplash.com/photo-1574625054254-80c1c6d3ceb0?q=80&w=1000&auto=format&fit=crop"
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
                                <h2 className="mb-6 font-serif text-3xl text-white md:text-4xl">A Family Affair</h2>
                                <div className="space-y-6 font-sans text-lg text-stone-300">
                                    <p>
                                        Art runs in our veins. It is a language spoken fluently at our dinner table.
                                    </p>
                                    <p>
                                        What began as one man's vision has naturally evolved into a shared family vocation. Today, Hudemas represents a collective dedication to the craft, where experience and new perspectives blend seamlessly.
                                    </p>
                                    <p>
                                        We work together with a singular purpose: to ensure that every kit we produce honors the tradition of the Gobelin while embracing the future. It is not just a business; it is our heritage, shared with you.
                                    </p>
                                </div>
                            </motion.div>
                        </div>
                    </div>
                </section>

                {/* The Craft */}
                <section className="mx-auto max-w-4xl px-4 py-24 text-center sm:px-6 lg:px-8">
                    <h2 className="mb-8 font-serif text-3xl text-stone-900 md:text-4xl">The Art of Patience</h2>
                    <p className="mx-auto max-w-2xl text-lg text-stone-600">
                        In a world of instant gratification, we champion the slow, meditative art of the Gobelin.
                        Each kit is a promise—a journey of thousands of stitches that culminates in a personal masterpiece.
                        We provide the finest threads and the most precise charts, but the magic... the magic comes from your hands.
                    </p>
                    <div className="mt-12 grid grid-cols-1 gap-8 sm:grid-cols-3">
                        {[
                            { title: 'Precision', desc: 'Computer-generated charts for flawless accuracy.' },
                            { title: 'Quality', desc: 'Premium threads that maintain their vibrancy for decades.' },
                            { title: 'Heritage', desc: 'Designs inspired by the world\'s greatest art movements.' }
                        ].map((item, i) => (
                            <div key={i} className="rounded-xl border border-stone-200 p-6">
                                <h3 className="mb-2 font-serif text-xl text-stone-900">{item.title}</h3>
                                <p className="text-sm text-stone-500">{item.desc}</p>
                            </div>
                        ))}
                    </div>
                </section>
            </main>

            <Footer />
        </div>
    );
}
