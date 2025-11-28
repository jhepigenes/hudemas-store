'use client';

import Image, { ImageProps } from 'next/image';
import { useState } from 'react';
import { Image as ImageIcon } from 'lucide-react';

export default function SafeImage(props: ImageProps) {
    const [error, setError] = useState(false);

    if (error) {
        return (
            <div className={`flex items-center justify-center bg-stone-100 text-stone-400 ${props.className}`}>
                <ImageIcon className="h-8 w-8 opacity-50" />
            </div>
        );
    }

    return (
        <Image
            {...props}
            onError={() => setError(true)}
        />
    );
}
