'use client';

import { Phone } from 'lucide-react';

export default function StickyPhone() {
    return (
        <a
            href="tel:+40722890794"
            className="fixed bottom-6 right-6 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-green-600 text-white shadow-lg transition-transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 md:hidden"
            aria-label="Call Us"
        >
            <Phone className="h-6 w-6" />
        </a>
    );
}
