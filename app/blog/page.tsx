import Link from 'next/link';
import Image from 'next/image';
import { supabaseAdmin } from '@/lib/supabase-admin';
import InstagramFeed from '../components/InstagramFeed';

export const revalidate = 3600; // Revalidate every hour

export default async function BlogList() {
    const { data: articles } = await supabaseAdmin
        .from('articles')
        .select('*')
        .order('published_at', { ascending: false });

    return (
        <div className="min-h-screen bg-stone-50 dark:bg-stone-950 pt-32 pb-20 px-4 sm:px-6 lg:px-8">
            <div className="max-w-7xl mx-auto">
                <div className="text-center mb-16">
                    <h1 className="font-serif text-4xl md:text-5xl text-stone-900 dark:text-white mb-4">The Atelier</h1>
                    <p className="text-lg text-stone-600 dark:text-stone-400 max-w-2xl mx-auto">
                        Stories of heritage, tips for your craft, and news from the Hudemas family.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {articles?.map((article: any) => (
                        <Link key={article.id} href={`/blog/${article.slug}`} className="group">
                            <div className="bg-white dark:bg-stone-900 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 border border-stone-100 dark:border-stone-800 h-full flex flex-col">
                                <div className="relative h-48 w-full bg-stone-200 dark:bg-stone-800 overflow-hidden">
                                    {article.image_url ? (
                                        <Image
                                            src={article.image_url}
                                            alt={article.title}
                                            fill
                                            className="object-cover group-hover:scale-105 transition-transform duration-500"
                                        />
                                    ) : (
                                        <div className="absolute inset-0 flex items-center justify-center text-stone-400">
                                            <span className="font-serif text-2xl opacity-20">Hudemas</span>
                                        </div>
                                    )}
                                </div>
                                <div className="p-6 flex-1 flex flex-col">
                                    <div className="mb-2 flex items-center gap-2 text-xs font-medium text-stone-500 uppercase tracking-wider">
                                        <span>{new Date(article.published_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</span>
                                    </div>
                                    <h2 className="font-serif text-xl text-stone-900 dark:text-white mb-3 group-hover:text-stone-600 dark:group-hover:text-stone-300 transition-colors">
                                        {article.title}
                                    </h2>
                                    <p className="text-sm text-stone-600 dark:text-stone-400 line-clamp-3 flex-1">
                                        {article.excerpt}
                                    </p>
                                    <span className="mt-4 inline-flex items-center text-sm font-medium text-stone-900 dark:text-white underline decoration-stone-300 underline-offset-4 group-hover:decoration-stone-900 transition-all">
                                        Read Article
                                    </span>
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>

                {(!articles || articles.length === 0) && (
                    <div className="text-center py-20">
                        <p className="text-stone-500">Our atelier is quiet today. Check back soon for new stories.</p>
                    </div>
                )}
            </div>
            
            <InstagramFeed />
        </div>
    );
}
