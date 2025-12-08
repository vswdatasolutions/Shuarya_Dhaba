
import { MenuItem, Table, Order, OrderStatus, OrderType } from './types';

export const MOCK_MENU: MenuItem[] = [
  // --- STARTERS (Veg & Non-Veg) ---
  {
    id: '101',
    name: 'Chicken 65',
    description: 'Spicy, deep-fried chicken chunks marinated in ginger, lemon, red chiles, and curry leaves.',
    price: 180,
    category: 'Starters',
    imageUrl: 'https://images.unsplash.com/photo-1610057099443-fde8c4d50f91?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80',
    isAvailable: true,
    isVegetarian: false
  },
  {
    id: '102',
    name: 'Chicken Lollipop',
    description: 'Frenched chicken winglets, battered and fried to crispy perfection. A Dhaba favorite.',
    price: 200,
    category: 'Starters',
    imageUrl: 'https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80',
    isAvailable: true,
    isVegetarian: false
  },
  {
    id: '103',
    name: 'Gobi Manchurian',
    description: 'Crispy cauliflower florets tossed in a spicy, sweet and tangy manchurian sauce.',
    price: 120,
    category: 'Starters',
    imageUrl: 'https://images.unsplash.com/photo-1567188040759-fb8a883dc6d8?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80',
    isAvailable: true,
    isVegetarian: true
  },
  {
    id: '104',
    name: 'Paneer Chilli',
    description: 'Cubes of fried crispy paneer tossed in a spicy sauce made with soy sauce, vinegar, chili sauce.',
    price: 180,
    category: 'Starters',
    imageUrl: 'https://images.unsplash.com/photo-1567188040759-fb8a883dc6d8?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80',
    isAvailable: true,
    isVegetarian: true
  },
  {
    id: '105',
    name: 'Chicken Sukka',
    description: 'Dry chicken dish made using fresh chicken, masala, grated fresh coconut and generous amount of ghee.',
    price: 150,
    category: 'Starters',
    imageUrl: 'https://images.unsplash.com/photo-1606735584985-fa5b7b257256?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80',
    isAvailable: true,
    isVegetarian: false
  },
  {
    id: '106',
    name: 'Lasooni Soup',
    description: 'Spicy and tangy garlic soup that warms your soul. Perfect starter.',
    price: 120,
    category: 'Soups',
    imageUrl: 'https://images.unsplash.com/photo-1547592166-23acbe34071b?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80',
    isAvailable: true,
    isVegetarian: true
  },
  {
    id: '107',
    name: 'Manchow Soup',
    description: 'Popular Indo-Chinese soup with mixed vegetables, garlic, ginger, soya sauce and fried noodles.',
    price: 100,
    category: 'Soups',
    imageUrl: 'https://images.unsplash.com/photo-1511910849309-0dffb87863b3?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80',
    isAvailable: true,
    isVegetarian: true
  },

  // --- MAIN COURSE (Veg) ---
  {
    id: '201',
    name: 'Dal Fry',
    description: 'Yellow lentils cooked with onion, tomato and flavored with generous amount of tempered ghee and spices.',
    price: 100,
    category: 'Main Course',
    imageUrl: 'https://images.unsplash.com/photo-1546833999-b9f5816029bd?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80',
    isAvailable: true,
    isVegetarian: true
  },
  {
    id: '202',
    name: 'Dal Tadka',
    description: 'Creamy and spicy dal with a smoking hot charcoal flavor (dhungar).',
    price: 120,
    category: 'Main Course',
    imageUrl: 'https://images.unsplash.com/photo-1546833999-b9f5816029bd?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80',
    isAvailable: true,
    isVegetarian: true
  },
  {
    id: '203',
    name: 'Paneer Butter Masala',
    description: 'Rich and creamy dish of paneer in a tomato, butter and cashew sauce.',
    price: 180,
    category: 'Main Course',
    imageUrl: 'https://images.unsplash.com/photo-1631452180519-c014fe946bc7?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80',
    isAvailable: true,
    isVegetarian: true
  },
  {
    id: '204',
    name: 'Kaju Curry',
    description: 'Roasted cashews slowly cooked in a spicy, creamy and silky onion tomato gravy.',
    price: 180,
    category: 'Main Course',
    imageUrl: 'https://images.unsplash.com/photo-1585937421612-70a008356f36?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80',
    isAvailable: true,
    isVegetarian: true
  },
  {
    id: '205',
    name: 'Shev Bhaji',
    description: 'Spicy Maharashtrian curry made with red chili powder, goda masala and topped with crispy sev.',
    price: 130,
    category: 'Main Course',
    imageUrl: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80',
    isAvailable: true,
    isVegetarian: true
  },
  {
    id: '206',
    name: 'Veg Kolhapuri',
    description: 'Mixed vegetables in a thick, spiced gravy from the Kolhapur region of Maharashtra.',
    price: 180,
    category: 'Main Course',
    imageUrl: 'https://images.unsplash.com/photo-1565557623262-b51c2513a641?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80',
    isAvailable: true,
    isVegetarian: true
  },

  // --- MAIN COURSE (Non-Veg) ---
  {
    id: '301',
    name: 'Butter Chicken',
    description: 'Chicken prepared in a buttery gravy with the addition of cream gives the curry sauce a silky smooth rich texture.',
    price: 180,
    category: 'Main Course',
    imageUrl: 'https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80',
    isAvailable: true,
    isVegetarian: false
  },
  {
    id: '302',
    name: 'Chicken Masala',
    description: 'Chicken cooked in a spicy gravy with authentic Indian spices.',
    price: 150,
    category: 'Main Course',
    imageUrl: 'https://images.unsplash.com/photo-1565557623262-b51c2513a641?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80',
    isAvailable: true,
    isVegetarian: false
  },
  {
    id: '303',
    name: 'Chicken Handi',
    description: 'Chicken cooked in a handi (clay pot) with stronger spices and flavour.',
    price: 180,
    category: 'Main Course',
    imageUrl: 'https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80',
    isAvailable: true,
    isVegetarian: false
  },
  {
    id: '304',
    name: 'Mutton Sukka',
    description: 'Tender mutton pieces coated in a thick, spicy masala paste.',
    price: 200,
    category: 'Main Course',
    imageUrl: 'https://images.unsplash.com/photo-1574672280602-95cb168e192a?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80',
    isAvailable: true,
    isVegetarian: false
  },
  {
    id: '305',
    name: 'Mutton Handi',
    description: 'Slow-cooked mutton in a traditional pot with rich gravy.',
    price: 220,
    category: 'Main Course',
    imageUrl: 'https://images.unsplash.com/photo-1574672280602-95cb168e192a?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80',
    isAvailable: true,
    isVegetarian: false
  },

  // --- BREADS (Roti) ---
  {
    id: '401',
    name: 'Tandoori Roti',
    description: 'Whole wheat bread baked in a clay oven.',
    price: 15,
    category: 'Breads',
    imageUrl: 'https://images.unsplash.com/photo-1626074353765-517a681e40be?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80',
    isAvailable: true,
    isVegetarian: true
  },
  {
    id: '402',
    name: 'Butter Roti',
    description: 'Tandoori roti topped with fresh butter.',
    price: 25,
    category: 'Breads',
    imageUrl: 'https://images.unsplash.com/photo-1626074353765-517a681e40be?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80',
    isAvailable: true,
    isVegetarian: true
  },
  {
    id: '403',
    name: 'Chapathi',
    description: 'Soft, thin flatbread made from wheat flour.',
    price: 20,
    category: 'Breads',
    imageUrl: 'https://images.unsplash.com/photo-1565557623262-b51c2513a641?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80',
    isAvailable: true,
    isVegetarian: true
  },
  {
    id: '404',
    name: 'Garlic Naan',
    description: 'Leavened flatbread topped with chopped garlic and coriander.',
    price: 50,
    category: 'Breads',
    imageUrl: 'https://images.unsplash.com/photo-1626074353765-517a681e40be?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80',
    isAvailable: true,
    isVegetarian: true
  },

  // --- RICE ---
  {
    id: '501',
    name: 'Jeera Rice',
    description: 'Basmati rice flavored with cumin seeds.',
    price: 80,
    category: 'Rice',
    imageUrl: 'https://images.unsplash.com/photo-1516685016129-c8d3286a3f0f?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80',
    isAvailable: true,
    isVegetarian: true
  },
  {
    id: '502',
    name: 'Dal Khichdi',
    description: 'Rice and lentils cooked together with mild spices. Comfort food.',
    price: 150,
    category: 'Rice',
    imageUrl: 'https://images.unsplash.com/photo-1596797038530-2c107229654b?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80',
    isAvailable: true,
    isVegetarian: true
  },
  {
    id: '503',
    name: 'Veg Biryani',
    description: 'Aromatic rice dish made with basmati rice, mixed veggies, herbs & biryani spices.',
    price: 130,
    category: 'Rice',
    imageUrl: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80',
    isAvailable: true,
    isVegetarian: true
  },
  {
    id: '504',
    name: 'Curd Rice',
    description: 'Soft cooked rice mixed with curd and tempered with spices.',
    price: 130,
    category: 'Rice',
    imageUrl: 'https://images.unsplash.com/photo-1596797038530-2c107229654b?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80',
    isAvailable: true,
    isVegetarian: true
  },

  // --- BEVERAGES ---
  {
    id: '601',
    name: 'Masala Chai',
    description: 'Hot indian tea brewed with spices.',
    price: 40,
    category: 'Beverages',
    imageUrl: 'https://images.unsplash.com/photo-1561336313-0bd5e0b27ec8?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80',
    isAvailable: true,
    isVegetarian: true
  },
  {
    id: '602',
    name: 'Sweet Lassi',
    description: 'Traditional yogurt based drink.',
    price: 60,
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
      { ...MOCK_MENU[0], quantity: 1 }, // Chicken 65
      { ...MOCK_MENU[11], quantity: 2 } // Butter Roti
    ],
    totalAmount: 230,
    status: OrderStatus.PREPARING,
    type: OrderType.DINE_IN,
    timestamp: Date.now() - 1000 * 60 * 15, // 15 mins ago
    tableNumber: '2'
  },
  {
    id: 'ORD-002',
    customerName: 'Amit Singh',
    items: [
      { ...MOCK_MENU[4], quantity: 2 }, // Chicken Sukka
    ],
    totalAmount: 300,
    status: OrderStatus.PENDING,
    type: OrderType.DELIVERY,
    timestamp: Date.now() - 1000 * 60 * 5, // 5 mins ago
    deliveryAddress: 'House 12, Highway Road'
  },
  {
    id: 'ORD-003',
    customerName: 'Priya Sharma',
    items: [
      { ...MOCK_MENU[7], quantity: 1 }, // Dal Fry
      { ...MOCK_MENU[20], quantity: 1 } // Jeera Rice
    ],
    totalAmount: 180,
    status: OrderStatus.READY,
    type: OrderType.PICKUP,
    timestamp: Date.now() - 1000 * 60 * 30 // 30 mins ago
  }
];

export const MOCK_PAST_ORDERS: Order[] = [
  {
    id: 'ORD-HIST-01',
    customerName: 'Rahul Kumar',
    items: [
      { ...MOCK_MENU[0], quantity: 2 },
      { ...MOCK_MENU[13], quantity: 4 }
    ],
    totalAmount: 560,
    status: OrderStatus.DELIVERED,
    type: OrderType.DELIVERY,
    timestamp: Date.now() - 1000 * 60 * 60 * 24 * 2, // 2 days ago
    deliveryAddress: 'Sector 4, Wada'
  },
  {
    id: 'ORD-HIST-02',
    customerName: 'Rahul Kumar',
    items: [
      { ...MOCK_MENU[2], quantity: 1 }, // Gobi Manchurian
      { ...MOCK_MENU[21], quantity: 1 } // Dal Khichdi
    ],
    totalAmount: 270,
    status: OrderStatus.DELIVERED,
    type: OrderType.DINE_IN,
    timestamp: Date.now() - 1000 * 60 * 60 * 24 * 5 // 5 days ago
  }
];

export const CATEGORIES = ['All', 'Starters', 'Main Course', 'Breads', 'Rice', 'Soups', 'Beverages'];
