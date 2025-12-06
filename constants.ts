import { MenuItem, Table, Order, OrderStatus, OrderType } from './types';

export const MOCK_MENU: MenuItem[] = [
  {
    id: '1',
    name: 'Butter Chicken Special',
    description: 'Rich creamy tomato gravy with tender chicken pieces, cooked in a traditional clay pot.',
    price: 350,
    category: 'Main Course',
    imageUrl: 'https://picsum.photos/400/300?random=1',
    isAvailable: true,
    isVegetarian: false
  },
  {
    id: '2',
    name: 'Dal Makhani',
    description: 'Black lentils cooked overnight with butter and cream. A Dhaba classic.',
    price: 220,
    category: 'Main Course',
    imageUrl: 'https://picsum.photos/400/300?random=2',
    isAvailable: true,
    isVegetarian: true
  },
  {
    id: '3',
    name: 'Garlic Naan',
    description: 'Soft leavened bread topped with chopped garlic and coriander.',
    price: 60,
    category: 'Breads',
    imageUrl: 'https://picsum.photos/400/300?random=3',
    isAvailable: true,
    isVegetarian: true
  },
  {
    id: '4',
    name: 'Paneer Tikka',
    description: 'Cottage cheese cubes marinated in spices and yogurt, grilled to perfection.',
    price: 280,
    category: 'Starters',
    imageUrl: 'https://picsum.photos/400/300?random=4',
    isAvailable: true,
    isVegetarian: true
  },
  {
    id: '5',
    name: 'Chicken Biryani',
    description: 'Aromatic basmati rice cooked with spices and chicken.',
    price: 320,
    category: 'Rice',
    imageUrl: 'https://picsum.photos/400/300?random=5',
    isAvailable: true,
    isVegetarian: false
  },
  {
    id: '6',
    name: 'Masala Chai',
    description: 'Traditional Indian spiced tea.',
    price: 40,
    category: 'Beverages',
    imageUrl: 'https://picsum.photos/400/300?random=6',
    isAvailable: true,
    isVegetarian: true
  }
];

export const MOCK_TABLES: Table[] = [
  { id: 't1', number: 1, seats: 4, isOccupied: false },
  { id: 't2', number: 2, seats: 4, isOccupied: true },
  { id: 't3', number: 3, seats: 6, isOccupied: false },
  { id: 't4', number: 4, seats: 2, isOccupied: false },
  { id: 't5', number: 5, seats: 8, isOccupied: true },
];

export const MOCK_ORDERS: Order[] = [
  {
    id: 'ORD-001',
    customerName: 'Rahul Kumar',
    items: [
      { ...MOCK_MENU[0], quantity: 1 },
      { ...MOCK_MENU[2], quantity: 2 }
    ],
    totalAmount: 470,
    status: OrderStatus.PREPARING,
    type: OrderType.DINE_IN,
    timestamp: Date.now() - 1000 * 60 * 15, // 15 mins ago
    tableNumber: '2'
  },
  {
    id: 'ORD-002',
    customerName: 'Amit Singh',
    items: [
      { ...MOCK_MENU[4], quantity: 2 },
    ],
    totalAmount: 640,
    status: OrderStatus.PENDING,
    type: OrderType.DELIVERY,
    timestamp: Date.now() - 1000 * 60 * 5, // 5 mins ago
    deliveryAddress: 'House 12, Highway Road'
  },
  {
    id: 'ORD-003',
    customerName: 'Priya Sharma',
    items: [
      { ...MOCK_MENU[1], quantity: 1 },
      { ...MOCK_MENU[3], quantity: 1 }
    ],
    totalAmount: 500,
    status: OrderStatus.READY,
    type: OrderType.PICKUP,
    timestamp: Date.now() - 1000 * 60 * 30 // 30 mins ago
  }
];

export const CATEGORIES = ['All', 'Starters', 'Main Course', 'Breads', 'Rice', 'Beverages'];