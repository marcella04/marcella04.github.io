import type { Allergen, DietTag, Ingredient, IngredientCategory, Unit } from '../types';

const V: DietTag[] = ['vegan', 'vegetarian', 'pescatarian'];
const VG: DietTag[] = ['vegetarian', 'pescatarian'];
const GD: DietTag[] = ['gluten-free', 'dairy-free'];
const SRC = 'Typical reference values (not individually verified)';

function ing(
  id: string, name: string, category: IngredientCategory, defaultUnit: Unit, dietTags: DietTag[], allergenTags: Allergen[],
  extra: Partial<Ingredient> = {}, aliases: string[] = [],
): Ingredient {
  return { id, name, category, defaultUnit, aliases, dietTags, allergenTags, nutritionSourceLabel: SRC, dataStatus: 'estimated', ...extra };
}

export const ingredients: Ingredient[] = [
  ing('chicken-breast', 'Chicken breast', 'protein', 'oz', GD, [], {}, ['boneless skinless chicken', 'chicken']),
  ing('ground-turkey', 'Ground turkey', 'protein', 'oz', GD, [], {}, ['turkey mince']),
  ing('salmon-fillet', 'Salmon fillet', 'protein', 'oz', ['pescatarian', ...GD], ['fish'], {}, ['salmon']),
  ing('canned-tuna', 'Canned tuna', 'protein', 'can', ['pescatarian', ...GD], ['fish'], { unitWeights: { can: 140 } }, ['tuna']),
  ing('shrimp', 'Shrimp', 'protein', 'oz', ['pescatarian', ...GD], ['shellfish'], {}, ['prawns']),
  ing('eggs', 'Eggs', 'protein', 'count', ['vegetarian', 'pescatarian', ...GD], ['egg'], { unitWeights: { count: 50 } }, ['egg']),
  ing('firm-tofu', 'Firm tofu', 'protein', 'oz', [...V, ...GD], ['soy'], {}, ['tofu']),
  ing('black-beans', 'Black beans (canned)', 'pantry', 'can', [...V, ...GD], [], { unitWeights: { can: 250 } }, ['black beans']),
  ing('chickpeas', 'Chickpeas (canned)', 'pantry', 'can', [...V, ...GD], [], { unitWeights: { can: 240 } }, ['garbanzo beans', 'chickpeas']),
  ing('lentils', 'Dry lentils', 'pantry', 'cup', [...V, ...GD], [], { density: 0.81 }, ['lentils']),
  ing('greek-yogurt', 'Plain Greek yogurt', 'dairy', 'cup', [...VG, 'gluten-free'], ['dairy'], { density: 1.03 }, ['yogurt']),
  ing('cheddar', 'Cheddar cheese', 'dairy', 'oz', [...VG, 'gluten-free'], ['dairy'], {}, ['cheese']),
  ing('feta', 'Feta cheese', 'dairy', 'oz', [...VG, 'gluten-free'], ['dairy'], {}, []),
  ing('brown-rice', 'Brown rice (dry)', 'grain', 'cup', [...V, ...GD], [], { density: 0.78 }, ['rice']),
  ing('quinoa', 'Quinoa (dry)', 'grain', 'cup', [...V, ...GD], [], { density: 0.72 }, []),
  ing('whole-wheat-pasta', 'Whole-wheat pasta (dry)', 'grain', 'oz', [...V, 'dairy-free'], ['gluten'], {}, ['pasta']),
  ing('tortilla', 'Whole-wheat tortilla', 'grain', 'count', [...V, 'dairy-free'], ['gluten'], { unitWeights: { count: 60 } }, ['wrap']),
  ing('bread', 'Whole-grain bread', 'grain', 'count', [...V, 'dairy-free'], ['gluten'], { unitWeights: { count: 40 } }, ['toast', 'bread slice']),
  ing('oats', 'Rolled oats', 'grain', 'cup', [...V, 'dairy-free'], [], { density: 0.38 }, ['oatmeal']),
  ing('sweet-potato', 'Sweet potato', 'vegetable', 'count', [...V, ...GD], [], { unitWeights: { count: 200 } }, []),
  ing('broccoli', 'Broccoli', 'vegetable', 'cup', [...V, ...GD], [], { density: 0.38 }, []),
  ing('spinach', 'Spinach', 'vegetable', 'cup', [...V, ...GD], [], { density: 0.13 }, []),
  ing('bell-pepper', 'Bell pepper', 'vegetable', 'count', [...V, ...GD], [], { unitWeights: { count: 150 } }, ['pepper']),
  ing('tomato', 'Tomato', 'vegetable', 'count', [...V, ...GD], [], { unitWeights: { count: 120 } }, []),
  ing('cucumber', 'Cucumber', 'vegetable', 'count', [...V, ...GD], [], { unitWeights: { count: 300 } }, []),
  ing('carrot', 'Carrot', 'vegetable', 'count', [...V, ...GD], [], { unitWeights: { count: 70 } }, []),
  ing('onion', 'Onion', 'vegetable', 'count', [...V, ...GD], [], { unitWeights: { count: 150 } }, []),
  ing('garlic', 'Garlic cloves', 'vegetable', 'count', [...V, ...GD], [], { unitWeights: { count: 5 } }, ['garlic']),
  ing('frozen-stirfry-veg', 'Frozen stir-fry vegetables', 'vegetable', 'cup', [...V, ...GD], [], { density: 0.63 }, ['frozen vegetables']),
  ing('avocado', 'Avocado', 'fruit', 'count', [...V, ...GD], [], { unitWeights: { count: 150 } }, []),
  ing('banana', 'Banana', 'fruit', 'count', [...V, ...GD], [], { unitWeights: { count: 118 } }, []),
  ing('lemon', 'Lemon', 'fruit', 'count', [...V, ...GD], [], { unitWeights: { count: 60 } }, []),
  ing('frozen-berries', 'Frozen mixed berries', 'fruit', 'cup', [...V, ...GD], [], { density: 0.63 }, ['berries']),
  ing('olive-oil', 'Olive oil', 'pantry', 'tbsp', [...V, ...GD], [], { density: 0.91 }, []),
  ing('soy-sauce', 'Soy sauce', 'sauce', 'tbsp', [...V, 'dairy-free'], ['soy', 'gluten'], { density: 1.2 }, []),
  ing('salsa', 'Salsa', 'sauce', 'cup', [...V, ...GD], [], { density: 1.1 }, []),
  ing('marinara', 'Marinara sauce', 'sauce', 'cup', [...V, ...GD], [], { density: 1.05 }, ['pasta sauce']),
  ing('hummus', 'Hummus', 'sauce', 'tbsp', [...V, ...GD], ['sesame'], { density: 1.0 }, []),
  ing('taco-seasoning', 'Taco seasoning', 'seasoning', 'tsp', [...V, ...GD], [], { density: 0.5 }, []),
  ing('italian-seasoning', 'Italian seasoning', 'seasoning', 'tsp', [...V, ...GD], [], { density: 0.3 }, []),
  ing('peanut-butter', 'Peanut butter', 'pantry', 'tbsp', [...V, ...GD], ['peanut'], { density: 1.08 }, []),
  ing('rotisserie-chicken', 'Rotisserie chicken', 'prepared food', 'oz', GD, [], { unitWeights: { count: 450 } }, ['cooked chicken']),
  ing('salad-kit', 'Salad kit (with dressing)', 'prepared food', 'count', ['vegetarian', 'pescatarian'], [], { unitWeights: { count: 280 } }, ['bagged salad']),
  ing('restaurant-meal', 'Restaurant meal (takeout estimate)', 'prepared food', 'count', [], [], { shoppable: false, dataStatus: 'sample' }, []),
];

export const ingredientsById: Record<string, Ingredient> = Object.fromEntries(ingredients.map((i) => [i.id, i]));
