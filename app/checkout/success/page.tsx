'use client';

import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { CheckCircle } from 'lucide-react';
import { Suspense } from 'react';

function SuccessContent() {
    const searchParams = useSearchParams();
    const orderId = searchParams.get('orderId');

    return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-stone-50 px-4 text-center dark:bg-stone-950">
            <div className="rounded-full bg-green-100 p-6 dark:bg-green-900/30">
                <CheckCircle className="h-16 w-16 text-green-600 dark:text-green-400" />
            </div>
            
            <h1 className="mt-8 font-serif text-4xl font-medium text-stone-900 dark:text-white">
                Order Confirmed!
            </h1>
            
            <p className="mt-4 max-w-md text-lg text-stone-600 dark:text-stone-400">
                Thank you for your purchase. Your order has been successfully placed.
            </p>

            <div className="mt-8 w-full max-w-sm rounded-lg border border-stone-200 bg-white p-6 shadow-sm dark:border-stone-800 dark:bg-stone-900">
                <p className="text-sm text-stone-500 dark:text-stone-400">Order Reference</p>
                <p className="font-mono text-xl font-bold text-stone-900 dark:text-white">{orderId || 'Loading...'}</p>
                
                <div className="my-4 border-t border-stone-100 dark:border-stone-800" />
                
                <p className="text-sm text-stone-500 dark:text-stone-400">Status</p>
                <p className="font-medium text-green-600 dark:text-green-400">Processing & AWB Generated</p>
            </div>

            <div className="mt-10 space-y-4">
                <p className="text-sm text-stone-500">
                    A confirmation email has been sent to your inbox.
                </p>
                <Link 
                    href="/"
                    className="inline-block rounded-full bg-stone-900 px-8 py-3 text-sm font-medium text-white hover:bg-stone-800 dark:bg-white dark:text-stone-900"
                >
                    Continue Shopping
                </Link>
            </div>
        </div>
    );
}

export default function SuccessPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <SuccessContent />
        </Suspense>
    );
}
