import moment from 'moment';
import _ from 'lodash';
import { parseCsvObjects } from '../../lib/csv';

export interface SalesReport {
  rows: number;
  totalCents: number;
  units: number;
  orders: number;
  byDay: { date: string; revenueCents: number }[];
  byProduct: { productId: string; name: string; units: number; revenueCents: number }[];
  byCountry: { country: string; revenueCents: number; orders: number }[];
}

const toCents = (v: string) => Math.round(Number(v) * 100);

/** Builds the report preview from the sales CSV export. Cancelled lines and the TOTAL row are excluded. */
export function buildSalesReport(csv: string): SalesReport {
  const lines = parseCsvObjects(csv).filter((r) => r.order_id && r.order_id !== 'TOTAL' && r.status !== 'cancelled');
  const withDay = lines.map((r) => ({
    orderId: r.order_id,
    productId: r.product_id,
    productName: r.product_name,
    quantity: Number(r.quantity),
    country: r.ship_country,
    day: moment(r.order_date).format('YYYY-MM-DD'),
    cents: toCents(r.line_total),
  }));

  const byDay = _.sortBy(
    _.map(_.groupBy(withDay, 'day'), (items, date) => ({ date, revenueCents: _.sumBy(items, 'cents') })),
    'date',
  );
  const byProduct = _.orderBy(
    _.map(_.groupBy(withDay, 'productId'), (items, productId) => ({
      productId,
      name: items[items.length - 1].productName,
      units: _.sumBy(items, 'quantity'),
      revenueCents: _.sumBy(items, 'cents'),
    })),
    ['revenueCents'],
    ['desc'],
  );
  const byCountry = _.orderBy(
    _.map(_.groupBy(withDay, 'country'), (items, country) => ({
      country,
      revenueCents: _.sumBy(items, 'cents'),
      orders: _.uniqBy(items, 'orderId').length,
    })),
    ['revenueCents'],
    ['desc'],
  );

  return {
    rows: lines.length,
    totalCents: _.sumBy(withDay, 'cents'),
    units: _.sumBy(withDay, 'quantity'),
    orders: _.uniqBy(withDay, 'orderId').length,
    byDay,
    byProduct,
    byCountry,
  };
}
