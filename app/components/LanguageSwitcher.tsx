'use client';

import { useLanguage } from '../context/LanguageContext';

export default function LanguageSwitcher() {
    const { language, setLanguage } = useLanguage();

    return (
        <div className="flex items-center gap-1 text-xs font-medium uppercase tracking-widest">
            <button
                onClick={() => setLanguage('en')}
                className={`px-1 hover:opacity-80 transition-opacity ${language === 'en' ? 'text-stone-900 dark:text-white font-bold underline decoration-stone-900 dark:decoration-white underline-offset-4' : 'text-stone-400 dark:text-stone-600'}`}
            >
                EN
            </button>
            <span className="text-stone-300 dark:text-stone-700">/</span>
            <button
                onClick={() => setLanguage('ro')}
                className={`px-1 hover:opacity-80 transition-opacity ${language === 'ro' ? 'text-stone-900 dark:text-white font-bold underline decoration-stone-900 dark:decoration-white underline-offset-4' : 'text-stone-400 dark:text-stone-600'}`}
            >
                RO
            </button>
        </div>
    );
}
