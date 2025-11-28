'use client';

import { useState } from 'react';
import { Edit2, Plus, Star, Calculator, X, Tag, Minus } from 'lucide-react';

export default function InventoryPage() {
    // Mock Data (Would come from Supabase)
    const [products, setProducts] = useState([
        { id: 1, name: 'Lebede', price: '91.08', stock: 12, boosted: true, cost: 45 },
        { id: 2, name: 'Vis exotic', price: '91.08', stock: 5, boosted: false, cost: 45 },
        { id: 3, name: 'Micuța balerină', price: '91.08', stock: 8, boosted: false, cost: 45 },
    ]);

    const [bundles, setBundles] = useState([
        { id: 1, name: 'Nature Collection', discount: 20, description: 'Buy 3 Get 20% Off' }
    ]);

    const [isCalculatorOpen, setIsCalculatorOpen] = useState(false);
    const [isBundleModalOpen, setIsBundleModalOpen] = useState(false);
    const [editingBundleId, setEditingBundleId] = useState<number | null>(null);

    // Calculator State
    const [calcCost, setCalcCost] = useState<number>(0);
    const [calcPrice, setCalcPrice] = useState<number>(0);

    // Bundle Form State
    const [newBundle, setNewBundle] = useState({ name: '', discount: 10, description: '' });

    const toggleBoost = (id: number) => {
        setProducts(products.map(p => p.id === id ? { ...p, boosted: !p.boosted } : p));
    };

    const handleUpdateStock = (id: number, change: number) => {
        setProducts(products.map(p => p.id === id ? { ...p, stock: Math.max(0, p.stock + change) } : p));
    };

    const handleSaveBundle = () => {
        if (editingBundleId) {
            setBundles(bundles.map(b => b.id === editingBundleId ? { ...b, ...newBundle } : b));
        } else {
            setBundles([...bundles, { id: Date.now(), ...newBundle }]);
        }
        setIsBundleModalOpen(false);
        setEditingBundleId(null);
        setNewBundle({ name: '', discount: 10, description: '' });
    };

    const openEditBundle = (bundle: any) => {
        setNewBundle({ name: bundle.name, discount: bundle.discount, description: bundle.description });
        setEditingBundleId(bundle.id);
        setIsBundleModalOpen(true);
    };

    const margin = calcPrice > 0 ? ((calcPrice - calcCost) / calcPrice) * 100 : 0;
    const profit = calcPrice - calcCost;

    return (
        <div className="space-y-6 relative">
            <div className="flex items-center justify-between">
                <h2 className="font-serif text-2xl font-medium text-stone-900 dark:text-white">Inventory Management</h2>
                <div className="flex gap-2">
                    <button
                        onClick={() => setIsCalculatorOpen(!isCalculatorOpen)}
                        className="flex items-center gap-2 rounded-full border border-stone-300 px-4 py-2 text-sm font-medium text-stone-700 hover:bg-stone-50 dark:border-stone-700 dark:text-stone-300 dark:hover:bg-stone-800"
                    >
                        <Calculator className="h-4 w-4" /> Margin Calc
                    </button>
                    <button className="flex items-center gap-2 rounded-full bg-stone-900 px-4 py-2 text-sm font-medium text-white hover:bg-stone-800 dark:bg-white dark:text-stone-900">
                        <Plus className="h-4 w-4" /> Add Product
                    </button>
                </div>
            </div>

            {/* Margin Calculator (Collapsible) */}
            {isCalculatorOpen && (
                <div className="rounded-xl border border-blue-200 bg-blue-50 p-6 dark:border-blue-900 dark:bg-blue-900/20">
                    <div className="flex justify-between items-start mb-4">
                        <h3 className="font-medium text-stone-900 dark:text-white flex items-center gap-2">
                            <Calculator className="h-4 w-4 text-blue-600" /> Profitability Calculator
                        </h3>
                        <button onClick={() => setIsCalculatorOpen(false)} className="text-stone-400 hover:text-stone-600"><X className="h-4 w-4" /></button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                        <div>
                            <label className="block text-xs font-medium text-stone-600 dark:text-stone-400 uppercase tracking-wide">Cost Price (RON)</label>
                            <input
                                type="number"
                                value={calcCost}
                                onChange={(e) => setCalcCost(Number(e.target.value))}
                                className="mt-1 block w-full rounded-md border-stone-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-stone-800 dark:border-stone-700"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-stone-600 dark:text-stone-400 uppercase tracking-wide">Sale Price (RON)</label>
                            <input
                                type="number"
                                value={calcPrice}
                                onChange={(e) => setCalcPrice(Number(e.target.value))}
                                className="mt-1 block w-full rounded-md border-stone-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-stone-800 dark:border-stone-700"
                            />
                        </div>
                        <div className="bg-white dark:bg-stone-800 p-3 rounded-lg border border-stone-200 dark:border-stone-700">
                            <p className="text-xs text-stone-500">Profit per Unit</p>
                            <p className={`text-lg font-bold ${profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                {profit.toFixed(2)} RON
                            </p>
                        </div>
                        <div className="bg-white dark:bg-stone-800 p-3 rounded-lg border border-stone-200 dark:border-stone-700">
                            <p className="text-xs text-stone-500">Margin</p>
                            <p className={`text-lg font-bold ${margin >= 30 ? 'text-green-600' : margin >= 0 ? 'text-yellow-600' : 'text-red-600'}`}>
                                {margin.toFixed(1)}%
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* Bundles Section */}
            <div className="rounded-xl border border-stone-200 bg-stone-50 p-6 dark:border-stone-800 dark:bg-stone-900/50">
                <h3 className="font-medium text-stone-900 dark:text-white">Active Bundles</h3>
                <div className="mt-4 flex flex-wrap gap-4">
                    {bundles.map(bundle => (
                        <div key={bundle.id} className="group relative flex items-center gap-3 rounded-lg bg-white p-4 shadow-sm dark:bg-stone-800 min-w-[200px] pr-10">
                            <div className="h-10 w-10 rounded bg-red-100 text-red-600 flex items-center justify-center font-bold text-xs dark:bg-red-900/30 dark:text-red-400">
                                -{bundle.discount}%
                            </div>
                            <div>
                                <p className="text-sm font-medium text-stone-900 dark:text-white">{bundle.name}</p>
                                <p className="text-xs text-stone-500">{bundle.description}</p>
                            </div>
                            <button
                                onClick={() => openEditBundle(bundle)}
                                className="absolute top-2 right-2 p-1 text-stone-400 hover:text-stone-900 dark:hover:text-white opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                                <Edit2 className="h-3 w-3" />
                            </button>
                        </div>
                    ))}

                    <button
                        onClick={() => {
                            setEditingBundleId(null);
                            setNewBundle({ name: '', discount: 10, description: '' });
                            setIsBundleModalOpen(true);
                        }}
                        className="flex items-center justify-center rounded-lg border-2 border-dashed border-stone-300 px-4 py-4 text-sm text-stone-500 hover:border-stone-400 hover:text-stone-600 dark:border-stone-700 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
                    >
                        + Create Bundle
                    </button>
                </div>
            </div>

            {/* Bundle Creation/Edit Modal */}
            {isBundleModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
                    <div className="w-full max-w-md bg-white dark:bg-stone-900 rounded-xl shadow-xl p-6 border border-stone-200 dark:border-stone-800">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-lg font-serif font-medium text-stone-900 dark:text-white">
                                {editingBundleId ? 'Edit Bundle' : 'New Bundle Offer'}
                            </h3>
                            <button onClick={() => setIsBundleModalOpen(false)}><X className="h-5 w-5 text-stone-500" /></button>
                        </div>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-stone-700 dark:text-stone-300">Bundle Name</label>
                                <input
                                    type="text"
                                    placeholder="e.g. Summer Sale"
                                    value={newBundle.name}
                                    onChange={(e) => setNewBundle({ ...newBundle, name: e.target.value })}
                                    className="mt-1 block w-full rounded-md border-stone-300 shadow-sm focus:border-stone-500 focus:ring-stone-500 dark:bg-stone-800 dark:border-stone-700"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-stone-700 dark:text-stone-300">Discount (%)</label>
                                <input
                                    type="number"
                                    value={newBundle.discount}
                                    onChange={(e) => setNewBundle({ ...newBundle, discount: Number(e.target.value) })}
                                    className="mt-1 block w-full rounded-md border-stone-300 shadow-sm focus:border-stone-500 focus:ring-stone-500 dark:bg-stone-800 dark:border-stone-700"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-stone-700 dark:text-stone-300">Description</label>
                                <input
                                    type="text"
                                    placeholder="e.g. Buy 2 Get 1 Free"
                                    value={newBundle.description}
                                    onChange={(e) => setNewBundle({ ...newBundle, description: e.target.value })}
                                    className="mt-1 block w-full rounded-md border-stone-300 shadow-sm focus:border-stone-500 focus:ring-stone-500 dark:bg-stone-800 dark:border-stone-700"
                                />
                            </div>
                            <button
                                onClick={handleSaveBundle}
                                disabled={!newBundle.name}
                                className="w-full mt-4 rounded-md bg-stone-900 px-4 py-2 text-sm font-medium text-white hover:bg-stone-800 disabled:opacity-50 dark:bg-white dark:text-stone-900"
                            >
                                {editingBundleId ? 'Save Changes' : 'Create Bundle'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Product List */}
            <div className="rounded-xl border border-stone-200 bg-white shadow-sm dark:border-stone-800 dark:bg-stone-900">
                <table className="w-full text-left text-sm">
                    <thead className="bg-stone-50 text-stone-500 dark:bg-stone-800 dark:text-stone-400">
                        <tr>
                            <th className="px-6 py-3 font-medium">Product Name</th>
                            <th className="px-6 py-3 font-medium">Price (RON)</th>
                            <th className="px-6 py-3 font-medium">Cost (RON)</th>
                            <th className="px-6 py-3 font-medium">Stock</th>
                            <th className="px-6 py-3 font-medium text-center">Boost</th>
                            <th className="px-6 py-3 font-medium text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-200 dark:divide-stone-800">
                        {products.map((product) => (
                            <tr key={product.id} className="group hover:bg-stone-50 dark:hover:bg-stone-800/50">
                                <td className="px-6 py-4 font-medium text-stone-900 dark:text-white">{product.name}</td>
                                <td className="px-6 py-4 text-stone-600 dark:text-stone-400">
                                    {product.price}
                                </td>
                                <td className="px-6 py-4 text-stone-500 dark:text-stone-500">
                                    {product.cost.toFixed(2)}
                                </td>
                                <td className="px-6 py-4 text-stone-600 dark:text-stone-400">
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => handleUpdateStock(product.id, -1)}
                                            className="p-1 text-stone-400 hover:text-stone-600 dark:hover:text-stone-200"
                                        >
                                            <Minus className="h-3 w-3" />
                                        </button>
                                        <span className="w-8 text-center font-medium">{product.stock}</span>
                                        <button
                                            onClick={() => handleUpdateStock(product.id, 1)}
                                            className="p-1 text-stone-400 hover:text-stone-600 dark:hover:text-stone-200"
                                        >
                                            <Plus className="h-3 w-3" />
                                        </button>
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-center">
                                    <button
                                        onClick={() => toggleBoost(product.id)}
                                        className={`rounded-full p-1 transition-colors ${product.boosted ? 'bg-yellow-100 text-yellow-600' : 'text-stone-300 hover:text-stone-400'}`}
                                    >
                                        <Star className="h-4 w-4 fill-current" />
                                    </button>
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <button className="text-stone-400 hover:text-stone-900 dark:hover:text-white">
                                        <Edit2 className="h-4 w-4" />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}