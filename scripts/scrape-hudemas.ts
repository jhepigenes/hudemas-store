import axios from 'axios';
import * as cheerio from 'cheerio';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const BASE_URL = 'https://www.hudemas.ro';
const OUTPUT_FILE = path.resolve(__dirname, '../scraped_data/full_products.json');

// Ensure output directory exists
const outputDir = path.dirname(OUTPUT_FILE);
if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
}

interface Product {
    title: string;
    price: string;
    url: string;
    image: string;
    category: string;
    description?: string;
    dimensions?: string;
    product_type: 'kit' | 'accessory' | 'finished';
}

const CATEGORIES = [
    { name: 'Goblenuri', url: 'https://www.hudemas.ro/goblenuri', type: 'kit' },
    { name: 'Accesorii', url: 'https://www.hudemas.ro/goblenuri/gherghefuri-panza-lupe-ace', type: 'accessory' },
    { name: 'Rame', url: 'https://www.hudemas.ro/rame', type: 'accessory' }
];

async function scrapeCategory(categoryName: string, categoryUrl: string, productType: 'kit' | 'accessory' | 'finished'): Promise<Product[]> {
    console.log(`Scraping category: ${categoryName} (${categoryUrl})`);
    const products: Product[] = [];
    let page = 1;
    let hasNextPage = true;

    while (hasNextPage) {
        // Pagination logic
        // For /goblenuri it works with /60, /120
        // For /rame it might be similar or different.
        // Let's assume standard pattern for now.

        const offset = (page - 1) * 60;
        let pageUrl = categoryUrl;

        if (page > 1) {
            // Check if url already has query params or not
            if (categoryUrl.includes('?')) {
                pageUrl = `${categoryUrl}&page=${page}`; // Some sites use query params
            } else {
                pageUrl = `${categoryUrl}/${offset}`;
            }
        }

        console.log(`  Fetching page ${page} (${pageUrl})...`);

        try {
            const { data } = await axios.get(pageUrl);
            const $ = cheerio.load(data);

            // Adjust selector based on actual site structure
            // Based on previous read, items seem to be in a list. 
            // I'll need to inspect the HTML structure from read_url_content output or browser.
            // For now, using generic selectors that are common, will refine.

            // Looking at the text dump: "Pe malul apei ... 63,98 Lei"
            // It seems to be a standard grid.

            // Based on analysis, products are links to /goblen/...
            // We'll look for all anchor tags, check if they link to a product, and extract info.

            // Check if we found any NEW products on this page
            let newItemsOnPage = 0;
            $('a').each((_, element) => {
                const el = $(element);
                const href = el.attr('href');

                // Heuristic for product links
                const isProductLink = href && (
                    (href.includes('/goblen/') && !href.includes('/goblenuri')) ||
                    (href.includes('/rame/') && !href.includes('/rame')) ||
                    (href.includes('/accesorii/') && !href.includes('/accesorii'))
                );

                if (isProductLink) {
                    const text = el.text().trim();
                    const priceMatch = text.match(/(\d+([.,]\d+)?)\s*Lei/i);

                    if (priceMatch) {
                        const price = priceMatch[0];
                        let title = el.find('h2, h3, .title').text().trim();
                        if (!title) {
                            title = text.replace(price, '').replace('Nou', '').replace('Favorit', '').trim();
                        }

                        const img = el.find('img').attr('src');
                        const fullUrl = href.startsWith('http') ? href : `${BASE_URL}${href}`;

                        const existing = products.find(p => p.url === fullUrl);
                        if (!existing) {
                            products.push({
                                title,
                                price,
                                url: fullUrl,
                                image: img ? (img.startsWith('http') ? img : `${BASE_URL}${img}`) : '',
                                category: categoryName,
                                product_type: productType
                            });
                            newItemsOnPage++;
                        }
                    }
                }
            });

            console.log(`  Found ${newItemsOnPage} new items on page ${page}`);

            if (newItemsOnPage === 0) {
                console.log('  No new items found. Stopping pagination.');
                hasNextPage = false;
            }

            page++;

            // Safety break
            if (page > 200) hasNextPage = false;

        } catch (error: any) {
            // If 404, likely end of pagination
            if (error.response && error.response.status === 404) {
                console.log('  Reached end of pages (404).');
            } else {
                console.error(`  Error fetching page ${page}:`, error.message);
            }
            hasNextPage = false;
        }
    }

    return products;
}

async function main() {
    const allProducts: Product[] = [];

    for (const cat of CATEGORIES) {
        const products = await scrapeCategory(cat.name, cat.url, cat.type as 'kit' | 'accessory' | 'finished');
        allProducts.push(...products);
    }

    fs.writeFileSync(OUTPUT_FILE, JSON.stringify(allProducts, null, 2));
    console.log(`Scraping complete. Saved ${allProducts.length} products to ${OUTPUT_FILE}`);
}

main();
