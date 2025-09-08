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
  AUTH_LOADING,
  LOGIN,
  DASHBOARD,
  LOADING,
  PLANNING,
  SHOPPING_LIST,
  VIEW_SAVED_PLAN,
}

export interface Ad {
  linkUrl: string;
  // This will now hold the fetched preview image URL.
  imageUrl: string;
  // These will hold the fetched metadata from the link.
  // Fix: Made title and description required. The data fetching logic always provides these, and this change fixes a downstream type predicate error.
  title: string;
  description: string;
}