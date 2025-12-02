'use client';

import { useEffect, useState } from 'react';
import { motion, useMotionValue, useSpring } from 'framer-motion';

export default function CustomCursor() {
    const [isHovering, setIsHovering] = useState(false);
    const cursorX = useMotionValue(-100);
    const cursorY = useMotionValue(-100);

    // Tighter, snappier physics to remove "rubbery" lag
    const springConfig = { damping: 40, stiffness: 800 };
    const cursorXSpring = useSpring(cursorX, springConfig);
    const cursorYSpring = useSpring(cursorY, springConfig);

    useEffect(() => {
        const moveCursor = (e: MouseEvent) => {
            // Center the cursor
            cursorX.set(e.clientX - 4); // Offset by half width (8px/2)
            cursorY.set(e.clientY - 4);
        };

        const handleMouseOver = (e: MouseEvent) => {
            const target = e.target as HTMLElement;
            if (
                target.tagName === 'BUTTON' ||
                target.tagName === 'A' ||
                target.closest('button') ||
                target.closest('a') ||
                target.classList.contains('cursor-pointer')
            ) {
                setIsHovering(true);
            } else {
                setIsHovering(false);
            }
        };

        window.addEventListener('mousemove', moveCursor);
        window.addEventListener('mouseover', handleMouseOver);

        return () => {
            window.removeEventListener('mousemove', moveCursor);
            window.removeEventListener('mouseover', handleMouseOver);
        };
    }, [cursorX, cursorY]);

    return (
        <motion.div
            className="pointer-events-none fixed left-0 top-0 z-[9999] hidden md:block rounded-full bg-stone-900/30 dark:bg-white/30 border border-stone-900 dark:border-white backdrop-blur-sm"
            style={{
                x: cursorXSpring,
                y: cursorYSpring,
                width: 8,
                height: 8,
            }}
            animate={{
                scale: isHovering ? 1.5 : 1,
            }}
            transition={{ duration: 0.15, ease: "easeOut" }}
        />
    );
}