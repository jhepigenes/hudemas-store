'use client';

import { X, TrendingUp, TrendingDown, AlertTriangle, Target, DollarSign, BarChart3 } from 'lucide-react';

interface DataPoint {
    label: string;
    value: string | number;
    change?: number;
    type?: 'currency' | 'percent' | 'number';
}

interface RecommendationDetail {
    priority: string;
    action: string;
    reason: string;
    channel: string;
    data_points: Record<string, number | string>;
    why_it_matters?: string;
    expected_impact?: {
        metric: string;
        improvement: string;
    };
}

interface RecommendationModalProps {
    recommendation: RecommendationDetail | null;
    onClose: () => void;
}

const priorityConfig: Record<string, { bg: string; border: string; icon: string; label: string }> = {
    CRITICAL: { bg: 'bg-red-50 dark:bg-red-900/30', border: 'border-red-500', icon: '🔴', label: 'Critical Priority' },
    HIGH: { bg: 'bg-orange-50 dark:bg-orange-900/30', border: 'border-orange-500', icon: '🟠', label: 'High Priority' },
    MEDIUM: { bg: 'bg-blue-50 dark:bg-blue-900/30', border: 'border-blue-500', icon: '🔵', label: 'Medium Priority' },
    LOW: { bg: 'bg-stone-50 dark:bg-stone-800', border: 'border-stone-400', icon: '⚪', label: 'Low Priority' },
};

const channelIcons: Record<string, string> = {
    'Meta Ads': '📱',
    'Google Ads': '🔍',
    'GA4': '📊',
    'Email': '📧',
    'Supabase': '🗄️',
    'General': '📌',
};

function formatDataPoint(key: string, value: number | string): DataPoint {
    const keyLower = key.toLowerCase();

    if (keyLower.includes('spend') || keyLower.includes('revenue') || keyLower.includes('cpa') || keyLower.includes('cost')) {
        return {
            label: key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
            value: typeof value === 'number' ? `${value.toLocaleString('ro-RO')} RON` : value,
            type: 'currency'
        };
    }

    if (keyLower.includes('rate') || keyLower.includes('percent') || keyLower.includes('roas') || keyLower.includes('ctr')) {
        return {
            label: key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
            value: typeof value === 'number' ? `${value.toFixed(2)}%` : value,
            type: 'percent'
        };
    }

    return {
        label: key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
        value: typeof value === 'number' ? value.toLocaleString('ro-RO') : value,
        type: 'number'
    };
}

function getWhyItMatters(priority: string, channel: string, action: string): string {
    const lowerAction = action.toLowerCase();

    if (priority === 'CRITICAL') {
        return 'This issue needs immediate attention. Ignoring it may lead to significant budget waste or missed revenue opportunities. Take action within 24 hours.';
    }

    if (lowerAction.includes('budget') || lowerAction.includes('spend')) {
        return 'Budget optimization directly impacts your return on ad spend (ROAS). Even small adjustments can compound into significant savings or revenue gains over time.';
    }

    if (lowerAction.includes('cpa') || lowerAction.includes('cost per')) {
        return 'Lowering your cost per acquisition (CPA) means acquiring customers more efficiently. This improves profitability and allows you to scale your campaigns further.';
    }

    if (lowerAction.includes('roas')) {
        return 'ROAS (Return on Ad Spend) is your key profitability metric. A ROAS below 3x typically means you\'re losing money on ads after accounting for costs.';
    }

    if (channel === 'Email') {
        return 'Email marketing has the highest ROI of any digital channel. Optimizing campaigns can significantly boost revenue with zero additional ad spend.';
    }

    return 'Acting on data-driven recommendations helps you stay ahead of the competition and maximize the efficiency of your marketing budget.';
}

function getExpectedImpact(action: string, dataPoints: Record<string, number | string>): { metric: string; improvement: string } {
    const lowerAction = action.toLowerCase();

    if (lowerAction.includes('reduce') && lowerAction.includes('budget')) {
        return { metric: 'Monthly Savings', improvement: '~15-25 RON' };
    }

    if (lowerAction.includes('increase') && lowerAction.includes('budget')) {
        return { metric: 'Additional Revenue', improvement: '+50-100 RON' };
    }

    if (lowerAction.includes('pause') || lowerAction.includes('stop')) {
        return { metric: 'Budget Saved', improvement: '~30-50 RON/week' };
    }

    if (lowerAction.includes('cpa') || lowerAction.includes('optimize')) {
        return { metric: 'CPA Reduction', improvement: '-10-20%' };
    }

    return { metric: 'Performance', improvement: 'Potential improvement' };
}

export default function RecommendationModal({ recommendation, onClose }: RecommendationModalProps) {
    if (!recommendation) return null;

    const config = priorityConfig[recommendation.priority] || priorityConfig.MEDIUM;
    const channelIcon = channelIcons[recommendation.channel] || '📌';
    const dataPoints = Object.entries(recommendation.data_points || {}).map(([key, value]) => formatDataPoint(key, value));
    const whyItMatters = recommendation.why_it_matters || getWhyItMatters(recommendation.priority, recommendation.channel, recommendation.action);
    const expectedImpact = recommendation.expected_impact || getExpectedImpact(recommendation.action, recommendation.data_points);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={onClose}>
            <div
                className="bg-white dark:bg-stone-900 rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className={`p-6 border-b-4 ${config.border} ${config.bg}`}>
                    <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                            <span className="text-2xl">{config.icon}</span>
                            <div>
                                <span className="text-xs font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400">
                                    {config.label}
                                </span>
                                <div className="flex items-center gap-2 mt-1">
                                    <span className="text-lg">{channelIcon}</span>
                                    <span className="text-sm font-medium text-stone-600 dark:text-stone-300">
                                        {recommendation.channel}
                                    </span>
                                </div>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 rounded-lg hover:bg-black/10 dark:hover:bg-white/10 transition"
                        >
                            <X className="h-5 w-5 text-stone-500" />
                        </button>
                    </div>
                </div>

                {/* Action */}
                <div className="p-6 border-b border-stone-200 dark:border-stone-700">
                    <h3 className="text-xl font-bold text-stone-900 dark:text-white flex items-center gap-2">
                        <Target className="h-5 w-5 text-blue-500" />
                        Recommended Action
                    </h3>
                    <p className="mt-3 text-lg text-stone-700 dark:text-stone-300">
                        {recommendation.action}
                    </p>
                </div>

                {/* Reason */}
                <div className="p-6 border-b border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800/50">
                    <h4 className="text-sm font-semibold uppercase tracking-wider text-stone-500 dark:text-stone-400 flex items-center gap-2">
                        <BarChart3 className="h-4 w-4" />
                        Analysis
                    </h4>
                    <p className="mt-2 text-stone-600 dark:text-stone-300">
                        {recommendation.reason}
                    </p>
                </div>

                {/* Data Points */}
                {dataPoints.length > 0 && (
                    <div className="p-6 border-b border-stone-200 dark:border-stone-700">
                        <h4 className="text-sm font-semibold uppercase tracking-wider text-stone-500 dark:text-stone-400 mb-4 flex items-center gap-2">
                            <DollarSign className="h-4 w-4" />
                            Supporting Data
                        </h4>
                        <div className="grid grid-cols-2 gap-3">
                            {dataPoints.map((point, i) => (
                                <div
                                    key={i}
                                    className="p-3 rounded-lg bg-gradient-to-br from-stone-100 to-stone-50 dark:from-stone-800 dark:to-stone-700"
                                >
                                    <div className="text-xs text-stone-500 dark:text-stone-400">
                                        {point.label}
                                    </div>
                                    <div className="text-lg font-bold text-stone-900 dark:text-white mt-1">
                                        {point.value}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Why It Matters */}
                <div className="p-6 border-b border-stone-200 dark:border-stone-700 bg-blue-50 dark:bg-blue-900/20">
                    <h4 className="text-sm font-semibold uppercase tracking-wider text-blue-600 dark:text-blue-400 flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4" />
                        Why This Matters
                    </h4>
                    <p className="mt-2 text-stone-600 dark:text-stone-300">
                        {whyItMatters}
                    </p>
                </div>

                {/* Expected Impact */}
                <div className="p-6 bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20">
                    <h4 className="text-sm font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 flex items-center gap-2">
                        <TrendingUp className="h-4 w-4" />
                        Expected Impact
                    </h4>
                    <div className="mt-3 flex items-center gap-4">
                        <div className="flex-1 p-4 rounded-xl bg-white/80 dark:bg-stone-800/80">
                            <div className="text-xs text-stone-500">
                                {expectedImpact.metric}
                            </div>
                            <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">
                                {expectedImpact.improvement}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Actions */}
                <div className="p-4 bg-stone-100 dark:bg-stone-800 flex justify-end gap-3">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 rounded-lg text-stone-600 dark:text-stone-300 hover:bg-stone-200 dark:hover:bg-stone-700 transition"
                    >
                        Dismiss
                    </button>
                    <button
                        onClick={onClose}
                        className="px-4 py-2 rounded-lg bg-blue-500 text-white font-medium hover:bg-blue-600 transition"
                    >
                        Got it
                    </button>
                </div>
            </div>
        </div>
    );
}
