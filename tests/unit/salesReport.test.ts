import { describe, expect, it } from 'vitest';
import { buildSalesReport } from '../../src/pages/seller/salesReport';

const CSV = [
  'order_id,order_date,product_id,product_name,quantity,unit_price,line_total,status,buyer_name,ship_city,ship_country',
  '10,2026-09-01T10:00:00.000Z,1,Indigo Batik Throw,1,42.00,42.00,delivered,Ben,Colombo,LK',
  '10,2026-09-01T10:00:00.000Z,2,"Pot, clay",2,18.50,37.00,shipped,Ben,Colombo,LK',
  '11,2026-09-02T08:00:00.000Z,1,Indigo Batik Throw,2,42.00,84.00,pending,Ana,Singapore,SG',
  '12,2026-09-02T09:00:00.000Z,1,Indigo Batik Throw,1,42.00,42.00,cancelled,Raj,Chennai,IN',
  'TOTAL,,,,,,163.00,,,,',
  '',
].join('\n');

describe('buildSalesReport', () => {
  const report = buildSalesReport(CSV);

  it('excludes cancelled lines and the TOTAL row', () => {
    expect(report.rows).toBe(3);
    expect(report.totalCents).toBe(16300);
    expect(report.orders).toBe(2);
    expect(report.units).toBe(5);
  });

  it('groups by product, highest revenue first', () => {
    expect(report.byProduct).toEqual([
      { productId: '1', name: 'Indigo Batik Throw', units: 3, revenueCents: 12600 },
      { productId: '2', name: 'Pot, clay', units: 2, revenueCents: 3700 },
    ]);
  });

  it('groups by country', () => {
    expect(report.byCountry.map((c) => [c.country, c.orders, c.revenueCents])).toEqual([
      ['SG', 1, 8400],
      ['LK', 1, 7900],
    ]);
  });

  it('builds a day series in date order', () => {
    expect(report.byDay.map((d) => d.revenueCents)).toEqual([7900, 8400]);
  });
});
