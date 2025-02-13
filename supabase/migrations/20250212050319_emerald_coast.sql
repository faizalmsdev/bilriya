/*
  # Fix Reviews and Profiles Relationship

  1. Changes
    - Add foreign key relationship between reviews and profiles tables
    - Update reviews query to use auth.users instead of profiles for email

  2. Security
    - Maintain existing RLS policies
*/

-- Update reviews table to use auth.users directly
ALTER TABLE reviews DROP CONSTRAINT IF EXISTS reviews_user_id_fkey;
ALTER TABLE reviews ADD CONSTRAINT reviews_user_id_fkey 
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Update reviews query function
CREATE OR REPLACE FUNCTION get_review_with_user_email(review_id uuid)
RETURNS TABLE (
  id uuid,
  product_id uuid,
  user_id uuid,
  rating integer,
  comment text,
  created_at timestamptz,
  user_email text
) AS $$
BEGIN
  RETURN QUERY
  SELECT r.*, u.email as user_email
  FROM reviews r
  JOIN auth.users u ON r.user_id = u.id
  WHERE r.id = review_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;