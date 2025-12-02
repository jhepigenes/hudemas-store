'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase';
import { Save, Mail, ToggleLeft, ToggleRight, Loader2 } from 'lucide-react';

interface Automation {
    id: string;
    name: string;
    trigger_event: string;
    enabled: boolean;
    config: {
        subject: string;
        body: string;
    };
}

export default function AutomationsPage() {
    const [automations, setAutomations] = useState<Automation[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState<string | null>(null);
    const supabase = createClient();

    useEffect(() => {
        const fetchAutomations = async () => {
            setLoading(true);
            const { data } = await supabase.from('automations').select('*').order('name');
            if (data) setAutomations(data);
            setLoading(false);
        };
        fetchAutomations();
    }, [supabase]);

    const toggleAutomation = async (id: string, currentStatus: boolean) => {
        const { error } = await supabase
            .from('automations')
            .update({ enabled: !currentStatus })
            .eq('id', id);

        if (!error) {
            setAutomations(automations.map(a => a.id === id ? { ...a, enabled: !currentStatus } : a));
        }
    };

    const updateConfig = (id: string, field: 'subject' | 'body', value: string) => {
        setAutomations(automations.map(a =>
            a.id === id ? { ...a, config: { ...a.config, [field]: value } } : a
        ));
    };

    const saveConfig = async (automation: Automation) => {
        setSaving(automation.id);
        const { error } = await supabase
            .from('automations')
            .update({ config: automation.config })
            .eq('id', automation.id);

        setSaving(null);
        if (error) alert('Failed to save');
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-[300px]">
                <Loader2 className="animate-spin h-8 w-8 text-stone-400" />
            </div>
        );
    }

    return (
        <div className="space-y-8 max-w-4xl">
            <div>
                <h2 className="font-serif text-2xl font-medium text-stone-900 dark:text-white">Automations</h2>
                <p className="text-stone-500">Configure automated emails and triggers.</p>
            </div>

            <div className="grid gap-6">
                {automations.map((automation) => (
                    <div key={automation.id} className="rounded-xl border border-stone-200 bg-white p-6 shadow-sm dark:border-stone-800 dark:bg-stone-900 transition-all hover:border-stone-300 dark:hover:border-stone-700">
                        <div className="flex items-start justify-between mb-6">
                            <div className="flex items-center gap-3">
                                <div className={`p-2 rounded-lg ${automation.enabled ? 'bg-green-100 text-green-600 dark:bg-green-900/20 dark:text-green-400' : 'bg-stone-100 text-stone-400 dark:bg-stone-800 dark:text-stone-500'}`}>
                                    <Mail className="h-5 w-5" />
                                </div>
                                <div>
                                    <h3 className="font-medium text-stone-900 dark:text-white">{automation.name}</h3>
                                    <p className="text-xs text-stone-500 font-mono mt-1">Trigger: {automation.trigger_event}</p>
                                </div>
                            </div>
                            <button
                                onClick={() => toggleAutomation(automation.id, automation.enabled)}
                                className={`transition-colors ${automation.enabled ? 'text-green-600 dark:text-green-400' : 'text-stone-400'}`}
                            >
                                {automation.enabled ? <ToggleRight className="h-8 w-8" /> : <ToggleLeft className="h-8 w-8" />}
                            </button>
                        </div>

                        {automation.enabled && (
                            <div className="space-y-4 pl-14">
                                <div>
                                    <label className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-1">Email Subject</label>
                                    <input
                                        type="text"
                                        value={automation.config.subject}
                                        onChange={(e) => updateConfig(automation.id, 'subject', e.target.value)}
                                        className="w-full rounded-md border-stone-300 shadow-sm focus:border-stone-500 focus:ring-stone-500 dark:bg-stone-800 dark:border-stone-700 sm:text-sm"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-1">
                                        Email Body Template
                                        <span className="ml-2 text-xs text-stone-400 font-normal">(Variables: {'{order_id}'}, {'{shipping_method}'}, {'{tracking_number}'})</span>
                                    </label>
                                    <textarea
                                        rows={3}
                                        value={automation.config.body}
                                        onChange={(e) => updateConfig(automation.id, 'body', e.target.value)}
                                        className="w-full rounded-md border-stone-300 shadow-sm focus:border-stone-500 focus:ring-stone-500 dark:bg-stone-800 dark:border-stone-700 sm:text-sm font-mono text-xs"
                                    />
                                </div>
                                <div className="flex justify-end pt-2">
                                    <button
                                        onClick={() => saveConfig(automation)}
                                        disabled={saving === automation.id}
                                        className="flex items-center gap-2 rounded-md bg-stone-900 px-4 py-2 text-sm font-medium text-white hover:bg-stone-800 disabled:opacity-50 dark:bg-white dark:text-stone-900"
                                    >
                                        {saving === automation.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                                        Save Changes
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}
