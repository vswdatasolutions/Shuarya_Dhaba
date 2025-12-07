import React, { useState, useEffect } from 'react';
import { MenuItem, CartItem, OrderType, Order, OrderStatus } from '../types';
import { ShoppingBag, Star, Clock, MapPin, Plus, Minus, User, Calendar, ArrowRight, Utensils, Phone, LogOut, Volume2, X, VolumeX, Loader2, CheckCircle, Smartphone, CreditCard, Wallet, Settings, History, ChevronRight, Leaf, Salad } from 'lucide-react';
import { CATEGORIES, MOCK_MENU, MOCK_PAST_ORDERS } from '../constants';
import { getSmartRecommendations } from '../services/geminiService';
import { VoiceAssistant } from './VoiceAssistant';

interface CustomerViewProps {
  menu: MenuItem[];
  cart: CartItem[];
  addToCart: (item: MenuItem) => void;
  removeFromCart: (itemId: string) => void;
  placeOrder: (type: OrderType, details: any) => void;
  userName: string;
  onLogout: () => void;
  activeOrders: Order[];
}

export const CustomerView: React.FC<CustomerViewProps> = ({ menu, cart, addToCart, removeFromCart, placeOrder, userName, onLogout, activeOrders }) => {
  const [activeCategory, setActiveCategory] = useState('All');
  const [isVegOnly, setIsVegOnly] = useState(false);
  // Navigation State
  const [view, setView] = useState<'MENU' | 'CART' | 'BOOKING' | 'PAYMENT_PROCESSING' | 'ORDERS' | 'PROFILE'>('MENU');
  
  const [recommendations, setRecommendations] = useState<string[]>([]);
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [bookingDetails, setBookingDetails] = useState({ name: userName || '', people: 2, time: '' });
  const [playingAudio, setPlayingAudio] = useState<string | null>(null);
  const [paymentStep, setPaymentStep] = useState<'SELECT' | 'PROCESSING' | 'SUCCESS'>('SELECT');
  const [userProfile, setUserProfile] = useState({ name: userName, email: 'user@example.com', mobile: '9876543210' });
  
  // Live Kitchen Activity Simulation State
  const [kitchenActivity, setKitchenActivity] = useState("Order received by Kitchen...");

  const cartTotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  // Gemini Smart Recommendations when cart updates
  useEffect(() => {
    const itemNames = cart.map(c => c.name);
    getSmartRecommendations(itemNames).then(recs => setRecommendations(recs));
  }, [cart.length]);

  // Live Kitchen Activity Updates
  useEffect(() => {
    const activities = [
        "Chef is chopping fresh vegetables 🥬",
        "Marinating with secret spices 🍗",
        "Tandoor is heating up to 400°C 🔥",
        "Chef Raju is preparing the gravy 🥘",
        "Garnishing with fresh coriander 🌿",
        "Quality check in progress ✅",
        "Packing your order with care ❤️"
    ];
    
    // Only run if there is an active order in preparing state
    const hasPreparingOrder = activeOrders.some(o => o.status === OrderStatus.PREPARING);
    
    if (hasPreparingOrder) {
        const interval = setInterval(() => {
            const random = activities[Math.floor(Math.random() * activities.length)];
            setKitchenActivity(random);
        }, 4000);
        return () => clearInterval(interval);
    } else {
        setKitchenActivity("Waiting for update...");
    }
  }, [activeOrders]);

  const filteredMenu = menu.filter(item => {
    const categoryMatch = activeCategory === 'All' || item.category === activeCategory;
    const vegMatch = isVegOnly ? item.isVegetarian : true;
    return categoryMatch && vegMatch;
  });

  const handlePaymentStart = () => {
    if (cart.length === 0 || !deliveryAddress) return;
    setPaymentStep('PROCESSING');
    
    // Simulate Payment Delay
    setTimeout(() => {
        setPaymentStep('SUCCESS');
        // Play Payment Sound (PhonePe style)
        const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/1435/1435-preview.mp3'); 
        audio.play().catch(e => console.log(e));
        
        setTimeout(() => {
            placeOrder(OrderType.DELIVERY, { deliveryAddress });
            setPaymentStep('SELECT');
            setDeliveryAddress('');
            setView('ORDERS'); // Go to Orders page after payment
        }, 2000);
    }, 3000);
  };

  const handleAddToCart = (item: MenuItem) => {
    addToCart(item);
    const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2578/2578-preview.mp3'); 
    audio.volume = 0.5;
    audio.play().catch(e => console.log("Audio play failed", e));
  }

  const getItemQuantity = (itemId: string) => {
    return cart.find(i => i.id === itemId)?.quantity || 0;
  };

  const playDishDescription = (name: string, description: string, id: string) => {
    if (playingAudio === id) {
        window.speechSynthesis.cancel();
        setPlayingAudio(null);
        return;
    }

    // Cancel any current speech
    window.speechSynthesis.cancel();

    // Text to speak: Name first, then description
    const textToSpeak = `${name}. ${description}`;
    const utterance = new SpeechSynthesisUtterance(textToSpeak);
    
    // Robust voice selection
    const voices = window.speechSynthesis.getVoices();
    const preferredVoice = voices.find(v => v.lang === 'en-IN' || v.lang.includes('en_IN')) ||
                           voices.find(v => v.lang === 'hi-IN' || v.lang.includes('hi')) ||
                           voices.find(v => v.lang === 'en-GB');

    if (preferredVoice) {
        utterance.voice = preferredVoice;
    }
    
    utterance.lang = 'en-IN';
    utterance.rate = 0.9; 
    utterance.pitch = 1.0;
    
    utterance.onstart = () => setPlayingAudio(id);
    utterance.onend = () => setPlayingAudio(null);
    utterance.onerror = () => setPlayingAudio(null);
    
    window.speechSynthesis.speak(utterance);
  };

  // Cleanup audio on unmount
  useEffect(() => {
    return () => {
        window.speechSynthesis.cancel();
    };
  }, []);

  const latestOrder = activeOrders.length > 0 ? activeOrders[0] : null;
  const getStatusMessage = (status: OrderStatus) => {
    switch(status) {
        case OrderStatus.PENDING: return { text: "Order Sent to Kitchen", color: "bg-yellow-500", icon: <Clock size={16}/> };
        case OrderStatus.PREPARING: return { text: "Chef is Cooking...", color: "bg-blue-500", icon: <Loader2 size={16} className="animate-spin"/> };
        case OrderStatus.READY: return { text: "Food Ready! Delivery soon.", color: "bg-green-600", icon: <CheckCircle size={16}/> };
        default: return { text: "Preparing...", color: "bg-gray-500", icon: <Clock size={16}/> };
    }
  };

  const handleBookingFromVoice = (details?: { people?: number, time?: string }) => {
    if (details) {
        setBookingDetails(prev => ({
            ...prev,
            people: details.people || prev.people,
            // If time is provided by AI (e.g., "20:00"), assume today
            time: details.time ? `${new Date().toISOString().split('T')[0]}T${details.time}` : prev.time
        }));
    }
    setView('BOOKING');
  };

  return (
    <div className="pb-24 md:pb-0 bg-gray-50 min-h-screen font-sans flex flex-col transition-all duration-300 relative">
      
      {/* AI Voice Assistant */}
      <VoiceAssistant 
        menu={menu} 
        addToCart={handleAddToCart} 
        onCheckout={() => setView('CART')} 
        onBooking={handleBookingFromVoice}
      />

      {/* Live Order Status Banner */}
      {latestOrder && view !== 'CART' && view !== 'ORDERS' && (
         <button onClick={() => setView('ORDERS')} className={`${getStatusMessage(latestOrder.status).color} text-white px-4 py-2 flex items-center justify-between text-sm font-bold shadow-md sticky top-[60px] md:top-[68px] z-40 animate-slide-up w-full`}>
            <div className="flex items-center gap-2">
                {getStatusMessage(latestOrder.status).icon}
                <span>{getStatusMessage(latestOrder.status).text}</span>
            </div>
            <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded flex items-center gap-1">
                Track <ChevronRight size={10} />
            </span>
         </button>
      )}

      {/* Universal Header */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md shadow-sm border-b border-gray-100 px-4 md:px-8 py-3 flex justify-between items-center transition-all">
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => setView('MENU')}>
            <div className="bg-orange-600 p-2 md:p-2.5 rounded-xl text-white shadow-orange-200 shadow-lg">
                <Utensils size={20} fill="currentColor" />
            </div>
            <div className="flex flex-col">
                <h1 className="text-lg md:text-xl font-extrabold text-gray-900 leading-none tracking-tight">Shourya Wada</h1>
                <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="text-[10px] text-green-600 font-bold flex items-center gap-0.5 bg-green-50 px-1 rounded">
                        <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span> OPEN
                    </span>
                </div>
            </div>
        </div>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-8">
            <button onClick={() => setView('MENU')} className={`font-semibold text-sm ${view === 'MENU' ? 'text-orange-600' : 'text-gray-600 hover:text-orange-500'}`}>Order Online</button>
            <button onClick={() => setView('ORDERS')} className={`font-semibold text-sm ${view === 'ORDERS' ? 'text-orange-600' : 'text-gray-600 hover:text-orange-500'}`}>My Orders</button>
            <button onClick={() => setView('BOOKING')} className={`font-semibold text-sm ${view === 'BOOKING' ? 'text-orange-600' : 'text-gray-600 hover:text-orange-500'}`}>Book Table</button>
            <div className="h-6 w-px bg-gray-200 mx-2"></div>
            <button onClick={() => setView('PROFILE')} className={`flex items-center gap-2 font-semibold text-sm ${view === 'PROFILE' ? 'text-orange-600' : 'text-gray-600 hover:text-orange-500'}`}>
                <User size={16} /> {userName.split(' ')[0]}
            </button>
            <button 
                onClick={() => setView('CART')}
                className="flex items-center gap-2 bg-gray-900 text-white px-4 py-2 rounded-full hover:bg-gray-800 transition-colors shadow-lg shadow-gray-200"
            >
                <ShoppingBag size={18} />
                <span className="font-bold text-sm">₹{cartTotal}</span>
                {cartCount > 0 && <span className="bg-red-500 text-[10px] w-5 h-5 flex items-center justify-center rounded-full ml-1">{cartCount}</span>}
            </button>
        </nav>

        {/* Mobile Cart Toggle */}
        <div className="flex items-center gap-3 md:hidden">
            <button 
                onClick={() => setView('CART')}
                className="relative p-2 bg-orange-50 rounded-full text-orange-700 hover:text-orange-600 border border-orange-100 transition-colors"
            >
                <ShoppingBag size={24} />
                {cartCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-600 text-white text-[10px] w-5 h-5 flex items-center justify-center rounded-full font-bold border border-white shadow-sm animate-bounce-slow">
                        {cartCount}
                    </span>
                )}
            </button>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 w-full max-w-7xl mx-auto">
          
          {view === 'MENU' && (
              <div className="md:px-8 md:py-8">
                {/* Greeting / Promo Banner */}
                <div className="px-4 py-4 md:px-0">
                    <div className="bg-gradient-to-r from-gray-900 to-gray-800 rounded-2xl p-5 md:p-6 text-white shadow-xl relative overflow-hidden flex items-center justify-between">
                        <div className="relative z-10 max-w-[75%]">
                            <span className="bg-orange-500 text-[9px] md:text-[10px] font-bold px-2 py-0.5 rounded text-white mb-1.5 inline-block">NAMASTE {userName.toUpperCase()} 🙏</span>
                            <h2 className="text-lg md:text-2xl font-bold mb-1 leading-tight">Authentic Dhaba Flavors</h2>
                            <p className="text-gray-300 text-xs mb-3">Order now for spicy & fresh food.</p>
                        </div>
                        <div className="w-20 h-20 md:w-28 md:h-28 rounded-full overflow-hidden border-2 border-white/20 shadow-lg flex-shrink-0">
                             <img src="https://images.unsplash.com/photo-1546833999-b9f5816029bd?ixlib=rb-1.2.1&auto=format&fit=crop&w=300&q=80" alt="Food" className="w-full h-full object-cover" />
                        </div>
                    </div>
                </div>

                {/* Smart Recommendations */}
                {recommendations.length > 0 && (
                    <div className="px-4 mb-4 md:px-0">
                        <div className="bg-purple-50 border border-purple-100 p-3 rounded-xl">
                            <div className="flex items-center gap-1.5 mb-2">
                                <div className="bg-purple-100 p-1 rounded-full"><Star size={10} className="text-purple-600" /></div>
                                <p className="text-[10px] font-bold text-purple-700 uppercase tracking-wide">Chef Recommendations</p>
                            </div>
                            <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
                                {recommendations.map((rec, i) => (
                                    <button key={i} className="bg-white text-purple-700 text-xs font-medium px-3 py-2 rounded-lg shadow-sm whitespace-nowrap border border-purple-100 active:scale-95 transition-transform">
                                        + {rec}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* Filters Row (Categories + Veg Toggle) */}
                <div className="sticky top-[60px] md:top-[72px] z-30 bg-gray-50/95 backdrop-blur-sm py-2 px-4 md:px-0 border-b border-gray-200 mb-4 transition-all">
                    <div className="flex items-center gap-3 overflow-x-auto no-scrollbar pb-1">
                        {/* Veg Mode Toggle */}
                        <button 
                            onClick={() => setIsVegOnly(!isVegOnly)}
                            className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-bold transition-all shadow-sm ${isVegOnly ? 'bg-green-50 border-green-500 text-green-700 ring-1 ring-green-200' : 'bg-white border-gray-300 text-gray-500'}`}
                        >
                            <div className={`w-3 h-3 border rounded-sm flex items-center justify-center ${isVegOnly ? 'border-green-600' : 'border-gray-400'}`}>
                                <div className={`w-1.5 h-1.5 rounded-full ${isVegOnly ? 'bg-green-600' : 'bg-gray-400'}`}></div>
                            </div>
                            <span>Pure Veg</span>
                        </button>

                        <div className="w-px h-6 bg-gray-200 flex-shrink-0"></div>

                        {CATEGORIES.map(cat => (
                            <button
                                key={cat}
                                onClick={() => setActiveCategory(cat)}
                                className={`flex-shrink-0 px-4 py-2 rounded-full text-xs md:text-sm font-bold transition-all shadow-sm ${
                                    activeCategory === cat 
                                    ? 'bg-orange-600 text-white shadow-orange-200 ring-2 ring-orange-100 border-transparent' 
                                    : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-100'
                                }`}
                            >
                                {cat}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Menu List */}
                <div className="px-4 pb-8 md:px-0 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                    {filteredMenu.length === 0 ? (
                        <div className="col-span-full py-12 text-center text-gray-500">
                            <Salad size={48} className="mx-auto text-gray-300 mb-3" />
                            <p>No items found in this category.</p>
                            {isVegOnly && <button onClick={() => setIsVegOnly(false)} className="text-orange-600 text-xs font-bold mt-2">Disable Pure Veg Mode</button>}
                        </div>
                    ) : (
                        filteredMenu.map(item => {
                            const qty = getItemQuantity(item.id);
                            return (
                                <div key={item.id} className="bg-white rounded-2xl p-3 shadow-sm border border-gray-100 flex gap-3 md:gap-4 transition-all hover:shadow-lg hover:-translate-y-1">
                                    {/* Image Container */}
                                    <div className="w-24 h-24 md:w-32 md:h-32 flex-shrink-0 rounded-xl bg-gray-100 overflow-hidden relative group">
                                        <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                                        <div className="absolute top-1.5 left-1.5 bg-white/95 backdrop-blur-sm rounded px-1.5 py-0.5 shadow-sm z-10">
                                            <div className={`w-3 h-3 border-2 flex items-center justify-center rounded-sm ${item.isVegetarian ? 'border-green-600' : 'border-red-600'}`}>
                                                <div className={`w-1.5 h-1.5 rounded-full ${item.isVegetarian ? 'bg-green-600' : 'bg-red-600'}`}></div>
                                            </div>
                                        </div>
                                        {/* Audio Description Button */}
                                        <button 
                                            onClick={(e) => { e.stopPropagation(); playDishDescription(item.name, item.description, item.id); }}
                                            className={`absolute bottom-1.5 right-1.5 p-1.5 rounded-full backdrop-blur-md transition-all shadow-sm z-20 ${playingAudio === item.id ? 'bg-orange-600 text-white animate-pulse ring-2 ring-orange-200' : 'bg-white/80 text-gray-700 hover:bg-white hover:text-orange-600'}`}
                                            title="Listen to Item Name & Description"
                                        >
                                            {playingAudio === item.id ? <VolumeX size={16} /> : <Volume2 size={16} />}
                                        </button>
                                    </div>
                                    
                                    {/* Content Container */}
                                    <div className="flex-1 flex flex-col justify-between py-0.5">
                                        <div>
                                            <h3 className="font-extrabold text-gray-900 text-sm md:text-lg leading-tight mb-1">{item.name}</h3>
                                            <p className="text-[10px] md:text-xs text-gray-500 line-clamp-2 leading-relaxed">{item.description}</p>
                                        </div>
                                        
                                        <div className="flex justify-between items-end mt-2">
                                            <span className="font-bold text-gray-900 text-base md:text-lg">₹{item.price}</span>
                                            
                                            {qty === 0 ? (
                                                <button 
                                                    onClick={() => handleAddToCart(item)}
                                                    className="bg-orange-50 text-orange-700 border border-orange-200 px-4 py-2 rounded-lg text-xs md:text-sm font-bold uppercase tracking-wide hover:bg-orange-600 hover:text-white transition-all active:scale-95 shadow-sm"
                                                >
                                                    ADD +
                                                </button>
                                            ) : (
                                                <div className="flex items-center gap-3 bg-orange-600 rounded-lg px-2 py-1 shadow-md shadow-orange-200">
                                                    <button onClick={() => removeFromCart(item.id)} className="text-white p-1 hover:bg-orange-700 rounded active:scale-90"><Minus size={16} strokeWidth={3} /></button>
                                                    <span className="text-white font-bold text-base w-4 text-center">{qty}</span>
                                                    <button onClick={() => handleAddToCart(item)} className="text-white p-1 hover:bg-orange-700 rounded active:scale-90"><Plus size={16} strokeWidth={3} /></button>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
              </div>
          )}

          {view === 'ORDERS' && (
              <div className="p-4 md:p-8 max-w-2xl mx-auto min-h-screen bg-white md:bg-gray-50 animate-fade-in">
                  <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                      <History className="text-orange-600" /> My Orders
                  </h2>

                  {/* Active Orders */}
                  {activeOrders.length > 0 && (
                      <div className="mb-8">
                          <h3 className="text-sm font-bold text-gray-500 uppercase mb-3">Live Orders</h3>
                          {activeOrders.map(order => (
                              <div key={order.id} className="bg-white p-5 rounded-2xl shadow-lg border border-orange-100 mb-4 relative overflow-hidden transition-all">
                                  {/* Progress Bar Background */}
                                  <div className={`absolute top-0 left-0 h-1 bg-green-500 transition-all duration-1000 ${
                                      order.status === OrderStatus.PENDING ? 'w-1/3' : 
                                      order.status === OrderStatus.PREPARING ? 'w-2/3' : 'w-full'
                                  }`}></div>
                                  
                                  <div className="flex justify-between items-start mb-4">
                                      <div>
                                          <p className="text-xs text-orange-600 font-bold mb-1">#{order.id}</p>
                                          <h4 className="font-bold text-lg text-gray-900">{order.items.map(i => i.name).join(', ').substring(0, 20)}...</h4>
                                      </div>
                                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                                          order.status === OrderStatus.READY ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
                                      }`}>
                                          {order.status === OrderStatus.READY ? 'Ready' : 'In Progress'}
                                      </span>
                                  </div>

                                  {/* Real-time Kitchen Updates */}
                                  {order.status === OrderStatus.PREPARING && (
                                    <div className="bg-blue-50 border border-blue-100 p-2 rounded-lg mb-4 flex items-center gap-2 animate-fade-in">
                                        <Loader2 size={14} className="text-blue-600 animate-spin" />
                                        <p className="text-xs font-semibold text-blue-800 transition-all">{kitchenActivity}</p>
                                    </div>
                                  )}

                                  {/* Stepper */}
                                  <div className="flex justify-between items-center text-[10px] md:text-xs font-bold text-gray-400 mt-2 relative">
                                      {/* Connecting Line */}
                                      <div className="absolute top-1/2 left-0 w-full h-0.5 bg-gray-100 -z-10"></div>
                                      
                                      <div className={`flex flex-col items-center gap-1 bg-white px-2 ${order.status !== OrderStatus.CANCELLED ? 'text-green-600' : ''}`}>
                                          <div className={`w-3 h-3 rounded-full ${order.status !== OrderStatus.CANCELLED ? 'bg-green-600' : 'bg-gray-200'}`}></div>
                                          <span>Sent</span>
                                      </div>
                                      <div className={`flex flex-col items-center gap-1 bg-white px-2 ${[OrderStatus.PREPARING, OrderStatus.READY, OrderStatus.DELIVERED].includes(order.status) ? 'text-green-600' : ''}`}>
                                          <div className={`w-3 h-3 rounded-full ${[OrderStatus.PREPARING, OrderStatus.READY, OrderStatus.DELIVERED].includes(order.status) ? 'bg-green-600' : 'bg-gray-200'}`}></div>
                                          <span>Cooking</span>
                                      </div>
                                      <div className={`flex flex-col items-center gap-1 bg-white px-2 ${[OrderStatus.READY, OrderStatus.DELIVERED].includes(order.status) ? 'text-green-600' : ''}`}>
                                          <div className={`w-3 h-3 rounded-full ${[OrderStatus.READY, OrderStatus.DELIVERED].includes(order.status) ? 'bg-green-600' : 'bg-gray-200'}`}></div>
                                          <span>Ready</span>
                                      </div>
                                  </div>
                              </div>
                          ))}
                      </div>
                  )}

                  {/* Past Orders */}
                  <div>
                      <h3 className="text-sm font-bold text-gray-500 uppercase mb-3">Past Orders</h3>
                      <div className="space-y-3">
                          {[...MOCK_PAST_ORDERS].map(order => (
                              <div key={order.id} className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex justify-between items-center opacity-80 hover:opacity-100 transition-opacity">
                                  <div>
                                      <p className="font-bold text-gray-800">{order.items[0].name} {order.items.length > 1 && `+ ${order.items.length - 1} more`}</p>
                                      <p className="text-xs text-gray-500 mt-1">{new Date(order.timestamp).toDateString()} • ₹{order.totalAmount}</p>
                                  </div>
                                  <button onClick={() => {
                                      order.items.forEach(i => addToCart(i));
                                      setView('CART');
                                  }} className="text-orange-600 text-xs font-bold bg-orange-50 px-3 py-2 rounded-lg hover:bg-orange-100">
                                      REORDER
                                  </button>
                              </div>
                          ))}
                      </div>
                  </div>
              </div>
          )}

          {view === 'PROFILE' && (
              <div className="p-4 md:p-8 max-w-lg mx-auto min-h-screen bg-white md:bg-gray-50 animate-fade-in">
                  <div className="flex items-center gap-4 mb-8">
                      <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center text-gray-500 text-2xl font-bold">
                          {userProfile.name.charAt(0)}
                      </div>
                      <div>
                          <h2 className="text-2xl font-bold text-gray-900">{userProfile.name}</h2>
                          <p className="text-gray-500 text-sm">+91 {userProfile.mobile}</p>
                      </div>
                  </div>

                  {/* Wallet Card */}
                  <div className="bg-gradient-to-r from-gray-900 to-gray-800 text-white p-6 rounded-2xl shadow-xl mb-6 flex justify-between items-center">
                      <div>
                          <p className="text-gray-400 text-xs font-bold uppercase mb-1">Dhaba Wallet</p>
                          <h3 className="text-3xl font-bold">₹0.00</h3>
                      </div>
                      <div className="bg-white/10 p-3 rounded-full">
                          <Wallet size={24} />
                      </div>
                  </div>

                  {/* Settings List */}
                  <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                      <div className="p-4 border-b border-gray-50 flex items-center gap-3 hover:bg-gray-50 cursor-pointer">
                          <MapPin size={20} className="text-gray-400" />
                          <div className="flex-1">
                              <p className="font-bold text-gray-800 text-sm">Saved Addresses</p>
                              <p className="text-xs text-gray-400">Manage delivery locations</p>
                          </div>
                          <ChevronRight size={16} className="text-gray-300" />
                      </div>
                      <div className="p-4 border-b border-gray-50 flex items-center gap-3 hover:bg-gray-50 cursor-pointer">
                          <Settings size={20} className="text-gray-400" />
                          <div className="flex-1">
                              <p className="font-bold text-gray-800 text-sm">Account Settings</p>
                              <p className="text-xs text-gray-400">Notifications, Language</p>
                          </div>
                          <ChevronRight size={16} className="text-gray-300" />
                      </div>
                      <div className="p-4 flex items-center gap-3 hover:bg-gray-50 cursor-pointer">
                          <Phone size={20} className="text-gray-400" />
                          <div className="flex-1">
                              <p className="font-bold text-gray-800 text-sm">Help & Support</p>
                              <p className="text-xs text-gray-400">Call us for issues</p>
                          </div>
                          <ChevronRight size={16} className="text-gray-300" />
                      </div>
                  </div>

                  <button onClick={onLogout} className="w-full mt-8 border border-red-200 text-red-600 font-bold py-3 rounded-xl hover:bg-red-50 flex items-center justify-center gap-2">
                      <LogOut size={18} /> Logout
                  </button>
              </div>
          )}

          {view === 'CART' && (
              <div className="p-4 max-w-lg mx-auto min-h-screen bg-white md:my-8 md:rounded-2xl md:shadow-lg md:border md:border-gray-100 animate-fade-in">
                  <div className="flex items-center gap-4 mb-6 pt-2 sticky top-0 bg-white z-20 py-2">
                    <button onClick={() => setView('MENU')} className="p-2 hover:bg-gray-100 rounded-full transition-colors border border-gray-100"><ArrowRight className="rotate-180" size={24}/></button>
                    <h2 className="text-xl font-bold">Your Order</h2>
                  </div>
                  
                  {cart.length === 0 ? (
                      <div className="text-center py-20 flex flex-col items-center justify-center">
                          <div className="bg-orange-50 p-6 rounded-full mb-4 animate-bounce">
                            <ShoppingBag size={40} className="text-orange-300" />
                          </div>
                          <h3 className="text-lg font-bold text-gray-800 mb-2">Cart Empty</h3>
                          <button onClick={() => setView('MENU')} className="bg-orange-600 text-white px-8 py-3 rounded-xl font-bold shadow-lg shadow-orange-200 hover:bg-orange-700 transition-colors active:scale-95 mt-4">Browse Menu</button>
                      </div>
                  ) : paymentStep === 'SELECT' ? (
                      <>
                        <div className="space-y-4 mb-8">
                            {cart.map(item => (
                                <div key={item.id} className="flex justify-between items-center py-3 border-b border-dashed border-gray-100">
                                    <div>
                                        <div className="flex items-center gap-2 mb-1">
                                            <div className={`w-3 h-3 border border-gray-300 flex items-center justify-center rounded-sm bg-white`}>
                                                <div className={`w-1.5 h-1.5 rounded-full ${item.isVegetarian ? 'bg-green-600' : 'bg-red-600'}`}></div>
                                            </div>
                                            <h4 className="font-semibold text-gray-800 text-base">{item.name}</h4>
                                        </div>
                                        <p className="text-xs text-gray-500 ml-5">₹{item.price} x {item.quantity}</p>
                                    </div>
                                    <div className="flex items-center gap-3 bg-white border border-gray-200 rounded-lg p-1 shadow-sm">
                                        <button onClick={() => removeFromCart(item.id)} className="w-8 h-8 flex items-center justify-center rounded hover:bg-gray-50 text-gray-600 active:bg-gray-200 transition-colors"><Minus size={18} /></button>
                                        <span className="text-base font-bold w-4 text-center text-gray-800">{item.quantity}</span>
                                        <button onClick={() => handleAddToCart(item)} className="w-8 h-8 flex items-center justify-center rounded hover:bg-gray-50 text-green-600 active:bg-gray-200 transition-colors"><Plus size={18} /></button>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="bg-gray-50 p-4 rounded-xl mb-6 border border-gray-200">
                            <div className="flex items-center gap-2 mb-3">
                                <MapPin size={16} className="text-orange-600" />
                                <label className="text-xs font-bold text-gray-700 uppercase">Delivery Location (पता)</label>
                            </div>
                            <textarea 
                                value={deliveryAddress}
                                onChange={(e) => setDeliveryAddress(e.target.value)}
                                placeholder="House No, Area..."
                                className="w-full bg-white border border-gray-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-orange-200 focus:border-orange-400 outline-none transition-all placeholder-gray-400 font-medium"
                                rows={2}
                            />
                        </div>

                        <div className="border-t border-gray-100 pt-4">
                            <div className="flex justify-between items-center text-lg font-bold mt-2 mb-6 pt-4 border-t border-dashed border-gray-200">
                                <span>Total Amount</span>
                                <span className="text-orange-600 text-2xl">₹{cartTotal}</span>
                            </div>
                            
                            <button 
                                onClick={handlePaymentStart}
                                disabled={!deliveryAddress}
                                className={`w-full py-4 rounded-xl font-bold text-white shadow-xl transition-all active:scale-95 flex items-center justify-center gap-2 mb-4 ${!deliveryAddress ? 'bg-gray-300 shadow-none cursor-not-allowed' : 'bg-[#5f259f] hover:bg-[#4a1c7c] shadow-purple-200'}`}
                            >
                                <span>PAY VIA PHONEPE</span>
                                <Smartphone size={20} />
                            </button>
                        </div>
                      </>
                  ) : paymentStep === 'PROCESSING' ? (
                       <div className="flex flex-col items-center justify-center py-12">
                          <div className="w-16 h-16 border-4 border-[#5f259f] border-t-transparent rounded-full animate-spin mb-4"></div>
                          <h3 className="text-xl font-bold text-[#5f259f]">Processing Payment...</h3>
                          <p className="text-gray-500 text-sm mt-2">Connecting to PhonePe Secure Server</p>
                          <div className="mt-8 bg-gray-100 p-4 rounded-lg flex items-center gap-3">
                              <Smartphone className="text-gray-400" />
                              <div className="text-left">
                                  <p className="text-xs text-gray-500">Request sent to</p>
                                  <p className="text-sm font-bold">+91 {userName.length > 0 ? "98XXX XXXXX" : "User"}</p>
                              </div>
                          </div>
                       </div>
                  ) : (
                      <div className="flex flex-col items-center justify-center py-12">
                          <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center text-white mb-6 animate-bounce">
                              <CheckCircle size={40} />
                          </div>
                          <h3 className="text-2xl font-bold text-gray-800">Payment Successful!</h3>
                          <p className="text-gray-600 mt-2">Order #ORD-{Date.now().toString().slice(-4)} Confirmed</p>
                          <div className="mt-8 w-full bg-green-50 border border-green-100 p-4 rounded-xl text-center">
                              <p className="text-sm text-green-800 font-medium">Redirecting to Menu...</p>
                          </div>
                      </div>
                  )}
              </div>
          )}

          {view === 'BOOKING' && (
              <div className="p-6 max-w-lg mx-auto bg-white min-h-screen md:my-8 md:rounded-2xl md:shadow-lg md:border md:border-gray-100 animate-fade-in">
                   <div className="mb-6">
                        <h2 className="text-2xl font-bold text-gray-900">Book Table</h2>
                        <p className="text-gray-500 text-sm mt-1">Reserve your family spot</p>
                   </div>
                   
                   <div className="space-y-5">
                        <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Name</label>
                            <input type="text" className="w-full bg-white border border-gray-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-orange-200 outline-none" placeholder="Your name" 
                                value={bookingDetails.name} onChange={e => setBookingDetails({...bookingDetails, name: e.target.value})}
                            />
                        </div>
                        
                        <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Number of Guests</label>
                            <div className="grid grid-cols-4 gap-2">
                                 {[2,3,4,5,6,8,10,12].map(n => (
                                     <button 
                                        key={n}
                                        onClick={() => setBookingDetails({...bookingDetails, people: n})}
                                        className={`py-2 rounded-lg text-sm font-medium transition-colors ${bookingDetails.people === n ? 'bg-orange-600 text-white shadow-md' : 'bg-white text-gray-600 border border-gray-200'}`}
                                     >
                                         {n}
                                     </button>
                                 ))}
                            </div>
                        </div>

                        <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Time</label>
                            <input type="datetime-local" className="w-full bg-white border border-gray-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-orange-200 outline-none"
                                value={bookingDetails.time} onChange={e => setBookingDetails({...bookingDetails, time: e.target.value})}
                            />
                        </div>
                        
                        <button className="w-full bg-gray-900 text-white py-4 rounded-xl font-bold mt-4 shadow-lg active:scale-95 transition-transform flex items-center justify-center gap-2">
                            <Calendar size={18} />
                            Confirm Booking
                        </button>
                   </div>
              </div>
          )}
      </div>

      {/* Website Footer (Desktop) */}
      <footer className="hidden md:block bg-gray-900 text-white py-12 px-4 mt-auto">
          <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
              <div>
                  <h3 className="text-xl font-bold text-orange-500 mb-4">Shourya Wada</h3>
                  <p className="text-gray-400 text-sm">Authentic Dhaba & Family Restaurant. Serving traditional flavors with modern hygiene standards on the highway.</p>
              </div>
              <div>
                  <h4 className="font-bold mb-4">Quick Links</h4>
                  <ul className="space-y-2 text-sm text-gray-400">
                      <li className="hover:text-white cursor-pointer" onClick={() => setView('MENU')}>Order Online</li>
                      <li className="hover:text-white cursor-pointer" onClick={() => setView('BOOKING')}>Book Table</li>
                  </ul>
              </div>
              <div>
                  <h4 className="font-bold mb-4">Contact</h4>
                  <ul className="space-y-2 text-sm text-gray-400">
                      <li className="flex items-center gap-2"><MapPin size={16} /> Highway Rd, Wada, Maharashtra</li>
                      <li className="flex items-center gap-2"><Phone size={16} /> +91 98765 43210</li>
                  </ul>
              </div>
              <div>
                   <h4 className="font-bold mb-4">Social</h4>
                   <button onClick={onLogout} className="mt-6 flex items-center gap-2 text-xs text-gray-500 hover:text-white transition-colors">
                       <LogOut size={14} /> Logout
                   </button>
              </div>
          </div>
      </footer>

      {/* Modern Bottom Navigation (Mobile Only) */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-lg border-t border-gray-200 flex justify-around py-3 px-2 z-50 md:hidden pb-safe shadow-[0_-5px_10px_rgba(0,0,0,0.02)]">
         <button onClick={() => setView('MENU')} className={`flex flex-col items-center gap-1 w-14 group ${view === 'MENU' ? 'text-orange-600' : 'text-gray-400'}`}>
            <div className={`p-1.5 rounded-2xl transition-all duration-300 ${view === 'MENU' ? 'bg-orange-50 translate-y-[-2px]' : 'bg-transparent'}`}>
                <Utensils size={22} strokeWidth={view === 'MENU' ? 2.5 : 2} />
            </div>
            <span className="text-[9px] font-bold">Menu</span>
         </button>
         
         <button onClick={() => setView('ORDERS')} className={`flex flex-col items-center gap-1 w-14 group ${view === 'ORDERS' ? 'text-orange-600' : 'text-gray-400'}`}>
            <div className={`p-1.5 rounded-2xl transition-all duration-300 ${view === 'ORDERS' ? 'bg-orange-50 translate-y-[-2px]' : 'bg-transparent'}`}>
                <History size={22} strokeWidth={view === 'ORDERS' ? 2.5 : 2} />
            </div>
            <span className="text-[9px] font-bold">Orders</span>
         </button>

         {/* Floating Cart Button (Center) */}
         <button onClick={() => setView('CART')} className="relative -top-5 bg-gray-900 text-white p-4 rounded-full shadow-xl shadow-gray-400/40 transform transition-transform active:scale-95">
             <ShoppingBag size={24} />
             {cartCount > 0 && (
                <span className="absolute top-0 right-0 bg-red-600 text-white text-[10px] w-5 h-5 flex items-center justify-center rounded-full font-bold border-2 border-white">
                    {cartCount}
                </span>
             )}
         </button>

         <button onClick={() => setView('BOOKING')} className={`flex flex-col items-center gap-1 w-14 group ${view === 'BOOKING' ? 'text-orange-600' : 'text-gray-400'}`}>
            <div className={`p-1.5 rounded-2xl transition-all duration-300 ${view === 'BOOKING' ? 'bg-orange-50 translate-y-[-2px]' : 'bg-transparent'}`}>
                <Calendar size={22} strokeWidth={view === 'BOOKING' ? 2.5 : 2} />
            </div>
            <span className="text-[9px] font-bold">Book</span>
         </button>
         
         <button onClick={() => setView('PROFILE')} className={`flex flex-col items-center gap-1 w-14 group ${view === 'PROFILE' ? 'text-orange-600' : 'text-gray-400'}`}>
            <div className={`p-1.5 rounded-2xl transition-all duration-300 ${view === 'PROFILE' ? 'bg-orange-50 translate-y-[-2px]' : 'bg-transparent'}`}>
                <User size={22} strokeWidth={view === 'PROFILE' ? 2.5 : 2} />
            </div>
            <span className="text-[9px] font-bold">Profile</span>
         </button>
      </nav>
    </div>
  );
};