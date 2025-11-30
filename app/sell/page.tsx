'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, CheckCircle, ArrowRight, X, Image as ImageIcon, Info, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { useLanguage } from '@/app/context/LanguageContext';

export default function SellPage() {
    const supabase = createClient();
    const router = useRouter();
    const { t } = useLanguage();
    const [step, setStep] = useState(1);
    const [formData, setFormData] = useState({
        artistName: '',
        email: '',
        artTitle: '',
        price: '',
        description: '',
        image: null as File | null
    });
    // ... (rest of state) ...
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [dragActive, setDragActive] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null);

    // ... (useEffect and handlers) ...
    // Prefill user data if logged in
    useEffect(() => {
        const checkUser = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                setIsLoggedIn(true);
                setFormData(prev => ({
                    ...prev,
                    email: user.email || '',
                    artistName: user.user_metadata?.full_name || ''
                }));
            } else {
                setIsLoggedIn(false);
            }
        };
        checkUser();

        const { data: { subscription } } = supabase.auth.onAuthStateChange((event: string, session: any) => {
            if (event === 'SIGNED_IN' && session) {
                setIsLoggedIn(true);
                setFormData(prev => ({
                    ...prev,
                    email: session.user.email || '',
                    artistName: session.user.user_metadata?.full_name || ''
                }));
            } else if (event === 'SIGNED_OUT') {
                setIsLoggedIn(false);
            }
        });

        return () => subscription.unsubscribe();
    }, [supabase]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            handleFile(e.target.files[0]);
        }
    };

    const handleFile = (file: File) => {
        // Basic validation
        if (file.size > 5 * 1024 * 1024) {
            setError("File size must be less than 5MB");
            return;
        }
        setError(null);
        setFormData({ ...formData, image: file });
        const url = URL.createObjectURL(file);
        setPreviewUrl(url);
    };

    const handleDrag = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === "dragenter" || e.type === "dragover") {
            setDragActive(true);
        } else if (e.type === "dragleave") {
            setDragActive(false);
        }
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            handleFile(e.dataTransfer.files[0]);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setError(null);

        try {
            const { data: { user }, error: authError } = await supabase.auth.getUser();

            // Double check auth just in case
            if (authError || !user) {
                setIsLoggedIn(false);
                return;
            }

            if (!formData.image) {
                setError("Please upload an image of your artwork.");
                setIsSubmitting(false);
                return;
            }

            // 1. Ensure Artist Profile Exists
            const { error: artistError } = await supabase
                .from('artists')
                .upsert({
                    id: user.id,
                    full_name: formData.artistName,
                    status: 'pending'
                });

            if (artistError) throw artistError;

            // 2. Upload Image
            const fileExt = formData.image.name.split('.').pop();
            const fileName = `${user.id}/${Date.now()}.${fileExt}`;

            const { error: uploadError } = await supabase.storage
                .from('marketplace')
                .upload(fileName, formData.image);

            if (uploadError) throw uploadError;

            // Get Public URL
            const { data: { publicUrl } } = supabase.storage
                .from('marketplace')
                .getPublicUrl(fileName);

            // 3. Create Listing
            const { error: listingError } = await supabase
                .from('marketplace_listings')
                .insert({
                    user_id: user.id,
                    artist_id: user.id,
                    title: formData.artTitle,
                    price: parseFloat(formData.price),
                    description: formData.description,
                    image_url: publicUrl,
                    status: 'pending',
                    product_type: 'finished',
                    stock: 1,
                    currency: 'RON'
                });

            if (listingError) throw listingError;

            setStep(4); // Success step
        } catch (err: any) {
            console.error('Error submitting listing:', err);
            setError(err.message || "An error occurred while submitting your listing.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const clearImage = () => {
        setFormData({ ...formData, image: null });
        setPreviewUrl(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const variants = {
        enter: (direction: number) => ({
            x: direction > 0 ? 20 : -20,
            opacity: 0
        }),
        center: {
            zIndex: 1,
            x: 0,
            opacity: 1
        },
        exit: (direction: number) => ({
            zIndex: 0,
            x: direction < 0 ? 20 : -20,
            opacity: 0
        })
    };

    if (isLoggedIn === false) {
        return (
            <div className="min-h-screen bg-stone-50 dark:bg-stone-950 pt-32 pb-20 flex items-center justify-center px-4">
                <div className="max-w-md w-full bg-white dark:bg-stone-900 rounded-2xl shadow-xl p-8 text-center border border-stone-200 dark:border-stone-800">
                    <div className="mx-auto h-16 w-16 bg-stone-100 dark:bg-stone-800 rounded-full flex items-center justify-center mb-6">
                        <Info className="h-8 w-8 text-stone-900 dark:text-white" />
                    </div>
                    <h2 className="font-serif text-3xl text-stone-900 dark:text-white mb-4">{t.sell.joinTitle}</h2>
                    <p className="text-stone-600 dark:text-stone-400 mb-8">
                        {t.sell.joinText}
                    </p>
                    <div className="space-y-3">
                        <Link
                            href="/login?returnUrl=/sell"
                            className="block w-full rounded-full bg-stone-900 py-3 text-white font-medium hover:bg-stone-800 dark:bg-white dark:text-stone-900 transition-colors"
                        >
                            {t.sell.login}
                        </Link>
                        <Link
                            href="/signup?returnUrl=/sell"
                            className="block w-full rounded-full border border-stone-200 py-3 text-stone-900 font-medium hover:bg-stone-50 dark:border-stone-700 dark:text-white dark:hover:bg-stone-800 transition-colors"
                        >
                            {t.sell.createAccount}
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    if (isLoggedIn === null) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-stone-50 dark:bg-stone-950">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-stone-900 dark:border-white"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-stone-50 dark:bg-stone-950 pt-32 pb-20 transition-colors duration-300">
            <div className="mx-auto max-w-4xl px-6">
                <div className="mb-16 text-center">
                    <h1 className="font-serif text-4xl text-stone-900 dark:text-white md:text-6xl">
                        {t.sell.title}
                    </h1>
                    <p className="mt-4 text-lg text-stone-600 dark:text-stone-400 max-w-2xl mx-auto">
                        {t.sell.subtitle}
                    </p>
                </div>

                {/* Progress Steps */}
                <div className="mb-12 flex justify-center">
                    <div className="flex items-center gap-4">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="flex items-center">
                                <div className={`flex h-10 w-10 items-center justify-center rounded-full border-2 transition-colors duration-300 ${step >= i
                                    ? 'border-stone-900 bg-stone-900 text-white dark:border-white dark:bg-white dark:text-stone-900'
                                    : 'border-stone-300 text-stone-400 dark:border-stone-700 dark:text-stone-600'
                                    }`}>
                                    {step > i ? <CheckCircle className="h-5 w-5" /> : <span className="font-serif">{i}</span>}
                                </div>
                                {i < 3 && (
                                    <div className={`h-0.5 w-12 sm:w-24 transition-colors duration-300 ${step > i ? 'bg-stone-900 dark:bg-white' : 'bg-stone-200 dark:bg-stone-800'
                                        }`} />
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    {/* Form Section */}
                    <div className="lg:col-span-7">
                        <AnimatePresence mode="wait" initial={false}>
                            {step === 1 && (
                                <motion.div
                                    key="step1"
                                    initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                                    className="rounded-2xl bg-white p-8 shadow-sm border border-stone-100 dark:bg-stone-900 dark:border-stone-800"
                                >
                                    <h2 className="mb-6 font-serif text-2xl text-stone-900 dark:text-white">{t.sell.step1}</h2>
                                    <div className="space-y-6">
                                        <div>
                                            <label className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-2">{t.sell.fullName}</label>
                                            <input
                                                type="text"
                                                placeholder="e.g. Maria Popescu"
                                                className="w-full rounded-lg border-stone-200 bg-stone-50 px-4 py-3 text-stone-900 focus:border-stone-500 focus:ring-stone-500 dark:bg-stone-800 dark:border-stone-700 dark:text-white dark:placeholder:text-stone-500"
                                                value={formData.artistName}
                                                onChange={e => setFormData({ ...formData, artistName: e.target.value })}
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-2">Email</label>
                                            <input
                                                type="email"
                                                placeholder="email@example.com"
                                                className="w-full rounded-lg border-stone-200 bg-stone-50 px-4 py-3 text-stone-900 focus:border-stone-500 focus:ring-stone-500 dark:bg-stone-800 dark:border-stone-700 dark:text-white dark:placeholder:text-stone-500"
                                                value={formData.email}
                                                onChange={e => setFormData({ ...formData, email: e.target.value })}
                                            />
                                        </div>
                                        <button
                                            onClick={() => setStep(2)}
                                            disabled={!formData.artistName || !formData.email}
                                            className="mt-4 flex w-full items-center justify-center gap-2 rounded-full bg-stone-900 py-4 text-white hover:bg-stone-800 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-white dark:text-stone-900 transition-all"
                                        >
                                            {t.common.next} <ArrowRight className="h-4 w-4" />
                                        </button>
                                    </div>
                                </motion.div>
                            )}

                            {step === 2 && (
                                <motion.div
                                    key="step2"
                                    initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                                    className="rounded-2xl bg-white p-8 shadow-sm border border-stone-100 dark:bg-stone-900 dark:border-stone-800"
                                >
                                    <h2 className="mb-6 font-serif text-2xl text-stone-900 dark:text-white">{t.sell.step2}</h2>
                                    <div className="space-y-6">
                                        <div>
                                            <label className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-2">{t.sell.artTitle}</label>
                                            <input
                                                type="text"
                                                placeholder="e.g. Winter Sunset"
                                                className="w-full rounded-lg border-stone-200 bg-stone-50 px-4 py-3 text-stone-900 focus:border-stone-500 focus:ring-stone-500 dark:bg-stone-800 dark:border-stone-700 dark:text-white dark:placeholder:text-stone-500"
                                                value={formData.artTitle}
                                                onChange={e => setFormData({ ...formData, artTitle: e.target.value })}
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-2">{t.sell.askingPrice} (RON)</label>
                                            <div className="relative">
                                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-500">RON</span>
                                                <input
                                                    type="number"
                                                    placeholder="0.00"
                                                    className="w-full rounded-lg border-stone-200 bg-stone-50 pl-14 pr-4 py-3 text-stone-900 focus:border-stone-500 focus:ring-stone-500 dark:bg-stone-800 dark:border-stone-700 dark:text-white dark:placeholder:text-stone-500"
                                                    value={formData.price}
                                                    onChange={e => setFormData({ ...formData, price: e.target.value })}
                                                />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-2">{t.sell.description}</label>
                                            <textarea
                                                rows={4}
                                                placeholder="..."
                                                className="w-full rounded-lg border-stone-200 bg-stone-50 px-4 py-3 text-stone-900 focus:border-stone-500 focus:ring-stone-500 dark:bg-stone-800 dark:border-stone-700 dark:text-white dark:placeholder:text-stone-500"
                                                value={formData.description}
                                                onChange={e => setFormData({ ...formData, description: e.target.value })}
                                            />
                                        </div>
                                        <div className="flex gap-4 pt-4">
                                            <button
                                                onClick={() => setStep(1)}
                                                className="w-full rounded-full border border-stone-200 py-3 text-stone-600 hover:bg-stone-50 dark:border-stone-700 dark:text-stone-300 dark:hover:bg-stone-800 transition-colors"
                                            >
                                                {t.common.back}
                                            </button>
                                            <button
                                                onClick={() => setStep(3)}
                                                disabled={!formData.artTitle || !formData.price}
                                                className="w-full rounded-full bg-stone-900 py-3 text-white hover:bg-stone-800 disabled:opacity-50 dark:bg-white dark:text-stone-900 transition-all"
                                            >
                                                {t.common.next}
                                            </button>
                                        </div>
                                    </div>
                                </motion.div>
                            )}

                            {step === 3 && (
                                <motion.div
                                    key="step3"
                                    initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                                    className="rounded-2xl bg-white p-8 shadow-sm border border-stone-100 dark:bg-stone-900 dark:border-stone-800"
                                >
                                    <h2 className="mb-2 font-serif text-2xl text-stone-900 dark:text-white">{t.sell.step3}</h2>
                                    <p className="mb-6 text-sm text-stone-500 dark:text-stone-400">High-quality photos increase your chances of selling.</p>

                                    <div className="space-y-6">
                                        <div
                                            className={`relative flex w-full items-center justify-center rounded-xl border-2 border-dashed transition-all duration-200 ${dragActive
                                                ? 'border-stone-900 bg-stone-50 dark:border-white dark:bg-stone-800'
                                                : 'border-stone-200 bg-stone-50/50 dark:border-stone-700 dark:bg-stone-800/50'
                                                }`}
                                            onDragEnter={handleDrag}
                                            onDragLeave={handleDrag}
                                            onDragOver={handleDrag}
                                            onDrop={handleDrop}
                                        >
                                            {previewUrl ? (
                                                <div className="relative h-64 w-full overflow-hidden rounded-xl">
                                                    <img src={previewUrl} alt="Preview" className="h-full w-full object-cover" />
                                                    <button
                                                        onClick={clearImage}
                                                        className="absolute right-4 top-4 rounded-full bg-white/90 p-2 text-stone-900 shadow-sm hover:bg-white transition-colors"
                                                    >
                                                        <X className="h-5 w-5" />
                                                    </button>
                                                </div>
                                            ) : (
                                                <label className="flex h-64 w-full cursor-pointer flex-col items-center justify-center p-6 text-center">
                                                    <div className="mb-4 rounded-full bg-stone-100 p-4 dark:bg-stone-800">
                                                        <Upload className="h-8 w-8 text-stone-500 dark:text-stone-400" />
                                                    </div>
                                                    <p className="mb-2 text-sm font-medium text-stone-900 dark:text-white">
                                                        <span className="underline">{t.sell.upload}</span>
                                                    </p>
                                                    <p className="text-xs text-stone-500 dark:text-stone-400">
                                                        PNG, JPG or WEBP (MAX. 5MB)
                                                    </p>
                                                    <input
                                                        ref={fileInputRef}
                                                        type="file"
                                                        className="hidden"
                                                        accept="image/*"
                                                        onChange={handleFileChange}
                                                    />
                                                </label>
                                            )}
                                        </div>

                                        {error && (
                                            <div className="mb-4 rounded-lg bg-red-50 p-4 text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400 flex items-center gap-2">
                                                <AlertCircle className="h-4 w-4" />
                                                {error}
                                            </div>
                                        )}

                                        <div className="flex gap-4 pt-4">
                                            <button
                                                onClick={() => setStep(2)}
                                                className="w-full rounded-full border border-stone-200 py-3 text-stone-600 hover:bg-stone-50 dark:border-stone-700 dark:text-stone-300 dark:hover:bg-stone-800 transition-colors"
                                            >
                                                {t.common.back}
                                            </button>
                                            <button
                                                onClick={handleSubmit}
                                                disabled={!formData.image || isSubmitting}
                                                className="w-full rounded-full bg-stone-900 py-3 text-white hover:bg-stone-800 disabled:opacity-50 dark:bg-white dark:text-stone-900 transition-all"
                                            >
                                                {isSubmitting ? (
                                                    <span className="flex items-center justify-center gap-2">
                                                        <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/20 border-t-white" />
                                                        Submitting...
                                                    </span>
                                                ) : t.sell.submitReview}
                                            </button>
                                        </div>
                                    </div>
                                </motion.div>
                            )}

                            {step === 4 && (
                                <motion.div
                                    key="step4"
                                    initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                                    className="rounded-2xl bg-white p-12 text-center shadow-sm border border-stone-100 dark:bg-stone-900 dark:border-stone-800"
                                >
                                    <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400">
                                        <CheckCircle className="h-10 w-10" />
                                    </div>
                                    <h2 className="font-serif text-3xl text-stone-900 dark:text-white">{t.sell.successTitle}</h2>
                                    <p className="mt-4 text-stone-500 dark:text-stone-400 max-w-md mx-auto">
                                        {t.sell.successText}
                                    </p>
                                    <div className="mt-8 flex justify-center gap-4">
                                        <Link href="/" className="rounded-full border border-stone-200 px-8 py-3 text-stone-600 hover:bg-stone-50 dark:border-stone-700 dark:text-stone-300 dark:hover:bg-stone-800">
                                            {t.nav.home}
                                        </Link>
                                        <Link href="/marketplace" className="rounded-full bg-stone-900 px-8 py-3 text-white hover:bg-stone-800 dark:bg-white dark:text-stone-900">
                                            {t.common.view} Marketplace
                                        </Link>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* Live Preview Side Panel (Desktop only) */}
                    {step < 4 && (
                        <div className="hidden lg:col-span-5 lg:block">
                            <div className="sticky top-32">
                                <h3 className="mb-4 font-serif text-lg text-stone-900 dark:text-white">{t.sell.preview}</h3>
                                <div className="overflow-hidden rounded-xl border border-stone-200 bg-white shadow-sm dark:border-stone-800 dark:bg-stone-900">
                                    <div className="aspect-[4/5] w-full bg-stone-100 dark:bg-stone-800 relative flex items-center justify-center overflow-hidden">
                                        {previewUrl ? (
                                            <img src={previewUrl} alt="Preview" className="h-full w-full object-cover" />
                                        ) : (
                                            <div className="flex flex-col items-center text-stone-400">
                                                <ImageIcon className="h-12 w-12 mb-2 opacity-50" />
                                                <span className="text-sm">Upload artwork</span>
                                            </div>
                                        )}
                                    </div>
                                    <div className="p-6">
                                        <div className="mb-2 flex items-start justify-between">
                                            <div>
                                                <h4 className="font-serif text-xl text-stone-900 dark:text-white">
                                                    {formData.artTitle || 'Untitled Masterpiece'}
                                                </h4>
                                                <p className="text-sm text-stone-500">{formData.artistName || 'Artist Name'}</p>
                                            </div>
                                            <p className="font-medium text-stone-900 dark:text-white">
                                                {formData.price ? `${Number(formData.price).toFixed(2)} RON` : t.common.price}
                                            </p>
                                        </div>
                                        <p className="line-clamp-3 text-sm text-stone-600 dark:text-stone-400">
                                            {formData.description || 'Description will appear here...'}
                                        </p>
                                    </div>
                                </div>
                                <div className="mt-6 rounded-lg bg-stone-50 p-4 text-sm text-stone-500 dark:bg-stone-900/50 flex gap-3 border border-stone-100 dark:border-stone-800">
                                    <Info className="h-5 w-5 shrink-0" />
                                    <p>Your listing will be reviewed for quality and authenticity before going live on the marketplace.</p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
