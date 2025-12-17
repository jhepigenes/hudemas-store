/**
 * Advanced Analytics Engine - TypeScript Version
 * Pure TypeScript implementation for Vercel serverless compatibility
 */

import { createClient } from '@supabase/supabase-js';

// Types
export interface Campaign {
    campaign_id: string;
    campaign_name: string;
    spend: number;
    impressions: number;
    reach: number;
    clicks: number;
    purchases: number;
    cpa: number;
    ctr: number;
    date?: string;
}

export interface Order {
    id: number;
    total: number;
    date: string;
    status: string;
    customer_id?: number;
}

export interface Customer {
    id: number;
    legacy_id: number;
    name: string;
    email: string;
    total_spent: number;
    order_count: number;
    ltv_tier: string;
    is_lapsed_vip: boolean;
    last_order: string;
}

export interface ChannelAttribution {
    spend: number;
    revenue: number;
    conversions: number;
    roas: number;
    cpa: number;
}

export interface Recommendation {
    priority: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
    action: string;
    reason: string;
    data_points: Record<string, number | string>;
    channel: string;
}

export interface AnalyticsResult {
    summary: {
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
    };
    attribution: {
        by_channel: Record<string, ChannelAttribution>;
        tracking_gap: { db_revenue: number; ga4_revenue: number; gap_pct: number };
    };
    recommendations: Recommendation[];
    campaigns: Campaign[];
    trends: DailyTrend[];
    run_at: string;
}

export interface DailyTrend {
    date: string;
    orders: number;
    revenue: number;
    meta_spend: number;
    meta_purchases: number;
}

// Configuration
const TARGET_CPA = 50;
const TARGET_ROAS = 3.0;
const AVG_ORDER_VALUE = 215;

// Meta Ads API Configuration
// Long-lived token (60 days) - Generated: 2025-12-17, Expires: ~2025-02-15
const META_APP_ID = process.env.META_APP_ID || '1505570397218595';
const META_ACCESS_TOKEN = process.env.META_ACCESS_TOKEN || 'EAAVZATuy15yMBQIxVlxjOXUSQaXZCLZAW4LoDdB5CLaaeitmLnq5MiLfOirSLgM1ZAQnQX9cUmiIxtcfIHYEH8o4edZAe8Cg4rHLDVGwxZAavBEAVwyCkDApBpVZBHaCJLUKq7otVX5rusZAaFAnWpJm8pYVXxE8elsmkMEPdGGKpRc48ZBTBRryon2e74TwT';
const META_AD_ACCOUNT_ID = process.env.META_AD_ACCOUNT_ID || '261SEP2140905';
const META_API_VERSION = 'v21.0';

// Legacy API
const LEGACY_SECRET = process.env.LEGACY_SYNC_SECRET || '6f35b97e06a1585ee8daa975d7d86ed3';
const LEGACY_ORDERS_URL = 'https://www.hudemas.ro/assets/order_sync.php';

/**
 * Fetch orders from legacy system
 */
export async function fetchLegacyOrders(days: number = 30): Promise<Order[]> {
    try {
        const url = `${LEGACY_ORDERS_URL}?action=recent&days=${days}&limit=1000&secret=${LEGACY_SECRET}`;
        const response = await fetch(url, {
            cache: 'no-store',
            headers: { 'Accept': 'application/json' }
        });

        if (!response.ok) {
            console.warn('[Analytics] Legacy orders API returned:', response.status);
            return [];
        }

        const data = await response.json();

        if (!data.success) {
            console.warn('[Analytics] Legacy orders API error:', data.error);
            return [];
        }

        // Transform to our Order format
        return (data.orders || []).map((o: any) => ({
            id: o.order_id,
            total: o.total || 0,
            date: o.order_date,
            status: o.status_name,
            customer_id: o.customer?.user_id,
        }));
    } catch (error) {
        console.error('[Analytics] Error fetching legacy orders:', error);
        return [];
    }
}

/**
 * Fetch customers from Supabase
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function fetchCustomers(supabase: any): Promise<Customer[]> {
    try {
        const { data, error } = await supabase
            .from('customers')
            .select('*')
            .order('total_spent', { ascending: false })
            .limit(5000);

        if (error) {
            console.error('[Analytics] Error fetching customers:', error);
            return [];
        }

        return data || [];
    } catch (error) {
        console.error('[Analytics] Error fetching customers:', error);
        return [];
    }
}

/**
 * Fetch Meta campaigns from CSV or stored data
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function fetchMetaCampaigns(supabase: any): Promise<Campaign[]> {
    try {
        // Try to get from stored analytics first
        const { data, error } = await supabase
            .from('analytics_runs')
            .select('campaigns')
            .order('run_at', { ascending: false })
            .limit(1)
            .single();

        if (error) {
            // No previous run found - this is expected on first run
            console.log('[Analytics] No previous campaigns data found');
            return [];
        }

        // Type assertion since we know the structure
        const result = data as { campaigns?: Campaign[] } | null;

        if (result?.campaigns) {
            return result.campaigns;
        }

        // Fallback: return empty (will be populated from dashboard CSV upload)
        return [];
    } catch (error) {
        console.error('[Analytics] Error fetching campaigns:', error);
        return [];
    }
}

/**
 * Fetch live Meta Ads data from Facebook Graph API
 */
export async function fetchMetaAdsLive(days: number = 7): Promise<Campaign[]> {
    if (!META_ACCESS_TOKEN || META_ACCESS_TOKEN.includes('your_token')) {
        console.log('[Analytics] No valid Meta access token, skipping live fetch');
        return [];
    }

    try {
        // Get ad account ID - try to find it from API
        const meUrl = `https://graph.facebook.com/${META_API_VERSION}/me/adaccounts?fields=id,name,account_status&access_token=${META_ACCESS_TOKEN}`;
        const meRes = await fetch(meUrl, { cache: 'no-store' });
        const meData = await meRes.json();

        if (meData.error) {
            console.error('[Analytics] Meta API error:', meData.error.message);
            return [];
        }

        // Find the Hudemas ad account - prefer account with 'hudema' in name
        const accounts = meData.data || [];
        const hudemasAccount = accounts.find((a: any) =>
            a.name?.toLowerCase().includes('hudema') && a.account_status === 1
        );
        const activeAccount = hudemasAccount || accounts.find((a: any) => a.account_status === 1) || accounts[0];

        if (!activeAccount) {
            console.warn('[Analytics] No Meta ad accounts found');
            return [];
        }

        const accountId = activeAccount.id; // Format: act_XXXXX
        console.log(`[Analytics] Using Meta ad account: ${activeAccount.name} (${accountId})`);

        // Calculate date range - URL encode the JSON
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);

        const timeRange = JSON.stringify({
            since: startDate.toISOString().split('T')[0],
            until: endDate.toISOString().split('T')[0]
        });

        // Fetch campaign insights - properly encode time_range
        const insightsUrl = `https://graph.facebook.com/${META_API_VERSION}/${accountId}/insights?` +
            `level=campaign&` +
            `fields=campaign_id,campaign_name,spend,impressions,reach,clicks,cpc,cpm,ctr,actions,cost_per_action_type&` +
            `time_range=${encodeURIComponent(timeRange)}&` +
            `access_token=${META_ACCESS_TOKEN}`;

        const insightsRes = await fetch(insightsUrl, { cache: 'no-store' });
        const insightsData = await insightsRes.json();

        if (insightsData.error) {
            console.error('[Analytics] Meta insights error:', insightsData.error.message);
            return [];
        }

        // Transform to Campaign format
        const campaigns: Campaign[] = (insightsData.data || []).map((insight: any) => {
            // Find purchase actions
            const actions = insight.actions || [];
            const purchaseAction = actions.find((a: any) => a.action_type === 'purchase' || a.action_type === 'omni_purchase');
            const purchases = purchaseAction ? parseInt(purchaseAction.value) || 0 : 0;

            // Find cost per purchase
            const costPerActions = insight.cost_per_action_type || [];
            const cpaPurchase = costPerActions.find((c: any) => c.action_type === 'purchase' || c.action_type === 'omni_purchase');
            const cpa = cpaPurchase ? parseFloat(cpaPurchase.value) || 0 : 0;

            const spend = parseFloat(insight.spend) || 0;

            return {
                campaign_id: insight.campaign_id,
                campaign_name: insight.campaign_name || 'Unknown Campaign',
                spend,
                impressions: parseInt(insight.impressions) || 0,
                reach: parseInt(insight.reach) || 0,
                clicks: parseInt(insight.clicks) || 0,
                purchases,
                cpa: purchases > 0 ? spend / purchases : cpa,
                ctr: parseFloat(insight.ctr) || 0,
            };
        });

        console.log(`[Analytics] Fetched ${campaigns.length} Meta campaigns with ${campaigns.reduce((s, c) => s + c.purchases, 0)} total purchases`);
        return campaigns;

    } catch (error) {
        console.error('[Analytics] Error fetching live Meta data:', error);
        return [];
    }
}

/**
 * Calculate daily trends from orders
 */
export function calculateDailyTrends(orders: Order[], campaigns: Campaign[], days: number = 7): DailyTrend[] {
    const trends: DailyTrend[] = [];
    const today = new Date();

    for (let i = days - 1; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];

        // Filter orders for this day
        const dayOrders = orders.filter(o => {
            const orderDate = new Date(o.date).toISOString().split('T')[0];
            return orderDate === dateStr;
        });

        trends.push({
            date: dateStr,
            orders: dayOrders.length,
            revenue: dayOrders.reduce((sum, o) => sum + (o.total || 0), 0),
            meta_spend: campaigns.reduce((sum, c) => sum + (c.spend || 0), 0) / days, // Average per day
            meta_purchases: Math.round(campaigns.reduce((sum, c) => sum + (c.purchases || 0), 0) / days),
        });
    }

    return trends;
}

/**
 * Calculate attribution from orders and campaigns
 */
export function calculateAttribution(
    orders: Order[],
    campaigns: Campaign[],
    customers: Customer[]
): AnalyticsResult['attribution'] {
    const totalRevenue = orders.reduce((sum, o) => sum + (o.total || 0), 0);
    const metaSpend = campaigns.reduce((sum, c) => sum + (c.spend || 0), 0);
    const metaPurchases = campaigns.reduce((sum, c) => sum + (c.purchases || 0), 0);

    // Estimate channel distribution based on typical patterns
    // In production, this would come from GA4 API
    const estimatedMetaRevenue = metaPurchases * AVG_ORDER_VALUE;

    const attribution: AnalyticsResult['attribution'] = {
        by_channel: {
            'Meta Paid': {
                spend: metaSpend,
                revenue: estimatedMetaRevenue,
                conversions: metaPurchases,
                roas: metaSpend > 0 ? estimatedMetaRevenue / metaSpend : 0,
                cpa: metaPurchases > 0 ? metaSpend / metaPurchases : 0,
            },
            'Organic': {
                spend: 0,
                revenue: totalRevenue * 0.3, // Estimate 30% organic
                conversions: Math.round(orders.length * 0.3),
                roas: Infinity,
                cpa: 0,
            },
            'Direct': {
                spend: 0,
                revenue: totalRevenue * 0.25,
                conversions: Math.round(orders.length * 0.25),
                roas: Infinity,
                cpa: 0,
            },
            'Email': {
                spend: 0,
                revenue: totalRevenue * 0.1,
                conversions: Math.round(orders.length * 0.1),
                roas: Infinity,
                cpa: 0,
            },
        },
        tracking_gap: {
            db_revenue: totalRevenue,
            ga4_revenue: estimatedMetaRevenue + (totalRevenue * 0.65), // Estimate tracked
            gap_pct: 0,
        },
    };

    // Calculate gap
    const trackedRevenue = Object.values(attribution.by_channel).reduce((sum, c) => sum + c.revenue, 0);
    attribution.tracking_gap.gap_pct = totalRevenue > 0
        ? ((totalRevenue - trackedRevenue) / totalRevenue) * 100
        : 0;

    return attribution;
}

/**
 * Generate data-backed recommendations
 */
export function generateRecommendations(
    campaigns: Campaign[],
    customers: Customer[],
    attribution: AnalyticsResult['attribution']
): Recommendation[] {
    const recommendations: Recommendation[] = [];

    // Analyze campaigns
    if (campaigns.length > 0) {
        const campaignsWithPurchases = campaigns.filter(c => c.purchases > 0);

        if (campaignsWithPurchases.length > 0) {
            // Sort by CPA
            const sortedByCpa = [...campaignsWithPurchases].sort((a, b) => a.cpa - b.cpa);
            const best = sortedByCpa[0];
            const worst = sortedByCpa[sortedByCpa.length - 1];

            // Recommend scaling best performer
            if (best.cpa < TARGET_CPA * 0.7) {
                recommendations.push({
                    priority: 'HIGH',
                    action: `Increase "${best.campaign_name}" budget by 25-30%`,
                    reason: `CPA of ${best.cpa.toFixed(0)} RON is 30%+ below target of ${TARGET_CPA} RON`,
                    data_points: {
                        current_cpa: Math.round(best.cpa),
                        target_cpa: TARGET_CPA,
                        current_spend: Math.round(best.spend),
                        purchases: best.purchases,
                    },
                    channel: 'Meta Ads',
                });
            }

            // Recommend pausing poor performers
            if (worst.cpa > TARGET_CPA * 1.5 && worst !== best) {
                recommendations.push({
                    priority: 'HIGH',
                    action: `Pause or optimize "${worst.campaign_name}"`,
                    reason: `CPA of ${worst.cpa.toFixed(0)} RON is 50%+ above target`,
                    data_points: {
                        current_cpa: Math.round(worst.cpa),
                        target_cpa: TARGET_CPA,
                        wasted_spend: Math.round(worst.spend * 0.5),
                    },
                    channel: 'Meta Ads',
                });
            }
        }
    }

    // Check Meta ROAS
    const metaChannel = attribution.by_channel['Meta Paid'];
    if (metaChannel) {
        if (metaChannel.roas > 0 && metaChannel.roas < 1) {
            recommendations.push({
                priority: 'CRITICAL',
                action: 'Meta Ads losing money - reduce spend or pause',
                reason: `ROAS of ${metaChannel.roas.toFixed(2)}x means losing money`,
                data_points: {
                    current_roas: Math.round(metaChannel.roas * 100) / 100,
                    spend: Math.round(metaChannel.spend),
                    revenue: Math.round(metaChannel.revenue),
                    loss: Math.round(metaChannel.spend - metaChannel.revenue),
                },
                channel: 'Meta Ads',
            });
        } else if (metaChannel.roas >= TARGET_ROAS) {
            recommendations.push({
                priority: 'MEDIUM',
                action: 'Meta Ads profitable - consider scaling',
                reason: `ROAS of ${metaChannel.roas.toFixed(2)}x exceeds target of ${TARGET_ROAS}x`,
                data_points: {
                    current_roas: Math.round(metaChannel.roas * 100) / 100,
                    target_roas: TARGET_ROAS,
                    profit: Math.round(metaChannel.revenue - metaChannel.spend),
                },
                channel: 'Meta Ads',
            });
        }
    }

    // Check lapsed VIPs
    const lapsedVips = customers.filter(c => c.is_lapsed_vip).length;
    const activeVips = customers.filter(c =>
        (c.ltv_tier === 'VIP_PLATINUM' || c.ltv_tier === 'VIP_GOLD') && !c.is_lapsed_vip
    ).length;

    if (lapsedVips > activeVips * 0.5) {
        recommendations.push({
            priority: 'HIGH',
            action: `Launch VIP reactivation campaign for ${lapsedVips} lapsed customers`,
            reason: `Lapsed VIPs (${lapsedVips}) exceed 50% of active VIPs (${activeVips})`,
            data_points: {
                lapsed_vip_count: lapsedVips,
                active_vip_count: activeVips,
                potential_recovery: Math.round(lapsedVips * AVG_ORDER_VALUE * 0.1),
            },
            channel: 'Email/Meta',
        });
    }

    // Email recommendation
    const emailChannel = attribution.by_channel['Email'];
    if (emailChannel && emailChannel.revenue > 0) {
        recommendations.push({
            priority: 'MEDIUM',
            action: 'Increase email marketing frequency',
            reason: `Email generated ${emailChannel.revenue.toFixed(0)} RON at zero cost`,
            data_points: {
                email_revenue: Math.round(emailChannel.revenue),
                cost: 0,
                roas: 'infinite',
            },
            channel: 'Email',
        });
    }

    // Sort by priority
    const priorityOrder = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };
    recommendations.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);

    return recommendations;
}

/**
 * Main analytics engine function
 */
export async function runAnalytics(days: number = 7): Promise<AnalyticsResult> {
    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    console.log(`[Analytics] Starting analysis for ${days} days...`);

    // Fetch all data in parallel
    const [orders, customers, storedCampaigns, liveCampaigns] = await Promise.all([
        fetchLegacyOrders(days),
        fetchCustomers(supabase),
        fetchMetaCampaigns(supabase),
        fetchMetaAdsLive(days),
    ]);

    // Use live campaigns if available, otherwise use stored
    const campaigns = liveCampaigns.length > 0 ? liveCampaigns : storedCampaigns;

    console.log(`[Analytics] Loaded: ${orders.length} orders, ${customers.length} customers, ${campaigns.length} campaigns (live: ${liveCampaigns.length > 0})`);

    // Calculate attribution
    const attribution = calculateAttribution(orders, campaigns, customers);

    // Generate recommendations
    const recommendations = generateRecommendations(campaigns, customers, attribution);

    // Calculate trends
    const trends = calculateDailyTrends(orders, campaigns, days);

    // Build summary with all Meta metrics
    const metaSpend = campaigns.reduce((sum, c) => sum + (c.spend || 0), 0);
    const metaPurchases = campaigns.reduce((sum, c) => sum + (c.purchases || 0), 0);
    const metaImpressions = campaigns.reduce((sum, c) => sum + (c.impressions || 0), 0);
    const metaClicks = campaigns.reduce((sum, c) => sum + (c.clicks || 0), 0);
    const totalRevenue = orders.reduce((sum, o) => sum + (o.total || 0), 0);
    const metaRevenue = metaPurchases * AVG_ORDER_VALUE;

    const result: AnalyticsResult = {
        summary: {
            total_orders: orders.length,
            total_revenue: totalRevenue,
            total_customers: customers.length,
            meta_spend: metaSpend,
            meta_purchases: metaPurchases,
            meta_cpa: metaPurchases > 0 ? metaSpend / metaPurchases : 0,
            meta_roas: metaSpend > 0 ? metaRevenue / metaSpend : 0,
            meta_impressions: metaImpressions,
            meta_clicks: metaClicks,
            critical_alerts: recommendations.filter(r => r.priority === 'CRITICAL').length,
            high_priority_actions: recommendations.filter(r => r.priority === 'HIGH').length,
        },
        attribution,
        recommendations,
        campaigns,
        trends,
        run_at: new Date().toISOString(),
    };

    // Store to Supabase
    const { error } = await supabase.from('analytics_runs').insert({
        run_at: result.run_at,
        summary: result.summary,
        attribution: result.attribution,
        recommendations: result.recommendations,
        campaigns: result.campaigns,
        trends: result.trends,
    });

    if (error) {
        console.error('[Analytics] Error storing results:', error);
    } else {
        console.log('[Analytics] Results stored to Supabase');
    }

    return result;
}

/**
 * Send email digest via Resend
 */
export async function sendEmailDigest(result: AnalyticsResult): Promise<boolean> {
    const resendKey = process.env.RESEND_API_KEY;

    if (!resendKey) {
        console.warn('[Analytics] No Resend API key found');
        return false;
    }

    const subject = `📊 Hudemas Analytics - ${new Date().toLocaleDateString()}`;

    const html = `
        <h1>📊 Hudemas Daily Analytics</h1>
        <p><strong>Generated:</strong> ${new Date().toLocaleString()}</p>
        
        <h2>📈 Summary</h2>
        <ul>
            <li>Orders: ${result.summary.total_orders}</li>
            <li>Revenue: ${result.summary.total_revenue.toFixed(0)} RON</li>
            <li>Meta Spend: ${result.summary.meta_spend.toFixed(0)} RON</li>
            <li>Meta CPA: ${result.summary.meta_cpa.toFixed(0)} RON</li>
        </ul>
        
        <h2>🚨 Alerts</h2>
        <p>Critical: ${result.summary.critical_alerts} | High Priority: ${result.summary.high_priority_actions}</p>
        
        <h2>💡 Top Recommendations</h2>
        <ol>
            ${result.recommendations.slice(0, 5).map(rec =>
        `<li><strong>[${rec.priority}]</strong> ${rec.action}<br/><em>${rec.reason}</em></li>`
    ).join('')}
        </ol>
        
        <p><a href="https://hudemas-store.vercel.app/admin/dashboard/analytics">View full dashboard →</a></p>
    `;

    try {
        const response = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${resendKey}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                from: 'Hudemas Analytics <analytics@hudemas.ro>',
                to: [process.env.ADMIN_EMAIL || 'admin@hudemas.ro'],
                subject,
                html,
            }),
        });

        if (response.ok) {
            console.log('[Analytics] Email sent successfully');
            return true;
        } else {
            console.error('[Analytics] Email failed:', await response.text());
            return false;
        }
    } catch (error) {
        console.error('[Analytics] Email error:', error);
        return false;
    }
}
