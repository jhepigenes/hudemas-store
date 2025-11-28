import Image from 'next/image';
import { notFound } from 'next/navigation';
import productsData from '../../products.json';
import { Product } from '../../types/product';
import { slugify } from '../../utils/slug';
import ProductActions from './ProductActions';
import RelatedProducts from '../../components/RelatedProducts';

// Cast data
const products: Product[] = productsData as Product[];

// Generate static params for all products
export async function generateStaticParams() {
    return products.map((product) => ({
        slug: slugify(product.name),
    }));
}

export default async function ProductPage({
    params,
}: {
    params: Promise<{ slug: string }>;
}) {
    const { slug } = await params;
    const product = products.find((p) => slugify(p.name) === slug);

    if (!product) {
        notFound();
    }

    return (
        <div className="min-h-screen bg-stone-50 dark:bg-stone-950 transition-colors duration-300">
            <main className="mx-auto max-w-7xl px-4 py-32 sm:px-6 lg:px-8">
                <div className="grid grid-cols-1 gap-12 lg:grid-cols-2 lg:gap-24">
                    {/* Image Section */}
                    <div className="relative aspect-square w-full overflow-hidden bg-stone-100 dark:bg-stone-800 lg:aspect-[4/5]">
                        <Image
                            src={product.image}
                            alt={product.name}
                            fill
                            className="object-cover"
                            priority
                        />
                    </div>

                    {/* Details Section */}
                    <div className="flex flex-col justify-center">
                        <h1 className="font-serif text-4xl text-stone-900 dark:text-white md:text-5xl lg:text-6xl">
                            {product.name}
                        </h1>
                        
                        {/* Interactive Price & Actions */}
                        <div className="mt-8">
                            <ProductActions product={product} />
                        </div>

                        <div className="mt-8 space-y-6 text-lg leading-relaxed text-stone-600 dark:text-stone-300 font-sans">
                            <p>
                                A masterpiece of needlework, capturing the essence of {product.name.toLowerCase()}.
                                Each stitch tells a story of patience and precision, handcrafted to bring timeless beauty into your home.
                            </p>
                            <p>
                                This Gobelin tapestry is a testament to the Hudemas family tradition,
                                perfect for collectors who appreciate the finer details of life.
                            </p>
                        </div>

                        {/* Additional Info */}
                        <div className="mt-12 border-t border-stone-200 pt-8 dark:border-stone-800">
                            <dl className="grid grid-cols-1 gap-x-8 gap-y-6 sm:grid-cols-2">
                                <div>
                                    <dt className="font-medium text-stone-900 dark:text-white">Authenticity</dt>
                                    <dd className="mt-2 text-stone-500 dark:text-stone-400">Handcrafted Original</dd>
                                </div>
                                <div>
                                    <dt className="font-medium text-stone-900 dark:text-white">Shipping</dt>
                                    <dd className="mt-2 text-stone-500 dark:text-stone-400">Worldwide Delivery</dd>
                                </div>
                            </dl>
                        </div>
                    </div>
                </div>

                <RelatedProducts currentProduct={product} allProducts={products} />
            </main>
        </div>
    );
}
