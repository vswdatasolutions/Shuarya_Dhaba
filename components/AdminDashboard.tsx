import React, { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts';
import { Order, MenuItem, OrderStatus, Table } from '../types';
import { Settings, TrendingUp, DollarSign, Users, ChefHat, Edit2, Wand2 } from 'lucide-react';
import { generateMenuDescription } from '../services/geminiService';

interface AdminDashboardProps {
  orders: Order[];
  menu: MenuItem[];
  tables: Table[];
  onUpdateMenu: (item: MenuItem) => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ orders, menu, tables, onUpdateMenu }) => {
  const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'MENU'>('OVERVIEW');
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [isGeneratingAi, setIsGeneratingAi] = useState(false);

  // Mock Analytics Data
  const salesData = [
    { name: 'Mon', sales: 4000 },
    { name: 'Tue', sales: 3000 },
    { name: 'Wed', sales: 2000 },
    { name: 'Thu', sales: 2780 },
    { name: 'Fri', sales: 1890 },
    { name: 'Sat', sales: 6390 },
    { name: 'Sun', sales: 7490 },
  ];

  const totalRevenue = orders.reduce((acc, order) => acc + order.totalAmount, 0);
  const activeOrders = orders.filter(o => o.status !== OrderStatus.DELIVERED && o.status !== OrderStatus.CANCELLED).length;

  const handleAiDescription = async (item: MenuItem) => {
    setIsGeneratingAi(true);
    // Passing generic ingredients for demo purposes
    const newDesc = await generateMenuDescription(item.name, "traditional spices, fresh herbs, farm ingredients");
    setEditingItem({ ...item, description: newDesc });
    setIsGeneratingAi(false);
  };

  const handleSaveItem = () => {
    if (editingItem) {
        onUpdateMenu(editingItem);
        setEditingItem(null);
    }
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <header className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Owner Dashboard</h1>
          <p className="text-gray-500">Smart Dhaba Management System</p>
        </div>
        <div className="flex gap-2">
           <button 
             onClick={() => setActiveTab('OVERVIEW')}
             className={`px-4 py-2 rounded-lg font-medium ${activeTab === 'OVERVIEW' ? 'bg-orange-600 text-white' : 'bg-white text-gray-600'}`}
           >
             Overview
           </button>
           <button 
             onClick={() => setActiveTab('MENU')}
             className={`px-4 py-2 rounded-lg font-medium ${activeTab === 'MENU' ? 'bg-orange-600 text-white' : 'bg-white text-gray-600'}`}
           >
             Menu Manager
           </button>
        </div>
      </header>

      {activeTab === 'OVERVIEW' && (
        <div className="space-y-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-green-100 text-green-600 rounded-full">
                  <DollarSign size={24} />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Total Revenue</p>
                  <p className="text-2xl font-bold">₹{totalRevenue.toLocaleString()}</p>
                </div>
              </div>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-blue-100 text-blue-600 rounded-full">
                  <ChefHat size={24} />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Active Orders</p>
                  <p className="text-2xl font-bold">{activeOrders}</p>
                </div>
              </div>
            </div>
             <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-orange-100 text-orange-600 rounded-full">
                  <TrendingUp size={24} />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Daily Sales</p>
                  <p className="text-2xl font-bold">₹12,450</p>
                </div>
              </div>
            </div>
             <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-purple-100 text-purple-600 rounded-full">
                  <Users size={24} />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Total Customers</p>
                  <p className="text-2xl font-bold">143</p>
                </div>
              </div>
            </div>
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <h3 className="text-lg font-semibold mb-4">Weekly Revenue</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={salesData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="sales" fill="#ea580c" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <h3 className="text-lg font-semibold mb-4">Order Volume Trends</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={salesData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="sales" stroke="#2563eb" strokeWidth={2} dot={{ r: 4 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'MENU' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
             <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                <h3 className="text-xl font-bold">Menu Management</h3>
                <span className="text-sm text-gray-500">AI Powered Description Available</span>
             </div>
             <div className="overflow-x-auto">
                <table className="w-full text-left">
                    <thead className="bg-gray-50 text-gray-600 font-medium">
                        <tr>
                            <th className="p-4">Item Name</th>
                            <th className="p-4">Price</th>
                            <th className="p-4">Category</th>
                            <th className="p-4 w-1/3">Description</th>
                            <th className="p-4 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {menu.map(item => (
                            <tr key={item.id} className="hover:bg-gray-50">
                                <td className="p-4 font-medium">{item.name}</td>
                                <td className="p-4">₹{item.price}</td>
                                <td className="p-4">
                                    <span className="px-2 py-1 bg-gray-100 rounded text-xs text-gray-600">{item.category}</span>
                                </td>
                                <td className="p-4 text-sm text-gray-500">
                                    {editingItem?.id === item.id ? (
                                        <textarea 
                                            className="w-full border rounded p-2"
                                            value={editingItem.description}
                                            onChange={(e) => setEditingItem({...editingItem, description: e.target.value})}
                                        />
                                    ) : (
                                        item.description
                                    )}
                                </td>
                                <td className="p-4 text-right">
                                    {editingItem?.id === item.id ? (
                                        <div className="flex justify-end gap-2">
                                            <button 
                                                onClick={() => handleAiDescription(editingItem)}
                                                className="p-2 text-purple-600 hover:bg-purple-50 rounded"
                                                title="AI Improve"
                                                disabled={isGeneratingAi}
                                            >
                                                <Wand2 size={18} className={isGeneratingAi ? "animate-spin" : ""} />
                                            </button>
                                            <button 
                                                onClick={handleSaveItem}
                                                className="px-3 py-1 bg-green-600 text-white rounded text-sm"
                                            >
                                                Save
                                            </button>
                                            <button 
                                                onClick={() => setEditingItem(null)}
                                                className="px-3 py-1 bg-gray-200 text-gray-700 rounded text-sm"
                                            >
                                                Cancel
                                            </button>
                                        </div>
                                    ) : (
                                        <button 
                                            onClick={() => setEditingItem(item)}
                                            className="p-2 text-gray-400 hover:text-orange-600"
                                        >
                                            <Edit2 size={18} />
                                        </button>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
             </div>
        </div>
      )}
    </div>
  );
};