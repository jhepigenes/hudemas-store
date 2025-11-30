
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const accessories = [
    {
        "title": "Etamina Salmon 40",
        "price": 98.7,
        "image": "https://www.hudemas.ro/assets/images/products/small/goblen-hudemas-ea5-etamina-salmon-443.JPG"
    },
    {
        "title": "Etamina Baby Liliac 40",
        "price": 98.7,
        "image": "https://www.hudemas.ro/assets/images/products/small/goblen-hudemas-ea4-etamina-baby-liliac-228.JPG"
    },
    {
        "title": "Etamina Liliac 40",
        "price": 98.7,
        "image": "https://www.hudemas.ro/assets/images/products/small/goblen-hudemas-ea3-etamina-liliac-860.JPG"
    },
    {
        "title": "Etamina Baby Pink 40",
        "price": 98.7,
        "image": "https://www.hudemas.ro/assets/images/products/small/goblen-hudemas-ea2-etamina-baby-pink-962.JPG"
    },
    {
        "title": "Etamina Pink 40",
        "price": 98.7,
        "image": "https://www.hudemas.ro/assets/images/products/small/goblen-hudemas-ea1-etamina-pink-784.JPG"
    },
    {
        "title": "Banda Aida 10cm Negru",
        "price": 13.31,
        "image": "https://www.hudemas.ro/assets/images/products/small/goblen-hudemas-ba10n-banda-aida-10cm-negru-991.JPG"
    },
    {
        "title": "Banda Aida 5cm Negru",
        "price": 12.1,
        "image": "https://www.hudemas.ro/assets/images/products/small/goblen-hudemas-ba5n-banda-aida-5cm-negru-659.JPG"
    },
    {
        "title": "Banda Aida 10 cm Beige",
        "price": 13.31,
        "image": "https://www.hudemas.ro/assets/images/products/small/goblen-hudemas-ba10b-banda-aida-10-mm-beige-238.JPG"
    },
    {
        "title": "Banda Aida 5 cm Beige",
        "price": 12.1,
        "image": "https://www.hudemas.ro/assets/images/products/small/goblen-hudemas-ba5b-banda-aida-5-mm-beige-371.JPG"
    },
    {
        "title": "Banda Aida 10cm Ecru",
        "price": 13.31,
        "image": "https://www.hudemas.ro/assets/images/products/small/goblen-hudemas-ba10e-banda-aida-10mm-ecru-648.JPG"
    },
    {
        "title": "Banda Aida 5cm Ecru",
        "price": 12.1,
        "image": "https://www.hudemas.ro/assets/images/products/small/goblen-hudemas-ba5e-banda-aida-5mm-ecru-612.JPG"
    },
    {
        "title": "Banda Aida 10cm Alba",
        "price": 13.31,
        "image": "https://www.hudemas.ro/assets/images/products/small/goblen-hudemas-ba10a1-banda-aida-10mm-978.jpg"
    },
    {
        "title": "Banda Aida 5cm Alba",
        "price": 12.1,
        "image": "https://www.hudemas.ro/assets/images/products/small/goblen-hudemas-ba5a1-banda-aida-5mm-576.jpg"
    },
    {
        "title": "Banda Aida 10cm Rosie",
        "price": 13.31,
        "image": "https://www.hudemas.ro/assets/images/products/small/goblen-hudemas-ba10r-banda-aida-10mm-773.jpg"
    },
    {
        "title": "Banda Aida 5cm Rosie",
        "price": 12.1,
        "image": "https://www.hudemas.ro/assets/images/products/small/goblen-hudemas-ba5r-banda-aida-5mm-810.jpg"
    },
    {
        "title": "Gherghef Lemn Cu Șurub 28 cm",
        "price": 44.77,
        "image": "https://www.hudemas.ro/assets/images/products/small/goblen-hudemas-gls7-gherghef-lemn-cu-surub-28-cm-364.JPG"
    },
    {
        "title": "Gherghef Lemn Cu Șurub 25 cm",
        "price": 40.15,
        "image": "https://www.hudemas.ro/assets/images/products/small/goblen-hudemas-gls6-gherghef-lemn-cu-surub-25-cm-734.JPG"
    },
    {
        "title": "Gherghef Lemn Cu Șurub 22 cm",
        "price": 36.36,
        "image": "https://www.hudemas.ro/assets/images/products/small/goblen-hudemas-gls5-gherghef-lemn-cu-surub-22-cm-769.JPG"
    },
    {
        "title": "Gherghef Lemn Cu Șurub 19 cm",
        "price": 32.9,
        "image": "https://www.hudemas.ro/assets/images/products/small/goblen-hudemas-gls4-gherghef-lemn-cu-surub-19-cm-964.JPG"
    },
    {
        "title": "Gherghef Lemn Cu Șurub 16 cm",
        "price": 31.46,
        "image": "https://www.hudemas.ro/assets/images/products/small/goblen-hudemas-gls3-gherghef-lemn-cu-surub-16-cm-796.jpg"
    },
    {
        "title": "Gherghef Lemn Cu Șurub 10 cm",
        "price": 25.97,
        "image": "https://www.hudemas.ro/assets/images/products/small/goblen-hudemas-gls1-gherghef-lemn-cu-surub-10-cm-992.jpg"
    },
    {
        "title": "Gherghef Lemn Tip Rama 19 cm",
        "price": 29.04,
        "image": "https://www.hudemas.ro/assets/images/products/small/goblen-hudemas-glr3-gherghef-lemn-tip-rama-19-cm-330.JPG"
    },
    {
        "title": "Gherghef Lemn Tip Rama 13 cm",
        "price": 24.2,
        "image": "https://www.hudemas.ro/assets/images/products/small/goblen-hudemas-glr2-gherghef-lemn-tip-rama-13-cm-132.JPG"
    },
    {
        "title": "Gherghef Lemn Tip Rama 10 cm",
        "price": 21.78,
        "image": "https://www.hudemas.ro/assets/images/products/small/goblen-hudemas-glr1-gherghef-lemn-tip-rama-927.JPG"
    },
    {
        "title": "Gherghef Lemn Simplu 25 cm",
        "price": 21.78,
        "image": "https://www.hudemas.ro/assets/images/products/small/goblen-hudemas-gs3-gherghef-lemn-simplu-25-cm-980.JPG"
    },
    {
        "title": "Gherghef Plastic Tip Rama Patrat 15.5 cm",
        "price": 37.51,
        "image": "https://www.hudemas.ro/assets/images/products/small/goblen-hudemas-gptrp-gherghef-plastic-tip-rama-patrat-16-cm-400.jpg"
    },
    {
        "title": "Gherghef Plastic Tip Rama Oval Albastru",
        "price": 35.09,
        "image": "https://www.hudemas.ro/assets/images/products/small/goblen-hudemas-gptroa-gherghef-plastic-tip-rama-oval-crem-892.JPG"
    },
    {
        "title": "Gherghef Plastic Tip Rama Oval Bej",
        "price": 35.09,
        "image": "https://www.hudemas.ro/assets/images/products/small/goblen-hudemas-gptrob-gherghef-plastic-tip-rama-oval-bej-989.jpg"
    },
    {
        "title": "Gherghef Plastic Tip Rama Oval Crem",
        "price": 35.09,
        "image": "https://www.hudemas.ro/assets/images/products/small/goblen-hudemas-gptroc1-gherghef-plastic-tip-rama-oval-crem-966.jpg"
    },
    {
        "title": "Gherghef Plastic Tip Rama Rotund 23 cm",
        "price": 38.72,
        "image": "https://www.hudemas.ro/assets/images/products/small/goblen-hudemas-gptrr5-gherghef-plastic-tip-rama-rotund-22-cm-569.JPG"
    },
    {
        "title": "Gherghef Plastic Tip Rama Rotund 19 cm",
        "price": 37.51,
        "image": "https://www.hudemas.ro/assets/images/products/small/goblen-hudemas-gptrr4-gherghef-plastic-tip-rama-rotund-19-cm-545.JPG"
    },
    {
        "title": "Gherghef Plastic Tip Rama Rotund 15.2 cm",
        "price": 36.3,
        "image": "https://www.hudemas.ro/assets/images/products/small/goblen-hudemas-gptrr3-gherghef-plastic-tip-rama-rotund-16-cm-886.JPG"
    },
    {
        "title": "Gherghef Plastic Tip Rama Rotund 11.8 cm",
        "price": 32.9,
        "image": "https://www.hudemas.ro/assets/images/products/small/goblen-hudemas-gptrr2-gherghef-plastic-tip-rama-rotund-13-cm-551.JPG"
    },
    {
        "title": "Gherghef Plastic Tip Rama Rotund 8 cm",
        "price": 30.25,
        "image": "https://www.hudemas.ro/assets/images/products/small/goblen-hudemas-gptrr1-gherghef-plastic-tip-rama-rotund-10-cm-796.jpg"
    },
    {
        "title": "Gherghef Plastic Tip Rama Oval 25.5 cm",
        "price": 38.72,
        "image": "https://www.hudemas.ro/assets/images/products/small/goblen-hudemas-gptro5-gherghef-plastic-tip-rama-oval-22-cm-610.JPG"
    },
    {
        "title": "Gherghef Plastic Tip Rama Oval 21.5 cm",
        "price": 37.51,
        "image": "https://www.hudemas.ro/assets/images/products/small/goblen-hudemas-gptro4-gherghef-plastic-tip-rama-oval-19-cm-540.JPG"
    },
    {
        "title": "Gherghef Plastic Tip Rama Oval 17.5 cm",
        "price": 36.3,
        "image": "https://www.hudemas.ro/assets/images/products/small/goblen-hudemas-gptro3-gherghef-plastic-tip-rama-oval-16-cm-850.JPG"
    },
    {
        "title": "Gherghef Plastic Tip Rama Oval 13.7 cm",
        "price": 32.9,
        "image": "https://www.hudemas.ro/assets/images/products/small/goblen-hudemas-gptro2-gherghef-plastic-tip-rama-oval-13-cm-507.JPG"
    },
    {
        "title": "Gherghef Plastic Tip Rama Oval 8.7 cm",
        "price": 30.25,
        "image": "https://www.hudemas.ro/assets/images/products/small/goblen-hudemas-gptro1-gherghef-plastic-tip-rama-oval-10-cm-668.JPG"
    },
    {
        "title": "Gherghef fix din lemn de tei",
        "price": 49.61,
        "image": "https://www.hudemas.ro/assets/images/products/small/goblen-hudemas-hf-82-gherghef-fix-din-lemn-de-tei-178.jpg"
    },
    {
        "title": "Gherghef fix din lemn de tei",
        "price": 33.88,
        "image": "https://www.hudemas.ro/assets/images/products/small/goblen-hudemas-hf-32-gherghef-fix-din-lemn-de-tei-498.jpg"
    }
];

async function reseed() {
    console.log('Reseeding Accessories with Real Data...');

    // 1. Login as Admin
    const { data: { session }, error: loginError } = await supabase.auth.signInWithPassword({
        email: 'admin@hudemas.ro',
        password: 'admin123'
    });

    if (loginError) {
        console.error('Login failed:', loginError.message);
        return;
    }

    const userId = session?.user.id;
    console.log(`Logged in as Admin: ${userId}`);

    // 2. Delete existing accessories
    const { error: deleteError } = await supabase
        .from('marketplace_listings')
        .delete()
        .eq('product_type', 'accessory');

    if (deleteError) console.error('Delete error (expected if RLS blocks):', deleteError.message);
    else console.log('Deleted old accessories.');

    // 3. Insert New
    const items = accessories.map(acc => ({
        user_id: userId,
        artist_id: userId,
        title: acc.title,
        description: "Accesoriu original Hudemas.",
        price: acc.price,
        currency: 'RON',
        status: 'active',
        product_type: 'accessory',
        image_url: acc.image
    }));

    const { error: insertError } = await supabase.from('marketplace_listings').insert(items);

    if (insertError) console.error('Insert error:', insertError);
    else console.log(`✅ Inserted ${items.length} real accessories.`);
}

reseed();
