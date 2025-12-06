import React from 'react';
import { Order, OrderStatus } from '../types';
import { Clock, CheckCircle, XCircle } from 'lucide-react';

interface KitchenViewProps {
  orders: Order[];
  onUpdateStatus: (orderId: string, status: OrderStatus) => void;
}

export const KitchenView: React.FC<KitchenViewProps> = ({ orders, onUpdateStatus }) => {
  // Filter only active orders
  const activeOrders = orders.filter(
    o => o.status !== OrderStatus.DELIVERED && o.status !== OrderStatus.CANCELLED
  ).sort((a, b) => a.timestamp - b.timestamp);

  const getStatusColor = (status: OrderStatus) => {
    switch(status) {
        case OrderStatus.PENDING: return 'bg-yellow-50 border-yellow-200';
        case OrderStatus.PREPARING: return 'bg-blue-50 border-blue-200';
        case OrderStatus.READY: return 'bg-green-50 border-green-200';
        default: return 'bg-white';
    }
  }

  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      <h1 className="text-3xl font-bold text-gray-800 mb-6 flex items-center gap-3">
        <div className="w-4 h-8 bg-orange-600 rounded-full"></div>
        Kitchen Display System (KDS)
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {activeOrders.length === 0 && (
            <div className="col-span-full text-center py-20 text-gray-500">
                <h2 className="text-2xl font-semibold">All caught up!</h2>
                <p>No active orders in queue.</p>
            </div>
        )}
        
        {activeOrders.map(order => (
          <div key={order.id} className={`rounded-xl border-l-4 shadow-sm p-5 ${getStatusColor(order.status)} ${order.status === OrderStatus.PENDING ? 'border-l-yellow-500' : order.status === OrderStatus.PREPARING ? 'border-l-blue-500' : 'border-l-green-500'} bg-white`}>
            <div className="flex justify-between items-start mb-4">
              <div>
                <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Order #{order.id}</span>
                <h3 className="text-lg font-bold text-gray-900 mt-1">{order.type}</h3>
                {order.tableNumber && <p className="text-sm font-semibold text-orange-600">Table: {order.tableNumber}</p>}
              </div>
              <div className="text-right">
                <div className="flex items-center gap-1 text-gray-500 text-sm">
                  <Clock size={14} />
                  {Math.floor((Date.now() - order.timestamp) / 60000)} min ago
                </div>
              </div>
            </div>

            <div className="border-t border-b border-gray-100 py-4 my-2 space-y-2">
              {order.items.map((item, idx) => (
                <div key={idx} className="flex justify-between items-center">
                  <span className="font-semibold text-gray-800">
                    {item.quantity}x {item.name}
                  </span>
                  {item.quantity > 1 && <span className="text-xs bg-gray-200 px-2 py-1 rounded text-gray-700">Batch</span>}
                </div>
              ))}
            </div>

            {order.specialInstructions && (
                <div className="bg-red-50 text-red-700 text-sm p-2 rounded mb-4">
                    <strong>Note:</strong> {order.specialInstructions}
                </div>
            )}

            <div className="flex gap-2 mt-4">
              {order.status === OrderStatus.PENDING && (
                <button 
                  onClick={() => onUpdateStatus(order.id, OrderStatus.PREPARING)}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg font-bold transition-colors"
                >
                  Start Cooking
                </button>
              )}
              {order.status === OrderStatus.PREPARING && (
                <button 
                  onClick={() => onUpdateStatus(order.id, OrderStatus.READY)}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 rounded-lg font-bold transition-colors"
                >
                  Mark Ready
                </button>
              )}
              {order.status === OrderStatus.READY && (
                 <div className="flex-1 text-center bg-green-100 text-green-800 py-2 rounded-lg font-bold">
                    Order Ready
                 </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};