'use client';

import { useState, useEffect } from 'react';
import { Send, Copy, Monitor, Smartphone, Check, Pencil, Trash2, X, Save, Download, Image as ImageIcon, Loader2, Filter, Activity, GitCommit, Clock } from 'lucide-react';
import { createClient } from '@/lib/supabase';
import releaseInfo from '../release.json';

const PREVIEWS = [
    { name: 'Homepage', url: '/' },
    { name: 'Shop Catalog', url: '/shop' },
    { name: 'Product Page', url: '/product/vaza-cu-flori-023' },
    { name: 'Marketplace', url: '/marketplace' },
    { name: 'Blog', url: '/blog' },
    { name: 'Cart/Checkout', url: '/checkout' },
];

interface FeedbackItem {
    id: string;
    date: string;
    name: string;
    section: string;
    comment: string;
    status: 'open' | 'ready_for_review' | 'done';
    screenshot_url?: string;
}

export default function FeedbackPage() {
    const [feedback, setFeedback] = useState<FeedbackItem[]>([]);
    const [form, setForm] = useState({ name: '', section: 'General', comment: '', status: 'open', screenshot_url: '' });
    const [sending, setSending] = useState(false);
    const [copied, setCopied] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editForm, setEditForm] = useState({ comment: '', status: 'open' });
    const [uploading, setUploading] = useState(false);
    
    // Filters
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [sectionFilter, setSectionFilter] = useState<string>('all');
    const [nameFilter, setNameFilter] = useState<string>('all');

    const supabase = createClient();

    useEffect(() => {
        fetchFeedback();
    }, []);

    const fetchFeedback = async () => {
        const res = await fetch('/api/beta-feedback');
        const data = await res.json();
        if (Array.isArray(data)) setFeedback(data);
    };

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || e.target.files.length === 0) return;
        setUploading(true);
        const file = e.target.files[0];
        const formData = new FormData();
        formData.append('file', file);

        try {
            const res = await fetch('/api/upload', {
                method: 'POST',
                body: formData
            });

            if (!res.ok) throw new Error('Upload failed');

            const data = await res.json();
            setForm(prev => ({ ...prev, screenshot_url: data.url }));
        } catch (error) {
            alert('Upload failed. Please try again.');
            console.error(error);
        } finally {
            setUploading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSending(true);
        
        await fetch('/api/beta-feedback', {
            method: 'POST',
            body: JSON.stringify(form)
        });
        
        setForm({ name: '', section: 'General', comment: '', status: 'open', screenshot_url: '' });
        setSending(false);
        fetchFeedback();
    };

    const handleUpdate = async (id: string) => {
        const updatedList = feedback.map(item => 
            item.id === id ? { ...item, comment: editForm.comment, status: editForm.status as any } : item
        );
        
        setFeedback(updatedList);
        setEditingId(null);

        await fetch('/api/beta-feedback', {
            method: 'PUT',
            body: JSON.stringify(updatedList)
        });
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure?')) return;
        const updatedList = feedback.filter(item => item.id !== id);
        setFeedback(updatedList);

        await fetch('/api/beta-feedback', {
            method: 'PUT',
            body: JSON.stringify(updatedList)
        });
    };

    const startEdit = (item: FeedbackItem) => {
        setEditingId(item.id);
        setEditForm({ comment: item.comment, status: item.status || 'open' });
    };

    const copyToClipboard = () => {
        const text = feedback.map(f => `[${f.status.toUpperCase()}] [${f.section}] ${f.name}: ${f.comment} ${f.screenshot_url ? `(See: ${f.screenshot_url})` : ''}`).join('\n\n');
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const exportForGemini = () => {
        const data = feedback.filter(f => f.status !== 'done').map(f => ({
            instruction: `[Feedback for ${f.section}] ${f.comment} ${f.screenshot_url ? `(Screenshot: ${f.screenshot_url})` : ''}`,
            status: "pending",
            id: f.id,
            date: f.date,
            name: f.name,
            section: f.section,
            screenshot_url: f.screenshot_url
        }));
        
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'gemini_feedback_tasks.json';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'done': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 border-green-200';
            case 'ready_for_review': return 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400 border-amber-200';
            default: return 'bg-stone-100 text-stone-600 dark:bg-stone-800 dark:text-stone-400 border-stone-200';
        }
    };

    const filteredFeedback = feedback.filter(item => {
        if (statusFilter !== 'all' && item.status !== statusFilter) return false;
        if (sectionFilter !== 'all' && item.section !== sectionFilter) return false;
        if (nameFilter !== 'all' && item.name !== nameFilter) return false;
        return true;
    });

    const uniqueNames = Array.from(new Set(feedback.map(f => f.name))).sort();

    const [showReleaseDetails, setShowReleaseDetails] = useState(false);

    // ... (existing useEffects) ...

    // Stats Calculation
    const stats = {
        open: feedback.filter(f => f.status === 'open' || !f.status).length,
        ready: feedback.filter(f => f.status === 'ready_for_review').length,
        done: feedback.filter(f => f.status === 'done').length,
        total: feedback.length
    };

    return (
        <div className="min-h-screen bg-stone-50 dark:bg-stone-950 pt-24 pb-12 px-4 flex flex-col">
            {/* Background Pattern Overlay (CSS) */}
            <div className="fixed inset-0 opacity-[0.03] pointer-events-none" style={{ 
                backgroundImage: 'radial-gradient(#444 1px, transparent 1px)', 
                backgroundSize: '20px 20px' 
            }}></div>

            <div className="max-w-7xl mx-auto w-full flex-1 flex flex-col relative z-10">
                <div className="text-center mb-8 flex-shrink-0 flex flex-col items-center">
                    <div className="w-16 h-16 mb-4 bg-stone-100 dark:bg-stone-800 rounded-full flex items-center justify-center text-3xl shadow-sm">
                        🧵
                    </div>
                    <h1 className="font-serif text-4xl text-stone-900 dark:text-white mb-4">Beta Feedback Portal</h1>
                    <p className="text-stone-600 dark:text-stone-400">Review the site sections below and leave your thoughts.</p>
                </div>

                {/* System Overview Dashboard */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                    <div className="bg-white dark:bg-stone-900 p-4 rounded-xl border border-stone-200 dark:border-stone-800 shadow-sm">
                        <div className="flex items-center gap-2 text-stone-500 mb-1">
                            <GitCommit className="h-4 w-4" />
                            <span className="text-xs font-medium uppercase tracking-wide">Current Version</span>
                        </div>
                        <p className="text-lg font-mono font-bold text-stone-900 dark:text-white truncate" title={releaseInfo.version}>
                            {releaseInfo.version}
                        </p>
                    </div>
                    <div 
                        onClick={() => setShowReleaseDetails(true)}
                        className="bg-white dark:bg-stone-900 p-4 rounded-xl border border-stone-200 dark:border-stone-800 shadow-sm cursor-pointer hover:border-stone-400 transition-colors group"
                    >
                        <div className="flex items-center gap-2 text-stone-500 mb-1 group-hover:text-stone-900 dark:group-hover:text-stone-200 transition-colors">
                            <Clock className="h-4 w-4" />
                            <span className="text-xs font-medium uppercase tracking-wide">Last Updated</span>
                        </div>
                        <p className="text-lg font-bold text-stone-900 dark:text-white">
                            {new Date(releaseInfo.lastUpdated).toLocaleDateString()}
                        </p>
                        <p className="text-xs text-stone-400 truncate" title={releaseInfo.note}>
                            {releaseInfo.note}
                        </p>
                    </div>
                    <div className="md:col-span-2 bg-white dark:bg-stone-900 p-4 rounded-xl border border-stone-200 dark:border-stone-800 shadow-sm flex items-center justify-between gap-4">
                        <div className="flex flex-col items-center flex-1">
                            <span className="text-xs font-medium uppercase tracking-wide text-stone-500 mb-1">Open</span>
                            <span className="text-2xl font-bold text-stone-900 dark:text-white">{stats.open}</span>
                        </div>
                        <div className="w-px h-8 bg-stone-200 dark:bg-stone-800"></div>
                        <div className="flex flex-col items-center flex-1">
                            <span className="text-xs font-medium uppercase tracking-wide text-amber-600 dark:text-amber-500 mb-1">Ready</span>
                            <span className="text-2xl font-bold text-amber-600 dark:text-amber-500">{stats.ready}</span>
                        </div>
                        <div className="w-px h-8 bg-stone-200 dark:bg-stone-800"></div>
                        <div className="flex flex-col items-center flex-1">
                            <span className="text-xs font-medium uppercase tracking-wide text-green-600 dark:text-green-500 mb-1">Done</span>
                            <span className="text-2xl font-bold text-green-600 dark:text-green-500">{stats.done}</span>
                        </div>
                        <div className="w-px h-8 bg-stone-200 dark:bg-stone-800"></div>
                        <div className="flex flex-col items-center flex-1">
                            <span className="text-xs font-medium uppercase tracking-wide text-stone-400 mb-1">Total</span>
                            <span className="text-2xl font-bold text-stone-400">{stats.total}</span>
                        </div>
                    </div>
                </div>

                {/* Release Details Modal */}
                {showReleaseDetails && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" onClick={() => setShowReleaseDetails(false)}>
                        <div className="bg-white dark:bg-stone-900 rounded-2xl shadow-xl max-w-2xl w-full p-6 border border-stone-200 dark:border-stone-800 max-h-[80vh] flex flex-col" onClick={e => e.stopPropagation()}>
                            <div className="flex justify-between items-start mb-4 flex-shrink-0">
                                <h3 className="text-xl font-serif font-medium text-stone-900 dark:text-white">Release Information</h3>
                                <button onClick={() => setShowReleaseDetails(false)} className="text-stone-400 hover:text-stone-900 dark:hover:text-white"><X className="h-5 w-5" /></button>
                            </div>
                            
                            <div className="space-y-6 overflow-y-auto pr-2 flex-1">
                                {/* Current Version */}
                                <div className="bg-stone-50 dark:bg-stone-800/50 p-4 rounded-xl border border-stone-100 dark:border-stone-800">
                                    <div className="flex justify-between items-start mb-2">
                                        <div>
                                            <p className="text-xs text-stone-500 uppercase tracking-wide">Current Version</p>
                                            <p className="font-mono text-lg font-bold text-stone-900 dark:text-white mt-1">{releaseInfo.version}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-xs text-stone-500 uppercase tracking-wide">Deployed</p>
                                            <p className="text-sm text-stone-700 dark:text-stone-300 mt-1">{new Date(releaseInfo.lastUpdated).toLocaleString()}</p>
                                        </div>
                                    </div>
                                    <div className="mt-3">
                                        <p className="text-xs text-stone-500 uppercase tracking-wide mb-1">Latest Change</p>
                                        <p className="text-sm text-stone-800 dark:text-stone-200 bg-white dark:bg-stone-900 p-3 rounded-lg border border-stone-200 dark:border-stone-800">
                                            {releaseInfo.note}
                                        </p>
                                    </div>
                                </div>

                                {/* History List */}
                                <div>
                                    <h4 className="text-sm font-medium text-stone-900 dark:text-white mb-3 flex items-center gap-2">
                                        <Activity className="h-4 w-4" /> Release History
                                    </h4>
                                    <div className="space-y-3">
                                        {(releaseInfo as any).history?.map((item: any, i: number) => (
                                            <div key={i} className="flex gap-4 p-3 rounded-lg hover:bg-stone-50 dark:hover:bg-stone-800/50 transition-colors border border-transparent hover:border-stone-100 dark:hover:border-stone-800">
                                                <div className="flex-shrink-0 w-24">
                                                    <p className="text-xs font-mono text-stone-500">{item.hash}</p>
                                                    <p className="text-[10px] text-stone-400 mt-1">{new Date(item.date).toLocaleDateString()}</p>
                                                </div>
                                                <div className="flex-1">
                                                    <p className="text-sm text-stone-700 dark:text-stone-300 line-clamp-2">{item.message}</p>
                                                </div>
                                            </div>
                                        ))}
                                        {!(releaseInfo as any).history && <p className="text-sm text-stone-500 italic">No history available.</p>}
                                    </div>
                                </div>
                            </div>

                            <div className="mt-6 flex justify-end pt-4 border-t border-stone-100 dark:border-stone-800 flex-shrink-0">
                                <button onClick={() => setShowReleaseDetails(false)} className="px-4 py-2 bg-stone-900 text-white rounded-lg text-sm hover:bg-stone-800 transition-colors">Close</button>
                            </div>
                        </div>
                    </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 flex-1 min-h-0">
                    <div className="lg:col-span-2 space-y-12 overflow-y-auto pr-2 scrollbar-hide">
                        {PREVIEWS.map((item) => (
                            <div key={item.name} className="space-y-4">
                                <h3 className="text-xl font-serif text-stone-900 dark:text-white flex items-center gap-2">
                                    <Monitor className="h-5 w-5" /> {item.name}
                                </h3>
                                <div className="relative w-full aspect-video bg-stone-200 dark:bg-stone-800 rounded-xl overflow-hidden border border-stone-300 dark:border-stone-700 shadow-sm group">
                                    <iframe 
                                        src={item.url} 
                                        className="w-[200%] h-[200%] origin-top-left transform scale-50 border-none bg-white pointer-events-none group-hover:pointer-events-auto transition-all"
                                        loading="lazy"
                                    />
                                    <div className="absolute inset-0 flex items-center justify-center bg-black/5 pointer-events-none group-hover:hidden">
                                        <span className="bg-white/80 backdrop-blur px-3 py-1 rounded-full text-xs font-medium text-stone-600">
                                            Hover to Interact
                                        </span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="lg:col-span-1 flex flex-col gap-8 h-full">
                        <div className="bg-white dark:bg-stone-900 p-6 rounded-2xl shadow-lg border border-stone-200 dark:border-stone-800 flex-shrink-0">
                            <h3 className="text-lg font-medium text-stone-900 dark:text-white mb-4">Submit Feedback</h3>
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div>
                                    <label className="block text-xs font-medium text-stone-500 uppercase tracking-wide mb-1">Name</label>
                                    <input 
                                        type="text" 
                                        value={form.name}
                                        onChange={e => setForm({...form, name: e.target.value})}
                                        className="w-full rounded-lg bg-stone-50 dark:bg-stone-800 border-stone-200 dark:border-stone-700 text-stone-900 dark:text-white"
                                        placeholder="Your Name"
                                        required
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-medium text-stone-500 uppercase tracking-wide mb-1">Section</label>
                                        <select 
                                            value={form.section}
                                            onChange={e => setForm({...form, section: e.target.value})}
                                            className="w-full rounded-lg bg-stone-50 dark:bg-stone-800 border-stone-200 dark:border-stone-700 text-stone-900 dark:text-white"
                                        >
                                            <option>General</option>
                                            {PREVIEWS.map(p => <option key={p.name} value={p.name}>{p.name}</option>)}
                                            <option>Admin Panel</option>
                                            <option>Mobile Experience</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-stone-500 uppercase tracking-wide mb-1">Status</label>
                                        <select 
                                            value={form.status}
                                            onChange={e => setForm({...form, status: e.target.value as any})}
                                            className="w-full rounded-lg bg-stone-50 dark:bg-stone-800 border-stone-200 dark:border-stone-700 text-stone-900 dark:text-white"
                                        >
                                            <option value="open">Open</option>
                                            <option value="ready_for_review">Ready for Review</option>
                                            <option value="done">Done</option>
                                        </select>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-stone-500 uppercase tracking-wide mb-1">Feedback</label>
                                    <textarea 
                                        value={form.comment}
                                        onChange={e => setForm({...form, comment: e.target.value})}
                                        className="w-full rounded-lg bg-stone-50 dark:bg-stone-800 border-stone-200 dark:border-stone-700 min-h-[100px] text-stone-900 dark:text-white"
                                        placeholder="What works? What's broken?"
                                        required
                                    />
                                </div>
                                
                                {/* Image Upload */}
                                <div>
                                    <label className="block text-xs font-medium text-stone-500 uppercase tracking-wide mb-1">Screenshot (Optional)</label>
                                    <div className="flex items-center gap-2">
                                        <label className="flex-1 cursor-pointer">
                                            <div className="flex items-center justify-center gap-2 w-full rounded-lg border border-dashed border-stone-300 dark:border-stone-700 p-3 hover:bg-stone-50 dark:hover:bg-stone-800 transition-colors">
                                                {uploading ? (
                                                    <Loader2 className="h-4 w-4 animate-spin text-stone-500" />
                                                ) : (
                                                    <ImageIcon className="h-4 w-4 text-stone-500" />
                                                )}
                                                <span className="text-xs text-stone-500">
                                                    {form.screenshot_url ? 'Image Uploaded!' : uploading ? 'Uploading...' : 'Click to Upload'}
                                                </span>
                                            </div>
                                            <input 
                                                type="file" 
                                                accept="image/*" 
                                                className="hidden" 
                                                onChange={handleImageUpload}
                                                disabled={uploading}
                                            />
                                        </label>
                                        {form.screenshot_url && (
                                            <button 
                                                type="button"
                                                onClick={() => setForm(prev => ({ ...prev, screenshot_url: '' }))}
                                                className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"
                                            >
                                                <X className="h-4 w-4" />
                                            </button>
                                        )}
                                    </div>
                                </div>

                                <button 
                                    disabled={sending || uploading}
                                    className="w-full py-3 bg-stone-900 dark:bg-white text-white dark:text-stone-900 rounded-lg font-medium flex items-center justify-center gap-2 hover:opacity-90 transition-opacity disabled:opacity-50"
                                >
                                    {sending ? 'Saving...' : <><Send className="h-4 w-4" /> Submit</>}
                                </button>
                            </form>
                        </div>

                        <div className="bg-stone-100 dark:bg-stone-900/50 p-6 rounded-2xl border border-stone-200 dark:border-stone-800 flex-1 min-h-0 flex flex-col">
                            <div className="flex flex-col gap-4 mb-6 flex-shrink-0">
                                <div className="flex justify-between items-center">
                                    <h3 className="text-lg font-medium text-stone-900 dark:text-white">Tasks ({filteredFeedback.length})</h3>
                                    <div className="flex gap-2">
                                        <button 
                                            onClick={exportForGemini}
                                            className="text-xs font-medium text-stone-500 hover:text-stone-900 dark:hover:text-white flex items-center gap-1"
                                            title="Download JSON for AI"
                                        >
                                            <Download className="h-3 w-3" />
                                            Export
                                        </button>
                                        <button 
                                            onClick={copyToClipboard}
                                            className="text-xs font-medium text-stone-500 hover:text-stone-900 dark:hover:text-white flex items-center gap-1"
                                        >
                                            {copied ? <Check className="h-3 w-3 text-green-600" /> : <Copy className="h-3 w-3" />}
                                            {copied ? 'Copied' : 'Copy'}
                                        </button>
                                    </div>
                                </div>
                                
                                {/* Filters */}
                                <div className="flex gap-2">
                                    <div className="relative flex-1">
                                        <select
                                            value={statusFilter}
                                            onChange={(e) => setStatusFilter(e.target.value)}
                                            className="w-full pl-8 pr-2 py-1.5 rounded-lg text-xs border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-white appearance-none"
                                        >
                                            <option value="all">All Statuses</option>
                                            <option value="open">Open</option>
                                            <option value="ready_for_review">Ready for Review</option>
                                            <option value="done">Done</option>
                                        </select>
                                        <Filter className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-stone-400" />
                                    </div>
                                    <div className="relative flex-1">
                                        <select
                                            value={sectionFilter}
                                            onChange={(e) => setSectionFilter(e.target.value)}
                                            className="w-full pl-2 pr-2 py-1.5 rounded-lg text-xs border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-white appearance-none"
                                        >
                                            <option value="all">All Sections</option>
                                            <option value="General">General</option>
                                            {PREVIEWS.map(p => <option key={p.name} value={p.name}>{p.name}</option>)}
                                            <option value="Admin Panel">Admin Panel</option>
                                            <option value="Mobile Experience">Mobile Experience</option>
                                        </select>
                                    </div>
                                    <div className="relative flex-1">
                                        <select
                                            value={nameFilter}
                                            onChange={(e) => setNameFilter(e.target.value)}
                                            className="w-full pl-2 pr-2 py-1.5 rounded-lg text-xs border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-white appearance-none"
                                        >
                                            <option value="all">All Users</option>
                                            {uniqueNames.map(name => (
                                                <option key={name} value={name}>{name}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-4 overflow-y-auto flex-1 pr-2 scrollbar-thin scrollbar-thumb-stone-300 dark:scrollbar-thumb-stone-700">
                                {filteredFeedback.length === 0 && <p className="text-stone-500 text-sm italic text-center py-8">No tasks match filter.</p>}
                                {filteredFeedback.map((item) => (
                                    <div key={item.id} className={`bg-white dark:bg-stone-900 p-4 rounded-lg shadow-sm text-sm group relative border-l-4 transition-all hover:shadow-md ${ 
                                        item.status === 'done' ? 'border-l-green-500 opacity-60' : 
                                        item.status === 'ready_for_review' ? 'border-l-amber-500' : 'border-l-stone-300'
                                    }`}> 
                                        <div className="flex justify-between mb-2">
                                            <span className="font-bold text-stone-900 dark:text-white">{item.name}</span>
                                            <span className="text-xs text-stone-500">{new Date(item.date).toLocaleDateString()}</span>
                                        </div>
                                        <div className="flex flex-wrap gap-2 mb-3">
                                            <span className="inline-block px-2 py-0.5 bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400 rounded text-xs border border-stone-200 dark:border-stone-700">
                                                {item.section}
                                            </span>
                                            <span className={`inline-block px-2 py-0.5 rounded text-xs uppercase font-bold tracking-wider border ${getStatusColor(item.status || 'open')}`}>
                                                {item.status === 'ready_for_review' ? 'READY' : (item.status || 'OPEN')}
                                            </span>
                                        </div>
                                        
                                        {editingId === item.id ? (
                                            <div className="mt-2 bg-stone-50 dark:bg-stone-800/50 p-3 rounded-lg">
                                                <div className="mb-2">
                                                    <select 
                                                        value={editForm.status}
                                                        onChange={e => setEditForm(prev => ({ ...prev, status: e.target.value }))}
                                                        className="w-full p-2 rounded border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-white text-sm mb-2"
                                                    >
                                                        <option value="open">Open</option>
                                                        <option value="ready_for_review">Ready for Review</option>
                                                        <option value="done">Done</option>
                                                    </select>
                                                    <textarea
                                                        value={editForm.comment}
                                                        onChange={e => setEditForm(prev => ({ ...prev, comment: e.target.value }))}
                                                        className="w-full p-2 rounded border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-white text-sm"
                                                        rows={3}
                                                    />
                                                </div>
                                                <div className="flex justify-end gap-2">
                                                    <button onClick={() => setEditingId(null)} className="px-3 py-1 text-stone-600 hover:bg-stone-200 rounded text-xs">Cancel</button>
                                                    <button onClick={() => handleUpdate(item.id)} className="px-3 py-1 bg-stone-900 text-white rounded text-xs hover:bg-stone-800">Save</button>
                                                </div>
                                            </div>
                                        ) : (
                                            <>
                                                <p className="text-stone-700 dark:text-stone-300 whitespace-pre-wrap pr-8 leading-relaxed">{item.comment}</p>
                                                {item.screenshot_url && (
                                                    <a 
                                                        href={item.screenshot_url} 
                                                        target="_blank" 
                                                        rel="noopener noreferrer" 
                                                        className="mt-3 inline-flex items-center gap-2 text-xs text-stone-600 hover:text-blue-600 bg-stone-100 dark:bg-stone-800 px-3 py-2 rounded-lg transition-colors border border-stone-200 dark:border-stone-700"
                                                    >
                                                        <ImageIcon className="h-3 w-3" />
                                                        View Screenshot
                                                    </a>
                                                )}
                                            </>
                                        )}

                                        {editingId !== item.id && (
                                            <div className="absolute top-4 right-4 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity bg-white dark:bg-stone-900 p-1 rounded-lg shadow-sm border border-stone-100 dark:border-stone-800">
                                                <button 
                                                    onClick={() => startEdit(item)}
                                                    className="p-1.5 text-stone-400 hover:text-stone-900 dark:hover:text-white hover:bg-stone-100 dark:hover:bg-stone-800 rounded"
                                                    title="Edit"
                                                >
                                                    <Pencil className="h-3.5 w-3.5" />
                                                </button>
                                                <button 
                                                    onClick={() => handleDelete(item.id)}
                                                    className="p-1.5 text-stone-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
                                                    title="Delete"
                                                >
                                                    <Trash2 className="h-3.5 w-3.5" />
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}