'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useCart } from '../context/CartContext';
import { useCurrency } from '../context/CurrencyContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { MapPin, Truck, Box } from 'lucide-react';
import { createClient } from '@/lib/supabase';
import StripePaymentModal from '../components/StripePaymentModal';

export default function CheckoutPage() {
    const { items, cartTotal, subtotal, discount } = useCart();
    const { formatPrice } = useCurrency();
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [paymentMethod, setPaymentMethod] = useState<'card' | 'cod'>('cod');
    const [shippingMethod, setShippingMethod] = useState<'courier' | 'easybox'>('courier');
    const [customerType, setCustomerType] = useState<'private' | 'company'>('private');
    
    // Stripe State
    const [clientSecret, setClientSecret] = useState<string | null>(null);
    const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
    const [pendingOrderId, setPendingOrderId] = useState<string | null>(null);

    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        country: 'Romania',
        county: '', // Județ
        city: '',
        address: '',
        zipCode: '',
        companyName: '',
        vatId: '',
    });

    useEffect(() => {
        const fetchProfile = async () => {
            const supabase = createClient();
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                const { data: profile } = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('id', user.id)
                    .single();
                
                if (profile) {
                    setFormData(prev => ({
                        ...prev,
                        email: user.email || '',
                        firstName: profile.full_name?.split(' ')[0] || '',
                        lastName: profile.full_name?.split(' ').slice(1).join(' ') || '',
                        phone: profile.phone || '',
                        address: profile.address || '',
                        city: profile.city || '',
                        county: profile.county || '',
                        country: profile.country || 'Romania',
                    }));
                }
            }
        };
        fetchProfile();
    }, []);

    if (items.length === 0) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-stone-50 dark:bg-stone-900">
                <h1 className="text-2xl font-serif text-stone-900 dark:text-white">Your cart is empty</h1>
                <Link href="/" className="mt-4 underline text-stone-600 dark:text-stone-400">Return to Shop</Link>
            </div>
        );
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        // Get current user if logged in
        const supabase = createClient();
        const { data: { session } } = await supabase.auth.getSession();

        try {
            // Update Profile if user is logged in
            if (session?.user) {
                await supabase
                    .from('profiles')
                    .update({
                        phone: formData.phone,
                        address: formData.address,
                        city: formData.city,
                        county: formData.county,
                        country: formData.country,
                        full_name: `${formData.firstName} ${formData.lastName}`.trim()
                    })
                    .eq('id', session.user.id);
            }

            const response = await fetch('/api/create-order', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    customer: formData,
                    items,
                    total: cartTotal,
                    paymentMethod,
                    shippingMethod,
                    customerType,
                    userId: session?.user?.id
                }),
            });

            if (response.ok) {
                const data = await response.json();
                
                if (paymentMethod === 'card' && data.clientSecret) {
                    // Open Stripe Modal
                    setPendingOrderId(data.orderId);
                    setClientSecret(data.clientSecret);
                    setIsPaymentModalOpen(true);
                } else {
                    // COD or other success
                    router.push(`/checkout/success?orderId=${data.orderId}`);
                }
            } else {
                const errorData = await response.json();
                alert(`Something went wrong: ${errorData.error}`);
            }
        } catch (error) {
            console.error(error);
            alert('Failed to place order.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handlePaymentSuccess = () => {
        setIsPaymentModalOpen(false);
        if (pendingOrderId) {
            router.push(`/checkout/success?orderId=${pendingOrderId}`);
        }
    };

    return (
        <div className="min-h-screen bg-stone-50 pt-24 pb-12 dark:bg-stone-950 lg:pt-32">
            {clientSecret && (
                <StripePaymentModal 
                    clientSecret={clientSecret} 
                    orderId={pendingOrderId || ''}
                    isOpen={isPaymentModalOpen} 
                    onSuccess={handlePaymentSuccess}
                    onCancel={() => setIsPaymentModalOpen(false)}
                />
            )}

            <div className="mx-auto grid max-w-7xl grid-cols-1 gap-x-8 gap-y-10 px-4 sm:px-6 lg:grid-cols-2 lg:px-8">

                {/* Left: Form */}
                <div className="order-2 lg:order-1">
                    <h2 className="font-serif text-3xl font-medium text-stone-900 dark:text-white">Shipping Details</h2>

                    {/* Customer Type Toggle */}
                    <div className="mt-6 flex rounded-md shadow-sm">
                        <button
                            type="button"
                            onClick={() => setCustomerType('private')}
                            className={`relative flex-1 px-4 py-2 text-sm font-medium rounded-l-md border focus:z-10 focus:outline-none ${customerType === 'private'
                                ? 'bg-stone-900 text-white border-stone-900 dark:bg-stone-50 dark:text-stone-900'
                                : 'bg-white text-stone-700 border-stone-300 hover:bg-stone-50 dark:bg-stone-900 dark:text-stone-300 dark:border-stone-700'
                                }`}
                        >
                            Private Individual
                        </button>
                        <button
                            type="button"
                            onClick={() => setCustomerType('company')}
                            className={`relative flex-1 px-4 py-2 text-sm font-medium rounded-r-md border-t border-b border-r focus:z-10 focus:outline-none ${customerType === 'company'
                                ? 'bg-stone-900 text-white border-stone-900 dark:bg-stone-50 dark:text-stone-900'
                                : 'bg-white text-stone-700 border-stone-300 hover:bg-stone-50 dark:bg-stone-900 dark:text-stone-300 dark:border-stone-700'
                                }`}
                        >
                            Company / Legal Entity
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="mt-8 grid grid-cols-1 gap-y-6 sm:grid-cols-2 sm:gap-x-4">

                        {/* Company Fields */}
                        {customerType === 'company' && (
                            <>
                                <div className="sm:col-span-2">
                                    <label htmlFor="companyName" className="block text-sm font-medium text-stone-700 dark:text-stone-300">Company Name</label>
                                    <input type="text" name="companyName" required={customerType === 'company'} onChange={handleChange} className="mt-1 block w-full rounded-md border-stone-300 shadow-sm focus:border-stone-500 focus:ring-stone-500 dark:bg-stone-900 dark:border-stone-700" />
                                </div>
                                <div className="sm:col-span-2">
                                    <label htmlFor="vatId" className="block text-sm font-medium text-stone-700 dark:text-stone-300">VAT ID (CUI)</label>
                                    <input type="text" name="vatId" placeholder="RO..." required={customerType === 'company'} onChange={handleChange} className="mt-1 block w-full rounded-md border-stone-300 shadow-sm focus:border-stone-500 focus:ring-stone-500 dark:bg-stone-900 dark:border-stone-700" />
                                </div>
                            </>
                        )}

                        <div>
                            <label htmlFor="firstName" className="block text-sm font-medium text-stone-700 dark:text-stone-300">First Name</label>
                            <input type="text" name="firstName" required onChange={handleChange} className="mt-1 block w-full rounded-md border-stone-300 shadow-sm focus:border-stone-500 focus:ring-stone-500 dark:bg-stone-900 dark:border-stone-700" />
                        </div>
                        <div>
                            <label htmlFor="lastName" className="block text-sm font-medium text-stone-700 dark:text-stone-300">Last Name</label>
                            <input type="text" name="lastName" required onChange={handleChange} className="mt-1 block w-full rounded-md border-stone-300 shadow-sm focus:border-stone-500 focus:ring-stone-500 dark:bg-stone-900 dark:border-stone-700" />
                        </div>
                        <div className="sm:col-span-2">
                            <label htmlFor="email" className="block text-sm font-medium text-stone-700 dark:text-stone-300">Email</label>
                            <input type="email" name="email" required onChange={handleChange} className="mt-1 block w-full rounded-md border-stone-300 shadow-sm focus:border-stone-500 focus:ring-stone-500 dark:bg-stone-900 dark:border-stone-700" />
                        </div>
                        <div className="sm:col-span-2">
                            <label htmlFor="phone" className="block text-sm font-medium text-stone-700 dark:text-stone-300">Phone</label>
                            <input type="tel" name="phone" placeholder="+40..." required onChange={handleChange} className="mt-1 block w-full rounded-md border-stone-300 shadow-sm focus:border-stone-500 focus:ring-stone-500 dark:bg-stone-900 dark:border-stone-700" />
                        </div>

                        {/* Country Selector */}
                        <div className="sm:col-span-2">
                            <label htmlFor="country" className="block text-sm font-medium text-stone-700 dark:text-stone-300">Country</label>
                            <select
                                name="country"
                                value={formData.country}
                                onChange={handleChange}
                                className="mt-1 block w-full rounded-md border-stone-300 shadow-sm focus:border-stone-500 focus:ring-stone-500 dark:bg-stone-900 dark:border-stone-700"
                            >
                                <option value="Romania">Romania</option>
                                <option value="Germany">Germany</option>
                                <option value="France">France</option>
                                <option value="Italy">Italy</option>
                                <option value="Spain">Spain</option>
                                <option value="United Kingdom">United Kingdom</option>
                                <option value="USA">United States</option>
                                {/* Add more as needed */}
                            </select>
                        </div>

                        <div className="sm:col-span-2">
                            <label htmlFor="address" className="block text-sm font-medium text-stone-700 dark:text-stone-300">Address</label>
                            <input type="text" name="address" required onChange={handleChange} className="mt-1 block w-full rounded-md border-stone-300 shadow-sm focus:border-stone-500 focus:ring-stone-500 dark:bg-stone-900 dark:border-stone-700" />
                        </div>
                        <div>
                            <label htmlFor="county" className="block text-sm font-medium text-stone-700 dark:text-stone-300">State / County</label>
                            <input type="text" name="county" required onChange={handleChange} className="mt-1 block w-full rounded-md border-stone-300 shadow-sm focus:border-stone-500 focus:ring-stone-500 dark:bg-stone-900 dark:border-stone-700" />
                        </div>
                        <div>
                            <label htmlFor="city" className="block text-sm font-medium text-stone-700 dark:text-stone-300">City</label>
                            <input type="text" name="city" required onChange={handleChange} className="mt-1 block w-full rounded-md border-stone-300 shadow-sm focus:border-stone-500 focus:ring-stone-500 dark:bg-stone-900 dark:border-stone-700" />
                        </div>

                        {/* Shipping Method Section */}
                        <div className="sm:col-span-2 mt-6">
                            <h3 className="font-serif text-xl font-medium text-stone-900 dark:text-white mb-4">Delivery Method</h3>
                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                <div
                                    onClick={() => setShippingMethod('courier')}
                                    className={`relative flex cursor-pointer flex-col rounded-lg border p-4 shadow-sm focus:outline-none ${shippingMethod === 'courier'
                                        ? 'border-stone-900 ring-1 ring-stone-900 dark:border-white dark:ring-white bg-stone-50 dark:bg-stone-800'
                                        : 'border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900'
                                        }`}
                                >
                                    <span className="flex flex-1">
                                        <span className="flex flex-col">
                                            <span className="block text-sm font-medium text-stone-900 dark:text-white flex items-center gap-2">
                                                <Truck className="h-4 w-4" /> FanCourier
                                            </span>
                                            <span className="mt-1 flex items-center text-sm text-stone-500 dark:text-stone-400">Home Delivery (24h)</span>
                                            <span className="mt-6 text-sm font-medium text-stone-900 dark:text-white">19.00 RON</span>
                                        </span>
                                    </span>
                                    <span className={`pointer-events-none absolute -inset-px rounded-lg border-2 ${shippingMethod === 'courier' ? 'border-stone-900 dark:border-white' : 'border-transparent'}`} aria-hidden="true" />
                                </div>

                                <div
                                    onClick={() => setShippingMethod('easybox')}
                                    className={`relative flex cursor-pointer flex-col rounded-lg border p-4 shadow-sm focus:outline-none ${shippingMethod === 'easybox'
                                        ? 'border-stone-900 ring-1 ring-stone-900 dark:border-white dark:ring-white bg-stone-50 dark:bg-stone-800'
                                        : 'border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900'
                                        }`}
                                >
                                    <span className="flex flex-1">
                                        <span className="flex flex-col">
                                            <span className="block text-sm font-medium text-stone-900 dark:text-white flex items-center gap-2">
                                                <Box className="h-4 w-4" /> Sameday Easybox
                                            </span>
                                            <span className="mt-1 flex items-center text-sm text-stone-500 dark:text-stone-400">Locker Pickup</span>
                                            <span className="mt-6 text-sm font-medium text-stone-900 dark:text-white">12.00 RON</span>
                                        </span>
                                    </span>
                                    <span className={`pointer-events-none absolute -inset-px rounded-lg border-2 ${shippingMethod === 'easybox' ? 'border-stone-900 dark:border-white' : 'border-transparent'}`} aria-hidden="true" />
                                </div>
                            </div>

                            {/* Mock Locker Map Button */}
                            {shippingMethod === 'easybox' && (
                                <div className="mt-4">
                                    <button
                                        type="button"
                                        onClick={() => alert('Opening Sameday Locker Map... (Mock)')}
                                        className="flex w-full items-center justify-center gap-2 rounded-md border border-stone-300 bg-white px-4 py-3 text-sm font-medium text-stone-700 shadow-sm hover:bg-stone-50 dark:bg-stone-800 dark:border-stone-700 dark:text-stone-300"
                                    >
                                        <MapPin className="h-4 w-4" />
                                        Select Locker from Map
                                    </button>
                                </div>
                            )}
                        </div>

                        <div className="sm:col-span-2 mt-6">
                            <h3 className="font-serif text-xl font-medium text-stone-900 dark:text-white">Payment Method</h3>
                            <div className="mt-4 space-y-4">
                                <div className="flex items-center">
                                    <input
                                        id="cod"
                                        name="paymentMethod"
                                        type="radio"
                                        checked={paymentMethod === 'cod'}
                                        onChange={() => setPaymentMethod('cod')}
                                        className="h-4 w-4 border-stone-300 text-stone-900 focus:ring-stone-500"
                                    />
                                    <label htmlFor="cod" className="ml-3 block text-sm font-medium text-stone-700 dark:text-stone-300">
                                        Cash on Delivery (Ramburs)
                                    </label>
                                </div>
                                <div className="flex items-center">
                                    <input
                                        id="card"
                                        name="paymentMethod"
                                        type="radio"
                                        checked={paymentMethod === 'card'}
                                        onChange={() => setPaymentMethod('card')}
                                        className="h-4 w-4 border-stone-300 text-stone-900 focus:ring-stone-500"
                                    />
                                    <label htmlFor="card" className="ml-3 block text-sm font-medium text-stone-700 dark:text-stone-300">
                                        Credit Card (Stripe)
                                    </label>
                                </div>
                            </div>
                        </div>

                        <div className="sm:col-span-2 mt-8">
                            <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full rounded-md bg-stone-900 px-8 py-4 text-base font-medium text-white shadow-sm hover:bg-stone-800 focus:outline-none focus:ring-2 focus:ring-stone-500 focus:ring-offset-2 disabled:opacity-50 dark:bg-white dark:text-stone-900"
                            >
                                {isLoading ? 'Processing...' : `Place Order - ${formatPrice(cartTotal + (shippingMethod === 'easybox' ? 12 : 19))}`}
                            </button>
                        </div>
                    </form>
                </div>

                {/* Right: Order Summary */}
                <div className="order-1 lg:order-2">
                    <div className="sticky top-32 rounded-lg border border-stone-200 bg-white p-6 shadow-sm dark:border-stone-800 dark:bg-stone-900">
                        <h2 className="font-serif text-xl font-medium text-stone-900 dark:text-white">Order Summary</h2>
                        <ul className="mt-6 divide-y divide-stone-200 dark:divide-stone-700">
                            {items.map((item) => (
                                <li key={item.name} className="flex py-6">
                                    <div className="h-24 w-24 flex-shrink-0 overflow-hidden rounded-md border border-stone-200 dark:border-stone-700">
                                        <img src={item.image} alt={item.name} className="h-full w-full object-cover object-center" />
                                    </div>
                                    <div className="ml-4 flex flex-1 flex-col">
                                        <div>
                                            <div className="flex justify-between text-base font-medium text-stone-900 dark:text-white">
                                                <h3>{item.name}</h3>
                                                <p className="ml-4">
                                                    {(() => {
                                                        const priceNum = typeof item.price === 'string' ? parseFloat(item.price.replace(',', '.')) : item.price;
                                                        return formatPrice(priceNum * item.quantity);
                                                    })()}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex flex-1 items-end justify-between text-sm">
                                            <p className="text-stone-500 dark:text-stone-400">Qty {item.quantity}</p>
                                        </div>
                                    </div>
                                </li>
                            ))}
                        </ul>
                        <div className="mt-6 border-t border-stone-200 pt-6 dark:border-stone-700">
                            <div className="flex items-center justify-between text-sm text-stone-600 dark:text-stone-400">
                                <p>Subtotal</p>
                                <p>{formatPrice(subtotal)}</p>
                            </div>
                            <div className="mt-2 flex items-center justify-between text-sm font-medium text-green-600">
                                <p>Discount</p>
                                <p>-{formatPrice(discount)}</p>
                            </div>
                            <div className="mt-2 flex items-center justify-between text-sm text-stone-600 dark:text-stone-400">
                                <p>Shipping</p>
                                <p>{formatPrice(shippingMethod === 'easybox' ? 12 : 19)}</p>
                            </div>
                            <div className="mt-6 flex items-center justify-between border-t border-stone-200 pt-6 text-base font-medium text-stone-900 dark:border-stone-700 dark:text-white">
                                <p>Total</p>
                                <p>{formatPrice(cartTotal + (shippingMethod === 'easybox' ? 12 : 19))}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
