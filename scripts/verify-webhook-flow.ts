
import { createClient } from '@supabase/supabase-js';
import Stripe from 'stripe';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const WEBHOOK_SECRET = 'whsec_test'; // Must match what the server was started with

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
const stripe = new Stripe('sk_test_placeholder', {
    // apiVersion: '2025-11-17.clover', // Use default from installed package
});

async function main() {
    console.log('🚀 Starting Webhook Verification (Endpoint Reachability Only)...');

    // 1. Skip Order Creation (No Service Role Key)
    const fakeOrderId = '00000000-0000-0000-0000-000000000000';
    console.log(`ℹ️ Using fake order ID: ${fakeOrderId}`);

    // 2. Construct Stripe Event Payload
    const payload = {
        id: 'evt_test_webhook',
        object: 'event',
        type: 'payment_intent.succeeded',
        data: {
            object: {
                id: 'pi_test_123',
                object: 'payment_intent',
                amount: 10000,
                currency: 'ron',
                metadata: {
                    orderId: fakeOrderId
                },
                status: 'succeeded'
            }
        }
    };

    const payloadString = JSON.stringify(payload);
    const signature = stripe.webhooks.generateTestHeaderString({
        payload: payloadString,
        secret: WEBHOOK_SECRET,
    });

    // 3. Send Webhook Request
    console.log('📡 Sending webhook request...');
    try {
        const response = await fetch('http://localhost:3000/api/webhooks/stripe', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'stripe-signature': signature,
            },
            body: payloadString,
        });

        if (!response.ok) {
            const text = await response.text();
            console.error(`❌ Webhook request failed: ${response.status} ${response.statusText}`);
            console.error('Response:', text);
            process.exit(1);
        }

        console.log('✅ Webhook request sent successfully. Response: 200 OK');
        console.log('ℹ️ Check server logs to see if it attempted to update the order (it should fail to find the order or update it).');

    } catch (e) {
        console.error('❌ Failed to send request:', e);
        process.exit(1);
    }
}

main();
