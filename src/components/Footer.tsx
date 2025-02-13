import React from 'react';
import { ChevronDown } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-gray-100 mt-16">
      <div className="container mx-auto px-4 py-8">
        <div className="space-y-4">
          <details className="bg-white p-4 rounded-lg shadow">
            <summary className="flex items-center justify-between cursor-pointer">
              <span className="font-semibold">Contact Us</span>
              <ChevronDown className="w-5 h-5" />
            </summary>
            <div className="mt-4 text-gray-600">
              <p>Email: support@shophub.com</p>
              <p>Phone: 1-800-SHOP-HUB</p>
              <p>Hours: Monday - Friday, 9AM - 6PM EST</p>
            </div>
          </details>

          <details className="bg-white p-4 rounded-lg shadow">
            <summary className="flex items-center justify-between cursor-pointer">
              <span className="font-semibold">Exchange & Returns</span>
              <ChevronDown className="w-5 h-5" />
            </summary>
            <div className="mt-4 text-gray-600">
              <p>30-day return policy for unused items</p>
              <p>Free returns on all orders</p>
              <p>Exchange available for different sizes/colors</p>
            </div>
          </details>

          <details className="bg-white p-4 rounded-lg shadow">
            <summary className="flex items-center justify-between cursor-pointer">
              <span className="font-semibold">How to Cancel</span>
              <ChevronDown className="w-5 h-5" />
            </summary>
            <div className="mt-4 text-gray-600">
              <p>Log into your account</p>
              <p>Go to Order History</p>
              <p>Select the order you want to cancel</p>
              <p>Click "Cancel Order" (only available for orders not yet shipped)</p>
            </div>
          </details>
        </div>

        <div className="mt-8 text-center text-gray-600">
          <p>&copy; 2024 ShopHub. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}