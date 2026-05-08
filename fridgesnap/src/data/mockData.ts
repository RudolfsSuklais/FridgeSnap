import type { Recipe, ScannedItem, StoreUpsell } from '../types'
import { generic, upsellUrls } from './storeUpsells'
import {
  getMatchedIngredients,
  getMissingIngredients,
} from '../utils/matching'

const img = (id: string): string =>
  `https://images.unsplash.com/${id}?w=900&q=80&auto=format&fit=crop`

const upsellImg = (id: string): string =>
  `https://images.unsplash.com/${id}?w=600&q=80&auto=format&fit=crop`

// ---------------------------------------------------------------------------
// Scanned fridge — what the user "has". Designed so the 7 perfect-match
// recipes below are 100% cookable, and the 3 'almost' recipes fall short by
// exactly the items that show up as their upsells.
// ---------------------------------------------------------------------------
export const scannedItems: ScannedItem[] = [
  // Produce
  { name: 'Cherry tomatoes', category: 'produce', confidence: 0.95 },
  { name: 'Tomatoes', category: 'produce', confidence: 0.94 },
  { name: 'Cucumber', category: 'produce', confidence: 0.95 },
  { name: 'Avocado', category: 'produce', confidence: 0.91 },
  { name: 'Garlic', category: 'produce', confidence: 0.96 },
  { name: 'Ginger', category: 'produce', confidence: 0.88 },
  { name: 'Broccoli', category: 'produce', confidence: 0.93 },
  { name: 'Lemon', category: 'produce', confidence: 0.97 },
  { name: 'Lime', category: 'produce', confidence: 0.92 },
  { name: 'Bell pepper', category: 'produce', confidence: 0.94 },
  { name: 'Spinach', category: 'produce', confidence: 0.9 },
  { name: 'Basil leaves', category: 'produce', confidence: 0.86 },
  { name: 'Cilantro', category: 'produce', confidence: 0.83 },
  { name: 'Red onion', category: 'produce', confidence: 0.94 },
  { name: 'Yellow onion', category: 'produce', confidence: 0.95 },
  { name: 'Carrot', category: 'produce', confidence: 0.93 },
  { name: 'Mushrooms', category: 'produce', confidence: 0.91 },
  { name: 'Scallion', category: 'produce', confidence: 0.85 },

  // Dairy
  { name: 'Milk', category: 'dairy', confidence: 0.96 },
  { name: 'Butter', category: 'dairy', confidence: 0.95 },
  { name: 'Greek yogurt', category: 'dairy', confidence: 0.9 },
  { name: 'Cheddar cheese', category: 'dairy', confidence: 0.92 },
  { name: 'Mozzarella', category: 'dairy', confidence: 0.91 },
  { name: 'Heavy cream', category: 'dairy', confidence: 0.88 },

  // Protein
  { name: 'Eggs', category: 'protein', confidence: 0.98 },
  { name: 'Chicken breast', category: 'protein', confidence: 0.94 },
  { name: 'Bacon', category: 'protein', confidence: 0.93 },

  // Pantry
  { name: 'Pasta', category: 'pantry', confidence: 0.96 },
  { name: 'Rice', category: 'pantry', confidence: 0.96 },
  { name: 'Olive oil', category: 'pantry', confidence: 0.99 },
  { name: 'Flour', category: 'pantry', confidence: 0.92 },

  // Condiment
  { name: 'Soy sauce', category: 'condiment', confidence: 0.93 },
]

// ---------------------------------------------------------------------------
// Specific upsells inline per recipe.
// "Almost" recipes use specific upsells whose products are exactly the
// ingredients flagged as missing — so the demo can say "you're missing X,
// grab it at <store>" and the call to action lands on a real search/site.
// ---------------------------------------------------------------------------

const carbonaraSpecifics: StoreUpsell[] = [
  {
    id: 'r1-pancetta',
    name: 'Pancetta di Parma',
    description: 'Italian dry-cured pork belly, sliced.',
    reason: 'Authentic carbonara needs pancetta, not bacon.',
    price: 6.99,
    currency: 'EUR',
    store: 'rimi',
    imageUrl: upsellImg('photo-1606851094291-6efae152bb87'),
    searchUrl: upsellUrls.rimiSearch('pancetta'),
    type: 'specific',
  },
  {
    id: 'r1-pepper',
    name: 'Tellicherry Black Pepper',
    description: 'Whole black peppercorns, refillable mill.',
    reason: 'Carbonara is half pepper — fresh-cracked changes everything.',
    price: 4.5,
    currency: 'EUR',
    store: 'maxima',
    imageUrl: upsellImg('photo-1599909533730-e76b86c14cae'),
    searchUrl: upsellUrls.maximaHome,
    type: 'specific',
  },
]

const lemonChickenSpecifics: StoreUpsell[] = [
  {
    id: 'r2-garlic-butter',
    name: 'Cold-Pressed Garlic Butter',
    description: 'French-style cultured butter blended with roasted garlic.',
    reason: 'Skip the chopping — melt this over the chicken at the end.',
    price: 5.49,
    currency: 'EUR',
    store: 'rimi',
    imageUrl: upsellImg('photo-1589985270826-4b7bb135bc9d'),
    searchUrl: upsellUrls.rimiSearch('garlic butter'),
    type: 'specific',
  },
]

const stirFrySpecifics: StoreUpsell[] = [
  {
    id: 'r3-chili-crisp',
    name: 'Lao Gan Ma Chili Crisp',
    description: 'Sichuan chili oil with crispy onion and peanut.',
    reason: 'A spoonful adds crunch, heat, and umami to any stir-fry.',
    price: 4.29,
    currency: 'EUR',
    store: 'maxima',
    imageUrl: upsellImg('photo-1604908554007-9b86e9eed8d4'),
    searchUrl: upsellUrls.maximaHome,
    type: 'specific',
  },
]

const friedRiceSpecifics: StoreUpsell[] = [
  {
    id: 'r4-kewpie',
    name: 'Kewpie Japanese Mayonnaise',
    description: 'Egg-yolk-rich Japanese mayo, squeeze bottle.',
    reason: 'Drizzle on top — classic yōshoku finish for fried rice.',
    price: 5.79,
    currency: 'EUR',
    store: 'maxima',
    imageUrl: upsellImg('photo-1612102143721-d3eb9d1f5b65'),
    searchUrl: upsellUrls.maximaHome,
    type: 'specific',
  },
  {
    id: 'r4-furikake',
    name: 'Furikake Rice Seasoning',
    description: 'Toasted sesame, nori, and bonito flake mix.',
    reason: 'One shake turns plain rice into a meal.',
    price: 3.99,
    currency: 'EUR',
    store: 'rimi',
    imageUrl: upsellImg('photo-1604908176997-125f25cc6f3d'),
    searchUrl: upsellUrls.rimiSearch('furikake'),
    type: 'specific',
  },
]

const shakshukaSpecifics: StoreUpsell[] = [
  {
    id: 'r5-harissa',
    name: 'Harissa Paste',
    description: 'Tunisian roasted-pepper and chili paste, 100 g.',
    reason: 'A spoonful in the sauce gives shakshuka real backbone.',
    price: 3.49,
    currency: 'EUR',
    store: 'rimi',
    imageUrl: upsellImg('photo-1599909366542-e9f6db73e0b4'),
    searchUrl: upsellUrls.rimiSearch('harissa'),
    type: 'specific',
  },
  {
    id: 'r5-bulgarian-feta',
    name: 'Bulgarian Sheep Feta',
    description: 'Brined sheep-milk feta, 200 g block.',
    reason: 'Crumble over the eggs at the end — sharp and salty.',
    price: 4.79,
    currency: 'EUR',
    store: 'lidl',
    imageUrl: upsellImg('photo-1559561853-08451507cbe7'),
    searchUrl: upsellUrls.lidlHome,
    type: 'specific',
  },
]

const greekSaladSpecifics: StoreUpsell[] = [
  {
    id: 'r6-kalamata',
    name: 'Kalamata Olives',
    description: 'Greek brined Kalamata olives, pitted.',
    reason: 'No Greek salad without them — briny, fruity, essential.',
    price: 3.99,
    currency: 'EUR',
    store: 'maxima',
    imageUrl: upsellImg('photo-1593001872095-7d5b3868fb1d'),
    searchUrl: upsellUrls.maximaHome,
    type: 'specific',
  },
  {
    id: 'r6-greek-feta',
    name: 'Greek Feta DOP',
    description: 'PDO-protected Greek feta, 200 g.',
    reason: 'The legally-real feta — chunkier, milkier, transformative.',
    price: 5.49,
    currency: 'EUR',
    store: 'lidl',
    imageUrl: upsellImg('photo-1626957341926-98752fc2bbab'),
    searchUrl: upsellUrls.lidlHome,
    type: 'specific',
  },
]

const scrambledEggsSpecifics: StoreUpsell[] = [
  {
    id: 'r7-creme-fraiche',
    name: 'Crème Fraîche',
    description: 'French-style cultured cream, 200 g.',
    reason: 'A spoonful off the heat — silkier than any milk-based scramble.',
    price: 3.29,
    currency: 'EUR',
    store: 'rimi',
    imageUrl: upsellImg('photo-1488477181946-6428a0291777'),
    searchUrl: upsellUrls.rimiSearch('creme fraiche'),
    type: 'specific',
  },
  {
    id: 'r7-flaky-salt',
    name: 'Maldon Flaky Sea Salt',
    description: 'British pyramid-flake sea salt, 250 g tin.',
    reason: 'Finish at the table — texture, not just seasoning.',
    price: 4.99,
    currency: 'EUR',
    store: 'maxima',
    imageUrl: upsellImg('photo-1518110925495-b37653faff14'),
    searchUrl: upsellUrls.maximaHome,
    type: 'specific',
  },
]

// "Almost" recipe specifics — these correspond directly to missing ingredients.
const risottoSpecifics: StoreUpsell[] = [
  {
    id: 'r8-pinot-grigio',
    name: 'Italian Pinot Grigio (cooking)',
    description: 'Dry Italian white wine, 750 ml.',
    reason: "You're missing white wine — risotto needs it for depth and acidity.",
    price: 7.49,
    currency: 'EUR',
    store: 'rimi',
    imageUrl: upsellImg('photo-1547595628-c61a29f496f0'),
    searchUrl: upsellUrls.rimiSearch('pinot grigio'),
    type: 'specific',
  },
]

const currySpecifics: StoreUpsell[] = [
  {
    id: 'r9-curry-powder',
    name: 'Madras Curry Powder',
    description: 'Medium-hot South Indian blend, 50 g jar.',
    reason: "You're missing curry powder — without it, this is just chicken stew.",
    price: 2.49,
    currency: 'EUR',
    store: 'lidl',
    imageUrl: upsellImg('photo-1599909533730-e76b86c14cae'),
    searchUrl: upsellUrls.lidlHome,
    type: 'specific',
  },
  {
    id: 'r9-coconut-milk',
    name: 'Aroy-D Coconut Milk',
    description: 'Thai coconut milk, 400 ml.',
    reason: "You're missing coconut milk — it's the body of the curry.",
    price: 2.79,
    currency: 'EUR',
    store: 'rimi',
    imageUrl: upsellImg('photo-1582287014914-1db836415e6d'),
    searchUrl: upsellUrls.rimiSearch('coconut milk'),
    type: 'specific',
  },
]

const bibimbapSpecifics: StoreUpsell[] = [
  {
    id: 'r10-gochujang',
    name: 'Korean Gochujang Paste',
    description: 'Fermented Korean chili paste, 500 g tub.',
    reason: "You're missing gochujang — it's what makes bibimbap, bibimbap.",
    price: 5.99,
    currency: 'EUR',
    store: 'rimi',
    imageUrl: upsellImg('photo-1604908554007-9b86e9eed8d4'),
    searchUrl: upsellUrls.rimiSearch('gochujang'),
    type: 'specific',
  },
  {
    id: 'r10-sesame-oil',
    name: 'Toasted Sesame Oil',
    description: 'Pure dark sesame oil, 250 ml.',
    reason: "You're missing sesame oil — drizzle at the end, never cook with it.",
    price: 4.49,
    currency: 'EUR',
    store: 'lidl',
    imageUrl: upsellImg('photo-1474979266404-7eaacbcd87c5'),
    searchUrl: upsellUrls.lidlHome,
    type: 'specific',
  },
]

// ---------------------------------------------------------------------------
// Recipes. Build with empty matchedIngredients/missingIngredients then
// populate via the matching utility at module load (Part 5 backwards-compat).
// ---------------------------------------------------------------------------
const recipesBase: Recipe[] = [
  {
    id: 'r1',
    title: 'Pasta Carbonara',
    image: img('photo-1551183053-bf91a1d81141'),
    cookTime: 25,
    difficulty: 'medium',
    calories: 640,
    cuisine: 'Italian',
    tags: ['Italian', 'Pasta', 'Comfort'],
    matchType: 'perfect',
    mealTimes: ['lunch', 'dinner'],
    ingredients: [
      { name: 'Pasta', amount: '200', unit: 'g', category: 'pantry' },
      { name: 'Bacon', amount: '120', unit: 'g', category: 'protein' },
      { name: 'Eggs', amount: '2', category: 'protein' },
      { name: 'Cheddar cheese', amount: '60', unit: 'g', category: 'dairy' },
      { name: 'Garlic', amount: '2', unit: 'cloves', category: 'produce' },
      { name: 'Salt', amount: 'to taste', category: 'spice', isBasic: true },
      { name: 'Black pepper', amount: 'to taste', category: 'spice', isBasic: true },
    ],
    steps: [
      'Boil pasta in well-salted water until just shy of al dente.',
      'Render diced bacon in a cold pan over medium heat with sliced garlic.',
      'Whisk eggs with grated cheddar and lots of black pepper.',
      'Toss drained pasta into the bacon pan off the heat.',
      'Pour the egg mix in and toss continuously — heat from pasta cooks it.',
      'Loosen with pasta water until silky. Plate and finish with more pepper.',
    ],
    upsells: [generic('gen-parmigiano'), ...carbonaraSpecifics],
    matchedIngredients: [],
    missingIngredients: [],
  },
  {
    id: 'r2',
    title: 'Garlic Butter Lemon Chicken',
    image: img('photo-1532550907401-a500c9a57435'),
    cookTime: 25,
    difficulty: 'easy',
    calories: 480,
    cuisine: 'Comfort',
    tags: ['Comfort', 'Quick', 'Gluten-free'],
    matchType: 'perfect',
    mealTimes: ['lunch', 'dinner'],
    ingredients: [
      { name: 'Chicken breast', amount: '2', category: 'protein' },
      { name: 'Lemon', amount: '1', category: 'produce' },
      { name: 'Garlic', amount: '4', unit: 'cloves', category: 'produce' },
      { name: 'Butter', amount: '3', unit: 'tbsp', category: 'dairy' },
      { name: 'Olive oil', amount: '1', unit: 'tbsp', category: 'pantry' },
      { name: 'Salt', amount: 'to taste', category: 'spice', isBasic: true },
      { name: 'Black pepper', amount: 'to taste', category: 'spice', isBasic: true },
    ],
    steps: [
      'Pat chicken dry, season generously with salt and pepper.',
      'Sear in olive oil over medium-high until deeply golden, ~4 min per side.',
      'Reduce heat, add butter and sliced garlic. Baste for 2 minutes.',
      'Squeeze in lemon, scrape the pan, spoon the sauce over the chicken.',
      'Rest 3 minutes before slicing.',
    ],
    upsells: [generic('gen-fresh-herbs'), ...lemonChickenSpecifics],
    matchedIngredients: [],
    missingIngredients: [],
  },
  {
    id: 'r3',
    title: 'Garlic-Ginger Veggie Stir-Fry',
    image: img('photo-1512058564366-18510be2db19'),
    cookTime: 15,
    difficulty: 'easy',
    calories: 320,
    cuisine: 'Asian',
    tags: ['Asian', 'Vegetarian', 'Quick', 'Healthy'],
    matchType: 'perfect',
    mealTimes: ['lunch', 'snack', 'dinner'],
    ingredients: [
      { name: 'Broccoli', amount: '2', unit: 'cups', category: 'produce' },
      { name: 'Bell pepper', amount: '1', category: 'produce' },
      { name: 'Carrot', amount: '1', category: 'produce' },
      { name: 'Garlic', amount: '3', unit: 'cloves', category: 'produce' },
      { name: 'Ginger', amount: '1', unit: 'tbsp', category: 'produce' },
      { name: 'Soy sauce', amount: '3', unit: 'tbsp', category: 'condiment' },
      { name: 'Olive oil', amount: '2', unit: 'tbsp', category: 'pantry' },
      { name: 'Salt', amount: 'to taste', category: 'spice', isBasic: true },
    ],
    steps: [
      'Slice broccoli, peppers, and carrots into bite-size pieces.',
      'Heat oil in a large pan or wok until shimmering.',
      'Add garlic and ginger — 30 seconds, no longer.',
      'Add veg, toss constantly over high heat for 4–5 minutes.',
      'Pour in soy sauce, toss once more, serve immediately over rice.',
    ],
    upsells: [
      generic('gen-himalayan-salt'),
      generic('gen-smoked-paprika'),
      ...stirFrySpecifics,
    ],
    matchedIngredients: [],
    missingIngredients: [],
  },
  {
    id: 'r4',
    title: 'Bacon & Egg Fried Rice',
    image: img('photo-1603133872878-684f208fb84b'),
    cookTime: 20,
    difficulty: 'easy',
    calories: 560,
    cuisine: 'Asian',
    tags: ['Asian', 'Comfort', 'Quick'],
    matchType: 'perfect',
    mealTimes: ['breakfast', 'brunch', 'lunch', 'snack', 'dinner'],
    ingredients: [
      { name: 'Rice', amount: '2', unit: 'cups cooked', category: 'pantry' },
      { name: 'Eggs', amount: '2', category: 'protein' },
      { name: 'Bacon', amount: '100', unit: 'g', category: 'protein' },
      { name: 'Garlic', amount: '2', unit: 'cloves', category: 'produce' },
      { name: 'Scallion', amount: '3', category: 'produce' },
      { name: 'Soy sauce', amount: '2', unit: 'tbsp', category: 'condiment' },
      { name: 'Olive oil', amount: '1', unit: 'tbsp', category: 'pantry' },
    ],
    steps: [
      'Use day-old rice if possible — fresher rice goes mushy.',
      'Crisp bacon in a wok, then push to one side.',
      'Crack eggs into the cleared space, scramble loosely.',
      'Add garlic, then rice — break up clumps and toss for 2 minutes.',
      'Splash in soy sauce, fold, finish with sliced scallion.',
    ],
    upsells: [generic('gen-truffle-oil'), ...friedRiceSpecifics],
    matchedIngredients: [],
    missingIngredients: [],
  },
  {
    id: 'r5',
    title: 'Shakshuka',
    image: img('photo-1590412200988-a436970781fa'),
    cookTime: 30,
    difficulty: 'easy',
    calories: 410,
    cuisine: 'Middle Eastern',
    tags: ['Middle Eastern', 'Brunch', 'Vegetarian'],
    matchType: 'perfect',
    mealTimes: ['breakfast', 'brunch', 'lunch'],
    ingredients: [
      { name: 'Tomatoes', amount: '4', category: 'produce' },
      { name: 'Bell pepper', amount: '1', category: 'produce' },
      { name: 'Yellow onion', amount: '1', category: 'produce' },
      { name: 'Garlic', amount: '3', unit: 'cloves', category: 'produce' },
      { name: 'Eggs', amount: '4', category: 'protein' },
      { name: 'Olive oil', amount: '2', unit: 'tbsp', category: 'pantry' },
      { name: 'Salt', amount: 'to taste', category: 'spice', isBasic: true },
      { name: 'Black pepper', amount: 'to taste', category: 'spice', isBasic: true },
    ],
    steps: [
      'Soften diced onion and pepper in olive oil over medium heat, ~8 minutes.',
      'Add garlic, cook 30 seconds.',
      'Stir in chopped tomatoes, simmer until jammy, ~12 minutes.',
      'Make wells with the back of a spoon, crack an egg into each.',
      'Cover and cook until whites are set but yolks still soft, ~5 minutes.',
      'Serve straight from the pan with bread for dipping.',
    ],
    upsells: [generic('gen-smoked-paprika'), ...shakshukaSpecifics],
    matchedIngredients: [],
    missingIngredients: [],
  },
  {
    id: 'r6',
    title: 'Greek-style Salad',
    image: img('photo-1540420773420-3366772f4999'),
    cookTime: 10,
    difficulty: 'easy',
    calories: 280,
    cuisine: 'Mediterranean',
    tags: ['Mediterranean', 'Vegetarian', 'Healthy', 'No-cook'],
    matchType: 'perfect',
    mealTimes: ['lunch', 'snack', 'dinner'],
    ingredients: [
      { name: 'Cucumber', amount: '1', category: 'produce' },
      { name: 'Cherry tomatoes', amount: '2', unit: 'cups', category: 'produce' },
      { name: 'Red onion', amount: '1/2', category: 'produce' },
      { name: 'Lemon', amount: '1/2', category: 'produce' },
      { name: 'Olive oil', amount: '3', unit: 'tbsp', category: 'pantry' },
      { name: 'Salt', amount: 'to taste', category: 'spice', isBasic: true },
      { name: 'Black pepper', amount: 'to taste', category: 'spice', isBasic: true },
    ],
    steps: [
      'Chop cucumber and tomatoes into bite-size pieces.',
      'Thinly slice red onion, rinse briefly to mellow.',
      'Whisk olive oil, lemon juice, salt, pepper.',
      'Toss everything together. Best after 5 minutes of mingling.',
    ],
    upsells: [
      generic('gen-evoo'),
      generic('gen-balsamic'),
      ...greekSaladSpecifics,
    ],
    matchedIngredients: [],
    missingIngredients: [],
  },
  {
    id: 'r7',
    title: 'Cheesy Scrambled Eggs',
    image: img('photo-1525351484163-7529414344d8'),
    cookTime: 8,
    difficulty: 'easy',
    calories: 340,
    cuisine: 'Breakfast',
    tags: ['Breakfast', 'Quick', 'Comfort'],
    matchType: 'perfect',
    mealTimes: ['breakfast', 'brunch', 'snack'],
    ingredients: [
      { name: 'Eggs', amount: '3', category: 'protein' },
      { name: 'Milk', amount: '2', unit: 'tbsp', category: 'dairy' },
      { name: 'Butter', amount: '1', unit: 'tbsp', category: 'dairy' },
      { name: 'Cheddar cheese', amount: '40', unit: 'g', category: 'dairy' },
      { name: 'Salt', amount: 'to taste', category: 'spice', isBasic: true },
      { name: 'Black pepper', amount: 'to taste', category: 'spice', isBasic: true },
    ],
    steps: [
      'Whisk eggs with milk, salt, pepper.',
      'Melt butter in a non-stick pan over low-medium heat.',
      'Pour in eggs. Stir slowly with a spatula in long strokes.',
      'Just before fully set, fold in grated cheddar.',
      'Pull off the heat — they keep cooking. Plate immediately.',
    ],
    upsells: [generic('gen-fresh-herbs'), ...scrambledEggsSpecifics],
    matchedIngredients: [],
    missingIngredients: [],
  },
  {
    id: 'r8',
    title: 'Wild Mushroom Risotto',
    image: img('photo-1476124369491-e7addf5db371'),
    cookTime: 35,
    difficulty: 'medium',
    calories: 520,
    cuisine: 'Italian',
    tags: ['Italian', 'Vegetarian', 'Cozy'],
    matchType: 'almost',
    mealTimes: ['lunch', 'dinner'],
    ingredients: [
      { name: 'Rice', amount: '1', unit: 'cup', category: 'pantry' },
      { name: 'Mushrooms', amount: '250', unit: 'g', category: 'produce' },
      { name: 'Yellow onion', amount: '1', category: 'produce' },
      { name: 'Garlic', amount: '2', unit: 'cloves', category: 'produce' },
      { name: 'Butter', amount: '3', unit: 'tbsp', category: 'dairy' },
      { name: 'Parmesan', amount: '1/2', unit: 'cup', category: 'dairy' },
      { name: 'White wine', amount: '1/2', unit: 'cup', category: 'pantry' },
      { name: 'Salt', amount: 'to taste', category: 'spice', isBasic: true },
      { name: 'Black pepper', amount: 'to taste', category: 'spice', isBasic: true },
    ],
    steps: [
      'Sauté sliced mushrooms in butter until deeply browned. Set aside.',
      'Soften diced onion and garlic in butter.',
      'Add rice, toast 2 minutes — edges should turn translucent.',
      'Deglaze with white wine, stir until absorbed.',
      'Add hot stock a ladle at a time, stirring, ~18 minutes total.',
      'Fold mushrooms, parmesan, knob of butter back in. Rest 2 minutes.',
    ],
    upsells: [generic('gen-parmigiano'), ...risottoSpecifics],
    matchedIngredients: [],
    missingIngredients: [],
  },
  {
    id: 'r9',
    title: 'Chicken Curry',
    image: img('photo-1565557623262-b51c2513a641'),
    cookTime: 35,
    difficulty: 'medium',
    calories: 540,
    cuisine: 'Indian',
    tags: ['Indian', 'Curry', 'Comfort'],
    matchType: 'almost',
    mealTimes: ['lunch', 'dinner'],
    ingredients: [
      { name: 'Chicken breast', amount: '500', unit: 'g', category: 'protein' },
      { name: 'Yellow onion', amount: '1', category: 'produce' },
      { name: 'Garlic', amount: '3', unit: 'cloves', category: 'produce' },
      { name: 'Ginger', amount: '1', unit: 'tbsp', category: 'produce' },
      { name: 'Tomatoes', amount: '2', category: 'produce' },
      { name: 'Curry powder', amount: '2', unit: 'tbsp', category: 'spice' },
      { name: 'Coconut milk', amount: '400', unit: 'ml', category: 'pantry' },
      { name: 'Olive oil', amount: '1', unit: 'tbsp', category: 'pantry' },
      { name: 'Salt', amount: 'to taste', category: 'spice', isBasic: true },
    ],
    steps: [
      'Brown bite-size chicken pieces in olive oil. Set aside.',
      'Soften onion in the same pan. Add garlic and ginger, then curry powder.',
      'Stir in chopped tomatoes, cook until they break down.',
      'Pour in coconut milk, return chicken, simmer 12 minutes.',
      'Taste, adjust salt. Serve over rice with cilantro.',
    ],
    upsells: [generic('gen-fresh-herbs'), ...currySpecifics],
    matchedIngredients: [],
    missingIngredients: [],
  },
  {
    id: 'r10',
    title: 'Korean Bibimbap',
    image: img('photo-1582878826629-29b7ad1cdc43'),
    cookTime: 30,
    difficulty: 'medium',
    calories: 580,
    cuisine: 'Korean',
    tags: ['Korean', 'Rice bowl', 'Healthy'],
    matchType: 'almost',
    mealTimes: ['breakfast', 'brunch', 'lunch', 'dinner'],
    ingredients: [
      { name: 'Rice', amount: '2', unit: 'cups cooked', category: 'pantry' },
      { name: 'Eggs', amount: '2', category: 'protein' },
      { name: 'Broccoli', amount: '1', unit: 'cup', category: 'produce' },
      { name: 'Carrot', amount: '1', category: 'produce' },
      { name: 'Mushrooms', amount: '150', unit: 'g', category: 'produce' },
      { name: 'Garlic', amount: '2', unit: 'cloves', category: 'produce' },
      { name: 'Soy sauce', amount: '2', unit: 'tbsp', category: 'condiment' },
      { name: 'Gochujang', amount: '2', unit: 'tbsp', category: 'condiment' },
      { name: 'Sesame oil', amount: '1', unit: 'tbsp', category: 'pantry' },
      { name: 'Salt', amount: 'to taste', category: 'spice', isBasic: true },
    ],
    steps: [
      'Sauté each vegetable separately with a touch of garlic and soy.',
      'Fry an egg sunny-side up — runny yolk is the point.',
      'Mound rice in a bowl, arrange vegetables in colourful sections.',
      'Top with the egg, drizzle sesame oil, dollop gochujang on the side.',
      'Mix everything together at the table just before eating.',
    ],
    upsells: [generic('gen-himalayan-salt'), ...bibimbapSpecifics],
    matchedIngredients: [],
    missingIngredients: [],
  },
]

// Backwards-compat: derive matched/missing string arrays from the matching
// utility so existing UI (Sessions 1-3) keeps working unchanged.
for (const r of recipesBase) {
  r.matchedIngredients = getMatchedIngredients(r, scannedItems).map((i) => i.name)
  r.missingIngredients = getMissingIngredients(r, scannedItems).map((i) => i.name)
}

export const recipes: Recipe[] = recipesBase
