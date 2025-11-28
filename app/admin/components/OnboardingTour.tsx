'use client';

import { useState, useEffect } from 'react';
import { X, ArrowRight, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function OnboardingTour() {
    const [step, setStep] = useState(0);
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        const hasSeenTour = localStorage.getItem('admin_onboarding_complete');
        if (!hasSeenTour) {
            // Small delay to let the page load
            const timer = setTimeout(() => setIsVisible(true), 1000);
            return () => clearTimeout(timer);
        }
    }, []);

    const handleComplete = () => {
        setIsVisible(false);
        localStorage.setItem('admin_onboarding_complete', 'true');
    };

    const steps = [
        {
            title: "Welcome to your new Command Center!",
            text: "This dashboard is designed to make your daily work easier. Let's take a quick 30-second tour."
        },
        {
            title: "1. Daily Operations",
            text: "Click 'Daily Operations' in the sidebar every morning. That's where you print AWB labels and Invoices for new orders."
        },
        {
            title: "2. Financials & Accounting",
            text: "Need to send data to the accountant? Go to 'Financials', select the month, and click 'Export Accounting CSV'. Simple as that."
        },
        {
            title: "3. Inventory & Sales",
            text: "Use 'Inventory' to change prices or create special Bundles (like 'Buy 2 Get 1 Free') to boost sales."
        },
        {
            title: "You're all set!",
            text: "Explore the menu at your own pace. If you ever get stuck, just look for the help documentation."
        }
    ];

    if (!isVisible) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
                <motion.div 
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className="w-full max-w-lg bg-white dark:bg-stone-900 rounded-2xl shadow-2xl border border-stone-200 dark:border-stone-800 overflow-hidden"
                >
                    {/* Header Image/Color */}
                    <div className="h-32 bg-stone-900 relative flex items-center justify-center">
                        <h2 className="font-serif text-3xl text-white tracking-widest">HUDEMAS</h2>
                        <button 
                            onClick={handleComplete}
                            className="absolute top-4 right-4 p-2 bg-white/10 rounded-full text-white hover:bg-white/20 transition-colors"
                        >
                            <X className="h-4 w-4" />
                        </button>
                    </div>

                    <div className="p-8">
                        <div className="mb-6">
                            <span className="text-xs font-bold tracking-wider text-stone-400 uppercase">
                                Step {step + 1} of {steps.length}
                            </span>
                            <h3 className="mt-2 text-2xl font-serif text-stone-900 dark:text-white">
                                {steps[step].title}
                            </h3>
                            <p className="mt-4 text-lg text-stone-600 dark:text-stone-300 leading-relaxed">
                                {steps[step].text}
                            </p>
                        </div>

                        <div className="flex items-center justify-between mt-8 pt-6 border-t border-stone-100 dark:border-stone-800">
                            <div className="flex gap-2">
                                {steps.map((_, i) => (
                                    <div 
                                        key={i} 
                                        className={`h-2 w-2 rounded-full transition-colors ${i === step ? 'bg-stone-900 dark:bg-white' : 'bg-stone-200 dark:bg-stone-800'}`}
                                    />
                                ))}
                            </div>
                            
                            <button
                                onClick={() => {
                                    if (step < steps.length - 1) {
                                        setStep(step + 1);
                                    } else {
                                        handleComplete();
                                    }
                                }}
                                className="flex items-center gap-2 bg-stone-900 dark:bg-white text-white dark:text-stone-900 px-6 py-3 rounded-full font-medium hover:opacity-90 transition-opacity"
                            >
                                {step < steps.length - 1 ? (
                                    <>Next <ArrowRight className="h-4 w-4" /></>
                                ) : (
                                    <>Get Started <Check className="h-4 w-4" /></>
                                )}
                            </button>
                        </div>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
