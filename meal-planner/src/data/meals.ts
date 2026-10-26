import type { Allergen, DietTag, Meal, MealIngredient, Unit } from '../types';
import { ingredientsById } from './ingredients';
import { nutritionById } from './nutrition';
import { basePrices } from './priceTable';
import { convert } from '../engine/unitConversion';

type Row = [string, number, Unit] | [string, number, Unit, true];
interface Def {
  id: string; name: string; type: Meal['mealType']; desc: string; servings?: number; minutes: number; ing: Row[]; steps: string[];
  cuisines: string[]; prep?: string[]; chains?: string[];
  override?: { calories: number; protein: number; carbohydrates: number; fat: number; fiber: number; cost: number };
}

function grams(ingredientId: string, q: number, u: Unit): number {
  const r = convert(q, u, 'g', ingredientsById[ingredientId]);
  if (!r.ok) throw new Error(`Cannot convert ${ingredientId} ${u} to grams: ${r.error.message}`);
  return r.value;
}
function usageCost(ingredientId: string, q: number, u: Unit): number {
  const b = basePrices[ingredientId];
  if (!b) return 0;
  const r = convert(q, u, b.unit, ingredientsById[ingredientId]);
  if (!r.ok) throw new Error(`Cannot price ${ingredientId}: ${r.error.message}`);
  return (r.value / b.qty) * b.price;
}

const tagOrder: DietTag[] = ['vegan', 'vegetarian', 'pescatarian', 'gluten-free', 'dairy-free'];
function build(d: Def): Meal {
  const servings = d.servings ?? 1;
  const ingredients: MealIngredient[] = d.ing.map(([ingredientId, quantity, unit, optional]) => ({ ingredientId, quantity, unit, optional: !!optional }));
  let t = { calories: 0, protein: 0, carbohydrates: 0, fat: 0, fiber: 0 }, cost = 0;
  if (d.override) {
    t = { calories: d.override.calories, protein: d.override.protein, carbohydrates: d.override.carbohydrates, fat: d.override.fat, fiber: d.override.fiber };
    cost = d.override.cost;
  } else {
    for (const i of ingredients) {
      const n = nutritionById[i.ingredientId], f = grams(i.ingredientId, i.quantity, i.unit) / 100 / servings;
      t.calories += n.calories * f; t.protein += n.protein * f; t.carbohydrates += n.carbohydrates * f; t.fat += n.fat * f; t.fiber += n.fiber * f;
      cost += usageCost(i.ingredientId, i.quantity, i.unit) / servings;
    }
  }
  const ings = ingredients.map((i) => ingredientsById[i.ingredientId]);
  const tags: string[] = tagOrder.filter((tag) => ings.every((x) => x.dietTags.includes(tag)));
  if (t.protein >= 30) tags.push('high-protein');
  if (cost <= 3.5) tags.push('budget');
  const allergens = [...new Set(ings.flatMap((x) => x.allergenTags))] as Allergen[];
  const prepTags = [...(d.prep ?? [])];
  if (d.minutes <= 20 && !prepTags.includes('restaurant-style')) prepTags.push('quick');
  if (servings > 1 && !prepTags.includes('meal-prep')) prepTags.push('meal-prep');
  return {
    id: d.id, name: d.name, mealType: d.type, description: d.desc, servings,
    calories: Math.round(t.calories), protein: Math.round(t.protein), carbohydrates: Math.round(t.carbohydrates),
    fat: Math.round(t.fat), fiber: Math.round(t.fiber), estimatedCostPerServing: Math.round(cost * 100) / 100,
    preparationMinutes: d.minutes, ingredients, instructions: d.steps, dietaryTags: tags, allergenTags: allergens,
    cuisineTags: d.cuisines, preparationTags: prepTags, suggestedStoreChains: d.chains ?? ['Demo Market', 'Value Grocery', 'Neighborhood Foods'],
    dataStatus: 'estimated',
  };
}

const defs: Def[] = [
  { id: 'chicken-burrito-bowl', name: 'Chicken Burrito Bowl', type: 'lunch', minutes: 25, cuisines: ['Mexican'], desc: 'Seasoned chicken over brown rice with beans, salsa and avocado.',
    ing: [['chicken-breast', 5, 'oz'], ['brown-rice', 0.33, 'cup'], ['black-beans', 0.25, 'can'], ['salsa', 0.25, 'cup'], ['avocado', 0.25, 'count'], ['taco-seasoning', 1, 'tsp'], ['olive-oil', 1, 'tsp']],
    steps: ['Cook the rice according to the package.', 'Toss sliced chicken with taco seasoning and cook in oil until done through.', 'Warm the beans.', 'Build the bowl with rice, chicken, beans, salsa and sliced avocado.'] },
  { id: 'tuna-spinach-wrap', name: 'Tuna and Spinach Wrap', type: 'lunch', minutes: 10, cuisines: ['American'], prep: ['no-cook'], desc: 'Creamy yogurt tuna salad with cucumber and spinach in a tortilla.',
    ing: [['canned-tuna', 1, 'can'], ['tortilla', 2, 'count'], ['greek-yogurt', 0.25, 'cup'], ['cucumber', 0.25, 'count'], ['spinach', 1, 'cup']],
    steps: ['Drain the tuna and mix with yogurt.', 'Dice the cucumber.', 'Fill tortillas with spinach, tuna mix and cucumber, then roll.'] },
  { id: 'chickpea-hummus-salad', name: 'Chickpea Hummus Salad', type: 'lunch', minutes: 10, cuisines: ['Mediterranean'], prep: ['no-cook'], desc: 'Chickpeas, tomato and cucumber over spinach with a lemon-oil dressing and hummus.',
    ing: [['chickpeas', 1, 'can'], ['cucumber', 0.5, 'count'], ['tomato', 1, 'count'], ['spinach', 2, 'cup'], ['olive-oil', 2, 'tsp'], ['lemon', 0.25, 'count'], ['hummus', 2, 'tbsp']],
    steps: ['Rinse and drain the chickpeas.', 'Chop the tomato and cucumber.', 'Toss everything with oil and lemon juice, then top with hummus.'] },
  { id: 'veggie-scramble-toast', name: 'Veggie Egg Scramble with Toast', type: 'lunch', minutes: 12, cuisines: ['American'], desc: 'Soft scrambled eggs with spinach, peppers and feta on whole-grain toast.',
    ing: [['eggs', 3, 'count'], ['spinach', 1, 'cup'], ['bell-pepper', 0.5, 'count'], ['bread', 2, 'count'], ['olive-oil', 1, 'tsp'], ['feta', 0.5, 'oz']],
    steps: ['Dice the pepper and saute in oil for 2 minutes.', 'Add spinach until wilted.', 'Add beaten eggs and stir gently until set.', 'Top with feta and serve with toast.'] },
  { id: 'yogurt-berry-oat-bowl', name: 'Yogurt Berry Oat Bowl', type: 'lunch', minutes: 5, cuisines: ['American'], prep: ['no-cook'], desc: 'Greek yogurt with oats, berries, banana and peanut butter.',
    ing: [['greek-yogurt', 1, 'cup'], ['oats', 0.5, 'cup'], ['frozen-berries', 0.5, 'cup'], ['banana', 1, 'count'], ['peanut-butter', 1, 'tbsp']],
    steps: ['Spoon yogurt into a bowl.', 'Stir in oats and let sit 5 minutes if you like them softer.', 'Top with berries, sliced banana and peanut butter.'] },
  { id: 'rotisserie-salad-kit', name: 'Rotisserie Chicken Salad Kit', type: 'lunch', minutes: 5, cuisines: ['American'], prep: ['no-cook', 'grocery-prepared'], desc: 'Bagged salad kit topped with shredded store-cooked chicken and avocado.',
    ing: [['rotisserie-chicken', 6, 'oz'], ['salad-kit', 1, 'count'], ['avocado', 0.25, 'count']],
    steps: ['Shred the chicken.', 'Toss the salad kit with its dressing.', 'Top with chicken and sliced avocado.'] },
  { id: 'bean-rice-burrito', name: 'Bean and Rice Burrito', type: 'lunch', minutes: 15, cuisines: ['Mexican'], desc: 'A budget burrito with beans, rice, salsa, spinach and avocado.',
    ing: [['black-beans', 0.75, 'can'], ['brown-rice', 0.25, 'cup'], ['tortilla', 2, 'count'], ['salsa', 0.25, 'cup'], ['spinach', 1, 'cup'], ['avocado', 0.25, 'count']],
    steps: ['Cook rice in advance or use leftovers.', 'Warm beans and rice together.', 'Fill tortillas with beans, rice, spinach, salsa and avocado, then roll.'] },
  { id: 'restaurant-chicken-sandwich', name: 'Restaurant-Style Grilled Chicken Sandwich', type: 'lunch', minutes: 0, cuisines: ['American'], prep: ['restaurant-style'], chains: [],
    desc: 'A takeout-style grilled chicken sandwich. Values are a general estimate, not from a specific restaurant.',
    ing: [['restaurant-meal', 1, 'count']], override: { calories: 520, protein: 35, carbohydrates: 48, fat: 18, fiber: 3, cost: 9.5 },
    steps: ['Order a grilled (not fried) chicken sandwich.', 'Check the venue nutrition information if it is available.'] },
  { id: 'lentil-veggie-soup', name: 'Lentil Veggie Soup', type: 'either', minutes: 35, servings: 4, cuisines: ['Mediterranean'], desc: 'A batch of hearty lentil soup with carrot, onion, tomato sauce and spinach. Makes 4 servings.',
    ing: [['lentils', 2, 'cup'], ['carrot', 4, 'count'], ['onion', 2, 'count'], ['garlic', 8, 'count'], ['marinara', 2, 'cup'], ['spinach', 4, 'cup'], ['olive-oil', 4, 'tsp']],
    steps: ['Saute chopped onion, carrot and garlic in oil for 5 minutes.', 'Add lentils, marinara and 6 cups of water.', 'Simmer 25 minutes until lentils are tender.', 'Stir in spinach and portion into 4 containers.'] },
  { id: 'turkey-sweet-potato-skillet', name: 'Turkey Sweet Potato Skillet', type: 'either', minutes: 25, cuisines: ['American'], desc: 'Ground turkey with diced sweet potato, peppers and onion.',
    ing: [['ground-turkey', 5, 'oz'], ['sweet-potato', 1, 'count'], ['bell-pepper', 1, 'count'], ['onion', 0.5, 'count'], ['taco-seasoning', 1, 'tsp'], ['olive-oil', 1, 'tsp']],
    steps: ['Dice the sweet potato small and microwave 3 minutes to soften.', 'Brown the turkey with oil and seasoning.', 'Add pepper, onion and sweet potato and cook until tender.'] },
  { id: 'greek-pasta-salad', name: 'Greek Pasta Salad', type: 'either', minutes: 20, servings: 4, cuisines: ['Mediterranean'], desc: 'Whole-wheat pasta with tomato, feta and spinach. Makes 4 servings.',
    ing: [['whole-wheat-pasta', 12, 'oz'], ['tomato', 6, 'count'], ['feta', 4, 'oz'], ['spinach', 4, 'cup'], ['olive-oil', 8, 'tsp']],
    steps: ['Boil pasta and rinse under cold water.', 'Chop tomatoes and toss with pasta, spinach, feta and oil.', 'Chill and portion into 4 containers.'] },
  { id: 'restaurant-burrito-bowl', name: 'Restaurant-Style Burrito Bowl', type: 'either', minutes: 0, cuisines: ['Mexican'], prep: ['restaurant-style'], chains: [],
    desc: 'A takeout-style burrito bowl. Values are a general estimate, not from a specific restaurant.',
    ing: [['restaurant-meal', 1, 'count']], override: { calories: 640, protein: 32, carbohydrates: 70, fat: 24, fiber: 10, cost: 11 },
    steps: ['Choose a bowl with rice, beans, a lean protein and vegetables.', 'Ask for sauces on the side to control portions.'] },
  { id: 'greek-chicken-bowl', name: 'Greek Chicken Quinoa Bowl', type: 'either', minutes: 30, cuisines: ['Mediterranean'], desc: 'Chicken over quinoa with cucumber, tomato, feta and hummus.',
    ing: [['chicken-breast', 5, 'oz'], ['quinoa', 0.33, 'cup'], ['cucumber', 0.5, 'count'], ['tomato', 1, 'count'], ['feta', 1, 'oz'], ['hummus', 2, 'tbsp'], ['olive-oil', 1, 'tsp'], ['lemon', 0.25, 'count']],
    steps: ['Cook quinoa according to the package.', 'Pan-cook seasoned chicken in oil, then slice.', 'Assemble the bowl and finish with lemon juice.'] },
  { id: 'rotisserie-plate', name: 'Rotisserie Chicken Plate', type: 'dinner', minutes: 15, cuisines: ['American'], prep: ['grocery-prepared'], desc: 'Store-cooked chicken with a microwaved sweet potato and frozen vegetables.',
    ing: [['rotisserie-chicken', 6, 'oz'], ['sweet-potato', 1, 'count'], ['frozen-stirfry-veg', 1, 'cup'], ['olive-oil', 1, 'tsp']],
    steps: ['Microwave the sweet potato 5 to 7 minutes.', 'Steam or microwave the frozen vegetables.', 'Plate with sliced chicken and drizzle with oil.'] },
  { id: 'salmon-rice-bowl', name: 'Salmon Rice Bowl', type: 'dinner', minutes: 30, cuisines: ['Asian'], desc: 'Pan-seared salmon over brown rice with broccoli and soy sauce.',
    ing: [['salmon-fillet', 5, 'oz'], ['brown-rice', 0.33, 'cup'], ['broccoli', 1.5, 'cup'], ['soy-sauce', 1, 'tbsp'], ['olive-oil', 1, 'tsp']],
    steps: ['Cook the rice.', 'Steam the broccoli.', 'Sear the salmon in oil 4 minutes per side.', 'Serve over rice with broccoli and soy sauce.'] },
  { id: 'chicken-veggie-stirfry', name: 'Chicken Veggie Stir-Fry', type: 'dinner', minutes: 25, cuisines: ['Asian'], desc: 'Chicken and frozen vegetables in garlic soy sauce over rice.',
    ing: [['chicken-breast', 6, 'oz'], ['frozen-stirfry-veg', 2, 'cup'], ['brown-rice', 0.33, 'cup'], ['soy-sauce', 1.5, 'tbsp'], ['garlic', 2, 'count'], ['olive-oil', 1, 'tbsp']],
    steps: ['Cook the rice.', 'Stir-fry sliced chicken in oil until done.', 'Add garlic and vegetables for 5 minutes.', 'Add soy sauce and serve over rice.'] },
  { id: 'tofu-veggie-stirfry', name: 'Tofu Veggie Stir-Fry', type: 'dinner', minutes: 25, cuisines: ['Asian'], desc: 'Crisped tofu with vegetables and rice in garlic soy sauce.',
    ing: [['firm-tofu', 7, 'oz'], ['frozen-stirfry-veg', 2, 'cup'], ['brown-rice', 0.33, 'cup'], ['soy-sauce', 1.5, 'tbsp'], ['garlic', 2, 'count'], ['olive-oil', 1, 'tbsp']],
    steps: ['Cook the rice.', 'Press and cube the tofu, then pan-fry until golden.', 'Add garlic and vegetables for 5 minutes.', 'Add soy sauce and serve over rice.'] },
  { id: 'shrimp-garlic-pasta', name: 'Garlic Shrimp Pasta', type: 'dinner', minutes: 25, cuisines: ['Italian'], desc: 'Shrimp and spinach tossed with whole-wheat pasta, garlic and lemon.',
    ing: [['shrimp', 5, 'oz'], ['whole-wheat-pasta', 3, 'oz'], ['garlic', 3, 'count'], ['olive-oil', 1, 'tbsp'], ['spinach', 2, 'cup'], ['lemon', 0.25, 'count']],
    steps: ['Boil the pasta.', 'Saute garlic in oil, add shrimp and cook until pink.', 'Add spinach until wilted.', 'Toss with pasta and lemon juice.'] },
  { id: 'black-bean-sweet-potato-bowl', name: 'Black Bean Sweet Potato Bowl', type: 'dinner', minutes: 35, cuisines: ['Mexican'], desc: 'Roasted sweet potato with black beans, quinoa, salsa and avocado.',
    ing: [['black-beans', 1, 'can'], ['sweet-potato', 1, 'count'], ['quinoa', 0.25, 'cup'], ['salsa', 0.25, 'cup'], ['avocado', 0.25, 'count'], ['taco-seasoning', 1, 'tsp']],
    steps: ['Cube and roast the sweet potato at 425 F for 25 minutes.', 'Cook the quinoa.', 'Warm the beans with seasoning.', 'Assemble with salsa and avocado.'] },
  { id: 'turkey-marinara-pasta', name: 'Turkey Marinara Pasta', type: 'dinner', minutes: 30, cuisines: ['Italian'], desc: 'Whole-wheat pasta with turkey marinara and spinach.',
    ing: [['ground-turkey', 5, 'oz'], ['whole-wheat-pasta', 3, 'oz'], ['marinara', 0.5, 'cup'], ['spinach', 2, 'cup'], ['garlic', 2, 'count'], ['italian-seasoning', 1, 'tsp']],
    steps: ['Boil the pasta.', 'Brown the turkey with garlic and seasoning.', 'Add marinara and spinach and simmer 5 minutes.', 'Toss with pasta.'] },
  { id: 'sheet-pan-chicken-veg', name: 'Sheet-Pan Chicken and Vegetables', type: 'dinner', minutes: 40, servings: 4, cuisines: ['American'], desc: 'Roasted chicken, sweet potato, broccoli and onion. Makes 4 servings.',
    ing: [['chicken-breast', 24, 'oz'], ['sweet-potato', 4, 'count'], ['broccoli', 6, 'cup'], ['onion', 2, 'count'], ['olive-oil', 3, 'tbsp']],
    steps: ['Heat the oven to 425 F.', 'Cut everything into similar-sized pieces and toss with oil and salt.', 'Roast 25 to 30 minutes until chicken is cooked through.', 'Portion into 4 containers.'] },
  { id: 'veggie-egg-fried-rice', name: 'Veggie Egg Fried Rice', type: 'dinner', minutes: 25, cuisines: ['Asian'], desc: 'Rice stir-fried with eggs, vegetables, garlic and soy sauce.',
    ing: [['eggs', 3, 'count'], ['brown-rice', 0.4, 'cup'], ['frozen-stirfry-veg', 1.5, 'cup'], ['soy-sauce', 1, 'tbsp'], ['garlic', 2, 'count'], ['olive-oil', 1, 'tbsp']],
    steps: ['Cook the rice and let it cool slightly.', 'Scramble the eggs in oil and set aside.', 'Stir-fry garlic and vegetables.', 'Add rice, eggs and soy sauce and toss until hot.'] },
  { id: 'chickpea-spinach-stew', name: 'Chickpea Spinach Tomato Stew', type: 'dinner', minutes: 25, cuisines: ['Mediterranean'], desc: 'Chickpeas simmered in tomato sauce with spinach, served over quinoa.',
    ing: [['chickpeas', 1, 'can'], ['marinara', 0.75, 'cup'], ['spinach', 2, 'cup'], ['onion', 0.5, 'count'], ['garlic', 2, 'count'], ['quinoa', 0.33, 'cup']],
    steps: ['Cook the quinoa.', 'Saute onion and garlic.', 'Add chickpeas and marinara and simmer 10 minutes.', 'Stir in spinach and serve over quinoa.'] },
  { id: 'egg-bean-quesadilla', name: 'Egg and Bean Quesadilla', type: 'dinner', minutes: 15, cuisines: ['Mexican'], desc: 'Tortillas filled with egg, black beans and cheddar, served with salsa.',
    ing: [['tortilla', 2, 'count'], ['eggs', 2, 'count'], ['black-beans', 0.5, 'can'], ['cheddar', 1.5, 'oz'], ['salsa', 0.25, 'cup']],
    steps: ['Scramble the eggs.', 'Fill a tortilla with eggs, beans and cheese and top with the second tortilla.', 'Toast in a dry pan 2 minutes per side.', 'Serve with salsa.'] },
  { id: 'restaurant-salmon-plate', name: 'Restaurant-Style Salmon Plate', type: 'dinner', minutes: 0, cuisines: ['American'], prep: ['restaurant-style'], chains: [],
    desc: 'A takeout-style salmon and vegetables plate. Values are a general estimate, not from a specific restaurant.',
    ing: [['restaurant-meal', 1, 'count']], override: { calories: 620, protein: 40, carbohydrates: 38, fat: 32, fiber: 5, cost: 15.5 },
    steps: ['Order grilled salmon with vegetables and a starch.', 'Check the venue nutrition information if it is available.'] },
];

export const meals: Meal[] = defs.map(build);
export const mealsById: Record<string, Meal> = Object.fromEntries(meals.map((m) => [m.id, m]));
