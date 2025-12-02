'use client';

import { usePathname } from 'next/navigation';
import Script from 'next/script';
import { useEffect, useState } from 'react';

export default function FacebookPixel() {
  const [pixelId, setPixelId] = useState<string | null>(null);
  const pathname = usePathname();

  useEffect(() => {
    // In a real app, you might fetch this from Supabase settings
    // For now, we check env var or default placeholder
    setPixelId(process.env.NEXT_PUBLIC_FACEBOOK_PIXEL_ID || null);
  }, []);

  useEffect(() => {
    if (pixelId) {
      import('react-facebook-pixel')
        .then((x) => x.default)
        .then((ReactPixel) => {
          ReactPixel.init(pixelId);
          ReactPixel.pageView();
        });
    }
  }, [pathname, pixelId]);

  if (!pixelId) return null;

  return null;
}
