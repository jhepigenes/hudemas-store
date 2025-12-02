import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { ArrowLeft } from 'lucide-react';

export async function generateStaticParams() {
    const { data: articles } = await supabaseAdmin.from('articles').select('slug');
    return articles?.map((a: any) => ({ slug: a.slug })) || [];
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params;
    const { data: article } = await supabaseAdmin.from('articles').select('*').eq('slug', slug).single();
    
    if (!article) return { title: 'Article Not Found' };

    return {
        title: `${article.title} | Hudemas Atelier`,
        description: article.excerpt,
        openGraph: {
            images: article.image_url ? [article.image_url] : [],
        },
    };
}

export default async function ArticlePage({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params;
    const { data: article } = await supabaseAdmin
        .from('articles')
        .select('*')
        .eq('slug', slug)
        .single();

    if (!article) notFound();

    return (
        <div className="min-h-screen bg-white dark:bg-stone-950 pt-32 pb-20">
            <article className="max-w-3xl mx-auto px-4 sm:px-6">
                <Link 
                    href="/blog" 
                    className="inline-flex items-center gap-2 text-sm text-stone-500 hover:text-stone-900 dark:hover:text-white mb-8 transition-colors"
                >
                    <ArrowLeft className="h-4 w-4" /> Back to Atelier
                </Link>

                <header className="mb-12 text-center">
                    <div className="text-sm text-stone-500 mb-4 uppercase tracking-wider">
                        {new Date(article.published_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                    </div>
                    <h1 className="font-serif text-4xl md:text-5xl text-stone-900 dark:text-white leading-tight mb-6">
                        {article.title}
                    </h1>
                    {article.excerpt && (
                        <p className="text-xl text-stone-600 dark:text-stone-300 leading-relaxed">
                            {article.excerpt}
                        </p>
                    )}
                </header>

                {article.image_url && (
                    <div className="relative aspect-video w-full rounded-2xl overflow-hidden mb-12 bg-stone-100 dark:bg-stone-900">
                        <Image
                            src={article.image_url}
                            alt={article.title}
                            fill
                            className="object-cover"
                            priority
                        />
                    </div>
                )}

                <div 
                    className="prose prose-stone dark:prose-invert prose-lg mx-auto font-serif"
                    dangerouslySetInnerHTML={{ __html: article.content }}
                />
            </article>
        </div>
    );
}
