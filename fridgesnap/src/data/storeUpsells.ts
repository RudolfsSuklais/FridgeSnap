import type { StoreUpsell } from '../types'

/**
 * Search URL patterns by store.
 *
 * Verified manually via WebFetch on 2026-05-08:
 *   - Rimi:   `https://www.rimi.lv/e-veikals/en/search?query=<term>` returns a real product
 *             search page. Use this pattern.
 *   - Maxima: no public product-catalog search surface that we could verify. Their online
 *             grocery delivery is run separately as Barbora and is auth-gated. Falling back
 *             to the Maxima homepage. Test manually before launch.
 *   - Lidl:   lidl.lv is a brochure site (weekly offers + store locator), no public catalog
 *             search. Falling back to the Lidl homepage. Test manually before launch.
 */
const rimiSearch = (term: string): string =>
  `https://www.rimi.lv/e-veikals/en/search?query=${encodeURIComponent(term)}`

const MAXIMA_HOME = 'https://www.maxima.lv'
const LIDL_HOME = 'https://www.lidl.lv'

const img = (id: string): string =>
  `https://images.unsplash.com/${id}?w=600&q=80&auto=format&fit=crop`

export const genericUpsells: StoreUpsell[] = [
  {
    id: 'gen-parmigiano',
    name: 'Parmigiano Reggiano 24m',
    description: 'Aged Italian DOP parmesan, hand-grated.',
    reason: 'Adds umami depth and a salty, nutty finish to pasta and risotto.',
    price: 8.49,
    currency: 'EUR',
    store: 'rimi',
    imageUrl: img('photo-1626957341926-98752fc2bbab'),
    searchUrl: rimiSearch('parmesan'),
    type: 'generic',
  },
  {
    id: 'gen-balsamic',
    name: 'Aged Balsamic Vinegar',
    description: '12-year aged balsamic from Modena.',
    reason: 'Sweet-acid finish that lifts tomatoes, salads, and roast veg.',
    price: 11.9,
    currency: 'EUR',
    store: 'rimi',
    imageUrl: img('photo-1542990253-a781e04c0082'),
    searchUrl: rimiSearch('balsamic'),
    type: 'generic',
  },
  {
    id: 'gen-burrata',
    name: 'Burrata di Andria',
    description: 'Fresh Italian cream-filled mozzarella, 125 g.',
    reason: "Tear it open over hot pasta or tomatoes — it's the upgrade.",
    price: 4.99,
    currency: 'EUR',
    store: 'rimi',
    imageUrl: img('photo-1631379578550-7038263db1f7'),
    searchUrl: rimiSearch('burrata'),
    type: 'generic',
  },
  {
    id: 'gen-evoo',
    name: 'Premium Extra Virgin Olive Oil',
    description: 'Single-estate Tuscan EVOO, cold-pressed.',
    reason: 'A finishing oil — drizzle, never cook with it.',
    price: 14.5,
    currency: 'EUR',
    store: 'rimi',
    imageUrl: img('photo-1474979266404-7eaacbcd87c5'),
    searchUrl: rimiSearch('olive oil'),
    type: 'generic',
  },
  {
    id: 'gen-truffle-oil',
    name: 'White Truffle Oil',
    description: 'Italian white truffle-infused olive oil, 100 ml.',
    reason: 'A few drops turn pasta, eggs, or mushrooms into restaurant food.',
    price: 12.9,
    currency: 'EUR',
    store: 'maxima',
    imageUrl: img('photo-1605207616227-7e1773bc4a6f'),
    searchUrl: MAXIMA_HOME,
    type: 'generic',
  },
  {
    id: 'gen-fresh-herbs',
    name: 'Fresh Thyme & Rosemary',
    description: 'Live potted herbs, harvest as you cook.',
    reason: 'Fresh-cut herbs are an order of magnitude better than dried.',
    price: 2.79,
    currency: 'EUR',
    store: 'maxima',
    imageUrl: img('photo-1607890048076-a1f3e0f96c34'),
    searchUrl: MAXIMA_HOME,
    type: 'generic',
  },
  {
    id: 'gen-himalayan-salt',
    name: 'Pink Himalayan Salt',
    description: 'Coarse pink salt, refillable mill.',
    reason: 'Mineral-rich finishing salt with a clean, bright pop.',
    price: 3.49,
    currency: 'EUR',
    store: 'lidl',
    imageUrl: img('photo-1518110925495-b37653faff14'),
    searchUrl: LIDL_HOME,
    type: 'generic',
  },
  {
    id: 'gen-smoked-paprika',
    name: 'Smoked Paprika',
    description: 'Spanish Pimentón de la Vera, 70 g.',
    reason: 'Smoky depth for eggs, chicken, soups — a one-jar transformation.',
    price: 2.19,
    currency: 'EUR',
    store: 'lidl',
    imageUrl: img('photo-1599909533730-e76b86c14cae'),
    searchUrl: LIDL_HOME,
    type: 'generic',
  },
  {
    id: 'gen-fresh-basil',
    name: 'Fresh Basil',
    description: 'Live potted Genovese basil.',
    reason: 'Tear, never chop — for caprese, pesto, and tomato anything.',
    price: 1.89,
    currency: 'EUR',
    store: 'lidl',
    imageUrl: img('photo-1618375569909-3c8616cf7733'),
    searchUrl: LIDL_HOME,
    type: 'generic',
  },
]

/** Lookup helper used by recipes to grab a generic upsell by id. Throws if missing — fail loud at module load. */
export function generic(id: string): StoreUpsell {
  const found = genericUpsells.find((u) => u.id === id)
  if (!found) {
    throw new Error(`Unknown generic upsell id: ${id}`)
  }
  return found
}

/** URL helpers exported so specific upsells in mockData can reuse the same patterns. */
export const upsellUrls = {
  rimiSearch,
  maximaHome: MAXIMA_HOME,
  lidlHome: LIDL_HOME,
}
