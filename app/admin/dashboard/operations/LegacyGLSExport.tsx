'use client';

import { useState, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Download, Upload, AlertCircle, CheckCircle2, Loader2, FileText } from 'lucide-react';

interface ParsedOrder {
    id: string;
    date: string;
    customerName: string;
    products: string;
    total: number;
    currency: string;
    status: 'new' | 'existing' | 'vip';
    address: string;
    city: string;
    state: string;
    zip: string;
    phone: string;
    email: string;
    isCOD: boolean;
    addressValid: boolean | null;
}

interface CustomerRecord {
    name: string;
    email: string;
    phone: string;
    address: string;
    locality: string;
    state: string;
    postalcode: string;
    total_spent: number;
    ltv_tier: string;
}

// i18n
const i18n = {
    en: {
        title: 'Legacy GLS Export',
        subtitle: 'For orders from the legacy system (hudemas.ro)',
        step1: 'Paste Orders from Admin',
        step1Help: 'Copy the order table from legacy admin (ID, Date, Customer, Products, Total...)',
        parseBtn: 'Parse Orders',
        sampleBtn: 'Load Sample',
        step2: 'Customer Details',
        uploadHelp: 'Or upload customer CSV to auto-fill addresses',
        lookupBtn: 'Lookup in Database',
        validateBtn: 'Validate Addresses',
        generateBtn: 'Generate GLS Export',
        step3: 'GLS Export Ready',
        downloadBtn: 'Download CSV for GLS',
        orders: 'Orders',
        total: 'Total',
        matched: 'Matched',
        missing: 'Missing',
        noData: 'No data entered',
        noResults: 'Could not parse any rows',
        comingSoon: 'Coming Soon'
    },
    ro: {
        title: 'Export GLS Legacy',
        subtitle: 'Pentru comenzi din sistemul vechi (hudemas.ro)',
        step1: 'Lipește Comenzile din Admin',
        step1Help: 'Copiază tabelul din admin-ul vechi (ID, Data, Client, Produse, Total...)',
        parseBtn: 'Parsează',
        sampleBtn: 'Exemplu',
        step2: 'Detalii Clienți',
        uploadHelp: 'Sau încarcă CSV cu clienți pentru auto-completare',
        lookupBtn: 'Caută în Baza de Date',
        validateBtn: 'Validează Adresele',
        generateBtn: 'Generează Export',
        step3: 'Export GLS Pregătit',
        downloadBtn: 'Download CSV pentru GLS',
        orders: 'Comenzi',
        total: 'Total',
        matched: 'Găsiți',
        missing: 'Lipsă',
        noData: 'Niciun text introdus',
        noResults: 'Nu am putut parsa niciun rând',
        comingSoon: 'În Curând'
    }
};

export default function LegacyGLSExport() {
    const [lang, setLang] = useState<'en' | 'ro'>('en');
    const t = i18n[lang];

    const [rawInput, setRawInput] = useState('');
    const [orders, setOrders] = useState<ParsedOrder[]>([]);
    const [customerDB, setCustomerDB] = useState<Map<string, CustomerRecord>>(new Map());
    const [csvLoaded, setCsvLoaded] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const stats = {
        orders: orders.length,
        total: orders.reduce((sum, o) => sum + o.total, 0),
        matched: orders.filter(o => o.status !== 'new' && o.address).length,
        missing: orders.filter(o => !o.address).length
    };

    // Load sample customer data
    useEffect(() => {
        // Pre-populate with known VIP customers
        const defaultDB = new Map<string, CustomerRecord>([
            ['Barbu Carmen', { name: 'Barbu Carmen', email: 'carmen.barbu@gmail.com', phone: '0722890794', address: 'Str. Republicii 15', locality: 'București', state: 'București', postalcode: '010101', total_spent: 102866, ltv_tier: 'VIP_PLATINUM' }],
            ['Gheorghiu Doina', { name: 'Gheorghiu Doina', email: 'doina.gheorghiu@yahoo.com', phone: '0745123456', address: 'Str. Mihai Eminescu 42', locality: 'Timișoara', state: 'Timiș', postalcode: '300001', total_spent: 208266, ltv_tier: 'VIP_PLATINUM' }],
            ['Sc Jvj Petrolcom Srl', { name: 'Sc Jvj Petrolcom Srl', email: 'iulianiordache_jvj@yahoo.com', phone: '0722525138', address: 'Str. Garoafei 58', locality: 'Com. Cornetu', state: 'Ilfov', postalcode: '077070', total_spent: 25775, ltv_tier: 'VIP_PLATINUM' }],
        ]);
        setCustomerDB(defaultDB);
    }, []);

    const handleCSVUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setLoading(true);
        const text = await file.text();
        const lines = text.split('\n');
        const headers = lines[0].split(',').map(h => h.trim().toLowerCase());

        const nameIdx = headers.findIndex(h => h === 'name');
        const emailIdx = headers.findIndex(h => h === 'email');
        const phoneIdx = headers.findIndex(h => h === 'phone');
        const addressIdx = headers.findIndex(h => h === 'address');
        const localityIdx = headers.findIndex(h => h === 'locality');
        const stateIdx = headers.findIndex(h => h === 'state');
        const zipIdx = headers.findIndex(h => h === 'postalcode' || h === 'zip');
        const ltvIdx = headers.findIndex(h => h === 'total_spent');
        const tierIdx = headers.findIndex(h => h === 'ltv_tier');

        const newDB = new Map(customerDB);

        for (let i = 1; i < lines.length; i++) {
            const cols = lines[i].split(',').map(c => c.trim().replace(/^"|"$/g, ''));
            const name = cols[nameIdx];
            if (name) {
                newDB.set(name, {
                    name,
                    email: cols[emailIdx] || '',
                    phone: cols[phoneIdx] || '',
                    address: cols[addressIdx] || '',
                    locality: cols[localityIdx] || '',
                    state: cols[stateIdx] || '',
                    postalcode: cols[zipIdx] || '',
                    total_spent: parseFloat(cols[ltvIdx]) || 0,
                    ltv_tier: cols[tierIdx] || 'LOW'
                });
            }
        }

        setCustomerDB(newDB);
        setCsvLoaded(true);
        setLoading(false);

        // Re-match orders if any exist
        if (orders.length > 0) {
            lookupCustomers(newDB);
        }
    };

    const loadSample = () => {
        setRawInput(`26027\t14.12.2025 18:47:48\tBarbu Carmen\t1 x Toamna(750) 1 x Iarna(751)\t351.46\t0.00\t351.46\tLei\tProcessing
26026\t14.12.2025 18:07:24\tMaria Popescu\t1 x Panseluțe(534)\t133.21\t25.00\t158.21\tLei\tProcessing
26025\t14.12.2025 15:13:27\tRasinariu Lucica\t1 x Flori de câmp(088)\t56.23\t35.00\t91.23\tLei\tProcessing
26024\t14.12.2025 14:20:31\tDuma Gheorghe\t1 x Ruga(014.1) 1 x Flori(484)\t488.70\t0.00\t488.70\tLei\tProcessing`);
    };

    // Parse key-value format (from order details view)
    const parseKeyValueOrder = (text: string): ParsedOrder | null => {
        const getValue = (key: string): string => {
            const pattern = new RegExp(`${key}[:\\s]+([^\\n]+)`, 'i');
            const match = text.match(pattern);
            return match ? match[1].trim() : '';
        };

        const name = getValue('Name and surname') || getValue('Name') || getValue('Nume');
        if (!name) return null;

        // Extract Order ID from header
        let orderId = getValue('Order ID');
        const orderMatch = text.match(/Order details no\.\s*(\d+)/i) || text.match(/no\.\s*(\d+)/i);
        if (!orderId && orderMatch) orderId = orderMatch[1];
        if (!orderId) orderId = `NEW-${Date.now()}`;

        // Extract email from "User : Name (email@example.com)"
        let email = getValue('Email') || '';
        const emailMatch = text.match(/\(([^)]+@[^)]+)\)/);
        if (!email && emailMatch) email = emailMatch[1];

        // Extract total
        let total = 0;
        const totalMatch = text.match(/Total\s+(\d+[.,]\d+)\s*Lei/gi);
        if (totalMatch && totalMatch.length > 0) {
            const lastTotal = totalMatch[totalMatch.length - 1];
            const numMatch = lastTotal.match(/(\d+[.,]\d+)/);
            if (numMatch) total = parseFloat(numMatch[1].replace(',', '.'));
        }

        return {
            id: orderId,
            date: new Date().toLocaleDateString('ro-RO'),
            customerName: name,
            products: '',
            total,
            currency: 'Lei',
            status: 'new',
            address: getValue('Address') || getValue('Adresa'),
            city: getValue('Locality') || getValue('Localitate') || getValue('City'),
            state: getValue('County') || getValue('County/region') || getValue('Judet'),
            zip: getValue('Postal code') || getValue('Cod postal'),
            phone: getValue('Phone') || getValue('Telefon'),
            email,
            isCOD: true,
            addressValid: true
        };
    };

    const parseOrders = useCallback(() => {
        setError('');

        if (!rawInput.trim()) {
            setError(t.noData);
            return;
        }

        const text = rawInput.trim();

        // Detect key-value format (individual order details)
        if (text.includes('Name and surname:') || text.includes('Address:') || text.includes('Nume:')) {
            const parsed = parseKeyValueOrder(text);
            if (parsed) {
                const customer = customerDB.get(parsed.customerName);
                if (customer) {
                    parsed.status = customer.ltv_tier?.includes('VIP') ? 'vip' : 'existing';
                    parsed.email = parsed.email || customer.email;
                }
                setOrders(prev => [...prev, parsed]);
                setRawInput('');
                return;
            }
        }

        // Tab-separated table format
        const lines = text.split('\n').filter(line => line.trim());
        const parsed: ParsedOrder[] = [];

        for (const line of lines) {
            if (line.startsWith('ID') || line.includes('Data adăugării')) continue;
            const parts = line.split('\t').map(p => p.trim()).filter(p => p);
            if (parts.length < 7) continue;

            const customerName = parts[2];
            const customer = customerDB.get(customerName);

            parsed.push({
                id: parts[0],
                date: parts[1],
                customerName,
                products: parts[3],
                total: parseFloat(parts[6]) || parseFloat(parts[4]) || 0,
                currency: parts[7] || 'Lei',
                status: customer?.ltv_tier?.includes('VIP') ? 'vip' : customer ? 'existing' : 'new',
                address: customer?.address || '',
                city: customer?.locality || '',
                state: customer?.state || '',
                zip: customer?.postalcode || '',
                phone: customer?.phone || '',
                email: customer?.email || '',
                isCOD: true,
                addressValid: customer?.address ? true : null
            });
        }

        if (parsed.length === 0) {
            setError(t.noResults);
            return;
        }

        setOrders(parsed);
    }, [rawInput, customerDB, t]);

    // Normalize name for matching (remove accents, lowercase)
    const normalizeName = (name: string): string => {
        return name
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '') // Remove accents
            .replace(/[^a-z0-9\s]/g, '') // Remove special chars
            .trim();
    };

    // Common name translations (Chrome auto-translate)
    const translationMap: Record<string, string[]> = {
        'barbu': ['beard'], 'popescu': ['popescu'], 'gheorghe': ['george'],
        'popa': ['priest', 'pope'], 'rusu': ['russian'], 'florea': ['flower'],
        'ursul': ['bear'], 'lupu': ['wolf'], 'vulpe': ['fox'],
    };

    // Get name variations including translations
    const getNameVariations = (name: string): string[] => {
        const normalized = normalizeName(name);
        const parts = normalized.split(/\s+/);
        const variations = [normalized, parts.reverse().join(' ')];  // original + reversed

        parts.forEach(part => {
            Object.entries(translationMap).forEach(([ro, ens]) => {
                if (part === ro || ens.includes(part)) {
                    ens.forEach(en => variations.push(normalized.replace(part, en)));
                    variations.push(normalized.replace(part, ro));
                }
            });
        });
        return [...new Set(variations)];
    };

    const lookupCustomers = (db?: Map<string, CustomerRecord>) => {
        const database = db || customerDB;

        // Build indexed lookups
        const normalizedNameIndex = new Map<string, CustomerRecord>();
        const phoneIndex = new Map<string, CustomerRecord>();

        database.forEach((customer, name) => {
            getNameVariations(name).forEach(v => normalizedNameIndex.set(v, customer));
            if (customer.phone) {
                const cleanPhone = customer.phone.replace(/\D/g, '').slice(-9);
                if (cleanPhone.length >= 9) phoneIndex.set(cleanPhone, customer);
            }
        });

        setOrders(prev => prev.map(o => {
            // Try exact match first
            let customer = database.get(o.customerName);

            // Try normalized/translated name matching
            if (!customer) {
                for (const v of getNameVariations(o.customerName)) {
                    customer = normalizedNameIndex.get(v);
                    if (customer) break;
                }
            }

            // Try phone matching
            if (!customer && o.phone) {
                const cleanPhone = o.phone.replace(/\D/g, '').slice(-9);
                if (cleanPhone.length >= 9) customer = phoneIndex.get(cleanPhone);
            }

            if (customer) {
                return {
                    ...o,
                    status: customer.ltv_tier?.includes('VIP') ? 'vip' : 'existing',
                    address: o.address || customer.address,
                    city: o.city || customer.locality,
                    state: customer.state,
                    zip: o.zip || customer.postalcode,
                    phone: o.phone || customer.phone,
                    email: o.email || customer.email,
                    addressValid: !!(o.address || customer.address)
                };
            }
            return o;
        }));
    };

    const updateOrder = (index: number, field: keyof ParsedOrder, value: string | boolean) => {
        setOrders(prev => prev.map((o, i) => i === index ? { ...o, [field]: value } : o));
    };

    const downloadCSV = () => {
        const header = 'Amount of CoD;Name;Address;City;ZIP Code;Country;E-mail;Phone;Client reference;CoD reference;Comment;Count;Contact;Services';
        const sanitize = (str: string) => String(str || '').replace(/;/g, ',').replace(/\n/g, ' ').trim();

        const rows = orders.map(o => [
            sanitize(o.isCOD ? o.total.toFixed(2) : ''),
            sanitize(o.customerName),
            sanitize(o.address),
            sanitize(o.city),
            sanitize(o.zip),
            'RO',
            sanitize(o.email),
            sanitize(o.phone),
            sanitize(o.id),
            sanitize(o.isCOD ? o.id : ''),
            sanitize(o.products.substring(0, 50)),
            1,
            sanitize(o.customerName),
            ''
        ].join(';'));

        const csv = [header, ...rows].join('\n');
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `gls_legacy_export_${new Date().toISOString().split('T')[0]}.csv`;
        link.click();
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold flex items-center gap-2">
                        <FileText className="h-6 w-6" />
                        {t.title}
                    </h2>
                    <p className="text-muted-foreground text-sm">{t.subtitle}</p>
                </div>
                <div className="flex gap-2">
                    <Button variant={lang === 'en' ? 'default' : 'outline'} size="sm" onClick={() => setLang('en')}>EN</Button>
                    <Button variant={lang === 'ro' ? 'default' : 'outline'} size="sm" onClick={() => setLang('ro')}>RO</Button>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-4 gap-4">
                <Card>
                    <CardHeader className="pb-2">
                        <CardDescription>{t.orders}</CardDescription>
                        <CardTitle className="text-2xl">{stats.orders}</CardTitle>
                    </CardHeader>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardDescription>{t.total}</CardDescription>
                        <CardTitle className="text-2xl">{stats.total.toFixed(0)} RON</CardTitle>
                    </CardHeader>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardDescription>{t.matched}</CardDescription>
                        <CardTitle className="text-2xl text-green-600">{stats.matched}</CardTitle>
                    </CardHeader>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardDescription>{t.missing}</CardDescription>
                        <CardTitle className="text-2xl text-red-600">{stats.missing}</CardTitle>
                    </CardHeader>
                </Card>
            </div>

            {/* Step 1: Paste */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <span className="bg-primary text-primary-foreground w-6 h-6 rounded-full flex items-center justify-center text-sm">1</span>
                        {t.step1}
                    </CardTitle>
                    <CardDescription>{t.step1Help}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <textarea
                        value={rawInput}
                        onChange={(e) => setRawInput(e.target.value)}
                        placeholder="26027	14.12.2025	Barbu Carmen	1 x Toamna(750)	351.46	0.00	351.46	Lei	Processing"
                        className="w-full h-32 p-3 border rounded-lg font-mono text-sm bg-muted resize-y"
                    />
                    <div className="flex gap-2">
                        <Button onClick={parseOrders}>{t.parseBtn}</Button>
                        <Button variant="outline" onClick={loadSample}>{t.sampleBtn}</Button>
                    </div>
                    {error && <p className="text-destructive flex items-center gap-2"><AlertCircle className="h-4 w-4" />{error}</p>}
                </CardContent>
            </Card>

            {/* Step 2: Customer Details */}
            {orders.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <span className="bg-primary text-primary-foreground w-6 h-6 rounded-full flex items-center justify-center text-sm">2</span>
                            {t.step2} ({orders.length})
                        </CardTitle>
                        <CardDescription className="flex items-center gap-4">
                            <label className="flex items-center gap-2 cursor-pointer">
                                <Upload className="h-4 w-4" />
                                <span>{t.uploadHelp}</span>
                                <input type="file" accept=".csv" onChange={handleCSVUpload} className="hidden" />
                                {csvLoaded && <Badge variant="secondary"><CheckCircle2 className="h-3 w-3 mr-1" />CSV Loaded</Badge>}
                            </label>
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="flex gap-2 mb-4">
                            <Button variant="secondary" onClick={() => lookupCustomers()} disabled={loading}>
                                {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                                {t.lookupBtn}
                            </Button>
                        </div>
                        <div className="border rounded-lg overflow-auto max-h-96">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="w-20">ID</TableHead>
                                        <TableHead>Customer</TableHead>
                                        <TableHead className="w-20">Status</TableHead>
                                        <TableHead className="w-24">Total</TableHead>
                                        <TableHead>Address</TableHead>
                                        <TableHead className="w-28">City</TableHead>
                                        <TableHead className="w-20">Zip</TableHead>
                                        <TableHead className="w-28">Phone</TableHead>
                                        <TableHead className="w-16">COD</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {orders.map((order, i) => (
                                        <TableRow key={order.id} className={!order.address ? 'bg-red-50 dark:bg-red-950/20' : ''}>
                                            <TableCell className="font-mono text-xs">{order.id}</TableCell>
                                            <TableCell className="font-medium">{order.customerName}</TableCell>
                                            <TableCell>
                                                <Badge variant={order.status === 'vip' ? 'default' : order.status === 'new' ? 'destructive' : 'secondary'}>
                                                    {order.status.toUpperCase()}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>{order.total.toFixed(2)}</TableCell>
                                            <TableCell>
                                                <Input
                                                    value={order.address}
                                                    onChange={(e) => updateOrder(i, 'address', e.target.value)}
                                                    placeholder="Str..."
                                                    className={`h-8 ${!order.address ? 'border-red-300' : ''}`}
                                                />
                                            </TableCell>
                                            <TableCell>
                                                <Input
                                                    value={order.city}
                                                    onChange={(e) => updateOrder(i, 'city', e.target.value)}
                                                    placeholder="București"
                                                    className="h-8"
                                                />
                                            </TableCell>
                                            <TableCell>
                                                <Input
                                                    value={order.zip}
                                                    onChange={(e) => updateOrder(i, 'zip', e.target.value)}
                                                    placeholder="010101"
                                                    className="h-8"
                                                />
                                            </TableCell>
                                            <TableCell>
                                                <Input
                                                    value={order.phone}
                                                    onChange={(e) => updateOrder(i, 'phone', e.target.value)}
                                                    placeholder="07..."
                                                    className="h-8"
                                                />
                                            </TableCell>
                                            <TableCell>
                                                <Checkbox
                                                    checked={order.isCOD}
                                                    onCheckedChange={(checked) => updateOrder(i, 'isCOD', !!checked)}
                                                />
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Step 3: Download */}
            {orders.length > 0 && stats.missing === 0 && (
                <Card className="border-green-200 bg-green-50 dark:bg-green-950/20">
                    <CardHeader>
                        <CardTitle className="text-green-700 dark:text-green-400 flex items-center gap-2">
                            <CheckCircle2 className="h-5 w-5" />
                            {t.step3}
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Button size="lg" onClick={downloadCSV}>
                            <Download className="h-4 w-4 mr-2" />
                            {t.downloadBtn}
                        </Button>
                    </CardContent>
                </Card>
            )}

            {orders.length > 0 && stats.missing > 0 && (
                <Card className="border-yellow-200 bg-yellow-50 dark:bg-yellow-950/20">
                    <CardHeader>
                        <CardTitle className="text-yellow-700 dark:text-yellow-400 flex items-center gap-2">
                            <AlertCircle className="h-5 w-5" />
                            {stats.missing} orders missing address data
                        </CardTitle>
                        <CardDescription>
                            Upload a customer CSV or manually fill in the missing addresses before exporting.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Button size="lg" variant="outline" onClick={downloadCSV}>
                            <Download className="h-4 w-4 mr-2" />
                            Download Anyway (incomplete)
                        </Button>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
