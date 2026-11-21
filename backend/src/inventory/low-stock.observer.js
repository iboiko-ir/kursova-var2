import { Injectable } from '@nestjs/common';
import { StockObserver } from './stock-observer';

// This observer checks low stock.
@Injectable()
export class LowStockObserver extends StockObserver {
  async onStockChanged({ manager }, productId) {
    const [product] = await manager.query('SELECT quantity, min_stock, archived FROM products WHERE id = $1', [productId]);
    if (!product) {
      return;
    }
    const [active] = await manager.query(
      "SELECT id, quantity, min_stock FROM notifications WHERE product_id = $1 AND status = 'active' FOR UPDATE",
      [productId],
    );
    // Archived products never keep an active notification.
    const isLow = !product.archived && product.quantity <= product.min_stock;

    if (isLow && !active) {
      await manager.query(
        "INSERT INTO notifications (product_id, status, quantity, min_stock) VALUES ($1, 'active', $2, $3)",
        [productId, product.quantity, product.min_stock],
      );
    } else if (isLow && (active.quantity !== product.quantity || active.min_stock !== product.min_stock)) {
      await manager.query('UPDATE notifications SET quantity = $2, min_stock = $3, updated_at = now() WHERE id = $1', [
        active.id,
        product.quantity,
        product.min_stock,
      ]);
    } else if (!isLow && active) {
      await manager.query(
        "UPDATE notifications SET status = 'resolved', resolved_at = now(), updated_at = now() WHERE id = $1",
        [active.id],
      );
    }
  }
}
