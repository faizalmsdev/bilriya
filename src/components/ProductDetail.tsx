import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Star, Minus, Plus, ShoppingCart } from 'lucide-react';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import type { Product } from '../types';

export default function ProductDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [product, setProduct] = useState<Product | null>(null);
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [reviews, setReviews] = useState([]);
  const [similarProducts, setSimilarProducts] = useState<Product[]>([]);
  const { dispatch } = useCart();
  const { user } = useAuth();

  useEffect(() => {
    fetchProductData();
    fetchProductAndReviews();
  }, [id]);

  const fetchProductData = async () => {
    try {
      // Fetch the product from Supabase
      const { data: productData, error: productError } = await supabase
        .from('products')
        .select('*')
        .eq('id', id)
        .single();

      if (productError) {
        console.error('Error fetching product:', productError);
        return;
      }

      if (productData) {
        setProduct(productData);
        
        // Fetch similar products
        const { data: similarProductsData, error: similarError } = await supabase
          .from('products')
          .select('*')
          .eq('category', productData.category)
          .neq('id', id)
          .limit(4);

        if (!similarError && similarProductsData) {
          setSimilarProducts(similarProductsData);
        }
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const fetchProductAndReviews = async () => {
    try {
      const { data: reviewsData, error: reviewsError } = await supabase
        .from('reviews')
        .select(`
          id,
          product_id,
          user_id,
          rating,
          comment,
          created_at,
          auth_users:user_id (
            email
          )
        `)
        .eq('product_id', id)
        .order('created_at', { ascending: false });

      if (reviewsError) {
        console.error('Error fetching reviews:', reviewsError);
        return;
      }

      setReviews(reviewsData || []);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  if (!product) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">Loading product...</div>
      </div>
    );
  }

  const handleAddToCart = () => {
    dispatch({
      type: 'ADD_ITEM',
      payload: { product, quantity },
    });
  };

  const handleBuyNow = () => {
    handleAddToCart();
    navigate('/checkout');
  };

  const handleSubmitReview = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('reviews')
        .insert([
          {
            product_id: product.id,
            user_id: user.id,
            rating: reviewRating,
            comment: reviewComment,
          }
        ]);

      if (error) throw error;

      fetchProductAndReviews();
      setReviewComment('');
      setReviewRating(5);
    } catch (error) {
      console.error('Error submitting review:', error);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid md:grid-cols-2 gap-8">
        {/* Images */}
        <div className="space-y-4">
          <img
            src={product.images[selectedImage]}
            alt={product.name}
            className="w-full rounded-lg"
          />
          <div className="grid grid-cols-4 gap-4">
            {product.images.map((image, index) => (
              <button
                key={index}
                onClick={() => setSelectedImage(index)}
                className={`border-2 rounded-lg overflow-hidden ${
                  selectedImage === index ? 'border-blue-500' : 'border-gray-200'
                }`}
              >
                <img src={image} alt={`${product.name} ${index + 1}`} />
              </button>
            ))}
          </div>
        </div>

        {/* Product Info */}
        <div className="space-y-6">
          <h1 className="text-3xl font-bold">{product.name}</h1>
          
          <div className="flex items-center space-x-4">
            <div className="flex items-center">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star
                  key={i}
                  className={`w-5 h-5 ${
                    i < Math.floor(product.rating || 0)
                      ? 'text-yellow-400 fill-current'
                      : 'text-gray-300'
                  }`}
                />
              ))}
            </div>
            <span className="text-gray-600">
              ({reviews.length} reviews)
            </span>
          </div>

          <div className="flex items-center space-x-4">
            <span className="text-3xl font-bold">${product.price.toFixed(2)}</span>
            {product.discount > 0 && (
              <>
                <span className="text-xl text-gray-500 line-through">
                  ${product.original_price.toFixed(2)}
                </span>
                <span className="text-red-500 font-semibold">
                  {product.discount}% OFF
                </span>
              </>
            )}
          </div>

          <p className="text-gray-600">{product.description}</p>

          <div className="flex items-center space-x-4">
            <button
              onClick={() => setQuantity(Math.max(1, quantity - 1))}
              className="p-2 rounded-full border"
            >
              <Minus className="w-4 h-4" />
            </button>
            <span className="text-xl font-semibold">{quantity}</span>
            <button
              onClick={() => setQuantity(quantity + 1)}
              className="p-2 rounded-full border"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>

          <div className="flex space-x-4">
            <button
              onClick={handleAddToCart}
              className="flex-1 bg-gray-900 text-white py-3 rounded-lg flex items-center justify-center space-x-2"
            >
              <ShoppingCart className="w-5 h-5" />
              <span>Add to Cart</span>
            </button>
            <button
              onClick={handleBuyNow}
              className="flex-1 bg-blue-600 text-white py-3 rounded-lg"
            >
              Buy Now
            </button>
          </div>
        </div>
      </div>

      {/* Similar Products */}
      <div className="mt-16">
        <h2 className="text-2xl font-bold mb-6">Similar Products</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {similarProducts.map((similarProduct) => (
            <div
              key={similarProduct.id}
              className="bg-white rounded-lg shadow-md overflow-hidden"
              onClick={() => navigate(`/product/${similarProduct.id}`)}
              role="button"
              tabIndex={0}
            >
              <img
                src={similarProduct.images[0]}
                alt={similarProduct.name}
                className="w-full h-48 object-cover"
              />
              <div className="p-4">
                <h3 className="font-semibold">{similarProduct.name}</h3>
                <div className="flex items-center justify-between mt-2">
                  <span className="font-bold">${similarProduct.price.toFixed(2)}</span>
                  {similarProduct.discount > 0 && (
                    <span className="text-red-500 text-sm">
                      {similarProduct.discount}% OFF
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Reviews Section remains the same */}
      <div className="mt-12">
        <h2 className="text-2xl font-bold mb-6">Customer Reviews</h2>
        
        {user && (
          <div className="bg-gray-50 p-6 rounded-lg mb-8">
            <h3 className="text-xl font-semibold mb-4">Write a Review</h3>
            <div className="flex items-center mb-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <button
                  key={i}
                  onClick={() => setReviewRating(i + 1)}
                  className="focus:outline-none"
                >
                  <Star
                    className={`w-6 h-6 ${
                      i < reviewRating
                        ? 'text-yellow-400 fill-current'
                        : 'text-gray-300'
                    }`}
                  />
                </button>
              ))}
            </div>
            <textarea
              value={reviewComment}
              onChange={(e) => setReviewComment(e.target.value)}
              placeholder="Share your thoughts about this product..."
              className="w-full p-3 border rounded-lg mb-4"
              rows={4}
            />
            <button
              onClick={handleSubmitReview}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg"
            >
              Submit Review
            </button>
          </div>
        )}

        <div className="space-y-6">
          {reviews.map((review) => (
            <div key={review.id} className="border-b pb-6">
              <div className="flex items-center mb-2">
                <div className="flex items-center">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      className={`w-4 h-4 ${
                        i < review.rating
                          ? 'text-yellow-400 fill-current'
                          : 'text-gray-300'
                      }`}
                    />
                  ))}
                </div>
                <span className="ml-2 text-gray-600">
                  by {review.auth_users?.email}
                </span>
              </div>
              <p className="text-gray-600">{review.comment}</p>
              <span className="text-sm text-gray-500">
                {new Date(review.created_at).toLocaleDateString()}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}