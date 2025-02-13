import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import LoadingSpinner from './LoadingSpinner';
import { Package, ShoppingBag, X, Plus, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';

type OrderStatus = 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';

interface Order {
  id: string;
  user_id: string;
  status: OrderStatus;
  total: number;
  payment_method: string;
  shipping_address: string;
  phone: string;
  created_at: string;
}

interface Product {
  id: string;
  name: string;
  price: number;
  description: string;
  category: string;
  images: string[];
  in_stock: number;
  original_price: number;
  discount: number;
}

export default function AdminDashboard() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'products' | 'orders'>('products');
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [editedProduct, setEditedProduct] = useState<Partial<Product>>({});
  const [orderItems, setOrderItems] = useState<any[]>([]);
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);
  const [showAddProductModal, setShowAddProductModal] = useState(false);
  const [newProduct, setNewProduct] = useState<Partial<Product>>({
    name: '',
    price: 0,
    original_price: 0,
    discount: 0,
    description: '',
    category: '',
    in_stock: 0,
    images: []
  });

  useEffect(() => {
    fetchProducts();
    fetchOrders();
  }, []);

  async function fetchProducts() {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProducts(data || []);
    } catch (error) {
      toast.error('Error fetching products');
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  }

  async function fetchOrders() {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setOrders(data || []);
    } catch (error) {
      toast.error('Error fetching orders');
      console.error('Error fetching orders:', error);
    }
  }

  async function handleAddProduct() {
    try {
      const { error } = await supabase
        .from('products')
        .insert({
          name: newProduct.name,
          price: newProduct.price,
          original_price: newProduct.original_price,
          discount: newProduct.discount,
          description: newProduct.description,
          category: newProduct.category,
          in_stock: newProduct.in_stock,
          images: newProduct.images?.filter(url => url.trim()) || []
        });

      if (error) throw error;

      toast.success('Product added successfully');
      setShowAddProductModal(false);
      setNewProduct({
        name: '',
        price: 0,
        original_price: 0,
        discount: 0,
        description: '',
        category: '',
        in_stock: 0,
        images: []
      });
      fetchProducts();
    } catch (error) {
      console.error('Error adding product:', error);
      toast.error('Error adding product');
    }
  }

  async function handleUpdateProduct() {
    if (!selectedProduct) return;

    try {
      const { error } = await supabase
        .from('products')
        .update({
          name: editedProduct.name,
          price: editedProduct.price,
          original_price: editedProduct.original_price,
          discount: editedProduct.discount,
          description: editedProduct.description,
          category: editedProduct.category,
          in_stock: editedProduct.in_stock,
          images: editedProduct.images
        })
        .eq('id', selectedProduct.id);

      if (error) throw error;

      toast.success('Product updated successfully');
      setShowEditModal(false);
      fetchProducts();
    } catch (error) {
      console.error('Error updating product:', error);
      toast.error('Error updating product');
    }
  }

  async function handleDeleteProduct(productId: string) {
    if (!confirm('Are you sure you want to delete this product?')) return;

    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', productId);

      if (error) throw error;

      toast.success('Product deleted successfully');
      fetchProducts();
    } catch (error) {
      console.error('Error deleting product:', error);
      toast.error('Error deleting product');
    }
  }

  async function handleDeleteAllProducts() {
    if (!confirm('Are you sure you want to delete ALL products? This action cannot be undone!')) return;

    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .neq('id', '0'); // Delete all products

      if (error) throw error;

      toast.success('All products deleted successfully');
      fetchProducts();
    } catch (error) {
      console.error('Error deleting all products:', error);
      toast.error('Error deleting all products');
    }
  }

  async function handleUpdateOrderStatus(orderId: string, newStatus: OrderStatus) {
    try {
      setUpdatingStatus(orderId);

      // Get the order details to get the user_id
      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .select('user_id, status')
        .eq('id', orderId)
        .single();

      if (orderError) throw orderError;

      // Only proceed if the status is actually changing
      if (orderData.status === newStatus) {
        setUpdatingStatus(null);
        return;
      }

      // Update order status
      const { error: updateError } = await supabase
        .from('orders')
        .update({ status: newStatus })
        .eq('id', orderId);

      if (updateError) throw updateError;

      // Create notification for the user
      const notificationMessage = getNotificationMessage(newStatus);
      const { error: notificationError } = await supabase
        .from('notifications')
        .insert({
          user_id: orderData.user_id,
          message: notificationMessage,
          read: false
        });

      if (notificationError) throw notificationError;

      // Update local state
      setOrders(prevOrders => 
        prevOrders.map(order => 
          order.id === orderId ? { ...order, status: newStatus } : order
        )
      );
      
      // Update selected order if modal is open
      if (selectedOrder && selectedOrder.id === orderId) {
        setSelectedOrder(prev => prev ? { ...prev, status: newStatus } : null);
      }
      
      // Show appropriate toast message
      toast.success(`Order ${newStatus}`);
    } catch (error) {
      console.error('Error updating order status:', error);
      toast.error('Error updating order status');
      // Revert the select value to the previous status
      fetchOrders();
    } finally {
      setUpdatingStatus(null);
    }
  }

  function getNotificationMessage(status: OrderStatus): string {
    switch (status) {
      case 'processing':
        return 'Your order is now being processed';
      case 'shipped':
        return 'Great news! Your order has been shipped';
      case 'delivered':
        return 'Your order has been delivered successfully';
      case 'cancelled':
        return 'Your order has been cancelled';
      default:
        return 'Your order status has been updated';
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

  function handleEditProduct(product: Product) {
    setSelectedProduct(product);
    setEditedProduct({ ...product });
    setShowEditModal(true);
  }

  async function handleViewOrderDetails(order: Order) {
    setSelectedOrder(order);
    const items = await fetchOrderItems(order.id);
    setOrderItems(items);
    setShowOrderModal(true);
  }

  if (!user) {
    return <div>Access denied</div>;
  }

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex space-x-4 mb-8">
        <button
          onClick={() => setActiveTab('products')}
          className={`flex items-center px-4 py-2 rounded-lg ${
            activeTab === 'products'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-700'
          }`}
        >
          <Package className="w-5 h-5 mr-2" />
          Products
        </button>
        <button
          onClick={() => setActiveTab('orders')}
          className={`flex items-center px-4 py-2 rounded-lg ${
            activeTab === 'orders'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-700'
          }`}
        >
          <ShoppingBag className="w-5 h-5 mr-2" />
          Orders
        </button>
      </div>

      {activeTab === 'products' ? (
        <div>
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold">Product Management</h2>
            <div className="space-x-4">
              <button
                onClick={() => setShowAddProductModal(true)}
                className="bg-green-600 text-white px-4 py-2 rounded-lg flex items-center"
              >
                <Plus className="w-5 h-5 mr-2" />
                Add Product
              </button>
              <button
                onClick={handleDeleteAllProducts}
                className="bg-red-600 text-white px-4 py-2 rounded-lg flex items-center"
              >
                <Trash2 className="w-5 h-5 mr-2" />
                Delete All Products
              </button>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Product
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Price
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Category
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Stock
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {products.map((product) => (
                  <tr key={product.id}>
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <img
                          src={product.images[0]}
                          alt={product.name}
                          className="h-10 w-10 rounded-full object-cover"
                        />
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {product.name}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      ₹{product.price.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {product.category}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {product.in_stock}
                    </td>
                    <td className="px-6 py-4 text-sm font-medium space-x-4">
                      <button 
                        onClick={() => handleEditProduct(product)}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        Edit
                      </button>
                      <button 
                        onClick={() => handleDeleteProduct(product.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div>
          <h2 className="text-2xl font-bold mb-6">Order Management</h2>
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Order ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Customer
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {orders.map((order) => (
                  <tr key={order.id}>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {order.id}
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">
                        {order.shipping_address}
                      </div>
                      <div className="text-sm text-gray-500">
                        {order.phone}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      ₹{order.total.toFixed(2)}
                    </td>
                    <td className="px-6 py-4">
                      <select
                        value={order.status}
                        onChange={(e) => handleUpdateOrderStatus(order.id, e.target.value as OrderStatus)}
                        className={`text-sm rounded-full px-3 py-1 ${
                          updatingStatus === order.id ? 'opacity-50 cursor-not-allowed' : ''
                        } ${
                          order.status === 'delivered' ? 'bg-green-100 text-green-800' :
                          order.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                          order.status === 'shipped' ? 'bg-blue-100 text-blue-800' :
                          order.status === 'processing' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-gray-100 text-gray-800'
                        }`}
                        disabled={updatingStatus === order.id}
                      >
                        <option value="pending">Pending</option>
                        <option value="processing">Processing</option>
                        <option value="shipped">Shipped</option>
                        <option value="delivered">Delivered</option>
                        <option value="cancelled">Cancelled</option>
                      </select>
                    </td>
                    <td className="px-6 py-4 text-sm font-medium">
                      <button
                        onClick={() => handleViewOrderDetails(order)}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        View Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add Product Modal */}
      {showAddProductModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold">Add New Product</h3>
              <button onClick={() => setShowAddProductModal(false)}>
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Product Name
                </label>
                <input
                  type="text"
                  value={newProduct.name || ''}
                  onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                  className="w-full p-2 border rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Price (₹)
                </label>
                <input
                  type="number"
                  value={newProduct.price || ''}
                  onChange={(e) => setNewProduct({ ...newProduct, price: parseFloat(e.target.value) })}
                  className="w-full p-2 border rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Original Price (₹)
                </label>
                <input
                  type="number"
                  value={newProduct.original_price || ''}
                  onChange={(e) => setNewProduct({ ...newProduct, original_price: parseFloat(e.target.value) })}
                  className="w-full p-2 border rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Discount (%)
                </label>
                <input
                  type="number"
                  value={newProduct.discount || ''}
                  onChange={(e) => setNewProduct({ ...newProduct, discount: parseInt(e.target.value) })}
                  className="w-full p-2 border rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Category
                </label>
                <input
                  type="text"
                  value={newProduct.category || ''}
                  onChange={(e) => setNewProduct({ ...newProduct, category: e.target.value })}
                  className="w-full p-2 border rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Stock
                </label>
                <input
                  type="number"
                  value={newProduct.in_stock || ''}
                  onChange={(e) => setNewProduct({ ...newProduct, in_stock: parseInt(e.target.value) })}
                  className="w-full p-2 border rounded-lg"
                />
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={newProduct.description || ''}
                  onChange={(e) => setNewProduct({ ...newProduct, description: e.target.value })}
                  className="w-full p-2 border rounded-lg"
                  rows={4}
                />
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Image URLs (one per line)
                </label>
                <textarea
                  value={newProduct.images?.join('\n') || ''}
                  onChange={(e) => setNewProduct({ ...newProduct, images: e.target.value.split('\n').filter(url => url.trim()) })}
                  className="w-full p-2 border rounded-lg"
                  rows={3}
                  placeholder="https://example.com/image1.jpg&#10;https://example.com/image2.jpg"
                />
              </div>
            </div>
            <div className="mt-6 flex justify-end space-x-4">
              <button
                onClick={() => setShowAddProductModal(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
              <button
                onClick={handleAddProduct}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Add Product
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Product Modal */}
      {showEditModal && selectedProduct && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold">Edit Product</h3>
              <button onClick={() => setShowEditModal(false)}>
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Product Name
                </label>
                <input
                  type="text"
                  value={editedProduct.name || ''}
                  onChange={(e) => setEditedProduct({ ...editedProduct, name: e.target.value })}
                  className="w-full p-2 border rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Price (₹)
                </label>
                <input
                  type="number"
                  value={editedProduct.price || ''}
                  onChange={(e) => setEditedProduct({ ...editedProduct, price: parseFloat(e.target.value) })}
                  className="w-full p-2 border rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Original Price (₹)
                </label>
                <input
                  type="number"
                  value={editedProduct.original_price || ''}
                  onChange={(e) => setEditedProduct({ ...editedProduct, original_price: parseFloat(e.target.value) })}
                  className="w-full p-2 border rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Discount (%)
                </label>
                <input
                  type="number"
                  value={editedProduct.discount || ''}
                  onChange={(e) => setEditedProduct({ ...editedProduct, discount: parseInt(e.target.value) })}
                  className="w-full p-2 border rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Category
                </label>
                <input
                  type="text"
                  value={editedProduct.category || ''}
                  onChange={(e) => setEditedProduct({ ...editedProduct, category: e.target.value })}
                  className="w-full p-2 border rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Stock
                </label>
                <input
                  type="number"
                  value={editedProduct.in_stock || ''}
                  onChange={(e) => setEditedProduct({ ...editedProduct, in_stock: parseInt(e.target.value) })}
                  className="w-full p-2 border rounded-lg"
                />
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={editedProduct.description || ''}
                  onChange={(e) => setEditedProduct({ ...editedProduct, description: e.target.value })}
                  className="w-full p-2 border rounded-lg"
                  rows={4}
                />
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Image URLs (one per line)
                </label>
                <textarea
                  value={editedProduct.images?.join('\n') || ''}
                  onChange={(e) => setEditedProduct({ ...editedProduct, images: e.target.value.split('\n').filter(url => url.trim()) })}
                  className="w-full p-2 border rounded-lg"
                  rows={3}
                />
              </div>
            </div>
            <div className="mt-6 flex justify-end space-x-4">
              <button
                onClick={() => setShowEditModal(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdateProduct}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

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
                <p>Total: ₹{selectedOrder.total.toFixed(2)}</p>
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
                      <p>₹{(item.price * item.quantity).toFixed(2)}</p>
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