import React from 'react';
import { Link } from 'react-router-dom';
import { Star } from 'lucide-react';
import { Product } from '../types';

interface ProductCardProps {
  product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
  return (
    <Link to={`/product/${product.id}`} className="group">
      <div className="relative bg-white rounded-lg shadow-md overflow-hidden h-full">
        {product.discount > 0 && (
          <div className="absolute top-2 left-2 bg-red-500 text-white px-2 py-1 rounded-md text-xs md:text-sm">
            SALE
          </div>
        )}
        <img
          src={product.images[0]}
          alt={product.name}
          className="w-full h-40 md:h-48 lg:h-64 object-cover group-hover:scale-105 transition-transform duration-300"
        />
        <div className="p-2 md:p-4">
          <h3 className="text-sm md:text-lg font-semibold truncate">{product.name}</h3>
          <div className="flex items-center mt-1 md:mt-2">
            <div className="flex items-center">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star
                  key={i}
                  className={`w-3 h-3 md:w-4 md:h-4 ${
                    i < Math.floor(product.rating || 0)
                      ? 'text-yellow-400 fill-current'
                      : 'text-gray-300'
                  }`}
                />
              ))}
            </div>
            <span className="ml-1 md:ml-2 text-xs md:text-sm text-gray-600">
              ({product.reviewCount || 0})
            </span>
          </div>
          <div className="mt-1 md:mt-2 flex items-center">
            <span className="text-base md:text-xl font-bold text-gray-900">
              ${product.price.toFixed(2)}
            </span>
            {product.discount > 0 && (
              <span className="ml-2 text-xs md:text-sm text-gray-500 line-through">
                ${product.original_price.toFixed(2)}
              </span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}