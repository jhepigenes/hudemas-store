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

export interface AdDeliveryIssue {
    campaign_id: string;
    campaign_name: string;
    severity: 'CRITICAL' | 'WARNING' | 'INFO';
    issue_type: string;
    message: string;
    recommendation: string;
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
    delivery_issues: AdDeliveryIssue[];
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

        // Also fetch campaign statuses to filter out DELETED/ARCHIVED campaigns
        // The insights API returns data even for deleted campaigns - we need to filter them
        const statusUrl = `https://graph.facebook.com/${META_API_VERSION}/${accountId}/campaigns?` +
            `fields=id,name,status,effective_status&` +
            `access_token=${META_ACCESS_TOKEN}`;

        const statusRes = await fetch(statusUrl, { cache: 'no-store' });
        const statusData = await statusRes.json();

        // Create a set of campaign IDs that are NOT deleted/archived
        const activeCampaignIds = new Set<string>();
        for (const campaign of (statusData.data || [])) {
            if (campaign.status !== 'DELETED' && campaign.status !== 'ARCHIVED' &&
                campaign.effective_status !== 'DELETED' && campaign.effective_status !== 'ARCHIVED') {
                activeCampaignIds.add(campaign.id);
            }
        }

        console.log(`[Analytics] Found ${activeCampaignIds.size} active campaigns (excluding deleted/archived)`);

        // Transform to Campaign format - FILTER out deleted campaigns
        const campaigns: Campaign[] = (insightsData.data || [])
            .filter((insight: any) => activeCampaignIds.has(insight.campaign_id))
            .map((insight: any) => {
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

        console.log(`[Analytics] Fetched ${campaigns.length} active Meta campaigns (after filtering) with ${campaigns.reduce((s, c) => s + c.purchases, 0)} total purchases`);
        return campaigns;

    } catch (error) {
        console.error('[Analytics] Error fetching live Meta data:', error);
        return [];
    }
}

/**
 * Check Meta Ads delivery status for issues
 * Returns warnings for paused, rejected, or limited campaigns
 */
export async function checkAdDeliveryIssues(): Promise<AdDeliveryIssue[]> {
    if (!META_ACCESS_TOKEN || META_ACCESS_TOKEN.includes('your_token')) {
        console.log('[Analytics] No valid Meta access token, skipping delivery check');
        return [];
    }

    const issues: AdDeliveryIssue[] = [];

    try {
        // Get ad account
        const meUrl = `https://graph.facebook.com/${META_API_VERSION}/me/adaccounts?fields=id,name,account_status&access_token=${META_ACCESS_TOKEN}`;
        const meRes = await fetch(meUrl, { cache: 'no-store' });
        const meData = await meRes.json();

        if (meData.error) {
            console.error('[Analytics] Meta API error:', meData.error.message);
            return [];
        }

        const accounts = meData.data || [];
        const hudemasAccount = accounts.find((a: any) =>
            a.name?.toLowerCase().includes('hudema') && a.account_status === 1
        );
        const activeAccount = hudemasAccount || accounts.find((a: any) => a.account_status === 1) || accounts[0];

        if (!activeAccount) {
            return [];
        }

        const accountId = activeAccount.id;

        // Fetch campaign statuses with delivery info
        const campaignsUrl = `https://graph.facebook.com/${META_API_VERSION}/${accountId}/campaigns?` +
            `fields=id,name,status,effective_status,issues_info,daily_budget,lifetime_budget&` +
            `access_token=${META_ACCESS_TOKEN}`;

        const campaignsRes = await fetch(campaignsUrl, { cache: 'no-store' });
        const campaignsData = await campaignsRes.json();

        if (campaignsData.error) {
            console.error('[Analytics] Meta campaigns error:', campaignsData.error.message);
            return [];
        }

        // Check each campaign for issues
        // Note: campaigns with status DELETED or ARCHIVED should be filtered out
        // Also: Don't warn about poor performers that are paused - that's intentional
        const POOR_PERFORMANCE_KEYWORDS = ['VIP Lookalike', 'International Growth', 'Retargeting Xmas 2.0'];

        for (const campaign of campaignsData.data || []) {
            const effectiveStatus = campaign.effective_status;
            const campaignStatus = campaign.status;
            const campaignName = campaign.name || 'Unknown';
            const campaignId = campaign.id;

            // Skip DELETED or ARCHIVED campaigns entirely
            if (campaignStatus === 'DELETED' || campaignStatus === 'ARCHIVED' ||
                effectiveStatus === 'DELETED' || effectiveStatus === 'ARCHIVED') {
                continue;
            }

            // Check if this is a known poor performer that SHOULD be paused
            const isPoorPerformerPaused = POOR_PERFORMANCE_KEYWORDS.some(kw =>
                campaignName.toLowerCase().includes(kw.toLowerCase())
            ) && effectiveStatus === 'PAUSED';

            // For PAUSED campaigns:
            // - If it's a known poor performer, mark as INFO (intentional pause = good)
            // - If it's NOT a known poor performer, mark as WARNING (might need attention)
            if (effectiveStatus === 'PAUSED') {
                if (isPoorPerformerPaused) {
                    issues.push({
                        campaign_id: campaignId,
                        campaign_name: campaignName,
                        severity: 'INFO',
                        issue_type: 'PAUSED_INTENTIONALLY',
                        message: `Campaign "${campaignName}" is paused (intentional - poor performance)`,
                        recommendation: '✓ This pause is correct based on performance data. No action needed.',
                    });
                } else {
                    issues.push({
                        campaign_id: campaignId,
                        campaign_name: campaignName,
                        severity: 'WARNING',
                        issue_type: 'PAUSED',
                        message: `Campaign "${campaignName}" is paused`,
                        recommendation: 'Check if this pause is intentional or resume the campaign',
                    });
                }
            } else if (effectiveStatus === 'DISAPPROVED') {
                issues.push({
                    campaign_id: campaignId,
                    campaign_name: campaignName,
                    severity: 'CRITICAL',
                    issue_type: 'DISAPPROVED',
                    message: `Campaign "${campaignName}" has been disapproved`,
                    recommendation: 'Check Meta Ads Manager for policy violations and fix them',
                });
            } else if (effectiveStatus === 'PENDING_REVIEW') {
                issues.push({
                    campaign_id: campaignId,
                    campaign_name: campaignName,
                    severity: 'INFO',
                    issue_type: 'PENDING_REVIEW',
                    message: `Campaign "${campaignName}" is pending review`,
                    recommendation: 'Wait for Meta to complete the review (usually 24 hours)',
                });
            } else if (effectiveStatus === 'CAMPAIGN_PAUSED') {
                issues.push({
                    campaign_id: campaignId,
                    campaign_name: campaignName,
                    severity: 'WARNING',
                    issue_type: 'CAMPAIGN_PAUSED',
                    message: `Campaign "${campaignName}" is paused at campaign level`,
                    recommendation: 'Check campaign settings in Meta Ads Manager',
                });
            } else if (effectiveStatus === 'ADSET_PAUSED') {
                issues.push({
                    campaign_id: campaignId,
                    campaign_name: campaignName,
                    severity: 'WARNING',
                    issue_type: 'ADSET_PAUSED',
                    message: `Ad sets in "${campaignName}" are paused`,
                    recommendation: 'Check ad set settings in Meta Ads Manager',
                });
            }

            // Check for issues_info if present
            if (campaign.issues_info && campaign.issues_info.length > 0) {
                for (const issue of campaign.issues_info) {
                    issues.push({
                        campaign_id: campaignId,
                        campaign_name: campaignName,
                        severity: issue.level === 'ERROR' ? 'CRITICAL' : 'WARNING',
                        issue_type: issue.error_code || 'UNKNOWN',
                        message: issue.error_message || `Issue in "${campaignName}"`,
                        recommendation: issue.error_summary || 'Check Meta Ads Manager for details',
                    });
                }
            }
        }

        console.log(`[Analytics] Found ${issues.length} delivery issues across ${campaignsData.data?.length || 0} campaigns`);
        return issues;

    } catch (error) {
        console.error('[Analytics] Error checking ad delivery:', error);
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
                const cpaVsTarget = ((TARGET_CPA - best.cpa) / TARGET_CPA * 100).toFixed(0);
                recommendations.push({
                    priority: 'HIGH',
                    action: `Increase "${best.campaign_name}" budget by 25-30%`,
                    reason: `CPA of ${best.cpa.toFixed(0)} RON is ${cpaVsTarget}% below target - room to scale`,
                    data_points: {
                        current_cpa: best.cpa.toFixed(0),
                        target_cpa: TARGET_CPA,
                        gap_to_target: `${cpaVsTarget}% below`,
                        current_spend: best.spend.toFixed(0),
                        purchases: best.purchases,
                        calculation: `CPA = ${best.spend.toFixed(0)} RON ÷ ${best.purchases} purchases = ${best.cpa.toFixed(0)} RON`,
                        recommendation_basis: 'CPA significantly below target means efficient acquisition - scaling will maintain profitability',
                    },
                    channel: 'Meta Ads',
                });
            }

            // Recommend pausing poor performers (only if they are ACTIVE, not already paused)
            if (worst.cpa > TARGET_CPA * 1.5 && worst !== best && worst.spend > 50) {
                const cpaOverTarget = ((worst.cpa - TARGET_CPA) / TARGET_CPA * 100).toFixed(0);
                recommendations.push({
                    priority: 'HIGH',
                    action: `Pause or optimize "${worst.campaign_name}"`,
                    reason: `CPA of ${worst.cpa.toFixed(0)} RON is ${cpaOverTarget}% above target - money being wasted`,
                    data_points: {
                        current_cpa: worst.cpa.toFixed(0),
                        target_cpa: TARGET_CPA,
                        gap_to_target: `${cpaOverTarget}% above`,
                        spend_last_7d: worst.spend.toFixed(0),
                        purchases: worst.purchases,
                        calculation: `CPA = ${worst.spend.toFixed(0)} RON ÷ ${worst.purchases} purchases = ${worst.cpa.toFixed(0)} RON`,
                        wasted_spend: (worst.spend - (worst.purchases * TARGET_CPA)).toFixed(0),
                        recommendation_basis: `At target CPA of ${TARGET_CPA} RON, should have spent only ${(worst.purchases * TARGET_CPA).toFixed(0)} RON`,
                    },
                    channel: 'Meta Ads',
                });
            }
        }
    }

    // Check Meta ROAS
    const metaChannel = attribution.by_channel['Meta Paid'];
    if (metaChannel) {
        const metaSpend = metaChannel.spend;
        const metaRevenue = metaChannel.revenue;
        const roas = metaChannel.roas;

        if (roas > 0 && roas < 1) {
            recommendations.push({
                priority: 'CRITICAL',
                action: 'Meta Ads losing money - reduce spend or pause immediately',
                reason: `Spending more than earning: ${metaSpend.toFixed(0)} RON spent → ${metaRevenue.toFixed(0)} RON revenue`,
                data_points: {
                    current_roas: roas.toFixed(2) + 'x',
                    target_roas: TARGET_ROAS + 'x',
                    total_spend: metaSpend.toFixed(0),
                    total_revenue: metaRevenue.toFixed(0),
                    loss_amount: (metaSpend - metaRevenue).toFixed(0),
                    calculation: `ROAS = ${metaRevenue.toFixed(0)} RON revenue ÷ ${metaSpend.toFixed(0)} RON spend = ${roas.toFixed(2)}x`,
                    recommendation_basis: 'ROAS below 1x means every RON spent loses money',
                },
                channel: 'Meta Ads',
            });
        } else if (roas >= TARGET_ROAS) {
            const profitAmount = metaRevenue - metaSpend;
            recommendations.push({
                priority: 'MEDIUM',
                action: 'Meta Ads profitable - consider scaling budget 10-20%',
                reason: `Generating ${roas.toFixed(2)}x return on spend (target: ${TARGET_ROAS}x)`,
                data_points: {
                    current_roas: roas.toFixed(2) + 'x',
                    target_roas: TARGET_ROAS + 'x',
                    profit_amount: profitAmount.toFixed(0),
                    total_spend: metaSpend.toFixed(0),
                    total_revenue: metaRevenue.toFixed(0),
                    calculation: `ROAS = ${metaRevenue.toFixed(0)} RON ÷ ${metaSpend.toFixed(0)} RON = ${roas.toFixed(2)}x → Profit: ${profitAmount.toFixed(0)} RON`,
                    recommendation_basis: 'ROAS above 3x typically safe to scale while maintaining profitability',
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
    const lapsedRatio = activeVips > 0 ? ((lapsedVips / activeVips) * 100).toFixed(0) : '100';

    if (lapsedVips > activeVips * 0.5) {
        const potentialRecovery = Math.round(lapsedVips * AVG_ORDER_VALUE * 0.1);
        recommendations.push({
            priority: 'HIGH',
            action: `Launch VIP reactivation campaign for ${lapsedVips} lapsed customers`,
            reason: `${lapsedRatio}% of VIP capacity is dormant - significant recovery opportunity`,
            data_points: {
                lapsed_vips: lapsedVips,
                active_vips: activeVips,
                lapsed_ratio: `${lapsedRatio}%`,
                avg_vip_order: AVG_ORDER_VALUE.toFixed(0),
                potential_recovery: potentialRecovery.toFixed(0),
                calculation: `${lapsedVips} lapsed × ${AVG_ORDER_VALUE} RON × 10% return rate = ${potentialRecovery} RON`,
                recommendation_basis: 'VIP customers have 3x higher purchase probability than cold leads - reactivating lapsed VIPs is more cost-effective than acquiring new ones',
            },
            channel: 'Email/Meta',
        });
    }

    // Email recommendation
    const emailChannel = attribution.by_channel['Email'];
    if (emailChannel && emailChannel.revenue > 0) {
        const emailConversions = emailChannel.conversions || 0;
        recommendations.push({
            priority: 'MEDIUM',
            action: 'Increase email marketing frequency - schedule 2-3 campaigns/week',
            reason: `Email generating ${emailChannel.revenue.toFixed(0)} RON revenue with ZERO ad spend`,
            data_points: {
                email_revenue: emailChannel.revenue.toFixed(0),
                email_conversions: emailConversions,
                cost: '0 RON',
                roas: '∞ (infinite)',
                calculation: `${emailChannel.revenue.toFixed(0)} RON revenue ÷ 0 RON cost = Infinite ROAS`,
                recommendation_basis: 'Email has highest ROI of any channel - every email sent has potential value with no incremental cost',
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
    const [orders, customers, storedCampaigns, liveCampaigns, deliveryIssues] = await Promise.all([
        fetchLegacyOrders(days),
        fetchCustomers(supabase),
        fetchMetaCampaigns(supabase),
        fetchMetaAdsLive(days),
        checkAdDeliveryIssues(),
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
        delivery_issues: deliveryIssues,
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
        delivery_issues: result.delivery_issues,
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

    // Check for critical delivery issues
    const criticalIssues = result.delivery_issues?.filter(i => i.severity === 'CRITICAL') || [];
    const warningIssues = result.delivery_issues?.filter(i => i.severity === 'WARNING') || [];

    const subject = criticalIssues.length > 0
        ? `🔴 URGENT: ${criticalIssues.length} Ad Delivery Issue(s) - Hudemas Analytics`
        : `📊 Hudemas Analytics - ${new Date().toLocaleDateString()}`;

    // Build RED ALERT section if there are critical issues
    const redAlertSection = criticalIssues.length > 0 ? `
        <div style="background: #fee2e2; border: 2px solid #dc2626; padding: 16px; margin-bottom: 20px; border-radius: 8px;">
            <h2 style="color: #dc2626; margin: 0 0 12px 0;">🔴 AD DELIVERY ALERTS</h2>
            <p style="margin: 0 0 8px 0;"><strong>ACTION REQUIRED:</strong> The following campaigns need immediate attention:</p>
            <ul style="margin: 8px 0;">
                ${criticalIssues.map(i =>
        `<li><strong>${i.campaign_name}:</strong> ${i.message}<br/><em style="color: #666;">Fix: ${i.recommendation}</em></li>`
    ).join('')}
            </ul>
            <p style="margin: 8px 0 0 0;"><a href="https://business.facebook.com/adsmanager" style="color: #dc2626; font-weight: bold;">Open Meta Ads Manager →</a></p>
        </div>
    ` : '';

    // Build WARNING section if there are warnings
    const warningSection = warningIssues.length > 0 ? `
        <div style="background: #fef3c7; border: 1px solid #f59e0b; padding: 12px; margin-bottom: 16px; border-radius: 6px;">
            <h3 style="color: #d97706; margin: 0 0 8px 0;">⚠️ Warnings (${warningIssues.length})</h3>
            <ul style="margin: 0; font-size: 14px;">
                ${warningIssues.slice(0, 5).map(i =>
        `<li>${i.campaign_name}: ${i.message}</li>`
    ).join('')}
            </ul>
        </div>
    ` : '';

    const html = `
        <h1>📊 Hudemas Daily Analytics</h1>
        <p><strong>Generated:</strong> ${new Date().toLocaleString()}</p>
        
        ${redAlertSection}
        ${warningSection}
        
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
