import { MenuItem, Table, Order, OrderStatus, OrderType } from './types';

export const MOCK_MENU: MenuItem[] = [
  {
    id: '1',
    name: 'Butter Chicken',
    description: 'Tandoori chicken simmered in a rich, creamy, and buttery tomato gravy. A Dhaba legend.',
    price: 380,
    category: 'Main Course',
    imageUrl: 'https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80',
    isAvailable: true,
    isVegetarian: false
  },
  {
    id: '2',
    name: 'Dal Khichdi',
    description: 'Comfort food at its best. Rice and lentils cooked together with a tempering of ghee, cumin, and garlic.',
    price: 240,
    category: 'Rice',
    imageUrl: 'https://images.unsplash.com/photo-1596797038530-2c107229654b?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80',
    isAvailable: true,
    isVegetarian: true
  },
  {
    id: '3',
    name: 'Lasooni Soup',
    description: 'Spicy and tangy garlic soup that warms your soul. Perfect starter for a highway meal.',
    price: 120,
    category: 'Starters',
    imageUrl: 'https://images.unsplash.com/photo-1547592166-23acbe34071b?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80',
    isAvailable: true,
    isVegetarian: true
  },
  {
    id: '4',
    name: 'Paneer Butter Masala',
    description: 'Soft paneer cubes cooked in a rich, creamy, slightly sweet and spicy gravy.',
    price: 320,
    category: 'Main Course',
    imageUrl: 'https://images.unsplash.com/photo-1631452180519-c014fe946bc7?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80',
    isAvailable: true,
    isVegetarian: true
  },
  {
    id: '5',
    name: 'Kaju Masala',
    description: 'Roasted cashews simmered in a spicy, flavorful onion-tomato gravy. A royal treat.',
    price: 360,
    category: 'Main Course',
    imageUrl: 'https://images.unsplash.com/photo-1585937421612-70a008356f36?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80',
    isAvailable: true,
    isVegetarian: true
  },
  {
    id: '6',
    name: 'Kaju Paneer Masala',
    description: 'The best of both worlds – crunchy cashews and soft paneer in a rich Dhaba style gravy.',
    price: 390,
    category: 'Main Course',
    imageUrl: 'https://images.unsplash.com/photo-1628294895950-98052523e036?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80',
    isAvailable: true,
    isVegetarian: true
  },
  {
    id: '7',
    name: 'Dal Methi',
    description: 'Yellow lentils cooked with fresh fenugreek leaves and traditional spices.',
    price: 220,
    category: 'Main Course',
    imageUrl: 'https://images.unsplash.com/photo-1546833999-b9f5816029bd?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80',
    isAvailable: true,
    isVegetarian: true
  },
  {
    id: '8',
    name: 'Mutton Handi',
    description: 'Tender mutton pieces slow-cooked in a clay pot with aromatic whole spices.',
    price: 480,
    category: 'Main Course',
    imageUrl: 'https://images.unsplash.com/photo-1574672280602-95cb168e192a?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80',
    isAvailable: true,
    isVegetarian: false
  },
  {
    id: '9',
    name: 'Jeera Rice',
    description: 'Basmati rice tempered with cumin seeds and coriander.',
    price: 180,
    category: 'Rice',
    imageUrl: 'https://images.unsplash.com/photo-1516685016129-c8d3286a3f0f?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80',
    isAvailable: true,
    isVegetarian: true
  },
  {
    id: '10',
    name: 'Garlic Naan',
    description: 'Soft leavened bread topped with chopped garlic and coriander.',
    price: 60,
    category: 'Breads',
    imageUrl: 'https://images.unsplash.com/photo-1626074353765-517a681e40be?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80',
    isAvailable: true,
    isVegetarian: true
  },
    {
    id: '11',
    name: 'Masala Chai',
    description: 'Traditional Indian spiced tea.',
    price: 40,
    category: 'Beverages',
    imageUrl: 'https://images.unsplash.com/photo-1561336313-0bd5e0b27ec8?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80',
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