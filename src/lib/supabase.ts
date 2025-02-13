import { createClient } from '@supabase/supabase-js';
import { Database } from '../types/supabase';
import { products as dummyProducts } from '../data/products';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);

// Function to seed products
export async function seedProducts() {
  try {
    const { data: existingProducts } = await supabase
      .from('products')
      .select('id')
      .limit(1);

    // Only seed if no products exist
    if (!existingProducts?.length) {
      const productsToInsert = dummyProducts.map(product => ({
        name: product.name,
        price: product.price,
        original_price: product.originalPrice,
        discount: product.discount,
        description: product.description,
        images: product.images,
        category: product.category,
        in_stock: product.inStock
      }));

      const { error } = await supabase
        .from('products')
        .insert(productsToInsert);

      if (error) {
        console.error('Error seeding products:', error);
      } else {
        console.log('Products seeded successfully');
      }
    }
  } catch (error) {
    console.error('Error in seedProducts:', error);
  }
}