'use client';

import { useState, useEffect } from 'react';
import { Mail, Send, Loader2, Users } from 'lucide-react';

export default function NewsletterManager() {
    const [subscribers, setSubscribers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const [campaign, setCampaign] = useState({ subject: '', body: '' });

    useEffect(() => {
        fetchSubscribers();
    }, []);

    const fetchSubscribers = async () => {
        try {
            const res = await fetch('/api/admin/newsletter');
            const data = await res.json();
            if (Array.isArray(data)) setSubscribers(data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!confirm(`Send this email to ${subscribers.length} subscribers?`)) return;

        setSending(true);
        try {
            const res = await fetch('/api/admin/newsletter', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    subject: campaign.subject,
                    body: campaign.body, // In a real app, this would be HTML from a rich text editor
                    recipients: 'all'
                })
            });

            const result = await res.json();
            if (res.ok) {
                alert(`Campaign sent successfully to ${result.sent} recipients!`);
                setCampaign({ subject: '', body: '' });
            } else {
                alert(`Failed: ${result.error}`);
            }
        } catch (error) {
            console.error(error);
            alert('Error sending campaign');
        } finally {
            setSending(false);
        }
    };

    return (
        <div className="rounded-xl border border-stone-200 bg-white p-6 dark:border-stone-800 dark:bg-stone-900">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h3 className="font-medium text-stone-900 dark:text-white flex items-center gap-2">
                        <Mail className="h-5 w-5" /> Newsletter Campaigns
                    </h3>
                    <p className="text-sm text-stone-500">Manage subscribers and send updates</p>
                </div>
                <div className="flex items-center gap-2 text-sm text-stone-500">
                    <Users className="h-4 w-4" />
                    <span>{subscribers.length} Subscribers</span>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Composer */}
                <div className="lg:col-span-2 space-y-4">
                    <div>
                        <label className="block text-xs font-medium text-stone-700 dark:text-stone-300 mb-1">Subject</label>
                        <input
                            type="text"
                            value={campaign.subject}
                            onChange={e => setCampaign({ ...campaign, subject: e.target.value })}
                            placeholder="e.g. New Arrivals at Hudemas!"
                            className="w-full rounded-md border-stone-300 text-sm dark:bg-stone-800 dark:border-stone-700"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-stone-700 dark:text-stone-300 mb-1">Message</label>
                        <textarea
                            value={campaign.body}
                            onChange={e => setCampaign({ ...campaign, body: e.target.value })}
                            placeholder="Write your update here..."
                            className="w-full h-40 rounded-md border-stone-300 text-sm dark:bg-stone-800 dark:border-stone-700 resize-none"
                        />
                        <p className="text-[10px] text-stone-400 mt-1">HTML tags allowed for basic formatting.</p>
                    </div>
                    <div className="flex justify-end">
                        <button
                            onClick={handleSend}
                            disabled={sending || !campaign.subject || !campaign.body || subscribers.length === 0}
                            className="flex items-center gap-2 rounded-md bg-stone-900 px-4 py-2 text-sm font-medium text-white hover:bg-stone-800 disabled:opacity-50 dark:bg-white dark:text-stone-900"
                        >
                            {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                            Send Campaign
                        </button>
                    </div>
                </div>

                {/* Subscribers List (Mini) */}
                <div className="lg:col-span-1 border-l border-stone-100 dark:border-stone-800 pl-0 lg:pl-8">
                    <h4 className="text-sm font-medium text-stone-900 dark:text-white mb-4">Recent Subscribers</h4>
                    <div className="space-y-3 max-h-64 overflow-y-auto pr-2">
                        {loading ? (
                            <p className="text-xs text-stone-500">Loading...</p>
                        ) : subscribers.length === 0 ? (
                            <p className="text-xs text-stone-500">No subscribers yet.</p>
                        ) : (
                            subscribers.slice(0, 10).map((sub) => (
                                <div key={sub.id} className="flex justify-between items-center text-sm">
                                    <span className="text-stone-600 dark:text-stone-400 truncate max-w-[150px]" title={sub.email}>{sub.email}</span>
                                    <span className="text-[10px] text-stone-400">{new Date(sub.created_at).toLocaleDateString()}</span>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
