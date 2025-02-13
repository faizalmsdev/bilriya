import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import LoadingSpinner from './LoadingSpinner';
import { Package, X } from 'lucide-react';
import toast from 'react-hot-toast';

interface Order {
  id: string;
  user_id: string;
  status: string;
  total: number;
  payment_method: string;
  shipping_address: string;
  phone: string;
  created_at: string;
}

export default function UserOrders() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [orderItems, setOrderItems] = useState<any[]>([]);
  const [showOrderModal, setShowOrderModal] = useState(false);

  useEffect(() => {
    if (user) {
      fetchUserOrders();

      // Subscribe to order status changes
      const subscription = supabase
        .channel('orders')
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'orders',
            filter: `user_id=eq.${user.id}`
          },
          (payload) => {
            setOrders(prevOrders =>
              prevOrders.map(order =>
                order.id === payload.new.id
                  ? { ...order, ...payload.new }
                  : order
              )
            );
          }
        )
        .subscribe();

      return () => {
        subscription.unsubscribe();
      };
    }
  }, [user]);

  async function fetchUserOrders() {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setOrders(data || []);
    } catch (error) {
      toast.error('Error fetching orders');
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  }

  async function fetchOrderItems(orderId: string) {
    try {
      const { data, error } = await supabase
        .from('order_items')
        .select(`
          *,
          products (*)
        `)
        .eq('order_id', orderId);

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching order items:', error);
      return [];
    }
  }

  async function handleViewOrderDetails(order: Order) {
    setSelectedOrder(order);
    const items = await fetchOrderItems(order.id);
    setOrderItems(items);
    setShowOrderModal(true);
  }

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!user) {
    return <div>Please sign in to view your orders.</div>;
  }

  if (orders.length === 0) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center">
        <Package className="w-16 h-16 text-gray-400 mb-4" />
        <h2 className="text-2xl font-bold text-gray-700 mb-2">No orders yet</h2>
        <p className="text-gray-500">You haven't placed any orders yet.</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-8">My Orders</h1>
      <div className="space-y-4">
        {orders.map((order) => (
          <div key={order.id} className="bg-white p-6 rounded-lg shadow-md">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm text-gray-500">Order ID: {order.id}</p>
                <p className="text-sm text-gray-500">
                  Placed on: {new Date(order.created_at).toLocaleDateString()}
                </p>
                <p className="mt-2 font-semibold">Total: ${order.total.toFixed(2)}</p>
              </div>
              <div className="text-right">
                <span className={`inline-block px-3 py-1 rounded-full text-sm ${
                  order.status === 'delivered' ? 'bg-green-100 text-green-800' :
                  order.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                  order.status === 'shipped' ? 'bg-blue-100 text-blue-800' :
                  order.status === 'processing' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                </span>
                <button
                  onClick={() => handleViewOrderDetails(order)}
                  className="block mt-2 text-blue-600 hover:text-blue-800"
                >
                  View Details
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Order Details Modal */}
      {showOrderModal && selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold">Order Details</h3>
              <button onClick={() => setShowOrderModal(false)}>
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <h4 className="font-semibold mb-2">Order Information</h4>
                <p>Order ID: {selectedOrder.id}</p>
                <p>Status: {selectedOrder.status}</p>
                <p>Total: ${selectedOrder.total.toFixed(2)}</p>
                <p>Payment Method: {selectedOrder.payment_method}</p>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Shipping Information</h4>
                <p>Address: {selectedOrder.shipping_address}</p>
                <p>Phone: {selectedOrder.phone}</p>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Order Items</h4>
                <div className="space-y-2">
                  {orderItems.map((item) => (
                    <div key={item.id} className="flex justify-between items-center">
                      <div>
                        <p className="font-medium">{item.products.name}</p>
                        <p className="text-sm text-gray-600">Quantity: {item.quantity}</p>
                      </div>
                      <p>${(item.price * item.quantity).toFixed(2)}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setShowOrderModal(false)}
                className="px-4 py-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}