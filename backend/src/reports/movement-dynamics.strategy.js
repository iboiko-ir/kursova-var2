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
    const firstDay = parseUtcDay(dateFrom, 'dateFrom');
    const lastDay = parseUtcDay(dateTo, 'dateTo');
    if (firstDay > lastDay) {
      throw new BadRequestException('dateFrom must not be later than dateTo.');
    }
    if ((lastDay - firstDay) / DAY_MS + 1 > MAX_DAYS) {
      throw new BadRequestException(`The date range must not be longer than ${MAX_DAYS} days.`);
    }

    const dailyRows = await this.dataSource.query(
      `SELECT to_char(calendar.day, 'YYYY-MM-DD') AS date,
              COALESCE(sum(line.quantity) FILTER (WHERE movement.type = 'receipt'), 0)::int AS received,
              COALESCE(sum(line.quantity) FILTER (WHERE movement.type = 'shipment'), 0)::int AS shipped,
              COALESCE(sum(line.quantity) FILTER (WHERE movement.type = 'write_off'), 0)::int AS "writtenOff"
       FROM generate_series($1::timestamp, $2::timestamp, interval '1 day') AS calendar(day)
       LEFT JOIN stock_movements movement
         ON movement.posted_at >= calendar.day AT TIME ZONE 'UTC'
        AND movement.posted_at < (calendar.day + interval '1 day') AT TIME ZONE 'UTC'
       LEFT JOIN stock_movement_lines line
         ON line.movement_id = movement.id AND ($3::int IS NULL OR line.product_id = $3::int)
       GROUP BY calendar.day
       ORDER BY calendar.day`,
      [dateFrom, dateTo, productId ?? null],
    );
    const totals = dailyRows.reduce(
      (runningTotals, dailyRow) => ({
        received: runningTotals.received + dailyRow.received,
        shipped: runningTotals.shipped + dailyRow.shipped,
        writtenOff: runningTotals.writtenOff + dailyRow.writtenOff,
      }),
      { received: 0, shipped: 0, writtenOff: 0 },
    );
    return { dateFrom, dateTo, productId: productId ?? null, items: dailyRows, totals };
  }
}
