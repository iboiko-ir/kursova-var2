import { parseUtcDay } from '../common/dates';

// Quantity and value of each product are sums of ledger deltas up to the end of a UTC day.
export async function ledgerBalances(dataSource, day) {
  const start = parseUtcDay(day, 'date');
  return dataSource.query(
    `SELECT l.product_id AS "productId",
            (array_agg(l.sku ORDER BY m.posted_at DESC, l.id DESC))[1] AS sku,
            (array_agg(l.product_name ORDER BY m.posted_at DESC, l.id DESC))[1] AS name,
            sum(l.quantity_delta)::int AS quantity,
            sum(l.value_delta) AS value
     FROM stock_movement_lines l
     JOIN stock_movements m ON m.id = l.movement_id
     WHERE m.posted_at < $1::timestamptz + interval '24 hours'
     GROUP BY l.product_id
     ORDER BY 2, 1`,
    [start.toISOString()],
  );
}
