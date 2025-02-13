/*
  # Add order status notification trigger

  This migration adds a trigger to automatically create notifications when order status changes.

  1. Changes
    - Creates a function to handle order status changes
    - Creates a trigger to call the function when orders are updated
    
  2. Security
    - Function executes with security definer to ensure it can create notifications
*/

-- Create function to handle order status notifications
CREATE OR REPLACE FUNCTION handle_order_status_change()
RETURNS TRIGGER AS $$
BEGIN
  -- Only create notification if status has changed
  IF OLD.status <> NEW.status THEN
    INSERT INTO notifications (user_id, message)
    VALUES (
      NEW.user_id,
      CASE NEW.status
        WHEN 'processing' THEN 'Your order is now being processed'
        WHEN 'shipped' THEN 'Great news! Your order has been shipped'
        WHEN 'delivered' THEN 'Your order has been delivered successfully'
        WHEN 'cancelled' THEN 'Your order has been cancelled'
        ELSE 'Your order status has been updated to ' || NEW.status
      END
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for order status changes
DROP TRIGGER IF EXISTS on_order_status_change ON orders;
CREATE TRIGGER on_order_status_change
  AFTER UPDATE OF status ON orders
  FOR EACH ROW
  EXECUTE FUNCTION handle_order_status_change();