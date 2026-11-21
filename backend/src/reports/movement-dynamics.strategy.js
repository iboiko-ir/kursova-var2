import { BadRequestException } from '@nestjs/common';
import { parseUtcDay } from '../common/dates';
import { ReportStrategy } from './report-strategy';

const MAX_DAYS = 366;
const DAY_MS = 24 * 60 * 60 * 1000;

// This strategy counts moved goods for each day.
export class MovementDynamicsStrategy extends ReportStrategy {
  constructor(dataSource) {
    super();
    this.dataSource = dataSource;
  }

  async generate({ dateFrom, dateTo, productId }) {
    const from = parseUtcDay(dateFrom, 'dateFrom');
    const to = parseUtcDay(dateTo, 'dateTo');
    if (from > to) {
      throw new BadRequestException('dateFrom must not be later than dateTo.');
    }
    if ((to - from) / DAY_MS + 1 > MAX_DAYS) {
      throw new BadRequestException(`The date range must not be longer than ${MAX_DAYS} days.`);
    }

    const rows = await this.dataSource.query(
      `SELECT to_char(days.day, 'YYYY-MM-DD') AS date,
              COALESCE(sum(l.quantity) FILTER (WHERE m.type = 'receipt'), 0)::int AS received,
              COALESCE(sum(l.quantity) FILTER (WHERE m.type = 'shipment'), 0)::int AS shipped,
              COALESCE(sum(l.quantity) FILTER (WHERE m.type = 'write_off'), 0)::int AS "writtenOff"
       FROM generate_series($1::timestamp, $2::timestamp, interval '1 day') AS days(day)
       LEFT JOIN stock_movements m
         ON m.posted_at >= days.day AT TIME ZONE 'UTC'
        AND m.posted_at < (days.day + interval '1 day') AT TIME ZONE 'UTC'
       LEFT JOIN stock_movement_lines l
         ON l.movement_id = m.id AND ($3::int IS NULL OR l.product_id = $3::int)
       GROUP BY days.day
       ORDER BY days.day`,
      [dateFrom, dateTo, productId ?? null],
    );
    const totals = rows.reduce(
      (sum, row) => ({
        received: sum.received + row.received,
        shipped: sum.shipped + row.shipped,
        writtenOff: sum.writtenOff + row.writtenOff,
      }),
      { received: 0, shipped: 0, writtenOff: 0 },
    );
    return { dateFrom, dateTo, productId: productId ?? null, items: rows, totals };
  }
}
