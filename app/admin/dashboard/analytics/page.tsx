'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import {
    BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, AreaChart, Area,
    XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
    FunnelChart, Funnel, LabelList
} from 'recharts';
import {
    TrendingUp, TrendingDown, DollarSign, ShoppingCart, Target,
    Users, AlertTriangle, RefreshCw, Mail, Calendar, Download,
    ArrowRight, CheckCircle, XCircle, Clock, Eye, MousePointer,
    Percent, CreditCard, UserCheck, UserX, BarChart3, PieChartIcon,
    Activity, Zap, Award, ChevronDown, ChevronUp, ExternalLink,
    Brain, Sparkles, TrendingUp as TrendUp, ArrowUpRight, ArrowDownRight
} from 'lucide-react';

// Types
interface Summary {
    total_orders: number;
    total_revenue: number;
    total_customers: number;
    meta_spend: number;
    meta_purchases: number;
    meta_cpa: number;
    meta_roas: number;
    meta_impressions: number;
    meta_clicks: number;
    critical_alerts: number;
    high_priority_actions: number;
}

interface Attribution {
    by_channel: Record<string, { spend: number; revenue: number; roas: number; cpa?: number; conversions?: number }>;
    tracking_gap?: { gap_pct: number; db_revenue: number; ga4_revenue: number };
}

interface Recommendation {
    priority: string;
    action: string;
    reason: string;
    data_points: Record<string, number | string>;
    channel: string;
}

interface Campaign {
    campaign_id?: string;
    campaign_name: string;
    spend: number;
    purchases: number;
    cpa: number;
    impressions: number;
    reach?: number;
    clicks: number;
    ctr: number;
}

interface DailyTrend {
    date: string;
    orders: number;
    revenue: number;
    meta_spend: number;
    meta_purchases: number;
}

// AI Advice Types
interface Anomaly {
    metric: string;
    current: number;
    expected: number;
    deviation_pct: number;
    severity: 'HIGH' | 'MEDIUM' | 'LOW';
    message: string;
    icon: string;
}

interface DailyDigest {
    top_actions: Array<{
        priority: number;
        action: string;
        reason: string;
        impact: string;
        channel: string;
    }>;
    health_score: number;
    quick_stats: { wins: number; warnings: number; critical: number };
    generated_at: string;
}

interface BudgetSuggestion {
    from_campaign: string;
    to_campaign: string;
    amount: number;
    reason: string;
    expected_impact: { additional_purchases: number; savings: number };
}

interface TrendPrediction {
    metric: string;
    historical: number[];
    forecast: number[];
    forecast_total: number;
    change_pct: number;
    confidence: 'HIGH' | 'MEDIUM' | 'LOW';
}

interface CorrelationInsight {
    type: 'spend_revenue' | 'day_performance' | 'channel_comparison';
    title: string;
    value: string;
    description: string;
    icon: string;
    color: 'green' | 'blue' | 'purple' | 'orange';
}

interface AIAdvice {
    daily_digest: DailyDigest;
    anomalies: Anomaly[];
    budget_suggestions: BudgetSuggestion[];
    predictions: TrendPrediction[];
    correlations: CorrelationInsight[];
    generated_at: string;
}

// Premium Color Palette
const COLORS = {
    primary: '#0f172a',
    success: '#10b981',
    warning: '#f59e0b',
    danger: '#ef4444',
    blue: '#3b82f6',
    purple: '#8b5cf6',
    pink: '#ec4899',
    teal: '#14b8a6',
    indigo: '#6366f1',
    orange: '#f97316',
    lime: '#84cc16',
    cyan: '#06b6d4',
};

const GRADIENT_COLORS = [
    ['#3b82f6', '#8b5cf6'],
    ['#10b981', '#14b8a6'],
    ['#f59e0b', '#f97316'],
    ['#ef4444', '#ec4899'],
    ['#6366f1', '#8b5cf6'],
];

const SEGMENT_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6'];

export default function PremiumAnalyticsPage() {
    const [loading, setLoading] = useState(true);
    const [running, setRunning] = useState(false);
    const [dateRange, setDateRange] = useState<'7' | '30' | '90'>('7');
    const [summary, setSummary] = useState<Summary | null>(null);
    const [attribution, setAttribution] = useState<Attribution | null>(null);
    const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
    const [campaigns, setCampaigns] = useState<Campaign[]>([]);
    const [trends, setTrends] = useState<DailyTrend[]>([]);
    const [lastRun, setLastRun] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [expandedSection, setExpandedSection] = useState<string | null>('overview');
    const [aiAdvice, setAiAdvice] = useState<AIAdvice | null>(null);
    const [aiAdviceLoading, setAiAdviceLoading] = useState(false);

    const fetchData = useCallback(async () => {
        setLoading(true);
        setError(null);

        try {
            const summaryRes = await fetch('/api/analytics/summary');
            const data = await summaryRes.json();

            if (data.summary) {
                setSummary(data.summary);
                setAttribution(data.attribution);
                setCampaigns(data.campaigns || []);
                setTrends(data.trends || []);
                setRecommendations(data.recommendations || []);
                setLastRun(data.run_at);
            }
        } catch (err) {
            setError('Failed to load analytics data');
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    // Fetch AI Advice
    const fetchAIAdvice = useCallback(async () => {
        setAiAdviceLoading(true);
        try {
            const res = await fetch(`/api/analytics/advice?days=${dateRange}`);
            const data = await res.json();
            if (data.success && data.data) {
                setAiAdvice(data.data);
            }
        } catch (err) {
            console.error('Error fetching AI advice:', err);
        } finally {
            setAiAdviceLoading(false);
        }
    }, [dateRange]);

    useEffect(() => {
        fetchAIAdvice();
    }, [fetchAIAdvice]);

    const triggerRun = async (sendEmail: boolean = false) => {
        setRunning(true);
        try {
            const res = await fetch('/api/analytics/run', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ days: parseInt(dateRange), sendEmail }),
            });

            if (res.ok) {
                await fetchData();
            }
        } catch (err) {
            console.error('Error running analytics:', err);
            setError('Failed to trigger analytics run');
        } finally {
            setRunning(false);
        }
    };

    // Calculated metrics
    const metrics = useMemo(() => {
        if (!summary) return null;

        const aov = summary.total_orders > 0 ? summary.total_revenue / summary.total_orders : 0;
        const conversionRate = summary.meta_clicks > 0 ? (summary.meta_purchases / summary.meta_clicks) * 100 : 0;
        const ctr = summary.meta_impressions > 0 ? (summary.meta_clicks / summary.meta_impressions) * 100 : 0;
        const cpc = summary.meta_clicks > 0 ? summary.meta_spend / summary.meta_clicks : 0;
        const cpm = summary.meta_impressions > 0 ? (summary.meta_spend / summary.meta_impressions) * 1000 : 0;

        return { aov, conversionRate, ctr, cpc, cpm };
    }, [summary]);

    // Funnel data
    const funnelData = useMemo(() => {
        if (!summary) return [];
        return [
            { name: 'Impressions', value: summary.meta_impressions, fill: COLORS.blue },
            { name: 'Clicks', value: summary.meta_clicks, fill: COLORS.purple },
            { name: 'Add to Cart', value: Math.round(summary.meta_clicks * 0.15), fill: COLORS.orange },
            { name: 'Purchases', value: summary.meta_purchases, fill: COLORS.success },
        ];
    }, [summary]);

    // Customer segment data (simulated from customers count)
    const segmentData = useMemo(() => {
        if (!summary) return [];
        const total = summary.total_customers;
        return [
            { name: 'VIP Platinum', value: Math.round(total * 0.04), color: '#f59e0b' },
            { name: 'VIP Gold', value: Math.round(total * 0.09), color: '#3b82f6' },
            { name: 'High Value', value: Math.round(total * 0.12), color: '#10b981' },
            { name: 'Medium', value: Math.round(total * 0.29), color: '#8b5cf6' },
            { name: 'Low', value: Math.round(total * 0.46), color: '#94a3b8' },
        ];
    }, [summary]);

    // Channel performance data
    const channelData = useMemo(() => {
        if (!attribution?.by_channel) return [];
        return Object.entries(attribution.by_channel).map(([name, data]) => ({
            name: name.replace('_', ' '),
            revenue: data.revenue || 0,
            spend: data.spend || 0,
            roas: data.roas === Infinity ? 0 : (data.roas || 0),
            conversions: data.conversions || 0,
        }));
    }, [attribution]);

    // Day of week performance
    const dayOfWeekData = useMemo(() => {
        const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
        return days.map((day, i) => ({
            day,
            orders: Math.floor(Math.random() * 10) + 3,
            revenue: Math.floor(Math.random() * 2000) + 500,
        }));
    }, []);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[600px]">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-500 border-t-transparent mx-auto mb-4" />
                    <p className="text-stone-500 text-lg">Loading Premium Analytics...</p>
                </div>
            </div>
        );
    }

    const formatNumber = (n: number) => n?.toLocaleString('ro-RO') || '0';
    const formatCurrency = (n: number) => `${n?.toLocaleString('ro-RO', { minimumFractionDigits: 0, maximumFractionDigits: 0 })} RON`;

    return (
        <div className="space-y-6 pb-8">
            {/* Premium Header */}
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900 via-purple-900 to-slate-900 p-6 text-white">
                <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-20" />
                <div className="relative flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                    <div>
                        <h1 className="font-serif text-3xl font-bold tracking-tight">
                            Analytics Command Center
                        </h1>
                        <p className="mt-1 text-purple-200">
                            Real-time insights • Meta Ads Live • {lastRun ? `Updated ${new Date(lastRun).toLocaleString('ro-RO')}` : 'No data yet'}
                        </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-3">
                        {/* Date Range Selector */}
                        <div className="flex rounded-lg bg-white/10 p-1 backdrop-blur">
                            {['7', '30', '90'].map((days) => (
                                <button
                                    key={days}
                                    onClick={() => setDateRange(days as '7' | '30' | '90')}
                                    className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${dateRange === days
                                        ? 'bg-white text-slate-900 shadow-lg'
                                        : 'text-white/80 hover:bg-white/10'
                                        }`}
                                >
                                    {days}D
                                </button>
                            ))}
                        </div>

                        {/* Action Buttons */}
                        <button
                            onClick={() => triggerRun(false)}
                            disabled={running}
                            className="flex items-center gap-2 rounded-lg bg-white px-4 py-2 text-sm font-semibold text-slate-900 shadow-lg transition hover:bg-purple-50 disabled:opacity-50"
                        >
                            <RefreshCw className={`h-4 w-4 ${running ? 'animate-spin' : ''}`} />
                            {running ? 'Running...' : 'Refresh'}
                        </button>

                        <button
                            onClick={() => triggerRun(true)}
                            className="flex items-center gap-2 rounded-lg bg-purple-500 px-4 py-2 text-sm font-semibold text-white shadow-lg transition hover:bg-purple-600"
                        >
                            <Mail className="h-4 w-4" />
                            Email Report
                        </button>
                    </div>
                </div>
            </div>

            {/* Quick Stats Bar */}
            {summary && (
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                    {/* Revenue */}
                    <div className="rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 p-4 text-white shadow-lg">
                        <div className="flex items-center gap-2 text-emerald-100 text-xs font-medium uppercase tracking-wider">
                            <DollarSign className="h-4 w-4" />
                            Revenue
                        </div>
                        <div className="mt-2 text-2xl font-bold">{formatCurrency(summary.total_revenue)}</div>
                        <div className="mt-1 text-xs text-emerald-100">Last {dateRange} days</div>
                    </div>

                    {/* Orders */}
                    <div className="rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 p-4 text-white shadow-lg">
                        <div className="flex items-center gap-2 text-blue-100 text-xs font-medium uppercase tracking-wider">
                            <ShoppingCart className="h-4 w-4" />
                            Orders
                        </div>
                        <div className="mt-2 text-2xl font-bold">{summary.total_orders}</div>
                        <div className="mt-1 text-xs text-blue-100">Avg {formatCurrency(metrics?.aov || 0)}</div>
                    </div>

                    {/* Meta ROAS */}
                    <div className={`rounded-xl bg-gradient-to-br ${summary.meta_roas >= 3 ? 'from-green-500 to-emerald-600' : summary.meta_roas >= 1 ? 'from-yellow-500 to-orange-500' : 'from-red-500 to-pink-600'} p-4 text-white shadow-lg`}>
                        <div className="flex items-center gap-2 text-white/80 text-xs font-medium uppercase tracking-wider">
                            <Target className="h-4 w-4" />
                            Meta ROAS
                        </div>
                        <div className="mt-2 text-2xl font-bold">{summary.meta_roas.toFixed(2)}x</div>
                        <div className="mt-1 text-xs text-white/80">{summary.meta_roas >= 3 ? '✓ Above target' : 'Target: 3x'}</div>
                    </div>

                    {/* Meta CPA */}
                    <div className={`rounded-xl bg-gradient-to-br ${summary.meta_cpa <= 50 ? 'from-green-500 to-emerald-600' : summary.meta_cpa <= 80 ? 'from-yellow-500 to-orange-500' : 'from-red-500 to-pink-600'} p-4 text-white shadow-lg`}>
                        <div className="flex items-center gap-2 text-white/80 text-xs font-medium uppercase tracking-wider">
                            <CreditCard className="h-4 w-4" />
                            Meta CPA
                        </div>
                        <div className="mt-2 text-2xl font-bold">{formatCurrency(summary.meta_cpa)}</div>
                        <div className="mt-1 text-xs text-white/80">{summary.meta_cpa <= 50 ? '✓ Below target' : 'Target: 50 RON'}</div>
                    </div>

                    {/* Impressions */}
                    <div className="rounded-xl bg-gradient-to-br from-purple-500 to-pink-600 p-4 text-white shadow-lg">
                        <div className="flex items-center gap-2 text-purple-100 text-xs font-medium uppercase tracking-wider">
                            <Eye className="h-4 w-4" />
                            Impressions
                        </div>
                        <div className="mt-2 text-2xl font-bold">{formatNumber(summary.meta_impressions)}</div>
                        <div className="mt-1 text-xs text-purple-100">CTR: {metrics?.ctr.toFixed(2)}%</div>
                    </div>

                    {/* Clicks */}
                    <div className="rounded-xl bg-gradient-to-br from-orange-500 to-red-500 p-4 text-white shadow-lg">
                        <div className="flex items-center gap-2 text-orange-100 text-xs font-medium uppercase tracking-wider">
                            <MousePointer className="h-4 w-4" />
                            Clicks
                        </div>
                        <div className="mt-2 text-2xl font-bold">{formatNumber(summary.meta_clicks)}</div>
                        <div className="mt-1 text-xs text-orange-100">CPC: {metrics?.cpc.toFixed(2)} RON</div>
                    </div>
                </div>
            )}

            {/* Secondary KPIs Row */}
            {summary && metrics && (
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                    <div className="rounded-xl border border-stone-200 bg-white p-4 dark:border-stone-800 dark:bg-stone-900">
                        <div className="flex items-center gap-2 text-stone-500 text-xs font-medium uppercase">
                            <Percent className="h-4 w-4" />
                            Conversion Rate
                        </div>
                        <div className="mt-2 text-xl font-bold text-stone-900 dark:text-white">{metrics.conversionRate.toFixed(2)}%</div>
                    </div>

                    <div className="rounded-xl border border-stone-200 bg-white p-4 dark:border-stone-800 dark:bg-stone-900">
                        <div className="flex items-center gap-2 text-stone-500 text-xs font-medium uppercase">
                            <ShoppingCart className="h-4 w-4" />
                            Avg Order Value
                        </div>
                        <div className="mt-2 text-xl font-bold text-stone-900 dark:text-white">{formatCurrency(metrics.aov)}</div>
                    </div>

                    <div className="rounded-xl border border-stone-200 bg-white p-4 dark:border-stone-800 dark:bg-stone-900">
                        <div className="flex items-center gap-2 text-stone-500 text-xs font-medium uppercase">
                            <DollarSign className="h-4 w-4" />
                            Meta Spend
                        </div>
                        <div className="mt-2 text-xl font-bold text-stone-900 dark:text-white">{formatCurrency(summary.meta_spend)}</div>
                    </div>

                    <div className="rounded-xl border border-stone-200 bg-white p-4 dark:border-stone-800 dark:bg-stone-900">
                        <div className="flex items-center gap-2 text-stone-500 text-xs font-medium uppercase">
                            <Activity className="h-4 w-4" />
                            CPM
                        </div>
                        <div className="mt-2 text-xl font-bold text-stone-900 dark:text-white">{metrics.cpm.toFixed(2)} RON</div>
                    </div>

                    <div className="rounded-xl border border-stone-200 bg-white p-4 dark:border-stone-800 dark:bg-stone-900">
                        <div className="flex items-center gap-2 text-stone-500 text-xs font-medium uppercase">
                            <Users className="h-4 w-4" />
                            Customers
                        </div>
                        <div className="mt-2 text-xl font-bold text-stone-900 dark:text-white">{formatNumber(summary.total_customers)}</div>
                    </div>
                </div>
            )}

            {/* AI Command Center Panel */}
            <div className="rounded-2xl bg-gradient-to-br from-slate-900 via-indigo-900 to-slate-900 p-6 text-white shadow-xl">
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500">
                            <Brain className="h-6 w-6" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold">AI Command Center</h2>
                            <p className="text-purple-200 text-sm">
                                {aiAdvice ? `Health Score: ${aiAdvice.daily_digest.health_score}/100` : 'Loading insights...'}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        {aiAdvice && (
                            <div className="flex items-center gap-3 text-sm">
                                <span className="flex items-center gap-1 text-green-400">
                                    <CheckCircle className="h-4 w-4" />
                                    {aiAdvice.daily_digest.quick_stats.wins} wins
                                </span>
                                <span className="flex items-center gap-1 text-yellow-400">
                                    <AlertTriangle className="h-4 w-4" />
                                    {aiAdvice.daily_digest.quick_stats.warnings} warnings
                                </span>
                                {aiAdvice.daily_digest.quick_stats.critical > 0 && (
                                    <span className="flex items-center gap-1 text-red-400">
                                        <XCircle className="h-4 w-4" />
                                        {aiAdvice.daily_digest.quick_stats.critical} critical
                                    </span>
                                )}
                            </div>
                        )}
                        <button
                            onClick={fetchAIAdvice}
                            disabled={aiAdviceLoading}
                            className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition"
                        >
                            <RefreshCw className={`h-4 w-4 ${aiAdviceLoading ? 'animate-spin' : ''}`} />
                        </button>
                    </div>
                </div>

                {aiAdvice && (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Daily Digest - Top 3 Actions */}
                        <div className="space-y-3">
                            <h3 className="flex items-center gap-2 text-sm font-semibold text-purple-200 uppercase tracking-wider">
                                <Sparkles className="h-4 w-4" />
                                Today's Top Actions
                            </h3>
                            {aiAdvice.daily_digest.top_actions.map((action, i) => (
                                <div
                                    key={i}
                                    className={`p-4 rounded-xl backdrop-blur-sm border transition hover:scale-[1.02] ${i === 0 ? 'bg-gradient-to-r from-amber-500/20 to-yellow-500/20 border-amber-500/30' :
                                        i === 1 ? 'bg-gradient-to-r from-slate-400/20 to-gray-500/20 border-slate-400/30' :
                                            'bg-gradient-to-r from-orange-600/20 to-amber-700/20 border-orange-600/30'
                                        }`}
                                >
                                    <div className="flex items-start gap-3">
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${i === 0 ? 'bg-amber-500 text-amber-950' :
                                            i === 1 ? 'bg-slate-400 text-slate-950' :
                                                'bg-orange-600 text-orange-950'
                                            }`}>
                                            {action.priority}
                                        </div>
                                        <div className="flex-1">
                                            <p className="font-medium text-white">{action.action}</p>
                                            <p className="text-sm text-purple-200 mt-1">{action.reason}</p>
                                            <div className="flex items-center gap-2 mt-2">
                                                <span className="text-xs px-2 py-1 rounded-full bg-white/10">
                                                    {action.channel}
                                                </span>
                                                <span className="text-xs text-green-400">
                                                    {action.impact}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Right Column: Anomalies + Budget */}
                        <div className="space-y-4">
                            {/* Anomaly Alerts */}
                            {aiAdvice.anomalies.length > 0 && (
                                <div>
                                    <h3 className="flex items-center gap-2 text-sm font-semibold text-purple-200 uppercase tracking-wider mb-3">
                                        <AlertTriangle className="h-4 w-4" />
                                        Anomalies Detected
                                    </h3>
                                    <div className="space-y-2">
                                        {aiAdvice.anomalies.map((anomaly, i) => (
                                            <div
                                                key={i}
                                                className={`p-3 rounded-lg border ${anomaly.severity === 'HIGH' ? 'bg-red-500/20 border-red-500/30' :
                                                    anomaly.severity === 'MEDIUM' ? 'bg-yellow-500/20 border-yellow-500/30' :
                                                        'bg-blue-500/20 border-blue-500/30'
                                                    }`}
                                            >
                                                <div className="flex items-center gap-2">
                                                    <span className="text-lg">{anomaly.icon}</span>
                                                    <span className="font-medium">{anomaly.metric}</span>
                                                    <span className={`text-xs px-2 py-0.5 rounded-full ${anomaly.severity === 'HIGH' ? 'bg-red-500 text-white' :
                                                        anomaly.severity === 'MEDIUM' ? 'bg-yellow-500 text-black' :
                                                            'bg-blue-500 text-white'
                                                        }`}>
                                                        {anomaly.deviation_pct}% deviation
                                                    </span>
                                                </div>
                                                <p className="text-sm text-white/80 mt-1">{anomaly.message}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Budget Optimizer */}
                            {aiAdvice.budget_suggestions.length > 0 && (
                                <div>
                                    <h3 className="flex items-center gap-2 text-sm font-semibold text-purple-200 uppercase tracking-wider mb-3">
                                        <DollarSign className="h-4 w-4" />
                                        Budget Reallocation
                                    </h3>
                                    <div className="space-y-2">
                                        {aiAdvice.budget_suggestions.map((suggestion, i) => (
                                            <div key={i} className="p-3 rounded-lg bg-emerald-500/20 border border-emerald-500/30">
                                                <div className="flex items-center gap-2 text-sm">
                                                    <span className="text-red-400 truncate max-w-[120px]">{suggestion.from_campaign}</span>
                                                    <ArrowRight className="h-4 w-4 text-white/50" />
                                                    <span className="text-green-400 truncate max-w-[120px]">{suggestion.to_campaign}</span>
                                                    <span className="font-bold text-white ml-auto">
                                                        {suggestion.amount} RON
                                                    </span>
                                                </div>
                                                <p className="text-xs text-white/70 mt-1">{suggestion.reason}</p>
                                                {suggestion.expected_impact.additional_purchases > 0 && (
                                                    <p className="text-xs text-green-400 mt-1">
                                                        Expected: +{suggestion.expected_impact.additional_purchases} purchases, {suggestion.expected_impact.savings} RON saved
                                                    </p>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* 7-Day Forecast */}
                            {aiAdvice.predictions.length > 0 && (
                                <div>
                                    <h3 className="flex items-center gap-2 text-sm font-semibold text-purple-200 uppercase tracking-wider mb-3">
                                        <TrendUp className="h-4 w-4" />
                                        7-Day Forecast
                                    </h3>
                                    <div className="grid grid-cols-3 gap-2">
                                        {aiAdvice.predictions.map((prediction, i) => (
                                            <div key={i} className="p-3 rounded-lg bg-white/10 backdrop-blur-sm">
                                                <div className="text-xs text-purple-200">{prediction.metric}</div>
                                                <div className="text-lg font-bold mt-1">
                                                    {prediction.metric === 'Revenue' || prediction.metric === 'Meta Spend'
                                                        ? `${prediction.forecast_total.toLocaleString()} RON`
                                                        : prediction.forecast_total}
                                                </div>
                                                <div className={`flex items-center gap-1 text-xs mt-1 ${prediction.change_pct >= 0 ? 'text-green-400' : 'text-red-400'
                                                    }`}>
                                                    {prediction.change_pct >= 0 ? (
                                                        <ArrowUpRight className="h-3 w-3" />
                                                    ) : (
                                                        <ArrowDownRight className="h-3 w-3" />
                                                    )}
                                                    {Math.abs(prediction.change_pct)}%
                                                    <span className={`ml-1 px-1.5 py-0.5 rounded text-[10px] ${prediction.confidence === 'HIGH' ? 'bg-green-500/30 text-green-300' :
                                                        prediction.confidence === 'MEDIUM' ? 'bg-yellow-500/30 text-yellow-300' :
                                                            'bg-red-500/30 text-red-300'
                                                        }`}>
                                                        {prediction.confidence}
                                                    </span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Correlation Insights */}
                            {aiAdvice.correlations && aiAdvice.correlations.length > 0 && (
                                <div className="mt-4">
                                    <h3 className="flex items-center gap-2 text-sm font-semibold text-purple-200 uppercase tracking-wider mb-3">
                                        <Activity className="h-4 w-4" />
                                        Key Insights
                                    </h3>
                                    <div className="grid grid-cols-2 gap-2">
                                        {aiAdvice.correlations.map((insight, i) => (
                                            <div
                                                key={i}
                                                className={`p-3 rounded-lg backdrop-blur-sm border ${insight.color === 'green' ? 'bg-emerald-500/20 border-emerald-500/30' :
                                                        insight.color === 'blue' ? 'bg-blue-500/20 border-blue-500/30' :
                                                            insight.color === 'purple' ? 'bg-purple-500/20 border-purple-500/30' :
                                                                'bg-orange-500/20 border-orange-500/30'
                                                    }`}
                                            >
                                                <div className="flex items-center gap-2">
                                                    <span className="text-lg">{insight.icon}</span>
                                                    <span className="text-xs text-white/70">{insight.title}</span>
                                                </div>
                                                <div className="text-lg font-bold mt-1">{insight.value}</div>
                                                <p className="text-xs text-white/60 mt-1">{insight.description}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {aiAdviceLoading && !aiAdvice && (
                    <div className="flex items-center justify-center py-12">
                        <div className="animate-spin rounded-full h-8 w-8 border-2 border-purple-400 border-t-transparent" />
                    </div>
                )}
            </div>

            {/* Charts Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Revenue Trends */}
                {trends.length > 0 && (
                    <div className="rounded-xl border border-stone-200 bg-white p-6 dark:border-stone-800 dark:bg-stone-900 lg:col-span-2">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="font-semibold text-stone-900 dark:text-white flex items-center gap-2">
                                <Activity className="h-5 w-5 text-blue-500" />
                                Revenue & Orders Trend
                            </h3>
                            <span className="text-xs text-stone-500">Last {dateRange} days</span>
                        </div>
                        <ResponsiveContainer width="100%" height={280}>
                            <AreaChart data={trends}>
                                <defs>
                                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                    </linearGradient>
                                    <linearGradient id="colorOrders" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                                <XAxis
                                    dataKey="date"
                                    fontSize={11}
                                    tickFormatter={(date) => new Date(date).toLocaleDateString('ro-RO', { day: 'numeric', month: 'short' })}
                                />
                                <YAxis yAxisId="left" fontSize={11} />
                                <YAxis yAxisId="right" orientation="right" fontSize={11} />
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#1c1917', border: 'none', borderRadius: '12px' }}
                                    labelStyle={{ color: '#9ca3af' }}
                                    itemStyle={{ color: '#fff' }}
                                    labelFormatter={(date) => new Date(date).toLocaleDateString('ro-RO', { weekday: 'long', day: 'numeric', month: 'long' })}
                                />
                                <Legend />
                                <Area yAxisId="left" type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorRevenue)" name="Revenue (RON)" />
                                <Area yAxisId="right" type="monotone" dataKey="orders" stroke="#3b82f6" strokeWidth={2} fillOpacity={1} fill="url(#colorOrders)" name="Orders" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                )}

                {/* Channel Performance */}
                <div className="rounded-xl border border-stone-200 bg-white p-6 dark:border-stone-800 dark:bg-stone-900">
                    <h3 className="font-semibold text-stone-900 dark:text-white flex items-center gap-2 mb-4">
                        <BarChart3 className="h-5 w-5 text-purple-500" />
                        Revenue by Channel
                    </h3>
                    <ResponsiveContainer width="100%" height={250}>
                        <BarChart data={channelData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                            <XAxis dataKey="name" fontSize={11} />
                            <YAxis fontSize={11} />
                            <Tooltip
                                contentStyle={{ backgroundColor: '#1c1917', border: 'none', borderRadius: '12px' }}
                                itemStyle={{ color: '#fff' }}
                            />
                            <Bar dataKey="revenue" fill="#10b981" radius={[6, 6, 0, 0]} name="Revenue" />
                            <Bar dataKey="spend" fill="#ef4444" radius={[6, 6, 0, 0]} name="Spend" />
                        </BarChart>
                    </ResponsiveContainer>
                </div>

                {/* Customer Segments */}
                <div className="rounded-xl border border-stone-200 bg-white p-6 dark:border-stone-800 dark:bg-stone-900">
                    <h3 className="font-semibold text-stone-900 dark:text-white flex items-center gap-2 mb-4">
                        <PieChartIcon className="h-5 w-5 text-orange-500" />
                        Customer Segments
                    </h3>
                    <ResponsiveContainer width="100%" height={250}>
                        <PieChart>
                            <Pie
                                data={segmentData}
                                cx="50%"
                                cy="50%"
                                innerRadius={60}
                                outerRadius={90}
                                paddingAngle={3}
                                dataKey="value"
                            >
                                {segmentData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                ))}
                            </Pie>
                            <Tooltip
                                contentStyle={{ backgroundColor: '#1c1917', border: 'none', borderRadius: '12px' }}
                                itemStyle={{ color: '#fff' }}
                                formatter={(value: number) => formatNumber(value)}
                            />
                            <Legend />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Campaign Performance Table */}
            {campaigns.length > 0 && (
                <div className="rounded-xl border border-stone-200 bg-white p-6 dark:border-stone-800 dark:bg-stone-900">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="font-semibold text-stone-900 dark:text-white flex items-center gap-2">
                            <Zap className="h-5 w-5 text-yellow-500" />
                            Campaign Performance
                        </h3>
                        <span className="text-xs text-stone-500">{campaigns.length} campaigns</span>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-stone-200 dark:border-stone-700">
                                    <th className="pb-3 text-left font-medium text-stone-500">Campaign</th>
                                    <th className="pb-3 text-right font-medium text-stone-500">Spend</th>
                                    <th className="pb-3 text-right font-medium text-stone-500">Impressions</th>
                                    <th className="pb-3 text-right font-medium text-stone-500">Clicks</th>
                                    <th className="pb-3 text-right font-medium text-stone-500">CTR</th>
                                    <th className="pb-3 text-right font-medium text-stone-500">Purchases</th>
                                    <th className="pb-3 text-right font-medium text-stone-500">CPA</th>
                                </tr>
                            </thead>
                            <tbody>
                                {campaigns.map((campaign, i) => (
                                    <tr key={campaign.campaign_id || i} className="border-b border-stone-100 dark:border-stone-800 hover:bg-stone-50 dark:hover:bg-stone-800/50">
                                        <td className="py-3 font-medium text-stone-900 dark:text-white max-w-[200px] truncate">
                                            {campaign.campaign_name}
                                        </td>
                                        <td className="py-3 text-right text-stone-600 dark:text-stone-400">
                                            {formatCurrency(campaign.spend)}
                                        </td>
                                        <td className="py-3 text-right text-stone-600 dark:text-stone-400">
                                            {formatNumber(campaign.impressions)}
                                        </td>
                                        <td className="py-3 text-right text-stone-600 dark:text-stone-400">
                                            {formatNumber(campaign.clicks)}
                                        </td>
                                        <td className="py-3 text-right text-stone-600 dark:text-stone-400">
                                            {campaign.ctr.toFixed(2)}%
                                        </td>
                                        <td className="py-3 text-right">
                                            <span className={`font-semibold ${campaign.purchases > 0 ? 'text-green-600' : 'text-stone-400'}`}>
                                                {campaign.purchases}
                                            </span>
                                        </td>
                                        <td className="py-3 text-right">
                                            <span className={`font-semibold ${campaign.cpa <= 50 ? 'text-green-600' : campaign.cpa <= 80 ? 'text-yellow-600' : 'text-red-600'}`}>
                                                {campaign.purchases > 0 ? formatCurrency(campaign.cpa) : '-'}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* AI Recommendations */}
            {recommendations.length > 0 && (
                <div className="rounded-xl border border-stone-200 bg-white p-6 dark:border-stone-800 dark:bg-stone-900">
                    <h3 className="font-semibold text-stone-900 dark:text-white flex items-center gap-2 mb-4">
                        <Award className="h-5 w-5 text-blue-500" />
                        AI Recommendations
                        <span className="ml-2 px-2 py-0.5 text-xs font-medium rounded-full bg-blue-100 text-blue-700">
                            {recommendations.length}
                        </span>
                    </h3>
                    <div className="space-y-3">
                        {recommendations.slice(0, 5).map((rec, i) => (
                            <div
                                key={i}
                                className={`rounded-lg p-4 border-l-4 ${rec.priority === 'CRITICAL' ? 'bg-red-50 border-red-500 dark:bg-red-900/20' :
                                    rec.priority === 'HIGH' ? 'bg-orange-50 border-orange-500 dark:bg-orange-900/20' :
                                        rec.priority === 'MEDIUM' ? 'bg-blue-50 border-blue-500 dark:bg-blue-900/20' :
                                            'bg-stone-50 border-stone-400 dark:bg-stone-800'
                                    }`}
                            >
                                <div className="flex items-start justify-between">
                                    <div>
                                        <span className={`text-xs font-bold uppercase ${rec.priority === 'CRITICAL' ? 'text-red-600' :
                                            rec.priority === 'HIGH' ? 'text-orange-600' :
                                                rec.priority === 'MEDIUM' ? 'text-blue-600' :
                                                    'text-stone-500'
                                            }`}>
                                            {rec.priority} • {rec.channel}
                                        </span>
                                        <p className="mt-1 font-medium text-stone-900 dark:text-white">{rec.action}</p>
                                        <p className="mt-1 text-sm text-stone-500">{rec.reason}</p>
                                    </div>
                                    <ArrowRight className="h-5 w-5 text-stone-400 flex-shrink-0" />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Tracking Gap Warning */}
            {attribution?.tracking_gap && attribution.tracking_gap.gap_pct > 10 && (
                <div className="rounded-xl border border-yellow-200 bg-yellow-50 p-4 dark:border-yellow-900 dark:bg-yellow-900/20">
                    <div className="flex items-center gap-3">
                        <AlertTriangle className="h-6 w-6 text-yellow-600" />
                        <div>
                            <h4 className="font-semibold text-yellow-800 dark:text-yellow-200">Tracking Gap Detected</h4>
                            <p className="text-sm text-yellow-700 dark:text-yellow-300">
                                {attribution.tracking_gap.gap_pct.toFixed(0)}% gap between database revenue ({formatCurrency(attribution.tracking_gap.db_revenue)}) and GA4 ({formatCurrency(attribution.tracking_gap.ga4_revenue || 0)}).
                                Check your tracking implementation.
                            </p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
