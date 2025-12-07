import React, { useState, useEffect } from 'react';
import { Role, MenuItem, CartItem, Order, OrderStatus, OrderType, User } from './types';
import { MOCK_MENU, MOCK_ORDERS, MOCK_TABLES } from './constants';
import { CustomerView } from './components/CustomerView';
import { AdminDashboard } from './components/AdminDashboard';
import { KitchenView } from './components/KitchenView';
import { LoginScreen } from './components/LoginScreen';
import { LayoutGrid, UtensilsCrossed, ChefHat, Truck, LogOut } from 'lucide-react';

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  
  // App State
  const [menu, setMenu] = useState<MenuItem[]>(MOCK_MENU);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [orders, setOrders] = useState<Order[]>(MOCK_ORDERS);
  const [tables, setTables] = useState(MOCK_TABLES);

  // 1. Persistent Login: Check LocalStorage on Mount
  useEffect(() => {
    const savedUser = localStorage.getItem('dhaba_user');
    if (savedUser) {
      try {
        setCurrentUser(JSON.parse(savedUser));
      } catch (e) {
        localStorage.removeItem('dhaba_user');
      }
    }
  }, []);

  // 2. Live Kitchen Simulation (Simulates a real backend)
  useEffect(() => {
    // Every 15 seconds, check if any order needs to move forward
    const interval = setInterval(() => {
      setOrders(prevOrders => {
        return prevOrders.map(order => {
          // Only update active orders randomly to simulate human work
          if (Math.random() > 0.3) return order; 

          const timeDiff = Date.now() - order.timestamp;
          
          // Auto-move Pending to Preparing after 30 seconds
          if (order.status === OrderStatus.PENDING && timeDiff > 30000) {
            return { ...order, status: OrderStatus.PREPARING };
          }
          
          // Auto-move Preparing to Ready after 2 minutes
          if (order.status === OrderStatus.PREPARING && timeDiff > 120000) {
             return { ...order, status: OrderStatus.READY };
          }

          return order;
        });
      });
    }, 5000); // Check every 5 seconds

    return () => clearInterval(interval);
  }, []);

  // Auth Actions
  const handleLogin = (role: Role, name: string) => {
    const user = {
      id: Date.now().toString(),
      name: name,
      role: role
    };
    setCurrentUser(user);
    localStorage.setItem('dhaba_user', JSON.stringify(user));
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setCart([]); 
    localStorage.removeItem('dhaba_user');
  };

  // Cart Actions
  const addToCart = (item: MenuItem) => {
    setCart(prev => {
      const existing = prev.find(i => i.id === item.id);
      if (existing) {
        return prev.map(i => i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i);
      }
      return [...prev, { ...item, quantity: 1 }];
    });
  };

  const removeFromCart = (itemId: string) => {
    setCart(prev => {
      const existing = prev.find(i => i.id === itemId);
      if (existing && existing.quantity > 1) {
        return prev.map(i => i.id === itemId ? { ...i, quantity: i.quantity - 1 } : i);
      }
      return prev.filter(i => i.id !== itemId);
    });
  };

  const placeOrder = (type: OrderType, details: any) => {
    const newOrder: Order = {
      id: `ORD-${Date.now().toString().slice(-4)}`,
      customerName: currentUser?.name || "Customer",
      items: [...cart],
      totalAmount: cart.reduce((acc, item) => acc + (item.price * item.quantity), 0),
      status: OrderStatus.PENDING,
      type: type,
      timestamp: Date.now(),
      ...details
    };
    setOrders(prev => [newOrder, ...prev]);
    setCart([]);
  };

  // Admin Actions
  const updateMenu = (updatedItem: MenuItem) => {
    setMenu(prev => prev.map(item => item.id === updatedItem.id ? updatedItem : item));
  };

  // Kitchen Actions
  const updateOrderStatus = (orderId: string, status: OrderStatus) => {
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status } : o));
  };

  // If not logged in, show Login Screen
  if (!currentUser) {
    return <LoginScreen onLogin={handleLogin} />;
  }

  // Helper to switch views within Admin Roles (Customer is locked to Customer View)
  const currentRole = currentUser.role;

  // Filter orders for the specific customer
  const myOrders = currentRole === Role.CUSTOMER 
    ? orders.filter(o => o.customerName === currentUser.name)
    : orders;

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-gray-50 font-sans text-gray-900">
      
      {/* Sidebar - Only for Staff Roles */}
      {currentRole !== Role.CUSTOMER && (
        <aside className="md:w-64 bg-gray-900 text-white flex-shrink-0 flex flex-col hidden md:flex">
          <div className="p-6 border-b border-gray-800">
              <h2 className="text-xl font-bold text-orange-500">Shourya Wada</h2>
              <p className="text-xs text-gray-400 mt-1">Admin Dashboard</p>
          </div>
          
          <div className="p-4 flex-1">
              <p className="text-xs font-bold text-gray-500 uppercase mb-3 px-2">Menu</p>
              <nav className="space-y-1">
                  <button 
                      onClick={() => setCurrentUser({...currentUser, role: Role.ADMIN})}
                      className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium transition-colors ${currentRole === Role.ADMIN ? 'bg-orange-600 text-white' : 'text-gray-400 hover:bg-gray-800'}`}
                  >
                      <LayoutGrid size={18} /> Owner Dashboard
                  </button>
                  <button 
                      onClick={() => setCurrentUser({...currentUser, role: Role.KITCHEN})}
                      className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium transition-colors ${currentRole === Role.KITCHEN ? 'bg-orange-600 text-white' : 'text-gray-400 hover:bg-gray-800'}`}
                  >
                      <ChefHat size={18} /> Kitchen Display
                  </button>
                  <button 
                      onClick={() => setCurrentUser({...currentUser, role: Role.DELIVERY})}
                      className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium transition-colors ${currentRole === Role.DELIVERY ? 'bg-orange-600 text-white' : 'text-gray-400 hover:bg-gray-800'}`}
                  >
                      <Truck size={18} /> Delivery Tracking
                  </button>
              </nav>
          </div>

          <div className="p-4 border-t border-gray-800">
              <button 
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium text-red-400 hover:bg-gray-800 hover:text-red-300 transition-colors"
              >
                  <LogOut size={18} /> Logout
              </button>
          </div>
        </aside>
      )}
      
      {/* Mobile Header for Admin Roles (Customer has its own header) */}
      {currentRole !== Role.CUSTOMER && (
        <header className="md:hidden bg-gray-900 text-white p-4 flex justify-between items-center sticky top-0 z-50">
           <div>
              <h2 className="text-lg font-bold text-orange-500">Shourya Wada</h2>
              <p className="text-[10px] text-gray-400">Logged in as {currentUser.name}</p>
           </div>
           <button onClick={handleLogout} className="p-2 text-red-400">
             <LogOut size={20} />
           </button>
        </header>
      )}

      {/* Main Content Area */}
      <main className={`flex-1 overflow-y-auto bg-gray-50 ${currentRole === Role.CUSTOMER ? 'h-auto' : 'h-[calc(100vh-60px)] md:h-screen'}`}>
        {currentRole === Role.CUSTOMER && (
            <CustomerView 
                menu={menu} 
                cart={cart} 
                addToCart={addToCart} 
                removeFromCart={removeFromCart} 
                placeOrder={placeOrder} 
                userName={currentUser.name}
                onLogout={handleLogout}
                activeOrders={myOrders.filter(o => o.status !== OrderStatus.DELIVERED && o.status !== OrderStatus.CANCELLED)}
            />
        )}
        
        {currentRole === Role.ADMIN && (
            <AdminDashboard 
                orders={orders} 
                menu={menu} 
                tables={tables}
                onUpdateMenu={updateMenu}
            />
        )}

        {currentRole === Role.KITCHEN && (
            <KitchenView 
                orders={orders} 
                onUpdateStatus={updateOrderStatus} 
            />
        )}

        {currentRole === Role.DELIVERY && (
            <div className="p-4 md:p-8">
                <h1 className="text-2xl font-bold mb-4">Delivery Partner View</h1>
                <p className="text-gray-600 mb-6">Active deliveries will appear here. Map integration available in Pro plan.</p>
                <div className="bg-white p-6 rounded-xl shadow border border-gray-100">
                     <h3 className="font-bold text-lg mb-4">Assigned Deliveries</h3>
                     {orders.filter(o => o.type === OrderType.DELIVERY && o.status !== OrderStatus.DELIVERED).map(order => (
                         <div key={order.id} className="border-b py-4 last:border-0">
                            <div className="flex justify-between">
                                <span className="font-bold">{order.id}</span>
                                <span className="text-orange-600 font-bold">₹{order.totalAmount}</span>
                            </div>
                            <p className="text-sm text-gray-500 mt-1">{order.deliveryAddress}</p>
                            <div className="mt-3 flex gap-2">
                                <button onClick={() => updateOrderStatus(order.id, OrderStatus.DELIVERED)} className="bg-green-600 text-white px-4 py-2 rounded text-sm font-medium w-full">Mark Delivered (OTP)</button>
                                <button className="bg-gray-100 text-gray-700 px-4 py-2 rounded text-sm font-medium">Call</button>
                            </div>
                         </div>
                     ))}
                     {orders.filter(o => o.type === OrderType.DELIVERY && o.status !== OrderStatus.DELIVERED).length === 0 && (
                         <p className="text-gray-400 text-center py-4">No active deliveries</p>
                     )}
                </div>
            </div>
        )}
      </main>

    </div>
  );
};

export default App;