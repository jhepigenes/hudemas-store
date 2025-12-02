'use client';

import { useState, useEffect } from 'react';
import { Edit2, Plus, Star, Calculator, X, Tag, Minus, Search, Store, ShoppingBag, Percent, Loader2 } from 'lucide-react';
import { createClient } from '@/lib/supabase';
import { useLanguage } from '@/app/context/LanguageContext';

export default function InventoryPage() {
    const [activeTab, setActiveTab] = useState<'store' | 'marketplace' | 'bundles'>('store');
    const [products, setProducts] = useState<any[]>([]);
    const [marketplaceListings, setMarketplaceListings] = useState<any[]>([]);
    const [bundles, setBundles] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');

    const [isCalculatorOpen, setIsCalculatorOpen] = useState(false);


    // Calculator State
    const [calcCost, setCalcCost] = useState<number>(0);
    const [calcPrice, setCalcPrice] = useState<number>(0);

    // Bundle Form State
    const [newBundle, setNewBundle] = useState({ name: '', discount: '' as any, description: '', productIds: [] as string[] });
    const [editingBundleId, setEditingBundleId] = useState<string | null>(null);
    const [isBundleModalOpen, setIsBundleModalOpen] = useState(false);

    // Product Editing State
    const [editingProductId, setEditingProductId] = useState<string | null>(null);
    const [uploadingImage, setUploadingImage] = useState(false);

    // Product Form State
    const [isProductModalOpen, setIsProductModalOpen] = useState(false);
    const [newProduct, setNewProduct] = useState({
        title: '',
        price: '',
        stock: 1,
        cost: 0,
        product_type: 'kit',
        description: '',
        image_url: '',
        category: 'kits',
        dimensions: '',
        colors: '',
        formats: [] as string[]
    });

    const supabase = createClient();

    useEffect(() => {
        fetchData();
    }, [activeTab]);

    const fetchData = async () => {
        setLoading(true);
        try {
            if (activeTab === 'store') {
                const { data } = await supabase.from('products').select('*').order('created_at', { ascending: false });
                setProducts(data || []);
            } else if (activeTab === 'marketplace') {
                const { data } = await supabase.from('marketplace_listings').select('*, artists(full_name)').order('created_at', { ascending: false });
                setMarketplaceListings(data || []);
            } else if (activeTab === 'bundles') {
                const res = await fetch('/api/admin/bundles');
                const data = await res.json();
                setBundles(data || []);
            }
        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setLoading(false);
        }
    };

    // --- Store Actions ---
    const toggleBoost = async (id: string, currentStatus: boolean) => {
        // Optimistic
        setProducts(products.map(p => p.id === id ? { ...p, boosted: !currentStatus } : p));
        await supabase.from('products').update({ boosted: !currentStatus }).eq('id', id);
    };

    const handleUpdateStock = async (id: string, change: number) => {
        const product = products.find(p => p.id === id);
        if (!product) return;
        const newStock = Math.max(0, (product.stock_quantity || 0) + change);

        setProducts(products.map(p => p.id === id ? { ...p, stock_quantity: newStock } : p));
        await supabase.from('products').update({ stock_quantity: newStock }).eq('id', id);
    };

    const handleSaveProduct = async () => {
        try {
            const productData = {
                title: newProduct.title,
                price: parseFloat(newProduct.price),
                stock_quantity: newProduct.stock,
                cost: newProduct.cost,
                product_type: newProduct.product_type,
                description: newProduct.description,
                image_url: newProduct.image_url,
                category: newProduct.category,
                currency: 'RON',
                dimensions: newProduct.dimensions,
                colors: newProduct.colors,
                formats: newProduct.formats
            };

            if (editingProductId) {
                const { error } = await supabase.from('products').update(productData).eq('id', editingProductId);
                if (error) throw error;
                alert("Product updated successfully!");
            } else {
                const slug = newProduct.title.toLowerCase().replace(/[^a-z0-9]+/g, '-') + '-' + Date.now();
                const { error } = await supabase.from('products').insert({ ...productData, slug: slug });
                if (error) throw error;
                alert("Product added successfully!");
            }

            setIsProductModalOpen(false);
            setEditingProductId(null);
            setNewProduct({ title: '', price: '', stock: 1, cost: 0, product_type: 'kit', description: '', image_url: '', category: 'kits', dimensions: '', colors: '', formats: [] });
            fetchData();
        } catch (error) {
            console.error("Error adding/updating product:", error);
            alert("Failed to save product");
        }
    };

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || e.target.files.length === 0) return;

        setUploadingImage(true);
        const file = e.target.files[0];
        const fileExt = file.name.split('.').pop();
        const fileName = `${Math.random()}.${fileExt}`;
        const filePath = `${fileName}`;

        try {
            const { error: uploadError } = await supabase.storage
                .from('products')
                .upload(filePath, file);

            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage
                .from('products')
                .getPublicUrl(filePath);

            setNewProduct({ ...newProduct, image_url: publicUrl });
        } catch (error) {
            console.error('Error uploading image:', error);
            alert('Error uploading image');
        } finally {
            setUploadingImage(false);
        }
    };

    const openEditProduct = (product: any) => {
        setNewProduct({
            title: product.title,
            price: product.price,
            cost: product.cost || 0,
            stock: product.stock_quantity,
            category: product.category || 'kits',
            product_type: product.product_type || 'kit',
            description: product.description || '',
            image_url: product.image_url || '',
            dimensions: product.dimensions || '',
            colors: product.colors || '',
            formats: product.formats || []
        });
        setEditingProductId(product.id);
        setIsProductModalOpen(true);
    };

    // --- Marketplace Actions ---
    const handleUpdateMarketplaceStock = async (id: string, change: number) => {
        const listing = marketplaceListings.find(l => l.id === id);
        if (!listing) return;
        const newStock = Math.max(0, (listing.stock || 0) + change);

        setMarketplaceListings(marketplaceListings.map(l => l.id === id ? { ...l, stock: newStock } : l));
        await supabase.from('marketplace_listings').update({ stock: newStock }).eq('id', id);
    };

    // --- Bundle Actions ---
    const handleSaveBundle = async () => {
        try {
            const method = editingBundleId ? 'PUT' : 'POST';
            const body = editingBundleId ? { id: editingBundleId, ...newBundle } : newBundle;

            const res = await fetch('/api/admin/bundles', {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            });

            if (!res.ok) throw new Error('Failed to save bundle');

            setIsBundleModalOpen(false);
            setEditingBundleId(null);
            setNewBundle({ name: '', discount: '' as any, description: '', productIds: [] });
            fetchData(); // Refresh bundles
        } catch (error) {
            console.error('Error saving bundle:', error);
            alert('Failed to save bundle');
        }
    };

    const openEditBundle = (bundle: any) => {
        const productIds = bundle.bundle_items?.map((item: any) => item.product_id) || [];
        setNewBundle({
            name: bundle.name,
            discount: bundle.discount_percent,
            description: bundle.description,
            productIds
        });
        setEditingBundleId(bundle.id);
        setIsBundleModalOpen(true);
    };

    const toggleProductInBundle = (productId: string) => {
        setNewBundle(prev => ({
            ...prev,
            productIds: prev.productIds.includes(productId)
                ? prev.productIds.filter(id => id !== productId)
                : [...prev.productIds, productId]
        }));
    };

    const margin = calcPrice > 0 ? ((calcPrice - calcCost) / calcPrice) * 100 : 0;
    const profit = calcPrice - calcCost;

    const filteredItems = (activeTab === 'store' ? products : marketplaceListings).filter(item =>
        item.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.sku?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="space-y-6 relative pb-20">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <h2 className="font-serif text-2xl font-medium text-stone-900 dark:text-white">Inventory Management</h2>
                <div className="flex gap-2">
                    <button
                        onClick={() => setIsCalculatorOpen(!isCalculatorOpen)}
                        className="flex items-center gap-2 rounded-full border border-stone-300 px-4 py-2 text-sm font-medium text-stone-700 hover:bg-stone-50 dark:border-stone-700 dark:text-stone-300 dark:hover:bg-stone-800"
                    >
                        <Calculator className="h-4 w-4" /> Margin Calc
                    </button>
                    {activeTab === 'store' && (
                        <button
                            onClick={() => {
                                setEditingProductId(null);
                                setNewProduct({ title: '', price: '', cost: 0, stock: 1, category: 'kits', product_type: 'kit', description: '', image_url: '', dimensions: '', colors: '', formats: [] });
                                setIsProductModalOpen(true);
                            }}
                            className="flex items-center gap-2 rounded-full bg-stone-900 px-4 py-2 text-sm font-medium text-white hover:bg-stone-800 dark:bg-white dark:text-stone-900"
                        >
                            <Plus className="h-4 w-4" /> Add Product
                        </button>
                    )}
                    {activeTab === 'bundles' && (
                        <button
                            onClick={() => {
                                setEditingBundleId(null);
                                setNewBundle({ name: '', discount: '' as any, description: '', productIds: [] });
                                setIsBundleModalOpen(true);
                            }}
                            className="flex items-center gap-2 rounded-full bg-stone-900 px-4 py-2 text-sm font-medium text-white hover:bg-stone-800 dark:bg-white dark:text-stone-900"
                        >
                            <Plus className="h-4 w-4" /> Create Bundle
                        </button>
                    )}
                </div>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-stone-200 dark:border-stone-800 overflow-x-auto">
                <button
                    onClick={() => setActiveTab('store')}
                    className={`flex items-center gap-2 px-6 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${activeTab === 'store'
                        ? 'border-stone-900 text-stone-900 dark:border-white dark:text-white'
                        : 'border-transparent text-stone-500 hover:text-stone-700 dark:text-stone-400'
                        }`}
                >
                    <Store className="h-4 w-4" /> Store Products
                </button>
                <button
                    onClick={() => setActiveTab('marketplace')}
                    className={`flex items-center gap-2 px-6 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${activeTab === 'marketplace'
                        ? 'border-stone-900 text-stone-900 dark:border-white dark:text-white'
                        : 'border-transparent text-stone-500 hover:text-stone-700 dark:text-stone-400'
                        }`}
                >
                    <ShoppingBag className="h-4 w-4" /> Marketplace
                </button>
                <button
                    onClick={() => setActiveTab('bundles')}
                    className={`flex items-center gap-2 px-6 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${activeTab === 'bundles'
                        ? 'border-stone-900 text-stone-900 dark:border-white dark:text-white'
                        : 'border-transparent text-stone-500 hover:text-stone-700 dark:text-stone-400'
                        }`}
                >
                    <Percent className="h-4 w-4" /> Bundles
                </button>
            </div>

            {/* Search Bar (Hidden for Bundles) */}
            {activeTab !== 'bundles' && (
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
                    <input
                        type="text"
                        placeholder="Search products by name or SKU..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 rounded-lg border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 focus:ring-2 focus:ring-stone-500 outline-none"
                    />
                </div>
            )}

            {/* Content Area */}
            <div className="rounded-xl border border-stone-200 bg-white shadow-sm dark:border-stone-800 dark:bg-stone-900 min-h-[400px]">
                {loading ? (
                    <div className="flex items-center justify-center h-64 text-stone-500">Loading...</div>
                ) : (
                    <>
                        {/* STORE TAB */}
                        {activeTab === 'store' && (
                            <>
                                {/* Mobile View (Cards) */}
                                <div className="md:hidden divide-y divide-stone-200 dark:divide-stone-800">
                                    {filteredItems.map((product) => (
                                        <div key={product.id} className="p-4 space-y-3">
                                            <div className="flex gap-3">
                                                {product.image_url && <img src={product.image_url} alt={product.title} className="w-12 h-12 rounded object-cover" />}
                                                <div>
                                                    <h4 className="font-medium text-stone-900 dark:text-white">{product.title}</h4>
                                                    <p className="text-xs text-stone-500">{product.sku}</p>
                                                </div>
                                            </div>
                                            <div className="flex justify-between items-center text-sm">
                                                <span className="text-stone-600 dark:text-stone-400">Price: {product.price} RON</span>
                                                <span className="text-stone-600 dark:text-stone-400">Stock: {product.stock_quantity}</span>
                                            </div>
                                            <div className="flex justify-between items-center gap-2">
                                                <div className="flex items-center gap-2 bg-stone-100 dark:bg-stone-800 rounded p-1">
                                                    <button onClick={() => handleUpdateStock(product.id, -1)} className="p-1 hover:bg-stone-200 dark:hover:bg-stone-700 rounded"><Minus className="h-3 w-3" /></button>
                                                    <span className="w-6 text-center text-xs">{product.stock_quantity || 0}</span>
                                                    <button onClick={() => handleUpdateStock(product.id, 1)} className="p-1 hover:bg-stone-200 dark:hover:bg-stone-700 rounded"><Plus className="h-3 w-3" /></button>
                                                </div>
                                                <div className="flex gap-2">
                                                    <button onClick={() => toggleBoost(product.id, product.boosted)} className={`p-2 rounded-full border ${product.boosted ? 'border-yellow-200 bg-yellow-50 text-yellow-600' : 'border-stone-200 text-stone-400 dark:border-stone-700'}`}>
                                                        <Star className="h-4 w-4" />
                                                    </button>
                                                    <button onClick={() => openEditProduct(product)} className="p-2 rounded-full border border-stone-200 text-stone-500 hover:bg-stone-50 dark:border-stone-700 dark:text-stone-400">
                                                        <Edit2 className="h-4 w-4" />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {/* Desktop View (Table) */}
                                <div className="hidden md:block overflow-x-auto">
                                    <table className="w-full text-left text-sm">
                                        <thead className="bg-stone-50 text-stone-500 dark:bg-stone-800 dark:text-stone-400">
                                            <tr>
                                                <th className="px-6 py-3 font-medium">Product</th>
                                                <th className="px-6 py-3 font-medium">SKU</th>
                                                <th className="px-6 py-3 font-medium">Price</th>
                                                <th className="px-6 py-3 font-medium">Cost</th>
                                                <th className="px-6 py-3 font-medium">Stock</th>
                                                <th className="px-6 py-3 font-medium text-center">Boost</th>
                                                <th className="px-6 py-3 font-medium text-center">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-stone-200 dark:divide-stone-800">
                                            {filteredItems.map((product) => (
                                                <tr key={product.id} className="group hover:bg-stone-50 dark:hover:bg-stone-800/50">
                                                    <td className="px-6 py-4 font-medium text-stone-900 dark:text-white">
                                                        <div className="flex items-center gap-3">
                                                            {product.image_url && (
                                                                <img src={product.image_url} alt={product.title} className="w-8 h-8 rounded object-cover" />
                                                            )}
                                                            <span>{product.title}</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 text-stone-500">{product.sku || '-'}</td>
                                                    <td className="px-6 py-4">{product.price} RON</td>
                                                    <td className="px-6 py-4 text-stone-500">{product.cost || 0} RON</td>
                                                    <td className="px-6 py-4">
                                                        <div className="flex items-center gap-2">
                                                            <button onClick={() => handleUpdateStock(product.id, -1)} className="p-1 hover:bg-stone-200 rounded"><Minus className="h-3 w-3" /></button>
                                                            <span className="w-8 text-center">{product.stock_quantity || 0}</span>
                                                            <button onClick={() => handleUpdateStock(product.id, 1)} className="p-1 hover:bg-stone-200 rounded"><Plus className="h-3 w-3" /></button>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 text-center">
                                                        <button onClick={() => toggleBoost(product.id, product.boosted)} className={`p-1 rounded-full ${product.boosted ? 'text-yellow-500 bg-yellow-100' : 'text-stone-300'}`}>
                                                            <Star className="h-4 w-4 fill-current" />
                                                        </button>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <button
                                                            onClick={() => openEditProduct(product)}
                                                            className="p-1 hover:bg-stone-100 rounded dark:hover:bg-stone-800"
                                                        >
                                                            <Edit2 className="h-4 w-4 text-stone-500" />
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </>
                        )}

                        {/* MARKETPLACE TAB */}
                        {activeTab === 'marketplace' && (
                            <>
                                {/* Mobile View (Marketplace) */}
                                <div className="md:hidden divide-y divide-stone-200 dark:divide-stone-800">
                                    {filteredItems.map((listing) => (
                                        <div key={listing.id} className="p-4 space-y-3">
                                            <div className="flex gap-3">
                                                {listing.images?.[0] && <img src={listing.images[0]} alt={listing.title} className="w-12 h-12 rounded object-cover" />}
                                                <div>
                                                    <h4 className="font-medium text-stone-900 dark:text-white">{listing.title}</h4>
                                                    <p className="text-xs text-stone-500">{listing.artists?.full_name}</p>
                                                </div>
                                            </div>
                                            <div className="flex justify-between items-center text-sm">
                                                <span>{listing.price} {listing.currency}</span>
                                                <span className={`px-2 py-0.5 rounded-full text-xs ${listing.status === 'active' ? 'bg-green-100 text-green-800' : listing.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'}`}>
                                                    {listing.status}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-2 bg-stone-100 dark:bg-stone-800 rounded p-1 w-fit">
                                                <button onClick={() => handleUpdateMarketplaceStock(listing.id, -1)} className="p-1 hover:bg-stone-200 dark:hover:bg-stone-700 rounded"><Minus className="h-3 w-3" /></button>
                                                <span className="w-6 text-center text-xs">{listing.stock || 0}</span>
                                                <button onClick={() => handleUpdateMarketplaceStock(listing.id, 1)} className="p-1 hover:bg-stone-200 dark:hover:bg-stone-700 rounded"><Plus className="h-3 w-3" /></button>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {/* Desktop View (Marketplace) */}
                                <div className="hidden md:block overflow-x-auto">
                                    <table className="w-full text-left text-sm">
                                        <thead className="bg-stone-50 text-stone-500 dark:bg-stone-800 dark:text-stone-400">
                                            <tr>
                                                <th className="px-6 py-3 font-medium">Listing</th>
                                                <th className="px-6 py-3 font-medium">Artist</th>
                                                <th className="px-6 py-3 font-medium">Price</th>
                                                <th className="px-6 py-3 font-medium">Stock</th>
                                                <th className="px-6 py-3 font-medium">Status</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-stone-200 dark:divide-stone-800">
                                            {filteredItems.map((listing) => (
                                                <tr key={listing.id} className="group hover:bg-stone-50 dark:hover:bg-stone-800/50">
                                                    <td className="px-6 py-4 font-medium text-stone-900 dark:text-white">
                                                        <div className="flex items-center gap-3">
                                                            {listing.images?.[0] && (
                                                                <img src={listing.images[0]} alt={listing.title} className="w-8 h-8 rounded object-cover" />
                                                            )}
                                                            <span>{listing.title}</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 text-stone-500">{listing.artists?.full_name || 'Unknown'}</td>
                                                    <td className="px-6 py-4">{listing.price} {listing.currency}</td>
                                                    <td className="px-6 py-4">
                                                        <div className="flex items-center gap-2">
                                                            <button onClick={() => handleUpdateMarketplaceStock(listing.id, -1)} className="p-1 hover:bg-stone-200 rounded"><Minus className="h-3 w-3" /></button>
                                                            <span className="w-8 text-center">{listing.stock || 0}</span>
                                                            <button onClick={() => handleUpdateMarketplaceStock(listing.id, 1)} className="p-1 hover:bg-stone-200 rounded"><Plus className="h-3 w-3" /></button>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <span className={`px-2 py-1 rounded-full text-xs ${listing.status === 'active' ? 'bg-green-100 text-green-800' :
                                                            listing.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'
                                                            }`}>
                                                            {listing.status}
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </>
                        )}

                        {/* BUNDLES TAB */}
                        {activeTab === 'bundles' && (
                            <div className="p-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {bundles.map(bundle => (
                                        <div key={bundle.id} className="relative flex items-center gap-4 rounded-lg border border-stone-200 p-4 shadow-sm dark:border-stone-700 dark:bg-stone-800">
                                            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-red-50 text-lg font-bold text-red-600 dark:bg-red-900/20 dark:text-red-400">
                                                -{bundle.discount_percent}%
                                            </div>
                                            <div>
                                                <h3 className="font-medium text-stone-900 dark:text-white">{bundle.name}</h3>
                                                <p className="text-sm text-stone-500">{bundle.description}</p>
                                                {bundle.stripe_coupon_id && (
                                                    <span className="mt-1 inline-block text-[10px] text-stone-400">Stripe: {bundle.stripe_coupon_id}</span>
                                                )}
                                            </div>
                                            <button
                                                onClick={() => openEditBundle(bundle)}
                                                className="absolute top-2 right-2 p-2 text-stone-400 hover:text-stone-900 dark:hover:text-white"
                                            >
                                                <Edit2 className="h-4 w-4" />
                                            </button>
                                        </div>
                                    ))}
                                    {bundles.length === 0 && (
                                        <div className="col-span-full text-center py-12 text-stone-500">
                                            No bundles active. Create one to get started!
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* ... Modals (Calculator, Product, Bundle) ... */}
            {/* Calculator */}
            {isCalculatorOpen && (
                <div className="absolute right-0 top-12 z-10 w-64 rounded-xl border border-stone-200 bg-white p-4 shadow-lg dark:border-stone-800 dark:bg-stone-900">
                    <h3 className="mb-3 font-medium">Quick Margin Calc</h3>
                    <div className="space-y-3">
                        <div>
                            <label className="text-xs text-stone-500">Cost</label>
                            <input type="number" value={calcCost} onChange={(e) => setCalcCost(Number(e.target.value))} className="w-full rounded border border-stone-200 p-1 text-sm dark:border-stone-700 dark:bg-stone-800" />
                        </div>
                        <div>
                            <label className="text-xs text-stone-500">Sale Price</label>
                            <input type="number" value={calcPrice} onChange={(e) => setCalcPrice(Number(e.target.value))} className="w-full rounded border border-stone-200 p-1 text-sm dark:border-stone-700 dark:bg-stone-800" />
                        </div>
                        <div className="pt-2 border-t border-stone-100 dark:border-stone-800">
                            <div className="flex justify-between text-sm">
                                <span>Margin:</span>
                                <span className={margin < 30 ? 'text-red-500' : 'text-green-500'}>{margin.toFixed(1)}%</span>
                            </div>
                            <div className="flex justify-between text-sm font-medium">
                                <span>Profit:</span>
                                <span>{profit.toFixed(2)} RON</span>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Product Modal */}
            {isProductModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="w-full max-w-md bg-white dark:bg-stone-900 rounded-xl shadow-xl p-6 border border-stone-200 dark:border-stone-800 max-h-[90vh] overflow-y-auto">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-lg font-serif font-medium text-stone-900 dark:text-white">
                                {editingProductId ? 'Edit Product' : 'Add New Product'}
                            </h3>
                            <button onClick={() => setIsProductModalOpen(false)}><X className="h-5 w-5 text-stone-500" /></button>
                        </div>
                        <div className="space-y-4">
                            {/* Image Upload */}
                            <div className="flex flex-col items-center justify-center border-2 border-dashed border-stone-300 rounded-lg p-4 hover:bg-stone-50 dark:border-stone-700 dark:hover:bg-stone-800 cursor-pointer relative">
                                <input 
                                    type="file" 
                                    accept="image/*" 
                                    onChange={handleImageUpload} 
                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                    disabled={uploadingImage}
                                />
                                {newProduct.image_url ? (
                                    <img src={newProduct.image_url} alt="Preview" className="h-32 object-contain rounded-md" />
                                ) : (
                                    <div className="text-center">
                                        <div className="mx-auto h-12 w-12 text-stone-400">
                                            {uploadingImage ? <Loader2 className="animate-spin" /> : <Plus />}
                                        </div>
                                        <p className="mt-1 text-sm text-stone-500">Upload Image</p>
                                    </div>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-stone-700 dark:text-stone-300">Title</label>
                                <input type="text" value={newProduct.title} onChange={(e) => setNewProduct({ ...newProduct, title: e.target.value })} className="mt-1 block w-full rounded-md border-stone-300 shadow-sm focus:border-stone-500 focus:ring-stone-500 dark:bg-stone-800 dark:border-stone-700" />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-stone-700 dark:text-stone-300">Price (RON)</label>
                                    <input type="number" value={newProduct.price} onChange={(e) => setNewProduct({ ...newProduct, price: e.target.value })} className="mt-1 block w-full rounded-md border-stone-300 shadow-sm focus:border-stone-500 focus:ring-stone-500 dark:bg-stone-800 dark:border-stone-700" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-stone-700 dark:text-stone-300">Cost (RON)</label>
                                    <input type="number" value={newProduct.cost} onChange={(e) => setNewProduct({ ...newProduct, cost: Number(e.target.value) })} className="mt-1 block w-full rounded-md border-stone-300 shadow-sm focus:border-stone-500 focus:ring-stone-500 dark:bg-stone-800 dark:border-stone-700" />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-stone-700 dark:text-stone-300">Stock</label>
                                    <input type="number" value={newProduct.stock} onChange={(e) => setNewProduct({ ...newProduct, stock: parseInt(e.target.value) })} className="mt-1 block w-full rounded-md border-stone-300 shadow-sm focus:border-stone-500 focus:ring-stone-500 dark:bg-stone-800 dark:border-stone-700" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-stone-700 dark:text-stone-300">Type</label>
                                    <select value={newProduct.product_type} onChange={(e) => setNewProduct({ ...newProduct, product_type: e.target.value })} className="mt-1 block w-full rounded-md border-stone-300 shadow-sm focus:border-stone-500 focus:ring-stone-500 dark:bg-stone-800 dark:border-stone-700">
                                        <option value="kit">Kit</option>
                                        <option value="accessory">Accessory</option>
                                        <option value="finished">Finished Work</option>
                                    </select>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-stone-700 dark:text-stone-300">Dimensions</label>
                                    <input type="text" value={newProduct.dimensions} onChange={(e) => setNewProduct({ ...newProduct, dimensions: e.target.value })} placeholder="e.g. 20x30 cm" className="mt-1 block w-full rounded-md border-stone-300 shadow-sm focus:border-stone-500 focus:ring-stone-500 dark:bg-stone-800 dark:border-stone-700" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-stone-700 dark:text-stone-300">Colors</label>
                                    <input type="text" value={newProduct.colors} onChange={(e) => setNewProduct({ ...newProduct, colors: e.target.value })} placeholder="e.g. 15 colors" className="mt-1 block w-full rounded-md border-stone-300 shadow-sm focus:border-stone-500 focus:ring-stone-500 dark:bg-stone-800 dark:border-stone-700" />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-2">Formats</label>
                                <div className="flex gap-4">
                                    <label className="flex items-center gap-2 text-sm">
                                        <input 
                                            type="checkbox" 
                                            checked={newProduct.formats.includes('Printed')} 
                                            onChange={e => {
                                                const newFormats = e.target.checked 
                                                    ? [...newProduct.formats, 'Printed']
                                                    : newProduct.formats.filter(f => f !== 'Printed');
                                                setNewProduct({ ...newProduct, formats: newFormats });
                                            }}
                                            className="rounded border-stone-300 text-stone-900 focus:ring-stone-900"
                                        />
                                        Printed
                                    </label>
                                    <label className="flex items-center gap-2 text-sm">
                                        <input 
                                            type="checkbox" 
                                            checked={newProduct.formats.includes('Diagram')} 
                                            onChange={e => {
                                                const newFormats = e.target.checked 
                                                    ? [...newProduct.formats, 'Diagram']
                                                    : newProduct.formats.filter(f => f !== 'Diagram');
                                                setNewProduct({ ...newProduct, formats: newFormats });
                                            }}
                                            className="rounded border-stone-300 text-stone-900 focus:ring-stone-900"
                                        />
                                        Diagram
                                    </label>
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-stone-700 dark:text-stone-300">Description</label>
                                <textarea value={newProduct.description} onChange={(e) => setNewProduct({ ...newProduct, description: e.target.value })} className="mt-1 block w-full rounded-md border-stone-300 shadow-sm focus:border-stone-500 focus:ring-stone-500 dark:bg-stone-800 dark:border-stone-700 h-20 resize-none" />
                            </div>
                            <button onClick={handleSaveProduct} className="w-full mt-4 rounded-md bg-stone-900 px-4 py-2 text-sm font-medium text-white hover:bg-stone-800 dark:bg-white dark:text-stone-900">
                                {editingProductId ? 'Save Changes' : 'Add Product'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Bundle Modal */}
            {isBundleModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
                    <div className="w-full max-w-md bg-white dark:bg-stone-900 rounded-xl shadow-xl p-6 border border-stone-200 dark:border-stone-800">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-lg font-serif font-medium text-stone-900 dark:text-white">{editingBundleId ? 'Edit Bundle' : 'New Bundle Offer'}</h3>
                            <button onClick={() => setIsBundleModalOpen(false)}><X className="h-5 w-5 text-stone-500" /></button>
                        </div>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-stone-700 dark:text-stone-300">Bundle Name</label>
                                <input type="text" placeholder="e.g. Summer Sale" value={newBundle.name} onChange={(e) => setNewBundle({ ...newBundle, name: e.target.value })} className="mt-1 block w-full rounded-md border-stone-300 shadow-sm focus:border-stone-500 focus:ring-stone-500 dark:bg-stone-800 dark:border-stone-700" />
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
                            {/* Product Selection for Bundle */}
                            <div>
                                <label className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-2">Included Products</label>
                                <div className="max-h-40 overflow-y-auto border border-stone-200 dark:border-stone-700 rounded-md p-2 space-y-2">
                                    {products.map(product => (
                                        <label key={product.id} className="flex items-center gap-2 text-sm">
                                            <input
                                                type="checkbox"
                                                checked={newBundle.productIds?.includes(product.id)}
                                                onChange={() => toggleProductInBundle(product.id)}
                                                className="rounded border-stone-300 text-stone-900 focus:ring-stone-500"
                                            />
                                            <span className="truncate">{product.title}</span>
                                        </label>
                                    ))}
                                </div>
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
        </div>
    );
}
