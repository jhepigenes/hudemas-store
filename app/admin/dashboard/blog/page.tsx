'use client';

import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Loader2, FileText } from 'lucide-react';

export default function BlogManager() {
    const [articles, setArticles] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [currentArticle, setCurrentArticle] = useState<any>({
        title: '',
        slug: '',
        excerpt: '',
        content: '',
        image_url: ''
    });

    useEffect(() => {
        fetchArticles();
    }, []);

    const fetchArticles = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/admin/blog');
            const data = await res.json();
            if (Array.isArray(data)) setArticles(data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const res = await fetch('/api/admin/blog', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(currentArticle)
            });

            if (res.ok) {
                setIsEditing(false);
                setCurrentArticle({ title: '', slug: '', excerpt: '', content: '', image_url: '' });
                fetchArticles();
            } else {
                alert('Failed to save article');
            }
        } catch (error) {
            console.error(error);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Delete this article?')) return;
        await fetch(`/api/admin/blog?id=${id}`, { method: 'DELETE' });
        fetchArticles();
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="font-serif text-2xl font-medium text-stone-900 dark:text-white">The Atelier (Blog)</h2>
                    <p className="text-stone-500">Manage content and articles.</p>
                </div>
                <button
                    onClick={() => {
                        setCurrentArticle({ title: '', slug: '', excerpt: '', content: '', image_url: '' });
                        setIsEditing(true);
                    }}
                    className="flex items-center gap-2 rounded-full bg-stone-900 px-4 py-2 text-sm font-medium text-white hover:bg-stone-800 dark:bg-white dark:text-stone-900"
                >
                    <Plus className="h-4 w-4" /> New Article
                </button>
            </div>

            {isEditing ? (
                <div className="bg-white dark:bg-stone-900 rounded-xl border border-stone-200 dark:border-stone-800 p-6 max-w-3xl">
                    <form onSubmit={handleSave} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium mb-1 dark:text-white">Title</label>
                            <input
                                type="text"
                                required
                                value={currentArticle.title}
                                onChange={e => setCurrentArticle({ ...currentArticle, title: e.target.value })}
                                className="w-full rounded-md border-stone-300 dark:bg-stone-800 dark:border-stone-700"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1 dark:text-white">Slug (Optional)</label>
                            <input
                                type="text"
                                value={currentArticle.slug}
                                onChange={e => setCurrentArticle({ ...currentArticle, slug: e.target.value })}
                                className="w-full rounded-md border-stone-300 dark:bg-stone-800 dark:border-stone-700"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1 dark:text-white">Excerpt</label>
                            <textarea
                                rows={2}
                                value={currentArticle.excerpt}
                                onChange={e => setCurrentArticle({ ...currentArticle, excerpt: e.target.value })}
                                className="w-full rounded-md border-stone-300 dark:bg-stone-800 dark:border-stone-700"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1 dark:text-white">Content (HTML)</label>
                            <textarea
                                rows={10}
                                required
                                value={currentArticle.content}
                                onChange={e => setCurrentArticle({ ...currentArticle, content: e.target.value })}
                                className="w-full rounded-md border-stone-300 dark:bg-stone-800 dark:border-stone-700 font-mono text-sm"
                            />
                        </div>
                        <div className="flex justify-end gap-2 pt-4">
                            <button type="button" onClick={() => setIsEditing(false)} className="px-4 py-2 text-stone-600 dark:text-stone-400">Cancel</button>
                            <button type="submit" className="px-4 py-2 bg-stone-900 text-white rounded-md dark:bg-white dark:text-stone-900">Save Article</button>
                        </div>
                    </form>
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-4">
                    {loading ? (
                        <div className="text-center py-12 text-stone-500">Loading...</div>
                    ) : articles.length === 0 ? (
                        <div className="text-center py-12 text-stone-500">No articles yet. Start writing!</div>
                    ) : (
                        articles.map(article => (
                            <div key={article.id} className="flex items-center justify-between bg-white dark:bg-stone-900 p-4 rounded-lg border border-stone-200 dark:border-stone-800">
                                <div>
                                    <h3 className="font-medium text-stone-900 dark:text-white">{article.title}</h3>
                                    <p className="text-sm text-stone-500 truncate max-w-md">{article.excerpt}</p>
                                </div>
                                <div className="flex gap-2">
                                    <button onClick={() => { setCurrentArticle(article); setIsEditing(true); }} className="p-2 text-stone-400 hover:text-stone-900 dark:hover:text-white">
                                        <Edit2 className="h-4 w-4" />
                                    </button>
                                    <button onClick={() => handleDelete(article.id)} className="p-2 text-red-400 hover:text-red-600">
                                        <Trash2 className="h-4 w-4" />
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            )}
        </div>
    );
}
