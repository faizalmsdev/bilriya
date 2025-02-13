import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './contexts/AuthContext';
import { CartProvider } from './contexts/CartContext';
import Header from './components/Header';
import Footer from './components/Footer';
import ProductDetail from './components/ProductDetail';
import Checkout from './components/Checkout';
import Auth from './components/Auth';
import AdminDashboard from './components/AdminDashboard';
import OrderSuccess from './components/OrderSuccess';
import { useAuth } from './contexts/AuthContext';
import ProductCard from './components/ProductCard';
import { supabase } from './lib/supabase';
import LoadingSpinner from './components/LoadingSpinner';
import Cart from './components/Cart';
import UserOrders from './components/UserOrders';

function ProtectedRoute({ children, adminOnly = false }: { children: React.ReactNode; adminOnly?: boolean }) {
  const { user, loading } = useAuth();

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!user) {
    return <Auth />;
  }

  if (adminOnly && user.email !== 'admin@gmail.com') {
    return <div className="container mx-auto px-4 py-8">Access denied. Admin only.</div>;
  }

  return <>{children}</>;
}

function App() {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProducts();
  }, []);

  async function fetchProducts() {
    try {
      const { data: productsData, error: productsError } = await supabase
        .from('products')
        .select('*');

      if (productsError) throw productsError;

      const { data: reviewsData, error: reviewsError } = await supabase
        .from('reviews')
        .select('product_id, rating');

      if (reviewsError) throw reviewsError;

      const productsWithRatings = productsData?.map(product => {
        const productReviews = reviewsData.filter(review => review.product_id === product.id);
        const reviewCount = productReviews.length;
        const averageRating = reviewCount > 0
          ? productReviews.reduce((sum, review) => sum + review.rating, 0) / reviewCount
          : 0;

        return {
          ...product,
          rating: averageRating,
          reviewCount: reviewCount
        };
      });

      setProducts(productsWithRatings || []);
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthProvider>
      <CartProvider>
        <Router>
          <div className="min-h-screen flex flex-col">
            <Header />
            <main className="flex-grow">
              <Routes>
                <Route
                  path="/"
                  element={
                    <div className="container mx-auto px-4 py-8">
                      <h1 className="text-2xl md:text-3xl font-bold mb-6 md:mb-8">
                        Featured Products
                      </h1>
                      {loading ? (
                        <LoadingSpinner />
                      ) : (
                        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-6">
                          {products.map((product) => (
                            <div className="w-full" key={product.id}>
                              <ProductCard product={product} />
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  }
                />
                <Route path="/product/:id" element={<ProductDetail />} />
                <Route path="/cart" element={<Cart />} />
                <Route
                  path="/checkout"
                  element={
                    <ProtectedRoute>
                      <Checkout />
                    </ProtectedRoute>
                  }
                />
                <Route path="/auth" element={<Auth />} />
                <Route
                  path="/admin"
                  element={
                    <ProtectedRoute adminOnly>
                      <AdminDashboard />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/orders"
                  element={
                    <ProtectedRoute>
                      <UserOrders />
                    </ProtectedRoute>
                  }
                />
                <Route path="/order-success" element={<OrderSuccess />} />
              </Routes>
            </main>
            <Footer />
            <Toaster position="top-right" />
          </div>
        </Router>
      </CartProvider>
    </AuthProvider>
  );
}

export default App;