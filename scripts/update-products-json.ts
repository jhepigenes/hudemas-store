
import fs from 'fs';
import path from 'path';

const scrapedDataPath = path.join(process.cwd(), 'scraped_data/full_products.json');
const productsJsonPath = path.join(process.cwd(), 'app/products.json');

const scrapedData = JSON.parse(fs.readFileSync(scrapedDataPath, 'utf-8'));

const newProducts = scrapedData.map((item: any) => {
    // Extract price number
    const priceString = item.price.replace(' Lei', '').replace('.', '').replace(',', '.').trim();
    // Keep original format "91,08" for consistency with existing app logic if needed, 
    // OR standardize. The app seems to expect "91,08" string in some places but "RON" currency.
    // Let's keep the numeric string but formatted as the app expects?
    // Existing products.json has "91,08".
    const formattedPrice = item.price.replace(' Lei', '').trim();

    return {
        name: item.title,
        image: item.image,
        price: formattedPrice,
        currency: 'RON'
    };
});

fs.writeFileSync(productsJsonPath, JSON.stringify(newProducts, null, 4));

console.log(`Updated products.json with ${newProducts.length} items.`);
