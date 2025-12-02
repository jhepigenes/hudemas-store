'use client';

import { useEffect, useState } from 'react';
import { motion, useMotionValue, useSpring } from 'framer-motion';

export default function CustomCursor() {
    const [isHovering, setIsHovering] = useState(false);
    const cursorX = useMotionValue(-100);
    const cursorY = useMotionValue(-100);

    // Tighter, snappier physics to remove "rubbery" lag
    // High stiffness = fast response. Critical damping = no wobble.
    const springConfig = { damping: 40, stiffness: 800 };
    const cursorXSpring = useSpring(cursorX, springConfig);
    const cursorYSpring = useSpring(cursorY, springConfig);

    useEffect(() => {
        const moveCursor = (e: MouseEvent) => {
            // Center the cursor (offset by half width/height of 12px -> 6px)
            cursorX.set(e.clientX - 6);
            cursorY.set(e.clientY - 6);
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
            className="pointer-events-none fixed left-0 top-0 z-[9999] hidden md:block rounded-full bg-white mix-blend-difference"
            style={{
                x: cursorXSpring,
                y: cursorYSpring,
                width: 12,
                height: 12,
            }}
            animate={{
                scale: isHovering ? 2.5 : 1,
                opacity: isHovering ? 0.5 : 1, // Fade out slightly when expanding to be less intrusive
            }}
            transition={{ duration: 0.3, ease: "easeOut" }}
        />
    );
}