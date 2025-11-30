'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

type Currency = 'RON' | 'EUR';

interface CurrencyContextType {
    currency: Currency;
    setCurrency: (currency: Currency) => void;
    convertPrice: (priceInRon: number) => string;
    formatPrice: (priceInRon: number) => string;
    exchangeRate: number;
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

export function CurrencyProvider({ children }: { children: React.ReactNode }) {
    const [currency, setCurrency] = useState<Currency>('RON');
    const [exchangeRate] = useState(0.20); // 1 RON = 0.20 EUR (approx)

    useEffect(() => {
        const saved = localStorage.getItem('hudemas_currency');
        if (saved && (saved === 'RON' || saved === 'EUR')) {
            setCurrency(saved as Currency);
        }
    }, []);

    const handleSetCurrency = (c: Currency) => {
        setCurrency(c);
        localStorage.setItem('hudemas_currency', c);
    };

    const convertPrice = (priceInRon: number) => {
        if (currency === 'RON') return priceInRon.toFixed(2);
        return (priceInRon * exchangeRate).toFixed(2);
    };

    const formatPrice = (priceInRon: number) => {
        const value = convertPrice(priceInRon);
        return currency === 'RON' ? `${value} Lei` : `€${value}`;
    };

    return (
        <CurrencyContext.Provider value={{
            currency,
            setCurrency: handleSetCurrency,
            convertPrice,
            formatPrice,
            exchangeRate
        }}>
            {children}
        </CurrencyContext.Provider>
    );
}

export function useCurrency() {
    const context = useContext(CurrencyContext);
    if (context === undefined) {
        throw new Error('useCurrency must be used within a CurrencyProvider');
    }
    return context;
}
