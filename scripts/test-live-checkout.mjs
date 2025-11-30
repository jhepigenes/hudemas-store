import fetch from 'node-fetch';

async function testCheckout() {
    const url = 'https://hudemas-store-eqmqllaq4-hudemas-projects.vercel.app/api/create-order';
    
    const payload = {
        customer: {
            firstName: "Test",
            lastName: "Bot",
            email: "test@bot.com",
            phone: "0700000000",
            country: "Romania",
            county: "Test County",
            city: "Test City",
            address: "Test St 123"
        },
        items: [
            {
                id: "HUD-001", // Assuming this exists or handling N/A
                name: "Test Gobelin Kit",
                quantity: 1,
                price: "100.00",
                currency: "RON",
                image: "https://placeholder.com/img.jpg"
            }
        ],
        total: 100,
        paymentMethod: "card",
        shippingMethod: "courier",
        customerType: "private",
        userId: null
    };

    console.log(`Sending POST request to ${url}...`);

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        const data = await response.json();

        if (response.ok) {
            console.log('✅ Order Created Successfully!');
            console.log('Order ID:', data.orderId);
            console.log('Client Secret:', data.clientSecret ? 'Present (starts with ' + data.clientSecret.substring(0, 5) + '...)' : 'Missing');
            
            if (data.clientSecret) {
                console.log('🎉 Stripe Integration verified. The UI should open the modal now.');
            }
        } else {
            console.error('❌ Failed to create order.');
            console.error('Status:', response.status);
            console.error('Error:', data);
        }

    } catch (error) {
        console.error('❌ Network/Script Error:', error);
    }
}

testCheckout();
