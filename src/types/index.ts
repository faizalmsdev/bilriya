export interface Product {
  id: string;
  name: string;
  price: number;
  originalPrice: number;
  discount: number;
  description: string;
  images: string[];
  category: string;
  inStock: number;
  rating: number;
  reviews: Review[];
}

export interface Review {
  id: string;
  userId: string;
  userName: string;
  rating: number;
  comment: string;
  date: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface User {
  id: string;
  email: string;
  name?: string;
  phone?: string;
  address?: string;
}