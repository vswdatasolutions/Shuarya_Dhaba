import React, { useState, useEffect, useRef } from 'react';
import { MenuItem, CartItem, OrderType, Order, OrderStatus } from '../types';
import { ShoppingBag, Star, Clock, MapPin, Plus, Minus, User, Calendar, ArrowRight, Utensils, Home, Phone, Instagram, Facebook, LogOut, ChevronRight, Volume2, X, VolumeX, Loader2, CheckCircle } from 'lucide-react';
import { CATEGORIES, MOCK_MENU } from '../constants';
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
  activeOrders: Order[]; // Passed from parent to show live status
}

export const CustomerView: React.FC<CustomerViewProps> = ({ menu, cart, addToCart, removeFromCart, placeOrder, userName, onLogout, activeOrders }) => {
  const [activeCategory, setActiveCategory] = useState('All');
  const [view, setView] = useState<'HOME' | 'MENU' | 'CART' | 'BOOKING'>('HOME');
  const [recommendations, setRecommendations] = useState<string[]>([]);
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [bookingDetails, setBookingDetails] = useState({ name: userName || '', people: 2, time: '' });
  const [showWelcome, setShowWelcome] = useState(false);
  const [playingAudio, setPlayingAudio] = useState<string | null>(null);

  const cartTotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  // Show welcome popup on first mount
  useEffect(() => {
    const hasSeenWelcome = localStorage.getItem('hasSeenWelcome');
    if (!hasSeenWelcome) {
      setShowWelcome(true);
      localStorage.setItem('hasSeenWelcome', 'true');
    }
  }, []);

  // Gemini Smart Recommendations when cart updates
  useEffect(() => {
    const itemNames = cart.map(c => c.name);
    // Fetches recommendations even if cart is empty (providing general suggestions)
    getSmartRecommendations(itemNames).then(recs => setRecommendations(recs));
  }, [cart.length]);

  const filteredMenu = activeCategory === 'All' 
    ? menu 
    : menu.filter(item => item.category === activeCategory);

  const handlePlaceOrder = () => {
    if (cart.length === 0) return;
    placeOrder(OrderType.DELIVERY, { deliveryAddress });
    // Play success sound
    const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2013/2013-preview.mp3'); // Simple bell sound
    audio.play().catch(e => console.log("Audio play failed", e));
    alert("Order Successful! (ऑर्डर सफल हुआ!)");
    setView('MENU');
  };

  const handleAddToCart = (item: MenuItem) => {
    addToCart(item);
    // Play feedback sound (click/pop)
    const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2578/2578-preview.mp3'); 
    audio.volume = 0.5;
    audio.play().catch(e => console.log("Audio play failed", e));
  }

  const getItemQuantity = (itemId: string) => {
    return cart.find(i => i.id === itemId)?.quantity || 0;
  };

  const playDishDescription = (description: string, id: string) => {
    if (playingAudio === id) {
        window.speechSynthesis.cancel();
        setPlayingAudio(null);
        return;
    }

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(description);
    const voices = window.speechSynthesis.getVoices();
    const indianVoice = voices.find(v => v.lang === 'en-IN');
    if (indianVoice) utterance.voice = indianVoice;
    
    utterance.rate = 1.0;
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

  // Live Order Status Logic
  const latestOrder = activeOrders.length > 0 ? activeOrders[0] : null;
  const getStatusMessage = (status: OrderStatus) => {
    switch(status) {
        case OrderStatus.PENDING: return { text: "Order Sent to Kitchen", color: "bg-yellow-500", icon: <Clock size={16}/> };
        case OrderStatus.PREPARING: return { text: "Chef is Cooking...", color: "bg-blue-500", icon: <Loader2 size={16} className="animate-spin"/> };
        case OrderStatus.READY: return { text: "Food Ready! Delivery soon.", color: "bg-green-600", icon: <CheckCircle size={16}/> };
        default: return { text: "Preparing...", color: "bg-gray-500", icon: <Clock size={16}/> };
    }
  };

  return (
    <div className="pb-24 md:pb-0 bg-gray-50 min-h-screen font-sans flex flex-col transition-all duration-300 relative">
      
      {/* AI Voice Assistant */}
      <VoiceAssistant menu={menu} addToCart={handleAddToCart} onCheckout={() => setView('CART')} />

      {/* Live Order Status Banner - Pinned to Top if active order */}
      {latestOrder && view !== 'CART' && (
         <div className={`${getStatusMessage(latestOrder.status).color} text-white px-4 py-2 flex items-center justify-between text-sm font-bold shadow-md sticky top-[60px] md:top-[68px] z-40 animate-slide-up`}>
            <div className="flex items-center gap-2">
                {getStatusMessage(latestOrder.status).icon}
                <span>{getStatusMessage(latestOrder.status).text}</span>
            </div>
            <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded">#{latestOrder.id}</span>
         </div>
      )}

      {/* Welcome Popup */}
      {showWelcome && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-white rounded-3xl overflow-hidden max-w-md w-full shadow-2xl transform transition-all scale-100 animate-slide-up relative">
            <button onClick={() => setShowWelcome(false)} className="absolute top-3 right-3 bg-black/10 p-1 rounded-full z-10"><X size={20}/></button>
            <div className="h-40 overflow-hidden relative">
                 <img src="https://images.unsplash.com/photo-1596797038530-2c107229654b?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80" className="w-full h-full object-cover" />
                 <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent"></div>
                 <div className="absolute bottom-4 left-4 text-white">
                    <span className="bg-orange-500 text-[10px] px-2 py-0.5 rounded font-bold uppercase tracking-wider">Welcome Gift</span>
                 </div>
            </div>
            <div className="p-6 text-center">
                <h2 className="text-2xl font-extrabold text-gray-900 mb-2">Namaste! 🙏</h2>
                <p className="text-gray-600 text-sm mb-6 leading-relaxed">
                   Authentic Dhaba food ordering is now easy. Tap the Mic button to order by voice!
                </p>
                <button 
                    onClick={() => setShowWelcome(false)}
                    className="w-full bg-gradient-to-r from-orange-600 to-red-600 text-white py-3.5 rounded-xl font-bold shadow-lg shadow-orange-200 hover:shadow-xl transition-all active:scale-95"
                >
                    Order Khana (ऑर्डर करें)
                </button>
            </div>
          </div>
        </div>
      )}

      {/* Universal Header */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md shadow-sm border-b border-gray-100 px-4 md:px-8 py-3 flex justify-between items-center transition-all">
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => setView('HOME')}>
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
            <button onClick={() => setView('HOME')} className={`font-semibold text-sm ${view === 'HOME' ? 'text-orange-600' : 'text-gray-600 hover:text-orange-500'}`}>Home</button>
            <button onClick={() => setView('MENU')} className={`font-semibold text-sm ${view === 'MENU' ? 'text-orange-600' : 'text-gray-600 hover:text-orange-500'}`}>Order Online</button>
            <button onClick={() => setView('BOOKING')} className={`font-semibold text-sm ${view === 'BOOKING' ? 'text-orange-600' : 'text-gray-600 hover:text-orange-500'}`}>Book Table</button>
            <div className="h-6 w-px bg-gray-200 mx-2"></div>
            <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-gray-500">Hi, {userName.split(' ')[0]}</span>
                <button 
                    onClick={onLogout}
                    className="p-2 hover:bg-gray-100 rounded-full text-gray-500 transition-colors"
                    title="Logout"
                >
                    <LogOut size={16} />
                </button>
            </div>
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
                onClick={onLogout}
                className="p-2 bg-gray-50 rounded-full text-gray-700 hover:text-red-600 transition-colors border border-gray-100"
            >
                <LogOut size={18} />
            </button>
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
          {view === 'HOME' && (
              <div className="animate-fade-in pb-10">
                  {/* Hero Section */}
                  <div className="relative w-full h-[35vh] md:h-[60vh] bg-gray-900 flex items-center justify-center overflow-hidden mb-0 md:rounded-b-3xl shadow-xl">
                      <div className="absolute inset-0 opacity-50 bg-[url('https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?ixlib=rb-1.2.1&auto=format&fit=crop&w=1920&q=80')] bg-cover bg-center"></div>
                      <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-transparent to-transparent opacity-90"></div>
                      
                      <div className="relative z-10 text-center px-6 max-w-3xl mx-auto mt-4">
                          <span className="text-orange-400 font-bold tracking-widest uppercase text-[10px] md:text-sm mb-3 block bg-white/10 backdrop-blur-md py-1 px-3 rounded-full inline-block mx-auto border border-white/10">Welcome, {userName}</span>
                          <h2 className="text-3xl md:text-6xl font-extrabold text-white mb-2 leading-tight drop-shadow-lg">
                             Authentic <br/> 
                             <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-yellow-400">Dhaba Flavors</span>
                          </h2>
                          <div className="flex flex-col md:flex-row gap-3 justify-center w-full max-w-xs md:max-w-none mx-auto mt-6">
                              <button onClick={() => setView('MENU')} className="bg-orange-600 hover:bg-orange-700 text-white w-full md:w-auto px-8 py-4 rounded-full font-bold transition-all transform active:scale-95 shadow-lg shadow-orange-900/50 flex items-center justify-center gap-2 text-lg">
                                  ORDER FOOD <ArrowRight size={20} />
                              </button>
                          </div>
                      </div>
                  </div>

                  {/* Infinite Horizontal Marquee */}
                  <div className="relative w-full bg-gray-900 border-t border-gray-800 overflow-hidden py-3 mb-8 md:mb-12">
                     <div className="absolute inset-y-0 left-0 w-12 bg-gradient-to-r from-gray-900 to-transparent z-10"></div>
                     <div className="absolute inset-y-0 right-0 w-12 bg-gradient-to-l from-gray-900 to-transparent z-10"></div>
                     
                     <div className="flex animate-scroll whitespace-nowrap gap-8">
                        {/* Repeat list twice for seamless loop */}
                        {[...MOCK_MENU, ...MOCK_MENU].map((item, idx) => (
                           <div key={`${item.id}-${idx}`} className="flex items-center gap-3 bg-gray-800/50 backdrop-blur rounded-full pr-4 pl-1 py-1 border border-gray-700/50 hover:bg-gray-800 transition-colors cursor-pointer group" onClick={() => setView('MENU')}>
                              <img src={item.imageUrl} className="w-8 h-8 rounded-full object-cover border border-orange-500/50" />
                              <span className="text-gray-300 text-xs font-bold group-hover:text-orange-400 transition-colors">{item.name}</span>
                           </div>
                        ))}
                     </div>
                  </div>

                  {/* Featured Items Preview */}
                  <div className="px-4 md:px-8">
                      <div className="flex justify-between items-end mb-4 md:mb-6">
                          <div>
                              <span className="text-orange-600 font-bold text-xs tracking-wide uppercase">Best Sellers</span>
                              <h3 className="text-xl md:text-3xl font-bold text-gray-900">Top Dishes</h3>
                          </div>
                          <button onClick={() => setView('MENU')} className="text-orange-600 font-bold text-xs md:text-sm flex items-center gap-1 hover:gap-2 transition-all">
                              See All <ChevronRight size={16} />
                          </button>
                      </div>
                      
                      {/* Horizontal Scroll for Mobile */}
                      <div className="flex overflow-x-auto gap-4 pb-4 md:grid md:grid-cols-4 md:pb-0 no-scrollbar snap-x">
                          {menu.slice(0, 4).map(item => (
                              <div key={item.id} className="min-w-[200px] md:min-w-0 snap-center bg-white rounded-xl overflow-hidden shadow-sm border border-gray-100 hover:shadow-md transition-all group cursor-pointer" onClick={() => setView('MENU')}>
                                  <div className="h-32 md:h-48 overflow-hidden relative">
                                      <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                                      <div className="absolute top-2 right-2 bg-white/90 backdrop-blur rounded px-2 py-1 text-[10px] font-bold text-gray-800 shadow-sm">
                                          ₹{item.price}
                                      </div>
                                  </div>
                                  <div className="p-3 md:p-4">
                                      <h4 className="font-bold text-gray-900 text-sm md:text-base mb-1 truncate">{item.name}</h4>
                                      <p className="text-xs text-gray-500 line-clamp-1">{item.description}</p>
                                  </div>
                              </div>
                          ))}
                      </div>
                  </div>
              </div>
          )}

          {view === 'MENU' && (
              <div className="md:px-8 md:py-8">
                {/* Promo Banner */}
                <div className="px-4 py-4 md:px-0">
                    <div className="bg-gradient-to-r from-gray-900 to-gray-800 rounded-2xl p-5 md:p-6 text-white shadow-xl relative overflow-hidden flex items-center justify-between">
                        <div className="relative z-10 max-w-[75%]">
                            <span className="bg-orange-500 text-[9px] md:text-[10px] font-bold px-2 py-0.5 rounded text-white mb-1.5 inline-block">TODAY'S SPECIAL</span>
                            <h2 className="text-lg md:text-2xl font-bold mb-1 leading-tight">Shourya Wada Thali</h2>
                            <p className="text-gray-300 text-xs mb-3">Full meal. Best Value.</p>
                            <button onClick={() => addToCart(menu.find(i => i.category === 'Main Course') || menu[0])} className="bg-white text-gray-900 px-4 py-2 rounded-full font-bold text-xs shadow hover:bg-gray-100 transition-colors">
                                Add to Order
                            </button>
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
                                <p className="text-[10px] font-bold text-purple-700 uppercase tracking-wide">Suggested for you</p>
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

                {/* Sticky Category Filter */}
                <div className="sticky top-[60px] md:top-[72px] z-30 bg-gray-50/95 backdrop-blur-sm py-2 px-4 md:px-0 border-b border-gray-200 overflow-x-auto whitespace-nowrap no-scrollbar mb-4 transition-all">
                    {CATEGORIES.map(cat => (
                        <button
                            key={cat}
                            onClick={() => setActiveCategory(cat)}
                            className={`inline-block mr-2 px-4 py-2 rounded-full text-xs md:text-sm font-bold transition-all shadow-sm ${
                                activeCategory === cat 
                                ? 'bg-orange-600 text-white shadow-orange-200 ring-2 ring-orange-100 border-transparent' 
                                : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-100'
                            }`}
                        >
                            {cat}
                        </button>
                    ))}
                </div>

                {/* Menu List */}
                <div className="px-4 pb-8 md:px-0 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                    {filteredMenu.map(item => {
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
                                        onClick={(e) => { e.stopPropagation(); playDishDescription(item.description, item.id); }}
                                        className={`absolute bottom-1.5 right-1.5 p-1.5 rounded-full backdrop-blur-md transition-all shadow-sm z-20 ${playingAudio === item.id ? 'bg-orange-600 text-white animate-pulse ring-2 ring-orange-200' : 'bg-white/80 text-gray-700 hover:bg-white hover:text-orange-600'}`}
                                        title="Listen"
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
                    })}
                </div>
              </div>
          )}

          {view === 'CART' && (
              <div className="p-4 max-w-lg mx-auto min-h-screen bg-white md:my-8 md:rounded-2xl md:shadow-lg md:border md:border-gray-100 animate-fade-in">
                  <div className="flex items-center gap-4 mb-6 pt-2 sticky top-0 bg-white z-20 py-2">
                    <button onClick={() => setView('MENU')} className="p-2 hover:bg-gray-100 rounded-full transition-colors border border-gray-100"><ArrowRight className="rotate-180" size={24}/></button>
                    <h2 className="text-xl font-bold">Checkout</h2>
                  </div>
                  
                  {cart.length === 0 ? (
                      <div className="text-center py-20 flex flex-col items-center justify-center">
                          <div className="bg-orange-50 p-6 rounded-full mb-4 animate-bounce">
                            <ShoppingBag size={40} className="text-orange-300" />
                          </div>
                          <h3 className="text-lg font-bold text-gray-800 mb-2">Cart Empty</h3>
                          <button onClick={() => setView('MENU')} className="bg-orange-600 text-white px-8 py-3 rounded-xl font-bold shadow-lg shadow-orange-200 hover:bg-orange-700 transition-colors active:scale-95 mt-4">Browse Menu</button>
                      </div>
                  ) : (
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
                                <span>Total To Pay</span>
                                <span className="text-orange-600 text-2xl">₹{cartTotal}</span>
                            </div>
                            
                            <button 
                                onClick={handlePlaceOrder}
                                disabled={!deliveryAddress}
                                className={`w-full py-4 rounded-xl font-bold text-white shadow-xl transition-all active:scale-95 flex items-center justify-center gap-2 mb-4 ${!deliveryAddress ? 'bg-gray-300 shadow-none cursor-not-allowed' : 'bg-gray-900 hover:bg-gray-800 shadow-gray-300'}`}
                            >
                                <span>CONFIRM ORDER</span>
                                <ArrowRight size={20} />
                            </button>
                        </div>
                      </>
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
                      <li className="hover:text-white cursor-pointer" onClick={() => setView('HOME')}>Home</li>
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
                   <div className="flex gap-4">
                       <a href="#" className="p-2 bg-gray-800 rounded-full hover:bg-orange-600 transition-colors"><Instagram size={20} /></a>
                       <a href="#" className="p-2 bg-gray-800 rounded-full hover:bg-blue-600 transition-colors"><Facebook size={20} /></a>
                   </div>
                   <button onClick={onLogout} className="mt-6 flex items-center gap-2 text-xs text-gray-500 hover:text-white transition-colors">
                       <LogOut size={14} /> Logout
                   </button>
              </div>
          </div>
      </footer>

      {/* Modern Bottom Navigation (Mobile Only) */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-lg border-t border-gray-200 flex justify-around py-3 px-2 z-50 md:hidden pb-safe shadow-[0_-5px_10px_rgba(0,0,0,0.02)]">
         <button onClick={() => setView('HOME')} className={`flex flex-col items-center gap-1 w-16 group ${view === 'HOME' ? 'text-orange-600' : 'text-gray-400'}`}>
            <div className={`p-1.5 rounded-2xl transition-all duration-300 ${view === 'HOME' ? 'bg-orange-50 translate-y-[-2px]' : 'bg-transparent'}`}>
                <Home size={24} strokeWidth={view === 'HOME' ? 2.5 : 2} />
            </div>
            <span className="text-[10px] font-bold">Home</span>
         </button>
         <button onClick={() => setView('MENU')} className={`flex flex-col items-center gap-1 w-16 group ${view === 'MENU' ? 'text-orange-600' : 'text-gray-400'}`}>
            <div className={`p-1.5 rounded-2xl transition-all duration-300 ${view === 'MENU' ? 'bg-orange-50 translate-y-[-2px]' : 'bg-transparent'}`}>
                <Utensils size={24} strokeWidth={view === 'MENU' ? 2.5 : 2} />
            </div>
            <span className="text-[10px] font-bold">Menu</span>
         </button>
         <button onClick={() => setView('CART')} className={`flex flex-col items-center gap-1 w-16 group relative ${view === 'CART' ? 'text-orange-600' : 'text-gray-400'}`}>
            <div className={`p-1.5 rounded-2xl transition-all duration-300 ${view === 'CART' ? 'bg-orange-50 translate-y-[-2px]' : 'bg-transparent'}`}>
                <ShoppingBag size={24} strokeWidth={view === 'CART' ? 2.5 : 2} />
            </div>
            <span className="text-[10px] font-bold">Cart</span>
            {cartCount > 0 && view !== 'CART' && (
                <span className="absolute top-1 right-2 w-2.5 h-2.5 bg-red-500 rounded-full border border-white animate-pulse"></span>
            )}
         </button>
         <button onClick={() => setView('BOOKING')} className={`flex flex-col items-center gap-1 w-16 group ${view === 'BOOKING' ? 'text-orange-600' : 'text-gray-400'}`}>
            <div className={`p-1.5 rounded-2xl transition-all duration-300 ${view === 'BOOKING' ? 'bg-orange-50 translate-y-[-2px]' : 'bg-transparent'}`}>
                <Calendar size={24} strokeWidth={view === 'BOOKING' ? 2.5 : 2} />
            </div>
            <span className="text-[10px] font-bold">Book</span>
         </button>
      </nav>
    </div>
  );
};