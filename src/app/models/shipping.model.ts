export type CourierCode = 'JNE' | 'J&T' | 'SICEPAT' | 'GOSEND';

export interface ShippingServiceOption {
  id: string;
  courier: CourierCode;
  serviceName: string; // e.g. 'REG', 'YES', 'EZ', 'Super Fast'
  courierFullName: string;
  cost: number;
  etd: string; // Estimated time of delivery, e.g. '1-2 Hari'
  type: 'Regular' | 'Express' | 'Same Day' | 'Economy';
  badge?: string;
  trackingPrefix: string;
}

export interface ShippingZone {
  province: string;
  city: string;
  baseRateMultiplier: number;
  jntAvailable: boolean;
  jneAvailable: boolean;
}

export interface OrderItem {
  productId: string;
  title: string;
  variantName: string;
  quantity: number;
  price: number;
  image: string;
}

export interface ShopifyOrder {
  id: string;
  orderNumber: string; // e.g. '#SYB-10821'
  createdAt: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  shippingAddress: {
    street: string;
    city: string;
    province: string;
    postalCode: string;
  };
  items: OrderItem[];
  subtotal: number;
  shippingCost: number;
  discount: number;
  total: number;
  paymentStatus: 'Paid' | 'Pending' | 'Refunded';
  fulfillmentStatus: 'Unfulfilled' | 'Ready to Ship' | 'Shipped' | 'Delivered';
  courier: CourierCode;
  serviceName: string;
  trackingNumber: string;
  weightGrams: number;
  notes?: string;
}

export interface TrackingMilestone {
  date: string;
  time: string;
  location: string;
  status: string;
  description: string;
  completed: boolean;
}
