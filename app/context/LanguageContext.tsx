'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { translations } from '../utils/translations';

type Language = 'en' | 'ro';
type Translations = typeof translations.en;

interface LanguageContextType {
    language: Language;
    setLanguage: (lang: Language) => void;
    t: Translations;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
    const [language, setLanguage] = useState<Language>('en');

    useEffect(() => {
        const savedLang = localStorage.getItem('hudemas-language') as Language;
        if (savedLang && (savedLang === 'en' || savedLang === 'ro')) {
            setLanguage(savedLang);
        } else {
            // Detect browser language
            const browserLang = navigator.language.startsWith('ro') ? 'ro' : 'en';
            setLanguage(browserLang);
        }
    }, []);

    const handleSetLanguage = (lang: Language) => {
        setLanguage(lang);
        localStorage.setItem('hudemas-language', lang);
    };

    return (
        <LanguageContext.Provider
            value={{
                language,
                setLanguage: handleSetLanguage,
                t: translations[language]
            }}
        >
            {children}
        </LanguageContext.Provider>
    );
}

export function useLanguage() {
    const context = useContext(LanguageContext);
    if (context === undefined) {
        throw new Error('useLanguage must be used within a LanguageProvider');
    }
    return context;
}
