import Image from 'next/image';
import { notFound } from 'next/navigation';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { Product } from '../../types/index';
import { slugify } from '../../utils/slug';
import ProductActions from './ProductActions';
import RelatedProducts from '../../components/RelatedProducts';
import ProductReviews from '../components/ProductReviews';

// Generate static params for all products
export async function generateStaticParams() {
    const { data: products } = await supabaseAdmin
        .from('products')
        .select('slug');

    if (!products) return [];

    return products
        .filter((p: { slug: string | null }) => p.slug)
        .map((product: { slug: string }) => ({
            slug: product.slug,
        }));
}

export default async function ProductPage({
    params,
}: {
    params: Promise<{ slug: string }>;
}) {
    const { slug } = await params;

    // Fetch product by slug (fuzzy match on title since we don't have slug column populated reliably yet?)
    // Actually, slugify(title) === slug.
    // But we can't query by computed column easily.
    // We should fetch all products and find? No, that's inefficient.
    // We should query by `slug` column if it exists.
    // I checked earlier and `slug` column exists.
    // Let's assume it's populated. If not, I might need to populate it.
    // But for now, let's try to find by title match if slug fails?
    // Or just fetch all and find (inefficient but safe for 1000 products).
    // 1000 products is small enough for SSG build, but for runtime...
    // Let's try to query by `slug` column first.

    let { data: productData, error } = await supabaseAdmin
        .from('products')
        .select('*')
        .eq('slug', slug)
        .single();

    if (!productData) {
        // Fallback: Fetch all and find match (if slug column is empty)
        const { data: allProducts } = await supabaseAdmin.from('products').select('*');
        if (allProducts) {
            productData = allProducts.find((p: any) => slugify(p.title) === slug);
        }
    }

    if (!productData) {
        notFound();
    }

    // Map DB fields to Product interface if needed
    // DB: title, image_url
    // Interface: name, image
    const product: Product = {
        ...productData,
        name: productData.title,
        image: productData.image_url || '/placeholder.jpg',
        // Ensure other fields match
    };

    // Fetch related products (same category, exclude current)
    const { data: relatedData } = await supabaseAdmin
        .from('products')
        .select('*')
        .eq('category', product.category)
        .neq('id', product.id)
        .limit(4);

    const relatedProducts = relatedData?.map((p: any) => ({
        ...p,
        name: p.title,
        image: p.image_url || '/placeholder.jpg'
    })) as Product[] || [];

    const jsonLd = {
        '@context': 'https://schema.org',
        '@type': 'Product',
        name: product.name,
        image: product.image,
        description: product.description || `A masterpiece of needlework, capturing the essence of ${product.name}.`,
        brand: {
            '@type': 'Brand',
            name: 'Hudemas',
        },
        offers: {
            '@type': 'Offer',
            url: `https://hudemas.ro/product/${slug}`,
            priceCurrency: product.currency || 'RON',
            price: typeof product.price === 'string' ? parseFloat(product.price.replace(',', '.')) : product.price,
            availability: (product.stock_quantity !== undefined && product.stock_quantity > 0) ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
        },
    };

    return (
        <div className="min-h-screen bg-stone-50 dark:bg-stone-950 transition-colors duration-300">
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
            />
            <main className="mx-auto max-w-7xl px-4 py-32 sm:px-6 lg:px-8">
                <div className="grid grid-cols-1 gap-12 lg:grid-cols-2 lg:gap-24">
                    {/* Image Section - Sticky on Desktop */}
                    <div className="relative w-full lg:sticky lg:top-32 lg:h-[calc(100vh-10rem)]">
                        <div className="relative aspect-square w-full overflow-hidden rounded-xl bg-stone-100 dark:bg-stone-800 lg:aspect-auto lg:h-full">
                            <Image
                                src={product.image}
                                alt={product.name}
                                fill
                                className="object-cover"
                                priority
                                sizes="(max-width: 768px) 100vw, 50vw"
                            />
                        </div>
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
                            {product.description && <p className="text-sm mt-4">{product.description}</p>}
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

                        <ProductReviews productId={product.id || ''} />
                    </div>
                </div>

                <RelatedProducts currentProduct={product} allProducts={relatedProducts} />
            </main>
        </div>
    );
}
