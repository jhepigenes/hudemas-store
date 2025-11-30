'use client';

import { useCurrency } from '../context/CurrencyContext';

export default function CurrencySwitcher() {
    const { currency, setCurrency } = useCurrency();

    return (
        <div className="flex items-center gap-1 text-xs font-medium uppercase tracking-widest text-current">
            <button
                onClick={() => setCurrency('RON')}
                className={`px-1 hover:opacity-100 transition-opacity ${currency === 'RON' ? 'font-bold underline underline-offset-4 opacity-100' : 'opacity-50'}`}
            >
                RON
            </button>
            <span className="opacity-30">/</span>
            <button
                onClick={() => setCurrency('EUR')}
                className={`px-1 hover:opacity-100 transition-opacity ${currency === 'EUR' ? 'font-bold underline underline-offset-4 opacity-100' : 'opacity-50'}`}
            >
                EUR
            </button>
        </div>
    );
}
