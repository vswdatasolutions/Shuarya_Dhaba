import React, { useState } from 'react';
import { Role } from '../types';
import { ChefHat, Truck, LayoutGrid, User, ArrowRight, Lock, Phone, KeyRound } from 'lucide-react';

interface LoginScreenProps {
  onLogin: (role: Role, name: string) => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onLogin }) => {
  const [activeTab, setActiveTab] = useState<'CUSTOMER' | 'STAFF'>('CUSTOMER');
  
  // Customer Login State
  const [mobile, setMobile] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [otp, setOtp] = useState('');
  const [showOtp, setShowOtp] = useState(false);

  // Staff Login State
  const [staffRole, setStaffRole] = useState<Role>(Role.ADMIN);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleCustomerLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!showOtp) {
      if (mobile.length !== 10) {
        setError('Please enter a valid 10-digit mobile number');
        return;
      }
      setShowOtp(true);
      setError('');
    } else {
      // Simulate OTP verification
      if (otp === '1234') {
        onLogin(Role.CUSTOMER, customerName || 'Guest User');
      } else {
        setError('Invalid OTP. Try 1234');
      }
    }
  };

  const handleStaffLogin = (e: React.FormEvent) => {
    e.preventDefault();
    // Simple Mock Authentication
    const credentials = {
      [Role.ADMIN]: 'admin123',
      [Role.KITCHEN]: 'chef123',
      [Role.DELIVERY]: 'rider123',
      [Role.CUSTOMER]: '' // Not used
    };

    if (password === credentials[staffRole]) {
      let name = '';
      if (staffRole === Role.ADMIN) name = 'Owner';
      if (staffRole === Role.KITCHEN) name = 'Head Chef';
      if (staffRole === Role.DELIVERY) name = 'Rider';
      onLogin(staffRole, name);
    } else {
      setError('Invalid Password');
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background Image Overlay */}
      <div className="absolute inset-0 opacity-40 bg-[url('https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?ixlib=rb-1.2.1&auto=format&fit=crop&w=1920&q=80')] bg-cover bg-center"></div>
      
      <div className="bg-white relative z-10 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-orange-600 p-8 text-center">
          <h1 className="text-3xl font-extrabold text-white">Shourya Wada</h1>
          <p className="text-orange-100 text-sm font-medium mt-1">Dhaba & Family Restaurant</p>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200">
          <button 
            onClick={() => { setActiveTab('CUSTOMER'); setError(''); }}
            className={`flex-1 py-4 text-sm font-bold uppercase tracking-wider transition-colors ${activeTab === 'CUSTOMER' ? 'text-orange-600 border-b-2 border-orange-600 bg-orange-50' : 'text-gray-400 hover:text-gray-600'}`}
          >
            Customer Login
          </button>
          <button 
            onClick={() => { setActiveTab('STAFF'); setError(''); }}
            className={`flex-1 py-4 text-sm font-bold uppercase tracking-wider transition-colors ${activeTab === 'STAFF' ? 'text-orange-600 border-b-2 border-orange-600 bg-orange-50' : 'text-gray-400 hover:text-gray-600'}`}
          >
            Staff Login
          </button>
        </div>

        <div className="p-8">
          {error && (
            <div className="mb-4 bg-red-50 text-red-600 text-sm p-3 rounded-lg flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-red-600 rounded-full"></span>
              {error}
            </div>
          )}

          {activeTab === 'CUSTOMER' ? (
            <form onSubmit={handleCustomerLogin} className="space-y-5">
              {!showOtp ? (
                <>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Your Name</label>
                    <div className="relative">
                        <User className="absolute left-3 top-3 text-gray-400" size={18} />
                        <input 
                            type="text" 
                            className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-200 focus:border-orange-400 outline-none transition-all"
                            placeholder="Enter your name"
                            value={customerName}
                            onChange={(e) => setCustomerName(e.target.value)}
                            required
                        />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Mobile Number</label>
                    <div className="relative">
                        <Phone className="absolute left-3 top-3 text-gray-400" size={18} />
                        <input 
                            type="tel" 
                            className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-200 focus:border-orange-400 outline-none transition-all"
                            placeholder="98765 43210"
                            value={mobile}
                            onChange={(e) => setMobile(e.target.value.replace(/\D/g, ''))}
                            maxLength={10}
                        />
                    </div>
                  </div>
                  <button type="submit" className="w-full bg-gray-900 text-white py-3.5 rounded-xl font-bold text-sm shadow-lg hover:bg-black transition-transform active:scale-95 flex items-center justify-center gap-2">
                    Send OTP <ArrowRight size={16} />
                  </button>
                </>
              ) : (
                <>
                  <div className="text-center mb-2">
                    <p className="text-gray-500 text-sm">OTP sent to +91 {mobile}</p>
                    <button type="button" onClick={() => setShowOtp(false)} className="text-orange-600 text-xs font-bold hover:underline">Change Number</button>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Enter OTP</label>
                    <div className="relative">
                        <KeyRound className="absolute left-3 top-3 text-gray-400" size={18} />
                        <input 
                            type="text" 
                            className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-200 focus:border-orange-400 outline-none transition-all tracking-widest font-bold text-lg"
                            placeholder="1234"
                            value={otp}
                            onChange={(e) => setOtp(e.target.value)}
                            maxLength={4}
                            autoFocus
                        />
                    </div>
                    <p className="text-[10px] text-gray-400 mt-2 text-right">Use 1234 for demo</p>
                  </div>
                  <button type="submit" className="w-full bg-orange-600 text-white py-3.5 rounded-xl font-bold text-sm shadow-lg shadow-orange-200 hover:bg-orange-700 transition-transform active:scale-95">
                    Login Securely
                  </button>
                </>
              )}
            </form>
          ) : (
            <form onSubmit={handleStaffLogin} className="space-y-5">
              <div className="grid grid-cols-3 gap-3 mb-2">
                <button 
                  type="button"
                  onClick={() => setStaffRole(Role.ADMIN)}
                  className={`p-3 rounded-xl border flex flex-col items-center gap-2 transition-all ${staffRole === Role.ADMIN ? 'bg-orange-50 border-orange-200 text-orange-700 ring-2 ring-orange-100' : 'bg-gray-50 border-gray-100 text-gray-500 hover:bg-gray-100'}`}
                >
                  <LayoutGrid size={20} />
                  <span className="text-[10px] font-bold">Owner</span>
                </button>
                <button 
                  type="button"
                  onClick={() => setStaffRole(Role.KITCHEN)}
                  className={`p-3 rounded-xl border flex flex-col items-center gap-2 transition-all ${staffRole === Role.KITCHEN ? 'bg-blue-50 border-blue-200 text-blue-700 ring-2 ring-blue-100' : 'bg-gray-50 border-gray-100 text-gray-500 hover:bg-gray-100'}`}
                >
                  <ChefHat size={20} />
                  <span className="text-[10px] font-bold">Kitchen</span>
                </button>
                <button 
                  type="button"
                  onClick={() => setStaffRole(Role.DELIVERY)}
                  className={`p-3 rounded-xl border flex flex-col items-center gap-2 transition-all ${staffRole === Role.DELIVERY ? 'bg-green-50 border-green-200 text-green-700 ring-2 ring-green-100' : 'bg-gray-50 border-gray-100 text-gray-500 hover:bg-gray-100'}`}
                >
                  <Truck size={20} />
                  <span className="text-[10px] font-bold">Delivery</span>
                </button>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Password</label>
                <div className="relative">
                    <Lock className="absolute left-3 top-3 text-gray-400" size={18} />
                    <input 
                        type="password" 
                        className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-200 focus:border-orange-400 outline-none transition-all"
                        placeholder="Enter password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                    />
                </div>
                <div className="mt-2 text-[10px] text-gray-400 flex justify-between">
                    <span>Admin: admin123</span>
                    <span>Chef: chef123</span>
                    <span>Rider: rider123</span>
                </div>
              </div>

              <button type="submit" className="w-full bg-gray-900 text-white py-3.5 rounded-xl font-bold text-sm shadow-lg hover:bg-black transition-transform active:scale-95">
                Access Dashboard
              </button>
            </form>
          )}
        </div>
        
        <div className="bg-gray-50 p-4 text-center border-t border-gray-100">
           <p className="text-[10px] text-gray-400">© 2025 Shourya Wada Digital System</p>
        </div>
      </div>
    </div>
  );
};