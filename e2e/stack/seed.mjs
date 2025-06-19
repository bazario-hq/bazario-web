// Deterministic fixture data for the Playwright suite. Inserts straight into the
// API's schema (after migrations), the same way bazario-api's test factories do.
import bcrypt from 'bcryptjs';
import pg from 'pg';
import { readFileSync } from 'node:fs';

const fx = JSON.parse(readFileSync(new URL('../support/fixtures.json', import.meta.url), 'utf8'));
const DAY = 86_400_000;

export async function seed(databaseUrl) {
  const client = new pg.Client({ connectionString: databaseUrl });
  await client.connect();
  const hash = bcrypt.hashSync(fx.password, 4);
  const now = Date.now();
  const q = (text, values) => client.query(text, values);
  const one = async (text, values) => (await q(text, values)).rows[0];

  try {
    await q('BEGIN');

    const user = (u, role = 'buyer', daysAgo = 200) =>
      one(
        `INSERT INTO users (email, name, password_hash, role, created_at) VALUES ($1, $2, $3, $4, $5) RETURNING id`,
        [u.email, u.name, hash, role, new Date(now - daysAgo * DAY)],
      );
    const admin = await user(fx.admin, 'admin', 400);
    const buyer = await user(fx.buyer, 'buyer', 300);
    const sellerUser = await user(fx.seller, 'seller', 380);
    const seller2User = await user(fx.seller2, 'seller', 360);
    const applicant = await user(fx.applicant, 'buyer', 3);
    const reviewers = [];
    for (let i = 1; i <= 3; i++) {
      reviewers.push(await user({ email: `reviewer${i}@bazario.example`, name: `Reviewer ${i}` }, 'buyer', 100));
    }

    const store = (u, s, status, daysAgo) =>
      one(
        `INSERT INTO sellers (user_id, store_name, slug, description, status, approved_at, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id`,
        [u.id, s.store, s.slug, `${s.store} on Bazario`, status, status === 'active' ? new Date(now - daysAgo * DAY) : null, new Date(now - daysAgo * DAY)],
      );
    const looms = await store(sellerUser, fx.seller, 'active', 370);
    const kitchen = await store(seller2User, fx.seller2, 'active', 350);
    await store(applicant, fx.applicant, 'pending', 2);

    const cat = (name, slug, parentId, position) =>
      one(`INSERT INTO categories (name, slug, parent_id, position, description) VALUES ($1, $2, $3, $4, $5) RETURNING id`, [
        name,
        slug,
        parentId,
        position,
        `${name} from independent makers`,
      ]);
    const home = await cat('Home & Living', fx.categories.home, null, 1);
    const textiles = await cat('Textiles', fx.categories.textiles, home.id, 1);
    const cushions = await cat('Cushions', fx.categories.cushions, textiles.id, 1);
    const kitchenCat = await cat('Kitchen', fx.categories.kitchen, null, 2);
    const cookware = await cat('Cookware', fx.categories.cookware, kitchenCat.id, 1);
    await cat('Toys', fx.categories.toys, null, 3);

    let slugSeq = 0;
    const product = (sellerId, categoryId, p) =>
      one(
        `INSERT INTO products (seller_id, category_id, name, slug, description, price_cents, compare_at_cents, stock, status, specs, published_at, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'active', $9, $10, $10) RETURNING id, price_cents, name, seller_id`,
        [
          sellerId,
          categoryId,
          p.name,
          `${p.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${++slugSeq}`,
          p.description ?? `${p.name}, made by hand in Sri Lanka. Each piece is a little different.`,
          p.priceCents,
          p.compareAtCents ?? null,
          p.stock ?? 25,
          JSON.stringify(p.specs ?? { origin: 'Sri Lanka' }),
          new Date(now - (p.ageDays ?? 30) * DAY),
        ],
      );

    const throwProduct = await product(looms.id, textiles.id, { ...fx.products.throw, ageDays: 60, specs: { material: 'cotton', size: '130 x 170 cm' } });
    for (let i = 1; i < fx.loomsProductCount; i++) {
      await product(looms.id, i % 2 ? cushions.id : textiles.id, {
        name: `${i % 2 ? 'Handloom Cushion Cover' : 'Woven Table Runner'} No. ${String(i).padStart(2, '0')}`,
        priceCents: 1500 + i * 25,
        ageDays: 5 + i,
      });
    }
    const pot = await product(kitchen.id, cookware.id, { ...fx.products.pot, ageDays: 40 });
    await product(kitchen.id, cookware.id, { ...fx.products.kettle, ageDays: 50 });
    const spoons = await product(kitchen.id, cookware.id, { ...fx.products.spoons, ageDays: 20 });
    for (let i = 1; i <= 8; i++) {
      await product(kitchen.id, i % 2 ? cookware.id : kitchenCat.id, { name: `Coconut Shell Bowl No. ${i}`, priceCents: 900 + i * 50, ageDays: 10 + i });
    }

    const address = { fullName: fx.buyer.name, line1: '12 Galle Road', city: 'Colombo', postalCode: '00300', country: 'LK', phone: null };
    const order = async (buyerId, lines, daysAgo, itemStatus) => {
      const subtotal = lines.reduce((s, l) => s + l.p.price_cents * l.qty, 0);
      const shipping = subtotal >= 5000 ? 0 : 599;
      const at = new Date(now - daysAgo * DAY);
      const status = itemStatus === 'delivered' ? 'delivered' : itemStatus === 'shipped' ? 'shipped' : 'paid';
      const o = await one(
        `INSERT INTO orders (buyer_id, status, subtotal_cents, shipping_cents, total_cents, shipping_address, payment_ref, payment_last4, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, '4242', $8, $8) RETURNING id`,
        [buyerId, status, subtotal, shipping, subtotal + shipping, JSON.stringify(address), `ch_seed_${daysAgo}_${buyerId}`, at],
      );
      for (const l of lines) {
        await q(
          `INSERT INTO order_items (order_id, product_id, seller_id, product_name, unit_price_cents, quantity, status, tracking_number, shipped_at, delivered_at, created_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
          [
            o.id,
            l.p.id,
            l.p.seller_id,
            l.p.name,
            l.p.price_cents,
            l.qty,
            itemStatus,
            itemStatus === 'pending' ? null : `LK${o.id}0001`,
            itemStatus === 'pending' ? null : new Date(at.getTime() + DAY),
            itemStatus === 'delivered' ? new Date(at.getTime() + 3 * DAY) : null,
            at,
          ],
        );
        await q(`UPDATE products SET sales_count = sales_count + $2 WHERE id = $1`, [l.p.id, l.qty]);
      }
      return o;
    };
    await order(buyer.id, [{ p: throwProduct, qty: 1 }, { p: spoons, qty: 2 }], 20, 'delivered');
    await order(buyer.id, [{ p: pot, qty: 1 }], 6, 'shipped');
    for (const [i, r] of reviewers.entries()) {
      await order(r.id, [{ p: throwProduct, qty: 1 }], 25 - i * 5, 'delivered');
    }
    // A fresh order for the seller to fulfil.
    await order(reviewers[0].id, [{ p: throwProduct, qty: 2 }], 1, 'pending');

    const ratings = [5, 4, 5];
    for (const [i, r] of reviewers.entries()) {
      await q(
        `INSERT INTO reviews (product_id, user_id, rating, title, body, status, created_at) VALUES ($1, $2, $3, $4, $5, 'published', $6)`,
        [throwProduct.id, r.id, ratings[i], ['Beautiful colours', 'Good quality', 'Lovely gift'][i], 'Arrived quickly and looks just like the photos.', new Date(now - (15 - i) * DAY)],
      );
    }
    await q(
      `INSERT INTO reviews (product_id, user_id, rating, title, body, status, created_at) VALUES ($1, $2, 2, 'Smaller than expected', 'Check the size before you order.', 'pending', $3)`,
      [pot.id, reviewers[1].id, new Date(now - DAY)],
    );
    await q(
      `UPDATE products p SET rating_avg = s.avg, rating_count = s.cnt
         FROM (SELECT product_id, round(avg(rating)::numeric, 2) AS avg, count(*) AS cnt FROM reviews WHERE status = 'published' GROUP BY product_id) s
        WHERE p.id = s.product_id`,
    );

    const notify = (userId, title, body, link, read, daysAgo) =>
      q(`INSERT INTO notifications (user_id, type, title, body, link, read_at, created_at) VALUES ($1, 'order', $2, $3, $4, $5, $6)`, [
        userId,
        title,
        body,
        link,
        read ? new Date(now - daysAgo * DAY) : null,
        new Date(now - daysAgo * DAY),
      ]);
    await notify(buyer.id, 'Your order was delivered', 'Indigo Batik Throw and 1 more item were delivered.', null, true, 17);
    await notify(buyer.id, 'Your order has shipped', 'Clay Curry Pot is on its way.', null, false, 5);
    await notify(buyer.id, 'Welcome to Bazario', 'Thanks for joining. Happy shopping!', null, false, 300);

    await q('COMMIT');
    return { adminId: admin.id, buyerId: buyer.id, sellerId: looms.id, imageProducts: [throwProduct.id, pot.id, spoons.id] };
  } catch (err) {
    await q('ROLLBACK');
    throw err;
  } finally {
    await client.end();
  }
}
