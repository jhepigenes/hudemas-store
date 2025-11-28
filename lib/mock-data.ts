import { faker } from '@faker-js/faker';

export interface MockOrder {
  id: string;
  customer_name: string;
  customer_type: 'private' | 'company';
  company_details?: {
    name: string;
    vatId: string;
  };
  total: number;
  status: 'pending' | 'processing' | 'completed' | 'cancelled';
  date: string;
  items: number;
  shipping_method: 'FanCourier Standard' | 'FanCourier Express' | 'Sameday EasyBox' | 'Pickup';
  shipping_cost: number;
}

export const generateMockOrders = (count: number = 10): MockOrder[] => {
  return Array.from({ length: count }).map(() => {
    const isCompany = faker.datatype.boolean({ probability: 0.3 });
    const shippingMethod = faker.helpers.arrayElement([
      { name: 'FanCourier Standard', cost: 15 },
      { name: 'FanCourier Express', cost: 25 },
      { name: 'Sameday EasyBox', cost: 12 },
      { name: 'Pickup', cost: 0 }
    ]);

    return {
      id: `ORD-${faker.string.alphanumeric(6).toUpperCase()}`,
      customer_name: faker.person.fullName(),
      customer_type: isCompany ? 'company' : 'private',
      company_details: isCompany ? {
        name: faker.company.name(),
        vatId: `RO${faker.number.int({ min: 1000000, max: 9999999 })}`
      } : undefined,
      total: parseFloat(faker.commerce.price({ min: 100, max: 5000 })),
      status: faker.helpers.arrayElement(['pending', 'processing', 'completed', 'cancelled']),
      date: faker.date.recent({ days: 2 }).toISOString().split('T')[0], // Recent orders for "Daily" view
      items: faker.number.int({ min: 1, max: 5 }),
      shipping_method: shippingMethod.name as any,
      shipping_cost: shippingMethod.cost
    };
  });
};

export const generateRevenueData = () => {
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  return days.map(day => ({
    name: day,
    total: faker.number.int({ min: 1000, max: 15000 }),
  }));
};

export const getMockStats = () => ({
  totalRevenue: faker.number.int({ min: 50000, max: 200000 }),
  activeOrders: faker.number.int({ min: 5, max: 50 }),
  totalCustomers: faker.number.int({ min: 100, max: 1000 }),
  growth: faker.number.int({ min: -10, max: 30 }),
});
