/**
 * AI Advice API Endpoint
 * Returns: Daily Digest, Anomalies, Budget Suggestions, Trend Predictions
 */

import { NextResponse } from 'next/server';
import { runAnalytics } from '@/lib/analytics/engine';
import { generateAIAdvice, type AIAdviceResult } from '@/lib/analytics/ai-advice';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const days = parseInt(searchParams.get('days') || '7', 10);

        // Run full analytics to get campaigns, trends, recommendations
        const analyticsResult = await runAnalytics(days);

        // Generate AI advice
        const advice: AIAdviceResult = generateAIAdvice(analyticsResult);

        return NextResponse.json({
            success: true,
            data: advice,
        });

    } catch (error) {
        console.error('[AI Advice API] Error:', error);

        return NextResponse.json({
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
            data: {
                daily_digest: {
                    top_actions: [],
                    health_score: 50,
                    quick_stats: { wins: 0, warnings: 0, critical: 0 },
                    generated_at: new Date().toISOString(),
                },
                anomalies: [],
                budget_suggestions: [],
                predictions: [],
                correlations: [],
                generated_at: new Date().toISOString(),
            },
        }, { status: 500 });
    }
}
