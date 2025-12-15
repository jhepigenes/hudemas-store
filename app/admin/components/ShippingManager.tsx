'use client';

import { useState } from 'react';
import { Truck, Package, CheckCircle, AlertCircle } from 'lucide-react';
import clsx from 'clsx';

const CARRIERS = [
    { id: 'fancourier', name: 'FanCourier', logo: 'FAN', color: 'bg-blue-600' },
    { id: 'sameday', name: 'Sameday (Easybox)', logo: 'SAY', color: 'bg-red-600' },
    { id: 'gls', name: 'GLS', logo: 'GLS', color: 'bg-blue-800' },
    { id: 'dhl', name: 'DHL Express', logo: 'DHL', color: 'bg-yellow-500 text-black' },
];

export default function ShippingManager() {
    const [selectedCarrier, setSelectedCarrier] = useState('fancourier');
    const [dimensions, setDimensions] = useState({ weight: '1.5', width: '30', height: '20', length: '10' });
    const [status, setStatus] = useState<'idle' | 'calculating' | 'generated'>('idle');
    const [cost, setCost] = useState<string | null>(null);

    const handleCalculate = () => {
        setStatus('calculating');
        setTimeout(() => {
            setCost('24.50 RON');
            setStatus('idle');
        }, 1000);
    };

    const handleGenerate = () => {
        setStatus('generated');
        // In real app: Call API to generate AWB
    };

    return (
        <div className="rounded-xl border border-stone-200 bg-white p-6 shadow-sm dark:border-stone-800 dark:bg-stone-900">
            <div className="flex items-center gap-2">
                <Truck className="h-5 w-5 text-stone-500" />
                <h3 className="font-serif text-lg font-medium text-stone-900 dark:text-white">Logistics Manager</h3>
            </div>

            <div className="mt-6 grid gap-6 lg:grid-cols-2">
                {/* Carrier Selection */}
                <div>
                    <label className="mb-3 block text-sm font-medium text-stone-700 dark:text-stone-300">Select Carrier</label>
                    <div className="grid grid-cols-2 gap-3">
                        {CARRIERS.map((carrier) => (
                            <button
                                key={carrier.id}
                                onClick={() => setSelectedCarrier(carrier.id)}
                                className={clsx(
                                    "flex items-center justify-between rounded-lg border p-3 text-sm transition-all",
                                    selectedCarrier === carrier.id
                                        ? "border-stone-900 bg-stone-50 ring-1 ring-stone-900 dark:border-white dark:bg-stone-800 dark:ring-white"
                                        : "border-stone-200 hover:border-stone-300 dark:border-stone-700 dark:hover:border-stone-600"
                                )}
                            >
                                <span className="font-medium text-stone-900 dark:text-white">{carrier.name}</span>
                                {selectedCarrier === carrier.id && <CheckCircle className="h-4 w-4 text-stone-900 dark:text-white" />}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Package Details */}
                <div>
                    <label className="mb-3 block text-sm font-medium text-stone-700 dark:text-stone-300">Package Details</label>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-xs text-stone-500">Weight (kg)</label>
                            <input
                                type="number"
                                value={dimensions.weight}
                                onChange={e => setDimensions({ ...dimensions, weight: e.target.value })}
                                className="mt-1 block w-full rounded-md border-stone-300 text-sm shadow-sm focus:border-stone-500 focus:ring-stone-500 dark:bg-stone-800 dark:border-stone-700"
                            />
                        </div>
                        <div className="grid grid-cols-3 gap-2">
                            <div>
                                <label className="text-xs text-stone-500">L (cm)</label>
                                <input type="number" value={dimensions.length} onChange={e => setDimensions({ ...dimensions, length: e.target.value })} className="mt-1 block w-full rounded-md border-stone-300 text-sm shadow-sm dark:bg-stone-800 dark:border-stone-700" />
                            </div>
                            <div>
                                <label className="text-xs text-stone-500">W (cm)</label>
                                <input type="number" value={dimensions.width} onChange={e => setDimensions({ ...dimensions, width: e.target.value })} className="mt-1 block w-full rounded-md border-stone-300 text-sm shadow-sm dark:bg-stone-800 dark:border-stone-700" />
                            </div>
                            <div>
                                <label className="text-xs text-stone-500">H (cm)</label>
                                <input type="number" value={dimensions.height} onChange={e => setDimensions({ ...dimensions, height: e.target.value })} className="mt-1 block w-full rounded-md border-stone-300 text-sm shadow-sm dark:bg-stone-800 dark:border-stone-700" />
                            </div>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="mt-6 flex items-center justify-between rounded-lg bg-stone-50 p-4 dark:bg-stone-800/50">
                        <div>
                            <p className="text-xs text-stone-500">Estimated Cost</p>
                            <p className="text-lg font-bold text-stone-900 dark:text-white">{cost || '---'}</p>
                        </div>
                        <div className="flex gap-2">
                            <button
                                onClick={handleCalculate}
                                className="rounded-md border border-stone-300 bg-white px-3 py-2 text-sm font-medium text-stone-700 hover:bg-stone-50 dark:border-stone-600 dark:bg-stone-800 dark:text-stone-300"
                            >
                                Calculate
                            </button>
                            <button
                                onClick={handleGenerate}
                                disabled={status === 'generated'}
                                className={clsx(
                                    "rounded-md px-4 py-2 text-sm font-medium text-white shadow-sm",
                                    status === 'generated' ? "bg-green-600" : "bg-stone-900 hover:bg-stone-800 dark:bg-white dark:text-stone-900"
                                )}
                            >
                                {status === 'generated' ? 'AWB Generated' : 'Generate Label'}
                            </button>
                        </div>
                    </div>
                    {status === 'generated' && (
                        <p className="mt-2 flex items-center gap-2 text-xs text-green-600">
                            <CheckCircle className="h-3 w-3" /> Label ready for print. Tracking code: AWB-8829102
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
}
