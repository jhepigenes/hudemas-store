
'use client';
import { useEffect } from 'react';
import { createClient } from '@/lib/supabase';
import { useRouter, usePathname } from 'next/navigation';

export default function OnboardingCheck() {
    const router = useRouter();
    const pathname = usePathname();
    const supabase = createClient();

    useEffect(() => {
        const checkProfile = async () => {
            // Skip check for admin routes or auth pages
            if (pathname?.startsWith('/admin') || pathname?.startsWith('/login') || pathname?.startsWith('/signup')) return;
            
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) return;

            // Don't check if already on profile
            if (pathname === '/profile') return;

            const { data: profile } = await supabase
                .from('profiles')
                .select('address, phone, full_name')
                .eq('id', session.user.id)
                .single();

            // Basic check: must have full_name and phone. Address optional? 
            // Feedback says "kundendaten... pflichtfelder". Let's enforce all.
            if (profile && (!profile.address || !profile.phone || !profile.full_name)) {
                router.push('/profile?onboarding=true');
            }
        };

        // Debounce or just run? Run is fine for now, Supabase client handles caching of session.
        checkProfile();
    }, [pathname, router, supabase]);

    return null;
}
