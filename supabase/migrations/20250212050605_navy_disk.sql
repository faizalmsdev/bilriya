-- Enable access to auth.users for review queries
GRANT SELECT ON auth.users TO authenticated;
GRANT SELECT ON auth.users TO anon;

-- Update reviews query policy to allow joining with auth.users
CREATE POLICY "Allow authenticated users to view user emails for reviews"
  ON auth.users
  FOR SELECT
  TO authenticated
  USING (true);

-- Update reviews table to use auth.users directly
ALTER TABLE reviews DROP CONSTRAINT IF EXISTS reviews_user_id_fkey;
ALTER TABLE reviews ADD CONSTRAINT reviews_user_id_fkey 
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;