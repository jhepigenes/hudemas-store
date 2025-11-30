
const fs = require('fs');
const path = require('path');

const categories = [
    { name: 'Fructe', url: 'https://www.hudemas.ro/goblenuri/fructe', type: 'kit' },
    { name: 'Flori', url: 'https://www.hudemas.ro/goblenuri/flori', type: 'kit' },
    { name: 'Peisaje', url: 'https://www.hudemas.ro/goblenuri/peisaje', type: 'kit' },
    { name: 'Religioase', url: 'https://www.hudemas.ro/goblenuri/religioase', type: 'kit' },
    { name: 'Natură moartă', url: 'https://www.hudemas.ro/goblenuri/natura-moarta', type: 'kit' },
    { name: 'Animale', url: 'https://www.hudemas.ro/goblenuri/animale-pasari-fluturi', type: 'kit' },
    { name: 'Pentru copii', url: 'https://www.hudemas.ro/goblenuri/pentru-copii', type: 'kit' },
    { name: 'Moderne', url: 'https://www.hudemas.ro/goblenuri/moderne', type: 'kit' },
    { name: 'Marine', url: 'https://www.hudemas.ro/goblenuri/marine', type: 'kit' },
    { name: 'Personaje', url: 'https://www.hudemas.ro/goblenuri/personaje', type: 'kit' },
    { name: 'Pictori celebri', url: 'https://www.hudemas.ro/goblenuri/pictori-celebri', type: 'kit' },
    { name: 'Zodii', url: 'https://www.hudemas.ro/goblenuri/zodii', type: 'kit' },
    { name: 'Modele 2-4 culori', url: 'https://www.hudemas.ro/goblenuri/modele-2-4-culori', type: 'kit' },
    { name: 'Alegorii', url: 'https://www.hudemas.ro/goblenuri/alegorii', type: 'kit' },
    { name: 'Accesorii', url: 'https://www.hudemas.ro/goblenuri/gherghefuri-panza-lupe-ace', type: 'accessory' }
];

async function fetchPage(url) {
    try {
        const response = await fetch(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            }
        });
        return await response.text();
    } catch (error) {
        console.error(`Failed to fetch ${url}:`, error);
        return null;
    }
}

function extractProducts(html, category, type) {
    const products = [];
    // Regex to find product list items
    // Looking for <li id="product-..."> ... </li>
    // This is a simple regex approach, might need refinement based on actual HTML structure

    // We'll split by <li id="product- to get chunks
    const chunks = html.split('<li id="product-');

    // Skip the first chunk (before the first product)
    for (let i = 1; i < chunks.length; i++) {
        const chunk = chunks[i];

        // Extract Title: <h2 class="product-name" title="...">Title</h2>
        const titleMatch = chunk.match(/<h2 class="product-name"[^>]*>([^<]+)<\/h2>/);

        // Extract Price: <span class="amount">38,09</span>
        const priceMatch = chunk.match(/<span class="amount">([\d,.]+)<\/span>/);

        // Extract Image: <img src="..." ...>
        const imageMatch = chunk.match(/<img[^>]*src="([^"]+)"/);

        if (titleMatch && priceMatch && imageMatch) {
            let price = parseFloat(priceMatch[1].replace(',', '.'));
            let title = titleMatch[1].trim();
            let image = imageMatch[1];

            // Fix relative image URLs
            if (!image.startsWith('http')) {
                image = 'https://www.hudemas.ro' + image;
            }

            products.push({
                title,
                price,
                image,
                category: category,
                product_type: type,
                currency: 'RON'
            });
        }
    }

    return products;
}

async function scrape() {
    let allProducts = [];

    for (const cat of categories) {
        console.log(`Scraping ${cat.name}...`);
        const html = await fetchPage(cat.url);
        if (html) {
            const products = extractProducts(html, cat.name, cat.type);
            console.log(`Found ${products.length} products in ${cat.name}`);
            allProducts = allProducts.concat(products);
        }
        // Be nice to the server
        await new Promise(resolve => setTimeout(resolve, 1000));
    }

    console.log(`Total products found: ${allProducts.length}`);

    fs.writeFileSync(path.join(__dirname, '../products_full.json'), JSON.stringify(allProducts, null, 2));
    console.log('Saved to products_full.json');
}

scrape();
