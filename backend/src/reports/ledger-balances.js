import { parseUtcDay } from '../common/dates';

// Quantity and value of each product are sums of ledger deltas up to the end of a UTC day.
export async function ledgerBalances(dataSource, day) {
  const startOfDay = parseUtcDay(day, 'date');
  return dataSource.query(
    `SELECT line.product_id AS "productId",
            (array_agg(line.sku ORDER BY movement.posted_at DESC, line.id DESC))[1] AS sku,
            (array_agg(line.product_name ORDER BY movement.posted_at DESC, line.id DESC))[1] AS name,
            sum(line.quantity_delta)::int AS quantity,
            sum(line.value_delta) AS value
     FROM stock_movement_lines line
     JOIN stock_movements movement ON movement.id = line.movement_id
     WHERE movement.posted_at < $1::timestamptz + interval '24 hours'
     GROUP BY line.product_id
     ORDER BY sku, "productId"`,
    [startOfDay.toISOString()],
  );
}
