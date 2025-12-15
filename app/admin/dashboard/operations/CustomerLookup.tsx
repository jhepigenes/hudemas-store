'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import {
    Search, Users, Building2, Crown, Clock, ShoppingBag, Filter, X,
    ChevronDown, Download, RefreshCw, Database, Sparkles, AlertCircle,
    Mail, Phone, MapPin, TrendingUp, CheckCircle2, Loader2
} from 'lucide-react';

interface Customer {
    id: number;
    legacy_id: number;
    name: string;
    email: string;
    phone: string;
    phone_normalized: string;
    address: string;
    locality: string;
    state: string;
    postalcode: string;
    country: string;
    total_spent: number;
    order_count: number;
    ltv_tier: string;
    recency_tier: string;
    is_b2b: boolean;
    is_international: boolean;
    is_repeat: boolean;
    is_holiday_buyer: boolean;
    is_lapsed_vip: boolean;
    last_order: string;
    data_quality_score: number;
}

type PresetFilter = 'all' | 'vip_platinum' | 'vip_gold' | 'companies' | 'recent' | 'lapsed' | 'international';

const PRESET_FILTERS: { id: PresetFilter; label: string; icon: React.ReactNode; description: string; color: string }[] = [
    { id: 'all', label: 'All Customers', icon: <Users className="h-4 w-4" />, description: 'View entire database', color: 'bg-stone-100 hover:bg-stone-200 dark:bg-stone-800' },
    { id: 'vip_platinum', label: 'VIP Platinum', icon: <Crown className="h-4 w-4" />, description: '≥1000 RON + 3 orders', color: 'bg-purple-100 hover:bg-purple-200 text-purple-900' },
    { id: 'vip_gold', label: 'VIP Gold', icon: <TrendingUp className="h-4 w-4" />, description: '≥500 RON or 5+ orders', color: 'bg-amber-100 hover:bg-amber-200 text-amber-900' },
    { id: 'companies', label: 'B2B Companies', icon: <Building2 className="h-4 w-4" />, description: 'SRL, PFA, Ltd, etc.', color: 'bg-blue-100 hover:bg-blue-200 text-blue-900' },
    { id: 'recent', label: 'Recent Active', icon: <Clock className="h-4 w-4" />, description: 'Ordered in last 90 days', color: 'bg-green-100 hover:bg-green-200 text-green-900' },
    { id: 'lapsed', label: 'Lapsed VIP', icon: <AlertCircle className="h-4 w-4" />, description: '6+ months dormant', color: 'bg-red-100 hover:bg-red-200 text-red-900' },
    { id: 'international', label: 'International', icon: <MapPin className="h-4 w-4" />, description: 'Non-Romania customers', color: 'bg-indigo-100 hover:bg-indigo-200 text-indigo-900' },
];

const EXPORT_FORMATS = [
    { id: 'gls', label: 'GLS Shipping', description: 'Ready for GLS upload' },
    { id: 'mailchimp', label: 'Mailchimp', description: 'With LTV merge tags' },
    { id: 'meta', label: 'Meta Ads', description: 'Custom audience format' },
    { id: 'google', label: 'Google Ads', description: 'Customer match format' },
];

export default function CustomerLookup() {
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [totalCount, setTotalCount] = useState(0);
    const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

    // Search & filters
    const [searchQuery, setSearchQuery] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [activePreset, setActivePreset] = useState<PresetFilter>('all');
    const [showAdvanced, setShowAdvanced] = useState(false);
    const [showExport, setShowExport] = useState(false);
    const [exporting, setExporting] = useState<string | null>(null);

    const [filters, setFilters] = useState({
        minSpent: '',
        maxSpent: '',
        city: '',
        state: '',
        hasEmail: false,
        hasPhone: false,
    });

    // Debounce search
    useEffect(() => {
        const timer = setTimeout(() => setDebouncedSearch(searchQuery), 300);
        return () => clearTimeout(timer);
    }, [searchQuery]);

    // Fetch from Supabase API
    const fetchCustomers = useCallback(async () => {
        setLoading(true);
        setError(null);

        try {
            const params = new URLSearchParams();

            // Add preset filter
            if (activePreset !== 'all') {
                if (activePreset === 'vip_platinum') params.set('ltv_tier', 'VIP_PLATINUM');
                else if (activePreset === 'vip_gold') params.set('ltv_tier', 'VIP_GOLD');
                else if (activePreset === 'companies') params.set('is_b2b', 'true');
                else if (activePreset === 'recent') params.set('recency_tier', 'ACTIVE');
                else if (activePreset === 'lapsed') params.set('is_lapsed_vip', 'true');
                else if (activePreset === 'international') params.set('is_international', 'true');
            }

            // Add search
            if (debouncedSearch) params.set('search', debouncedSearch);

            // Add advanced filters
            if (filters.city) params.set('locality', filters.city);
            if (filters.state) params.set('state', filters.state);
            if (filters.hasEmail) params.set('has_email', 'true');
            if (filters.hasPhone) params.set('has_phone', 'true');

            params.set('limit', '100');

            const res = await fetch(`/api/customers?${params.toString()}`);
            if (!res.ok) throw new Error('Failed to fetch customers');

            const data = await res.json();
            setCustomers(data.customers || []);
            setTotalCount(data.total || 0);
            setLastRefresh(new Date());
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Unknown error');
            setCustomers([]);
        } finally {
            setLoading(false);
        }
    }, [activePreset, debouncedSearch, filters]);

    // Fetch on mount and when filters change
    useEffect(() => {
        fetchCustomers();
    }, [fetchCustomers]);

    // Stats calculations
    const stats = useMemo(() => ({
        total: totalCount,
        showing: customers.length,
        totalLTV: customers.reduce((sum, c) => sum + (c.total_spent || 0), 0),
        vipCount: customers.filter(c => c.ltv_tier?.includes('VIP')).length,
        companyCount: customers.filter(c => c.is_b2b).length,
        withEmail: customers.filter(c => c.email).length,
        withPhone: customers.filter(c => c.phone).length,
    }), [customers, totalCount]);

    // Export handler
    const handleExport = async (format: string) => {
        setExporting(format);
        try {
            const params = new URLSearchParams();
            params.set('format', format);

            // Apply current filters to export
            if (activePreset !== 'all') {
                if (activePreset === 'vip_platinum') params.set('ltv_tier', 'VIP_PLATINUM');
                else if (activePreset === 'vip_gold') params.set('ltv_tier', 'VIP_GOLD');
                else if (activePreset === 'companies') params.set('is_b2b', 'true');
                else if (activePreset === 'lapsed') params.set('is_lapsed_vip', 'true');
                else if (activePreset === 'international') params.set('is_international', 'true');
            }

            const res = await fetch(`/api/customers/export?${params.toString()}`);
            if (!res.ok) throw new Error('Export failed');

            const blob = await res.blob();
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `customers_${format}_${activePreset}_${new Date().toISOString().split('T')[0]}.csv`;
            a.click();
            URL.revokeObjectURL(url);
        } catch (e) {
            console.error('Export error:', e);
        } finally {
            setExporting(null);
            setShowExport(false);
        }
    };

    const clearFilters = () => {
        setSearchQuery('');
        setActivePreset('all');
        setFilters({ minSpent: '', maxSpent: '', city: '', state: '', hasEmail: false, hasPhone: false });
    };

    const getLTVColor = (tier: string) => {
        if (tier?.includes('PLATINUM')) return 'bg-gradient-to-r from-purple-500 to-pink-500 text-white border-0';
        if (tier?.includes('GOLD')) return 'bg-gradient-to-r from-amber-400 to-yellow-500 text-white border-0';
        if (tier?.includes('VIP')) return 'bg-blue-100 text-blue-800 border-blue-200';
        if (tier === 'HIGH_VALUE') return 'bg-green-100 text-green-800 border-green-200';
        return 'bg-stone-100 text-stone-600 border-stone-200';
    };

    const hasActiveFilters = searchQuery || activePreset !== 'all' || Object.values(filters).some(v => v);

    return (
        <div className="space-y-6">
            {/* Hero Header */}
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-stone-900 via-stone-800 to-stone-900 p-8 text-white shadow-2xl">
                <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />
                <div className="absolute -top-24 -right-24 h-64 w-64 rounded-full bg-purple-500/20 blur-3xl" />
                <div className="absolute -bottom-24 -left-24 h-64 w-64 rounded-full bg-blue-500/20 blur-3xl" />

                <div className="relative flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-2 bg-white/10 rounded-lg backdrop-blur">
                                <Database className="h-6 w-6" />
                            </div>
                            <h1 className="text-3xl font-bold">Customer Database</h1>
                            <Badge className="bg-green-500/20 text-green-300 border-green-500/30">
                                <Sparkles className="h-3 w-3 mr-1" /> Supabase
                            </Badge>
                        </div>
                        <p className="text-stone-400">
                            {loading ? 'Loading...' : `${totalCount.toLocaleString()} customers • Real-time sync`}
                        </p>
                    </div>

                    <div className="flex gap-3">
                        <Button
                            variant="outline"
                            onClick={fetchCustomers}
                            disabled={loading}
                            className="bg-white/10 border-white/20 text-white hover:bg-white/20"
                        >
                            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                            Refresh
                        </Button>
                        <div className="relative">
                            <Button
                                onClick={() => setShowExport(!showExport)}
                                className="bg-white text-stone-900 hover:bg-stone-100"
                            >
                                <Download className="h-4 w-4 mr-2" />
                                Export
                                <ChevronDown className={`h-4 w-4 ml-2 transition-transform ${showExport ? 'rotate-180' : ''}`} />
                            </Button>

                            {showExport && (
                                <div className="absolute right-0 top-full mt-2 w-64 bg-white dark:bg-stone-900 rounded-xl shadow-2xl border border-stone-200 dark:border-stone-800 overflow-hidden z-50">
                                    <div className="p-3 border-b border-stone-100 dark:border-stone-800">
                                        <p className="text-xs font-medium text-stone-500 dark:text-stone-400">
                                            Export {stats.showing} filtered customers
                                        </p>
                                    </div>
                                    {EXPORT_FORMATS.map(format => (
                                        <button
                                            key={format.id}
                                            onClick={() => handleExport(format.id)}
                                            disabled={exporting === format.id}
                                            className="w-full px-4 py-3 text-left hover:bg-stone-50 dark:hover:bg-stone-800 transition-colors flex items-center justify-between"
                                        >
                                            <div>
                                                <p className="font-medium text-stone-900 dark:text-white">{format.label}</p>
                                                <p className="text-xs text-stone-500">{format.description}</p>
                                            </div>
                                            {exporting === format.id ? (
                                                <Loader2 className="h-4 w-4 animate-spin text-stone-400" />
                                            ) : (
                                                <Download className="h-4 w-4 text-stone-400" />
                                            )}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Quick Stats */}
                <div className="relative grid grid-cols-2 md:grid-cols-5 gap-4 mt-6">
                    {[
                        { label: 'Total', value: stats.total.toLocaleString(), icon: Users },
                        { label: 'Showing', value: stats.showing.toLocaleString(), icon: Filter },
                        { label: 'Combined LTV', value: `${(stats.totalLTV / 1000).toFixed(0)}K RON`, icon: TrendingUp },
                        { label: 'With Email', value: `${stats.withEmail}`, icon: Mail },
                        { label: 'With Phone', value: `${stats.withPhone}`, icon: Phone },
                    ].map((stat, i) => (
                        <div key={i} className="bg-white/5 backdrop-blur rounded-xl p-4 border border-white/10">
                            <div className="flex items-center gap-2 text-stone-400 text-xs mb-1">
                                <stat.icon className="h-3.5 w-3.5" />
                                {stat.label}
                            </div>
                            <p className="text-xl font-bold">{stat.value}</p>
                        </div>
                    ))}
                </div>
            </div>

            {/* Filter Pills */}
            <div className="flex flex-wrap gap-2">
                {PRESET_FILTERS.map((preset) => (
                    <button
                        key={preset.id}
                        onClick={() => setActivePreset(preset.id)}
                        className={`
                            flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium
                            transition-all duration-200 border
                            ${activePreset === preset.id
                                ? `${preset.color} ring-2 ring-offset-2 ring-stone-400`
                                : 'bg-white dark:bg-stone-900 border-stone-200 dark:border-stone-700 hover:border-stone-300'
                            }
                        `}
                    >
                        {preset.icon}
                        {preset.label}
                        {activePreset === preset.id && <CheckCircle2 className="h-3.5 w-3.5" />}
                    </button>
                ))}
            </div>

            {/* Search Bar */}
            <Card className="border-2 border-stone-100 dark:border-stone-800 shadow-sm">
                <CardContent className="p-4">
                    <div className="flex gap-4 items-center">
                        <div className="relative flex-1">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-stone-400" />
                            <Input
                                placeholder="Search by name, email, phone, or city..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-12 h-12 text-lg border-0 bg-stone-50 dark:bg-stone-800 focus-visible:ring-2 focus-visible:ring-purple-500"
                            />
                            {searchQuery && (
                                <button
                                    onClick={() => setSearchQuery('')}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600"
                                >
                                    <X className="h-5 w-5" />
                                </button>
                            )}
                        </div>
                        <Button
                            variant="ghost"
                            onClick={() => setShowAdvanced(!showAdvanced)}
                            className={showAdvanced ? 'bg-stone-100 dark:bg-stone-800' : ''}
                        >
                            <Filter className="h-4 w-4 mr-2" />
                            Advanced
                        </Button>
                        {hasActiveFilters && (
                            <Button variant="ghost" onClick={clearFilters} className="text-red-500 hover:text-red-600 hover:bg-red-50">
                                <X className="h-4 w-4 mr-2" />
                                Clear All
                            </Button>
                        )}
                    </div>

                    {/* Advanced Filters Panel */}
                    {showAdvanced && (
                        <div className="grid grid-cols-2 md:grid-cols-6 gap-4 pt-4 mt-4 border-t border-stone-100 dark:border-stone-800">
                            <div>
                                <label className="text-xs font-medium text-stone-500 mb-1 block">Min Spent (RON)</label>
                                <Input
                                    type="number"
                                    placeholder="0"
                                    value={filters.minSpent}
                                    onChange={(e) => setFilters({ ...filters, minSpent: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="text-xs font-medium text-stone-500 mb-1 block">Max Spent (RON)</label>
                                <Input
                                    type="number"
                                    placeholder="∞"
                                    value={filters.maxSpent}
                                    onChange={(e) => setFilters({ ...filters, maxSpent: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="text-xs font-medium text-stone-500 mb-1 block">City</label>
                                <Input
                                    placeholder="București"
                                    value={filters.city}
                                    onChange={(e) => setFilters({ ...filters, city: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="text-xs font-medium text-stone-500 mb-1 block">State/County</label>
                                <Input
                                    placeholder="Timiș"
                                    value={filters.state}
                                    onChange={(e) => setFilters({ ...filters, state: e.target.value })}
                                />
                            </div>
                            <div className="flex items-end">
                                <Button
                                    variant={filters.hasEmail ? 'default' : 'outline'}
                                    size="sm"
                                    onClick={() => setFilters({ ...filters, hasEmail: !filters.hasEmail })}
                                    className="w-full"
                                >
                                    <Mail className="h-4 w-4 mr-2" />
                                    Has Email
                                </Button>
                            </div>
                            <div className="flex items-end">
                                <Button
                                    variant={filters.hasPhone ? 'default' : 'outline'}
                                    size="sm"
                                    onClick={() => setFilters({ ...filters, hasPhone: !filters.hasPhone })}
                                    className="w-full"
                                >
                                    <Phone className="h-4 w-4 mr-2" />
                                    Has Phone
                                </Button>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Error State */}
            {error && (
                <Card className="border-red-200 bg-red-50 dark:bg-red-950/30">
                    <CardContent className="p-4 flex items-center gap-3 text-red-700 dark:text-red-400">
                        <AlertCircle className="h-5 w-5" />
                        <span>{error}</span>
                        <Button variant="outline" size="sm" onClick={fetchCustomers} className="ml-auto">
                            Retry
                        </Button>
                    </CardContent>
                </Card>
            )}

            {/* Results Table */}
            <Card className="overflow-hidden border-0 shadow-lg">
                <CardContent className="p-0">
                    {loading ? (
                        <div className="flex items-center justify-center py-24">
                            <Loader2 className="h-8 w-8 animate-spin text-stone-400" />
                            <span className="ml-3 text-stone-500">Loading customers...</span>
                        </div>
                    ) : (
                        <div className="overflow-auto max-h-[600px]">
                            <Table>
                                <TableHeader className="sticky top-0 bg-stone-50 dark:bg-stone-900 z-10">
                                    <TableRow className="hover:bg-transparent">
                                        <TableHead className="w-56 font-semibold">Customer</TableHead>
                                        <TableHead className="font-semibold">Contact</TableHead>
                                        <TableHead className="font-semibold">Location</TableHead>
                                        <TableHead className="w-28 text-right font-semibold">LTV</TableHead>
                                        <TableHead className="w-20 text-center font-semibold">Orders</TableHead>
                                        <TableHead className="w-32 font-semibold">Segment</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {customers.map((customer) => (
                                        <TableRow key={customer.id} className="hover:bg-purple-50/50 dark:hover:bg-purple-950/20 group">
                                            <TableCell>
                                                <div className="flex items-center gap-3">
                                                    <div className={`
                                                        h-10 w-10 rounded-full flex items-center justify-center font-medium text-sm
                                                        ${customer.is_b2b
                                                            ? 'bg-blue-100 text-blue-700'
                                                            : 'bg-stone-100 text-stone-600'
                                                        }
                                                    `}>
                                                        {customer.is_b2b ? <Building2 className="h-5 w-5" /> : customer.name?.charAt(0)?.toUpperCase()}
                                                    </div>
                                                    <div>
                                                        <p className="font-medium text-stone-900 dark:text-white">{customer.name}</p>
                                                        {customer.is_b2b && (
                                                            <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
                                                                B2B
                                                            </Badge>
                                                        )}
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="space-y-1">
                                                    {customer.email && (
                                                        <div className="flex items-center gap-2 text-sm text-stone-500">
                                                            <Mail className="h-3.5 w-3.5" />
                                                            {customer.email}
                                                        </div>
                                                    )}
                                                    {customer.phone && (
                                                        <div className="flex items-center gap-2 text-sm font-mono text-stone-500">
                                                            <Phone className="h-3.5 w-3.5" />
                                                            {customer.phone}
                                                        </div>
                                                    )}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-2 text-sm">
                                                    <MapPin className="h-3.5 w-3.5 text-stone-400" />
                                                    <span>{customer.locality}</span>
                                                    {customer.state && (
                                                        <span className="text-stone-400">• {customer.state}</span>
                                                    )}
                                                    {customer.is_international && (
                                                        <Badge variant="outline" className="text-xs">Intl</Badge>
                                                    )}
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <span className="font-bold text-stone-900 dark:text-white">
                                                    {customer.total_spent?.toLocaleString() || 0}
                                                </span>
                                                <span className="text-stone-400 text-sm ml-1">RON</span>
                                            </TableCell>
                                            <TableCell className="text-center">
                                                <span className="inline-flex items-center justify-center h-7 w-7 rounded-full bg-stone-100 dark:bg-stone-800 font-medium text-sm">
                                                    {customer.order_count || 0}
                                                </span>
                                            </TableCell>
                                            <TableCell>
                                                <Badge className={getLTVColor(customer.ltv_tier)}>
                                                    {customer.ltv_tier?.replace(/_/g, ' ') || 'N/A'}
                                                </Badge>
                                            </TableCell>
                                        </TableRow>
                                    ))}

                                    {customers.length === 0 && !loading && (
                                        <TableRow>
                                            <TableCell colSpan={6} className="text-center py-16">
                                                <div className="flex flex-col items-center gap-3">
                                                    <div className="p-4 rounded-full bg-stone-100 dark:bg-stone-800">
                                                        <Search className="h-8 w-8 text-stone-400" />
                                                    </div>
                                                    <p className="text-lg font-medium text-stone-600 dark:text-stone-300">
                                                        No customers found
                                                    </p>
                                                    <p className="text-sm text-stone-400">
                                                        Try adjusting your filters or search query
                                                    </p>
                                                    {hasActiveFilters && (
                                                        <Button variant="outline" onClick={clearFilters} className="mt-2">
                                                            Clear all filters
                                                        </Button>
                                                    )}
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    )}

                    {/* Footer */}
                    {customers.length > 0 && (
                        <div className="px-6 py-4 border-t border-stone-100 dark:border-stone-800 bg-stone-50/50 dark:bg-stone-900/50 flex items-center justify-between">
                            <p className="text-sm text-stone-500">
                                Showing <strong>{customers.length}</strong> of <strong>{totalCount.toLocaleString()}</strong> customers
                                {customers.length === 100 && totalCount > 100 && (
                                    <span className="ml-1">(limited to 100 – use filters to narrow down)</span>
                                )}
                            </p>
                            {lastRefresh && (
                                <p className="text-xs text-stone-400">
                                    Last refreshed: {lastRefresh.toLocaleTimeString()}
                                </p>
                            )}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
