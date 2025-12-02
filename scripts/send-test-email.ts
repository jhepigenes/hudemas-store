// import { resend } from '../lib/resend';
import { Resend } from 'resend';
import OrderConfirmationEmail from '../app/components/emails/OrderConfirmation';
import dotenv from 'dotenv';
import path from 'path';

// Load env vars
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const resend = new Resend(process.env.RESEND_API_KEY);

async function sendTest() {
    console.log('📧 Sending test email to jhountondji@gmx.de...');

    try {
        const data = await resend.emails.send({
            from: 'orders@hudemas.ro', // Using the production sender
            to: 'jhountondji@gmx.de',
            subject: 'Hudemas Order Confirmation (TEST)',
            react: OrderConfirmationEmail({
                customerName: 'Johannes Test',
                orderId: 'TEST-123',
                orderDate: new Date().toLocaleDateString(),
                totalAmount: '250.00 RON',
                items: [
                    { name: 'Dansul lebedelor (Kit)', quantity: 1, price: '120.00 RON' },
                    { name: 'Rama lemn', quantity: 1, price: '130.00 RON' }
                ],
                shippingAddress: {
                    street: 'Test Street 1',
                    city: 'Bucharest',
                    state: 'B',
                    zip: '010101',
                    country: 'Romania'
                }
            }),
        });

        if (data.error) {
            console.error('❌ Failed:', data.error);
        } else {
            console.log('✅ Email sent successfully!', data);
        }
    } catch (e) {
        console.error('❌ Exception:', e);
    }
}

sendTest();
