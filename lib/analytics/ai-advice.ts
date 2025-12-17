/**
 * AI Advice Engine - Phase 5 of Dashboard v4.0
 * Intelligent marketing insights: Anomaly Detection, Daily Digest, Budget Optimizer, Trend Predictions
 */

import type { Campaign, DailyTrend, Recommendation, AnalyticsResult } from './engine';

// ============ Types ============

export interface Anomaly {
    metric: string;
    current: number;
    expected: number;
    deviation_pct: number;
    severity: 'HIGH' | 'MEDIUM' | 'LOW';
    message: string;
    icon: string;
}

export interface DailyDigest {
    top_actions: Array<{
        priority: number;
        action: string;
        reason: string;
        impact: string;
        channel: string;
    }>;
    health_score: number; // 0-100
    quick_stats: {
        wins: number;
        warnings: number;
        critical: number;
    };
    generated_at: string;
}

export interface BudgetSuggestion {
    from_campaign: string;
    from_campaign_id?: string;
    to_campaign: string;
    to_campaign_id?: string;
    amount: number;
    reason: string;
    expected_impact: {
        additional_purchases: number;
        savings: number;
    };
}

export interface TrendPrediction {
    metric: string;
    historical: number[];
    forecast: number[];
    forecast_total: number;
    change_pct: number;
    confidence: 'HIGH' | 'MEDIUM' | 'LOW';
}

export interface AIAdviceResult {
    daily_digest: DailyDigest;
    anomalies: Anomaly[];
    budget_suggestions: BudgetSuggestion[];
    predictions: TrendPrediction[];
    generated_at: string;
}

// ============ Configuration ============

const TARGET_CPA = 50;
const TARGET_ROAS = 3.0;
const AVG_ORDER_VALUE = 215;

// Anomaly thresholds
const SPEND_DEVIATION_THRESHOLD = 0.3; // 30%
const CTR_DROP_THRESHOLD = 0.2; // 20%
const CPA_SPIKE_THRESHOLD = 0.5; // 50%

// ============ Anomaly Detection ============

export function detectAnomalies(
    trends: DailyTrend[],
    campaigns: Campaign[]
): Anomaly[] {
    const anomalies: Anomaly[] = [];

    if (trends.length < 2) return anomalies;

    // Split trends into current vs previous period
    const midpoint = Math.floor(trends.length / 2);
    const currentPeriod = trends.slice(midpoint);
    const previousPeriod = trends.slice(0, midpoint);

    // Calculate averages
    const avgCurrent = {
        orders: currentPeriod.reduce((s, t) => s + t.orders, 0) / currentPeriod.length,
        revenue: currentPeriod.reduce((s, t) => s + t.revenue, 0) / currentPeriod.length,
        spend: currentPeriod.reduce((s, t) => s + t.meta_spend, 0) / currentPeriod.length,
        purchases: currentPeriod.reduce((s, t) => s + t.meta_purchases, 0) / currentPeriod.length,
    };

    const avgPrevious = {
        orders: previousPeriod.reduce((s, t) => s + t.orders, 0) / previousPeriod.length || 1,
        revenue: previousPeriod.reduce((s, t) => s + t.revenue, 0) / previousPeriod.length || 1,
        spend: previousPeriod.reduce((s, t) => s + t.meta_spend, 0) / previousPeriod.length || 1,
        purchases: previousPeriod.reduce((s, t) => s + t.meta_purchases, 0) / previousPeriod.length || 1,
    };

    // Check: Spend up but conversions flat
    const spendChange = (avgCurrent.spend - avgPrevious.spend) / avgPrevious.spend;
    const purchaseChange = (avgCurrent.purchases - avgPrevious.purchases) / avgPrevious.purchases;

    if (spendChange > SPEND_DEVIATION_THRESHOLD && purchaseChange < 0.1) {
        anomalies.push({
            metric: 'Spend Efficiency',
            current: avgCurrent.spend,
            expected: avgPrevious.spend,
            deviation_pct: Math.round(spendChange * 100),
            severity: 'HIGH',
            message: `Spend up ${Math.round(spendChange * 100)}% but conversions only ${Math.round(purchaseChange * 100)}% change`,
            icon: '📈🔻',
        });
    }

    // Check: CTR drop
    if (campaigns.length > 0) {
        const avgCTR = campaigns.reduce((s, c) => s + c.ctr, 0) / campaigns.length;
        const avgCtrBenchmark = 1.5; // Industry benchmark for e-commerce

        if (avgCTR < avgCtrBenchmark * (1 - CTR_DROP_THRESHOLD)) {
            anomalies.push({
                metric: 'Click-Through Rate',
                current: avgCTR,
                expected: avgCtrBenchmark,
                deviation_pct: Math.round(((avgCtrBenchmark - avgCTR) / avgCtrBenchmark) * 100),
                severity: 'MEDIUM',
                message: `CTR of ${avgCTR.toFixed(2)}% is ${Math.round(((avgCtrBenchmark - avgCTR) / avgCtrBenchmark) * 100)}% below benchmark`,
                icon: '🖱️⬇️',
            });
        }
    }

    // Check: CPA spike
    const campaignsWithPurchases = campaigns.filter(c => c.purchases > 0);
    if (campaignsWithPurchases.length > 0) {
        const avgCPA = campaignsWithPurchases.reduce((s, c) => s + c.cpa, 0) / campaignsWithPurchases.length;

        if (avgCPA > TARGET_CPA * (1 + CPA_SPIKE_THRESHOLD)) {
            anomalies.push({
                metric: 'Cost Per Acquisition',
                current: avgCPA,
                expected: TARGET_CPA,
                deviation_pct: Math.round(((avgCPA - TARGET_CPA) / TARGET_CPA) * 100),
                severity: 'HIGH',
                message: `Average CPA of ${avgCPA.toFixed(0)} RON is ${Math.round(((avgCPA - TARGET_CPA) / TARGET_CPA) * 100)}% above target`,
                icon: '💰⚠️',
            });
        }
    }

    // Check: Revenue drop
    const revenueChange = (avgCurrent.revenue - avgPrevious.revenue) / avgPrevious.revenue;
    if (revenueChange < -0.25) {
        anomalies.push({
            metric: 'Revenue',
            current: avgCurrent.revenue,
            expected: avgPrevious.revenue,
            deviation_pct: Math.round(Math.abs(revenueChange) * 100),
            severity: 'HIGH',
            message: `Revenue dropped ${Math.round(Math.abs(revenueChange) * 100)}% compared to previous period`,
            icon: '📉',
        });
    }

    return anomalies;
}

// ============ Daily Digest ============

export function generateDailyDigest(
    recommendations: Recommendation[],
    campaigns: Campaign[],
    anomalies: Anomaly[]
): DailyDigest {
    // Count by priority
    const critical = recommendations.filter(r => r.priority === 'CRITICAL').length + anomalies.filter(a => a.severity === 'HIGH').length;
    const warnings = recommendations.filter(r => r.priority === 'HIGH').length + anomalies.filter(a => a.severity === 'MEDIUM').length;
    const wins = recommendations.filter(r => r.priority === 'LOW' || r.priority === 'MEDIUM').length;

    // Calculate health score (0-100)
    let healthScore = 100;
    healthScore -= critical * 20;
    healthScore -= warnings * 10;
    healthScore += wins * 5;
    healthScore = Math.max(0, Math.min(100, healthScore));

    // Boost if ROAS is good
    const campaignsWithPurchases = campaigns.filter(c => c.purchases > 0);
    if (campaignsWithPurchases.length > 0) {
        const avgCPA = campaignsWithPurchases.reduce((s, c) => s + c.cpa, 0) / campaignsWithPurchases.length;
        if (avgCPA < TARGET_CPA) {
            healthScore = Math.min(100, healthScore + 10);
        }
    }

    // Get top 3 actions
    const sortedRecs = [...recommendations].sort((a, b) => {
        const priorityOrder = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };
        return priorityOrder[a.priority] - priorityOrder[b.priority];
    });

    const topActions = sortedRecs.slice(0, 3).map((rec, i) => ({
        priority: i + 1,
        action: rec.action,
        reason: rec.reason,
        impact: estimateImpact(rec),
        channel: rec.channel,
    }));

    // If less than 3, add from anomalies
    if (topActions.length < 3 && anomalies.length > 0) {
        for (const anomaly of anomalies) {
            if (topActions.length >= 3) break;
            topActions.push({
                priority: topActions.length + 1,
                action: `Investigate ${anomaly.metric}`,
                reason: anomaly.message,
                impact: anomaly.severity === 'HIGH' ? 'Revenue protection' : 'Efficiency improvement',
                channel: 'Meta Ads',
            });
        }
    }

    return {
        top_actions: topActions,
        health_score: Math.round(healthScore),
        quick_stats: {
            wins,
            warnings,
            critical,
        },
        generated_at: new Date().toISOString(),
    };
}

function estimateImpact(rec: Recommendation): string {
    if (rec.data_points.potential_recovery) {
        return `~${rec.data_points.potential_recovery} RON recovery potential`;
    }
    if (rec.data_points.profit) {
        return `${rec.data_points.profit} RON profit opportunity`;
    }
    if (rec.data_points.wasted_spend) {
        return `Save ~${rec.data_points.wasted_spend} RON`;
    }
    if (rec.data_points.loss) {
        return `Stop losing ${rec.data_points.loss} RON`;
    }
    return 'Improved efficiency';
}

// ============ Budget Optimizer ============

export function optimizeBudget(campaigns: Campaign[]): BudgetSuggestion[] {
    const suggestions: BudgetSuggestion[] = [];

    if (campaigns.length < 2) return suggestions;

    // Find campaigns with purchases for CPA comparison
    const campaignsWithPurchases = campaigns.filter(c => c.purchases > 0 && c.spend > 0);

    if (campaignsWithPurchases.length < 2) return suggestions;

    // Sort by CPA
    const sortedByCPA = [...campaignsWithPurchases].sort((a, b) => a.cpa - b.cpa);

    const best = sortedByCPA[0];
    const worst = sortedByCPA[sortedByCPA.length - 1];

    // Only suggest if there's significant CPA difference (>30%)
    const cpaDiff = (worst.cpa - best.cpa) / best.cpa;

    if (cpaDiff > 0.3 && worst.spend > 20) {
        // Suggest moving 20-30% of worst performer's budget
        const moveAmount = Math.round(worst.spend * 0.25);
        const additionalPurchases = Math.round(moveAmount / best.cpa);
        const currentWastedPurchases = moveAmount / worst.cpa;
        const savingsPerPurchase = worst.cpa - best.cpa;

        suggestions.push({
            from_campaign: worst.campaign_name,
            from_campaign_id: worst.campaign_id,
            to_campaign: best.campaign_name,
            to_campaign_id: best.campaign_id,
            amount: moveAmount,
            reason: `"${best.campaign_name}" has ${Math.round(cpaDiff * 100)}% lower CPA (${best.cpa.toFixed(0)} vs ${worst.cpa.toFixed(0)} RON)`,
            expected_impact: {
                additional_purchases: Math.max(0, additionalPurchases - Math.floor(currentWastedPurchases)),
                savings: Math.round(savingsPerPurchase * additionalPurchases),
            },
        });
    }

    // Check for campaigns that could be paused entirely
    for (const campaign of campaignsWithPurchases) {
        if (campaign.cpa > TARGET_CPA * 2 && campaign.spend > 50) {
            suggestions.push({
                from_campaign: campaign.campaign_name,
                from_campaign_id: campaign.campaign_id,
                to_campaign: 'Savings / Reserve',
                amount: Math.round(campaign.spend * 0.5),
                reason: `CPA of ${campaign.cpa.toFixed(0)} RON is 2x above target - consider pausing`,
                expected_impact: {
                    additional_purchases: 0,
                    savings: Math.round(campaign.spend * 0.5),
                },
            });
        }
    }

    return suggestions;
}

// ============ Trend Predictions ============

export function predictTrends(trends: DailyTrend[]): TrendPrediction[] {
    const predictions: TrendPrediction[] = [];

    if (trends.length < 3) return predictions;

    // Predict orders
    predictions.push(createPrediction(
        'Orders',
        trends.map(t => t.orders),
    ));

    // Predict revenue
    predictions.push(createPrediction(
        'Revenue',
        trends.map(t => t.revenue),
    ));

    // Predict spend
    predictions.push(createPrediction(
        'Meta Spend',
        trends.map(t => t.meta_spend),
    ));

    return predictions;
}

function createPrediction(metric: string, historical: number[]): TrendPrediction {
    // Simple moving average forecast
    const windowSize = Math.min(3, historical.length);
    const recentAvg = historical.slice(-windowSize).reduce((s, v) => s + v, 0) / windowSize;

    // Calculate trend (slope)
    const trend = historical.length > 1
        ? (historical[historical.length - 1] - historical[0]) / historical.length
        : 0;

    // Generate 7-day forecast
    const forecast: number[] = [];
    for (let i = 1; i <= 7; i++) {
        const predicted = Math.max(0, recentAvg + (trend * i * 0.5)); // Dampen trend
        forecast.push(Math.round(predicted * 100) / 100);
    }

    const forecastTotal = forecast.reduce((s, v) => s + v, 0);
    const historicalTotal = historical.reduce((s, v) => s + v, 0);
    const changePct = historicalTotal > 0
        ? ((forecastTotal - historicalTotal) / historicalTotal) * 100
        : 0;

    // Calculate confidence based on volatility
    const mean = historical.reduce((s, v) => s + v, 0) / historical.length;
    const variance = historical.reduce((s, v) => s + Math.pow(v - mean, 2), 0) / historical.length;
    const coefficientOfVariation = mean > 0 ? Math.sqrt(variance) / mean : 1;

    let confidence: 'HIGH' | 'MEDIUM' | 'LOW';
    if (coefficientOfVariation < 0.2) {
        confidence = 'HIGH';
    } else if (coefficientOfVariation < 0.5) {
        confidence = 'MEDIUM';
    } else {
        confidence = 'LOW';
    }

    return {
        metric,
        historical,
        forecast,
        forecast_total: Math.round(forecastTotal),
        change_pct: Math.round(changePct),
        confidence,
    };
}

// ============ Main Entry Point ============

export function generateAIAdvice(analyticsResult: AnalyticsResult): AIAdviceResult {
    const { campaigns, trends, recommendations } = analyticsResult;

    // Generate all insights
    const anomalies = detectAnomalies(trends, campaigns);
    const daily_digest = generateDailyDigest(recommendations, campaigns, anomalies);
    const budget_suggestions = optimizeBudget(campaigns);
    const predictions = predictTrends(trends);

    return {
        daily_digest,
        anomalies,
        budget_suggestions,
        predictions,
        generated_at: new Date().toISOString(),
    };
}
