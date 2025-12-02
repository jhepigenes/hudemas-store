import Link from 'next/link';
import { Phone, Truck, CreditCard, RefreshCw, HelpCircle } from 'lucide-react';

export default function HelpPage() {
    return (
        <div className="min-h-screen bg-stone-50 dark:bg-stone-950 pt-32 pb-20">
            <div className="max-w-4xl mx-auto px-4 sm:px-6">
                <div className="text-center mb-16">
                    <h1 className="font-serif text-4xl md:text-5xl text-stone-900 dark:text-white mb-6">
                        Cum Comand? (How to Order)
                    </h1>
                    <p className="text-xl text-stone-600 dark:text-stone-300">
                        A simple guide for our cherished customers. We are here to help.
                    </p>
                </div>

                <div className="space-y-12">
                    {/* Section 1: Ordering */}
                    <div className="bg-white dark:bg-stone-900 rounded-2xl p-8 shadow-sm border border-stone-100 dark:border-stone-800">
                        <div className="flex items-start gap-6">
                            <div className="p-4 bg-green-100 dark:bg-green-900/30 rounded-full">
                                <Phone className="h-8 w-8 text-green-700 dark:text-green-400" />
                            </div>
                            <div>
                                <h2 className="font-serif text-2xl font-bold text-stone-900 dark:text-white mb-4">
                                    1. Order by Phone
                                </h2>
                                <p className="text-lg text-stone-600 dark:text-stone-300 mb-4">
                                    Not comfortable with technology? No problem. Call us directly, and we will place the order for you.
                                </p>
                                <a href="tel:+40722890794" className="inline-block text-2xl font-bold text-stone-900 dark:text-white border-b-2 border-green-500 hover:text-green-600 transition-colors">
                                    0722 890 794
                                </a>
                                <p className="text-sm text-stone-500 mt-2">Available Mon-Fri, 09:00 - 17:00</p>
                            </div>
                        </div>
                    </div>

                    {/* Section 2: Online Order */}
                    <div className="bg-white dark:bg-stone-900 rounded-2xl p-8 shadow-sm border border-stone-100 dark:border-stone-800">
                        <div className="flex items-start gap-6">
                            <div className="p-4 bg-blue-100 dark:bg-blue-900/30 rounded-full">
                                <CreditCard className="h-8 w-8 text-blue-700 dark:text-blue-400" />
                            </div>
                            <div>
                                <h2 className="font-serif text-2xl font-bold text-stone-900 dark:text-white mb-4">
                                    2. Order Online
                                </h2>
                                <ol className="list-decimal list-inside space-y-3 text-lg text-stone-600 dark:text-stone-300">
                                    <li>Browse the <Link href="/shop" className="underline text-stone-900 dark:text-white">Shop</Link> and find a Gobelin you love.</li>
                                    <li>Click the big <strong>"Add to Cart"</strong> button.</li>
                                    <li>Click the Shopping Bag icon (top right) and select <strong>"Checkout"</strong>.</li>
                                    <li>Fill in your delivery address.</li>
                                </ol>
                            </div>
                        </div>
                    </div>

                    {/* Section 3: Payment */}
                    <div className="bg-white dark:bg-stone-900 rounded-2xl p-8 shadow-sm border border-stone-100 dark:border-stone-800">
                        <div className="flex items-start gap-6">
                            <div className="p-4 bg-purple-100 dark:bg-purple-900/30 rounded-full">
                                <Truck className="h-8 w-8 text-purple-700 dark:text-purple-400" />
                            </div>
                            <div>
                                <h2 className="font-serif text-2xl font-bold text-stone-900 dark:text-white mb-4">
                                    Payment & Delivery
                                </h2>
                                <p className="text-lg text-stone-600 dark:text-stone-300 mb-4">
                                    We trust our customers. You can choose <strong>"Ramburs" (Cash on Delivery)</strong>.
                                </p>
                                <ul className="list-disc list-inside space-y-2 text-stone-600 dark:text-stone-300">
                                    <li>Pay cash to the courier when the package arrives.</li>
                                    <li>Or pay securely online with a card.</li>
                                    <li>Shipping cost: <strong>19 RON</strong> (Courier) or <strong>12 RON</strong> (Easybox).</li>
                                </ul>
                            </div>
                        </div>
                    </div>

                    {/* Section 4: Returns */}
                    <div className="bg-white dark:bg-stone-900 rounded-2xl p-8 shadow-sm border border-stone-100 dark:border-stone-800">
                        <div className="flex items-start gap-6">
                            <div className="p-4 bg-orange-100 dark:bg-orange-900/30 rounded-full">
                                <RefreshCw className="h-8 w-8 text-orange-700 dark:text-orange-400" />
                            </div>
                            <div>
                                <h2 className="font-serif text-2xl font-bold text-stone-900 dark:text-white mb-4">
                                    Returns & Guarantee
                                </h2>
                                <p className="text-lg text-stone-600 dark:text-stone-300">
                                    If you are not happy with your kit, you can return it within <strong>14 days</strong> for a full refund. No questions asked.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="mt-16 text-center">
                    <Link href="/shop" className="inline-flex items-center justify-center px-8 py-4 text-lg font-medium text-white bg-stone-900 rounded-full hover:bg-stone-800 dark:bg-white dark:text-stone-900 transition-colors">
                        Start Shopping Now
                    </Link>
                </div>
            </div>
        </div>
    );
}
