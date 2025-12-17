import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams;
        const days = parseInt(searchParams.get('days') || '7');

        // Read from latest meta campaigns CSV
        const reportsDir = path.join(process.cwd(), '..', 'reports');

        // Find most recent report folder
        let latestFolder = '';
        try {
            const folders = fs.readdirSync(reportsDir)
                .filter(f => /^\d{4}$/.test(f))
                .sort()
                .reverse();
            if (folders.length > 0) {
                latestFolder = folders[0];
            }
        } catch {
            // Fallback if can't read directory
        }

        if (!latestFolder) {
            return NextResponse.json({ campaigns: [], error: 'No report folders found' });
        }

        const campaignsFile = path.join(reportsDir, latestFolder, 'meta_campaigns.csv');

        if (!fs.existsSync(campaignsFile)) {
            return NextResponse.json({ campaigns: [], error: 'No campaigns file found' });
        }

        // Parse CSV
        const content = fs.readFileSync(campaignsFile, 'utf-8');
        const lines = content.trim().split('\n');
        const headers = lines[0].split(',');

        const campaigns = lines.slice(1).map(line => {
            const values = line.split(',');
            const campaign: Record<string, string | number> = {};
            headers.forEach((header, i) => {
                const value = values[i]?.replace(/"/g, '') || '';
                // Convert numeric fields
                if (['spend', 'impressions', 'reach', 'clicks', 'cpc', 'cpm', 'ctr', 'purchases', 'cost_per_purchase'].includes(header)) {
                    campaign[header] = parseFloat(value) || 0;
                } else {
                    campaign[header] = value;
                }
            });
            return campaign;
        });

        return NextResponse.json({
            campaigns,
            source: `reports/${latestFolder}/meta_campaigns.csv`,
            count: campaigns.length,
        });
    } catch (err) {
        console.error('Campaigns error:', err);
        return NextResponse.json({ error: 'Failed to fetch campaigns' }, { status: 500 });
    }
}
