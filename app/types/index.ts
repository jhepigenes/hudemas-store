export interface Product {
    id?: string;
    name: string;
    image: string;
    price: string | number;
    currency: string;
    amazonUrl?: string;
    type?: 'shop' | 'marketplace';
    artist_id?: string;
    description?: string;
    status?: 'active' | 'pending' | 'sold' | 'rejected';
    product_type?: 'kit' | 'accessory' | 'finished';
    quantity?: number;
    artists?: { full_name: string };
}

export interface UserProfile {
    id: string;
    full_name?: string;
    username?: string;
    avatar_url?: string;
    email?: string;
    phone?: string;
    address?: string;
    city?: string;
    county?: string;
    country?: string;
    zip_code?: string;
    role?: 'user' | 'admin';
}

export interface Order {
    id: string;
    created_at: string;
    total: number;
    currency: string;
    status: 'pending' | 'processing' | 'completed' | 'cancelled' | 'paid';
    items: OrderItem[];
    customer_details: any; // Can be typed further
}

export interface OrderItem {
    name: string;
    quantity: number;
    price: number;
    currency: string;
}
