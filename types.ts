export enum Role {
  CUSTOMER = 'CUSTOMER',
  ADMIN = 'ADMIN',
  KITCHEN = 'KITCHEN',
  DELIVERY = 'DELIVERY'
}

export enum OrderStatus {
  PENDING = 'PENDING',
  PREPARING = 'PREPARING',
  READY = 'READY',
  OUT_FOR_DELIVERY = 'OUT_FOR_DELIVERY',
  DELIVERED = 'DELIVERED',
  CANCELLED = 'CANCELLED'
}

export enum OrderType {
  DINE_IN = 'DINE_IN',
  DELIVERY = 'DELIVERY',
  PICKUP = 'PICKUP',
  PRE_ORDER = 'PRE_ORDER'
}

export interface User {
  id: string;
  name: string;
  role: Role;
  mobile?: string;
}

export interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  imageUrl: string;
  isAvailable: boolean;
  isVegetarian: boolean;
}

export interface CartItem extends MenuItem {
  quantity: number;
}

export interface Order {
  id: string;
  customerName: string;
  items: CartItem[];
  totalAmount: number;
  status: OrderStatus;
  type: OrderType;
  timestamp: number;
  tableNumber?: string;
  deliveryAddress?: string;
  specialInstructions?: string;
}

export interface Table {
  id: string;
  number: number;
  seats: number;
  isOccupied: boolean;
  reservedAt?: number;
}

export interface SalesData {
  name: string;
  sales: number;
}