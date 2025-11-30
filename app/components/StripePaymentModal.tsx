'use client';

import React, { useState } from 'react';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { motion } from 'framer-motion';
import { X } from 'lucide-react';

// Initialize Stripe outside of component to avoid recreation
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || '');

interface StripePaymentModalProps {
    clientSecret: string;
    orderId: string;
    isOpen: boolean;
    onSuccess: () => void;
    onCancel: () => void;
}

export default function StripePaymentModal({ clientSecret, orderId, isOpen, onSuccess, onCancel }: StripePaymentModalProps) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="w-full max-w-lg bg-white dark:bg-stone-950 rounded-lg shadow-xl overflow-hidden"
            >
                <div className="p-4 border-b border-stone-200 dark:border-stone-800 flex justify-between items-center">
                    <h3 className="font-serif text-lg font-medium text-stone-900 dark:text-white">Secure Payment</h3>
                    <button onClick={onCancel} className="text-stone-500 hover:text-stone-900 dark:text-stone-400 dark:hover:text-white">
                        <X className="h-5 w-5" />
                    </button>
                </div>
                <div className="p-6">
                    <Elements stripe={stripePromise} options={{ clientSecret, appearance: { theme: 'stripe' } }}>
                        <PaymentForm 
                            onSuccess={onSuccess} 
                            onCancel={onCancel} 
                            returnUrl={`${typeof window !== 'undefined' ? window.location.origin : ''}/checkout/success?orderId=${orderId}`}
                        />
                    </Elements>
                </div>
            </motion.div>
        </div>
    );
}

function PaymentForm({ onSuccess, onCancel, returnUrl }: { onSuccess: () => void, onCancel: () => void, returnUrl: string }) {
    const stripe = useStripe();
    const elements = useElements();
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();

        if (!stripe || !elements) {
            return;
        }

        setIsProcessing(true);

        const { error } = await stripe.confirmPayment({
            elements,
            confirmParams: {
                return_url: returnUrl,
            },
            redirect: 'if_required',
        });

        if (error) {
            setErrorMessage(error.message || 'An unexpected error occurred.');
            setIsProcessing(false);
        } else {
            onSuccess();
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <PaymentElement />
            {errorMessage && <div className="text-red-500 text-sm">{errorMessage}</div>}
            <div className="flex gap-4 mt-6">
                <button
                    type="button"
                    onClick={onCancel}
                    className="flex-1 px-4 py-3 border border-stone-300 text-stone-700 rounded-md hover:bg-stone-50 dark:border-stone-700 dark:text-stone-300 dark:hover:bg-stone-800"
                >
                    Cancel
                </button>
                <button
                    type="submit"
                    disabled={!stripe || isProcessing}
                    className="flex-1 px-4 py-3 bg-stone-900 text-white rounded-md hover:bg-stone-800 disabled:opacity-50 dark:bg-white dark:text-stone-900"
                >
                    {isProcessing ? 'Processing...' : 'Pay Now'}
                </button>
            </div>
        </form>
    );
}


