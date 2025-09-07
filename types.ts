export interface Meal {
  name: string;
}

export interface MealDay {
  day: string;
  lunch: Meal | null; // Allow null for merging
  dinner: Meal | null; // Allow null for merging
}

export interface Ingredient {
  name: string;
  quantity: string;
  category: string;
  checked?: boolean;
  usedIn?: string[];
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
}

export interface ActivePlan {
    mealPlan: MealDay[];
    shoppingList: Ingredient[];
    mealIngredients: Record<string, MealIngredientInfo[]>;
}

export enum AppState {
  DASHBOARD,
  WELCOME, // Kept for flow continuity if needed, but dashboard is primary
  LOADING,
  PLANNING,
  SHOPPING_LIST,
  VIEW_SAVED_PLAN,
}