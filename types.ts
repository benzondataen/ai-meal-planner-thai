export interface Meal {
  name: string;
  servings: number;
}

export interface MealDay {
  day: string;
  breakfast?: Meal;
  lunch?: Meal;
  dinner?: Meal;
}

export interface Ingredient {
  name: string;
  quantity: string;
  category: string;
  checked?: boolean;
  usedIn?: string[];
  price?: number; // Price for the ingredient
}

export interface AdditionalExpense {
    id: string; // Use a unique ID for list rendering, e.g., timestamp
    name: string;
    price: number;
}

export interface MealIngredientInfo {
    name: string;
    quantity: string;
}

export interface SavedPlan {
    id: string; // ISO date string when created
    createdAt: string; // User-friendly date string
    mealPlan: MealDay[];
    mealIngredients: Record<string, MealIngredientInfo[]>;
    shoppingList: Ingredient[];
    additionalExpenses: AdditionalExpense[];
}

export interface ActivePlan {
    mealPlan: MealDay[];
    shoppingList: Ingredient[];
    mealIngredients: Record<string, MealIngredientInfo[]>;
    additionalExpenses: AdditionalExpense[];
}

export enum AppState {
  AUTH_LOADING,
  LOGIN,
  DASHBOARD,
  LOADING,
  PLANNING,
  SHOPPING_LIST,
  WEEKLY_SUMMARY,
  VIEW_SAVED_PLAN,
}

export interface Ad {
  linkUrl: string;
  imageUrl: string;
}

export interface OcrResult {
  name: string;
  price: number;
}

export interface MatchedItemPair {
    receiptItemName: string;
    shoppingListItemName: string;
}

export interface PlannerSettings {
    dates: Date[];
    meals: ('breakfast' | 'lunch' | 'dinner')[];
}
