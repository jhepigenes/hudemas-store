'use client';

import { useLanguage } from '../context/LanguageContext';

export default function LanguageSwitcher() {
    const { language, setLanguage } = useLanguage();

    return (
        <div className="flex items-center gap-1 text-xs font-medium uppercase tracking-widest text-current">
            <button
                onClick={() => setLanguage('en')}
                className={`px-1 hover:opacity-100 transition-opacity ${language === 'en' ? 'font-bold underline underline-offset-4 opacity-100' : 'opacity-50'}`}
            >
                EN
            </button>
            <span className="opacity-30">/</span>
            <button
                onClick={() => setLanguage('ro')}
                className={`px-1 hover:opacity-100 transition-opacity ${language === 'ro' ? 'font-bold underline underline-offset-4 opacity-100' : 'opacity-50'}`}
            >
                RO
            </button>
        </div>
    );
}
