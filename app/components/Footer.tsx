'use client';

import Link from 'next/link';
import { Facebook, Instagram, Mail } from 'lucide-react';

export default function Footer() {
    return (
        <footer className="bg-stone-900 text-stone-400">
            <div className="mx-auto max-w-7xl px-6 py-16 lg:px-8">
                <div className="grid grid-cols-1 gap-12 lg:grid-cols-4">
                    {/* Brand */}
                    <div className="lg:col-span-2">
                        <Link href="/" className="font-serif text-2xl text-white">
                            HUDEMAS
                        </Link>
                        <p className="mt-4 max-w-sm text-sm leading-relaxed text-stone-400">
                            A family legacy of artistry, bringing handcrafted Gobelin tapestries to the modern world.
                            Curated with passion and precision.
                        </p>
                        <div className="mt-8 flex flex-col gap-4">
                            <div className="flex gap-6">
                                <a href="https://www.facebook.com/hudemas" target="_blank" rel="noopener noreferrer" className="text-stone-400 transition-colors hover:text-white">
                                    <span className="sr-only">Facebook</span>
                                    <Facebook className="h-5 w-5" />
                                </a>
                                <a href="mailto:office@hudemas.ro" className="text-stone-400 transition-colors hover:text-white">
                                    <span className="sr-only">Email</span>
                                    <Mail className="h-5 w-5" />
                                </a>
                            </div>
                            <p className="text-sm text-stone-400">
                                Order Support: <br />
                                <a href="tel:+40722890794" className="hover:text-white transition-colors">+40 722 890 794</a>
                            </p>
                        </div>
                    </div>

                    {/* Links */}
                    <div>
                        <h3 className="font-serif text-sm font-semibold text-white">Collection</h3>
                        <ul className="mt-4 space-y-3 text-sm">
                            <li>
                                <Link href="/" className="transition-colors hover:text-white">All Works</Link>
                            </li>
                            <li>
                                <Link href="/#collection" className="transition-colors hover:text-white">New Arrivals</Link>
                            </li>
                        </ul>
                    </div>

                    {/* Newsletter */}
                    <div>
                        <h3 className="font-serif text-sm font-semibold text-white">Stay Connected</h3>
                        <p className="mt-4 text-sm text-stone-400">
                            Join our community of Gobelin enthusiasts.
                        </p>
                        <form className="mt-4 flex gap-2" onSubmit={(e) => { e.preventDefault(); alert('Thank you for subscribing!'); }}>
                            <input
                                type="email"
                                placeholder="Enter your email"
                                className="w-full min-w-0 rounded-md border-0 bg-white/5 px-3.5 py-2 text-white shadow-sm ring-1 ring-inset ring-white/10 focus:ring-2 focus:ring-inset focus:ring-white sm:text-sm sm:leading-6"
                            />
                            <button
                                type="submit"
                                className="flex-none rounded-md bg-white px-3.5 py-2.5 text-sm font-semibold text-stone-900 shadow-sm hover:bg-stone-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
                            >
                                Subscribe
                            </button>
                        </form>
                    </div>
                </div>

                <div className="mt-16 border-t border-white/10 pt-8 text-center text-xs">
                    <p>&copy; {new Date().getFullYear()} Hudemas. All rights reserved.</p>
                </div>
            </div>
        </footer>
    );
}
