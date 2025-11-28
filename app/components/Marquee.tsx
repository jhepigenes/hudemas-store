'use client';

import { motion } from 'framer-motion';

export default function Marquee() {
    return (
        <div className="relative flex w-full overflow-hidden bg-stone-100 py-3 text-stone-900">
            <div className="flex whitespace-nowrap">
                <motion.div
                    animate={{ x: [0, -1000] }}
                    transition={{
                        repeat: Infinity,
                        ease: "linear",
                        duration: 20,
                    }}
                    className="flex gap-8"
                >
                    {[...Array(10)].map((_, i) => (
                        <div key={i} className="flex items-center gap-8">
                            <span className="font-serif text-sm font-medium tracking-widest uppercase">
                                Handcrafted Heritage
                            </span>
                            <span className="h-1.5 w-1.5 rounded-full bg-stone-400" />
                            <span className="font-serif text-sm font-medium tracking-widest uppercase">
                                Black Friday Sale
                            </span>
                            <span className="h-1.5 w-1.5 rounded-full bg-stone-400" />
                            <span className="font-serif text-sm font-medium tracking-widest uppercase">
                                Authentic Gobelins
                            </span>
                            <span className="h-1.5 w-1.5 rounded-full bg-stone-400" />
                        </div>
                    ))}
                </motion.div>
            </div>
        </div>
    );
}
