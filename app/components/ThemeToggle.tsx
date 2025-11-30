'use client';

import * as React from 'react';
import { Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';
import { motion } from 'framer-motion';

export function ThemeToggle() {
    const { setTheme, resolvedTheme } = useTheme();
    const [mounted, setMounted] = React.useState(false);

    React.useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) {
        return null;
    }

    return (
        <button
            onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
            className="relative p-2 rounded-full hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
            aria-label="Toggle theme"
        >
            <motion.div
                initial={false}
                animate={{
                    scale: resolvedTheme === 'dark' ? 0 : 1,
                    rotate: resolvedTheme === 'dark' ? 90 : 0,
                }}
                transition={{ duration: 0.2 }}
                className="absolute top-2 left-2"
            >
                <Sun className="h-5 w-5 text-current" />
            </motion.div>
            <motion.div
                initial={false}
                animate={{
                    scale: resolvedTheme === 'dark' ? 1 : 0,
                    rotate: resolvedTheme === 'dark' ? 0 : -90,
                }}
                transition={{ duration: 0.2 }}
            >
                <Moon className="h-5 w-5 text-current" />
            </motion.div>
            {/* Invisible spacer to maintain size */}
            <div className="w-5 h-5 opacity-0" />
        </button>
    );
}
