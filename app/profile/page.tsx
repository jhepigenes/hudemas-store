'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { User, Mail, MapPin, Save } from 'lucide-react';

export default function ProfilePage() {
    const supabase = createClient();
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [profile, setProfile] = useState({
        fullName: '',
        email: '',
        phone: '',
        bio: '',
        location: ''
    });

    useEffect(() => {
        const getProfile = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                router.push('/login');
                return;
            }

            setProfile(prev => ({ ...prev, email: user.email || '' }));

            // Fetch extended profile from 'artists' table if exists, or 'profiles' if you have one
            // Assuming 'artists' is the user profile table for now given previous context
            const { data: artist } = await supabase
                .from('artists')
                .select('*')
                .eq('id', user.id)
                .single();

            if (artist) {
                setProfile(prev => ({
                    ...prev,
                    fullName: artist.full_name || '',
                    bio: artist.bio || '',
                    // location isn't in schema yet, ignoring or mocking
                }));
            } else {
                // If no artist profile, maybe check metadata
                setProfile(prev => ({
                    ...prev,
                    fullName: user.user_metadata?.full_name || ''
                }));
            }
            setLoading(false);
        };
        getProfile();
    }, []);

    const handleSave = async () => {
        setSaving(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('No user');

            // Update 'artists' table - treating every user as potential artist
            const { error } = await supabase
                .from('artists')
                .upsert({
                    id: user.id,
                    full_name: profile.fullName,
                    bio: profile.bio,
                    status: 'pending' // Ensure they exist
                });

            if (error) throw error;
            alert('Profile updated!');
        } catch (error) {
            console.error('Error updating profile:', error);
            alert('Failed to update profile.');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-stone-50 dark:bg-stone-950">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-stone-900 dark:border-white"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-stone-50 dark:bg-stone-950 pt-32 pb-20">
            <div className="max-w-3xl mx-auto px-6">
                <h1 className="font-serif text-3xl text-stone-900 dark:text-white mb-2">My Profile</h1>
                <p className="text-stone-500 mb-8">Manage your personal information and artist bio.</p>

                <div className="bg-white dark:bg-stone-900 rounded-2xl shadow-sm border border-stone-200 dark:border-stone-800 overflow-hidden">
                    {/* Header / Cover Mock */}
                    <div className="h-32 bg-stone-200 dark:bg-stone-800 w-full"></div>
                    
                    <div className="px-8 pb-8">
                        <div className="relative -mt-12 mb-6">
                            <div className="h-24 w-24 rounded-full border-4 border-white dark:border-stone-900 bg-stone-300 flex items-center justify-center text-stone-500 text-xl font-bold">
                                {profile.fullName?.[0] || 'U'}
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-2">Full Name</label>
                                <div className="relative">
                                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
                                    <input 
                                        type="text" 
                                        value={profile.fullName}
                                        onChange={e => setProfile({...profile, fullName: e.target.value})}
                                        className="pl-10 w-full rounded-lg border-stone-200 bg-stone-50 py-2.5 text-stone-900 focus:ring-stone-900 dark:bg-stone-800 dark:border-stone-700 dark:text-white"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-2">Email</label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
                                    <input 
                                        type="email" 
                                        value={profile.email}
                                        disabled
                                        className="pl-10 w-full rounded-lg border-stone-200 bg-stone-100 py-2.5 text-stone-500 cursor-not-allowed dark:bg-stone-800/50 dark:border-stone-700"
                                    />
                                </div>
                            </div>

                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-2">Artist Bio</label>
                                <textarea 
                                    rows={4}
                                    value={profile.bio}
                                    onChange={e => setProfile({...profile, bio: e.target.value})}
                                    placeholder="Tell collectors about your journey..."
                                    className="w-full rounded-lg border-stone-200 bg-stone-50 py-2.5 px-4 text-stone-900 focus:ring-stone-900 dark:bg-stone-800 dark:border-stone-700 dark:text-white"
                                />
                            </div>
                        </div>

                        <div className="mt-8 flex justify-end">
                            <button 
                                onClick={handleSave}
                                disabled={saving}
                                className="flex items-center gap-2 rounded-full bg-stone-900 px-6 py-2.5 text-white hover:bg-stone-800 disabled:opacity-50 dark:bg-white dark:text-stone-900"
                            >
                                {saving ? 'Saving...' : <><Save className="h-4 w-4" /> Save Changes</>}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
