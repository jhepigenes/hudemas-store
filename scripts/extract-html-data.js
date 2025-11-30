const fs = require('fs');
const path = require('path');

const html = fs.readFileSync(path.join(__dirname, '../accessories_page.html'), 'utf8');

const products = [];
const productRegex = /<li id="product-[\s\S]*?<\/li>/g;
const matches = html.match(productRegex);

if (matches) {
    matches.forEach(match => {
        const titleMatch = match.match(/<h2 class="product-name"[^>]*>([\s\S]*?)<\/h2>/);
        const priceMatch = match.match(/<span class="amount">([\s\S]*?)<\/span>/);
        const imageMatch = match.match(/<img src="([^"]*)"/);

        if (titleMatch && priceMatch && imageMatch) {
            products.push({
                title: titleMatch[1].trim(),
                price: parseFloat(priceMatch[1].replace(',', '.')),
                image: imageMatch[1]
            });
        }
    });
}

console.log(JSON.stringify(products, null, 2));
