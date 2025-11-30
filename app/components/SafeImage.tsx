'use client';

import Image, { ImageProps } from 'next/image';
import { useState } from 'react';
import { Image as ImageIcon } from 'lucide-react';

export default function SafeImage(props: ImageProps) {
    const [error, setError] = useState(false);
    const { src, ...rest } = props;

    if (error || !src) {
        return (
            <div className={`flex items-center justify-center bg-stone-100 text-stone-400 ${props.className}`}>
                <ImageIcon className="h-8 w-8 opacity-50" />
            </div>
        );
    }

    return (
        <Image
            src={src}
            {...rest}
            onError={() => setError(true)}
        />
    );
}
