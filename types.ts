// Fix for multiple "Cannot find name" and "is not a module" errors.
// This file was a placeholder and is now fully defined.

export enum AppState {
  AUTH_LOADING = 'AUTH_LOADING',
  LOGIN = 'LOGIN',
  DASHBOARD = 'DASHBOARD',
  LOADING = 'LOADING',
  PLANNING = 'PLANNING',
  SHOPPING_LIST = 'SHOPPING_LIST',
  ADAPT_PLAN = 'ADAPT_PLAN',
  WEEKLY_SUMMARY = 'WEEKLY_SUMMARY',
  VIEW_SAVED_PLAN = 'VIEW_SAVED_PLAN',
}

export interface Meal {
  name: string;
  servings?: number;
}

export interface MealDay {
  day: string;
  breakfast?: Meal | null;
  lunch?: Meal | null;
  dinner?: Meal | null;
}

export interface Ingredient {
  name: string;
  quantity: string;
  category: string;
  checked: boolean;
  price?: number;
  usedIn?: string[];
}

export interface MealIngredientInfo {
    name: string;
    quantity: string;
}

export interface SavedPlan {
    id: string;
    createdAt: string;
    mealPlan: MealDay[];
    shoppingList: Ingredient[];
    mealIngredients: Record<string, MealIngredientInfo[]>;
    additionalExpenses: AdditionalExpense[];
    userId: string;
    planDates: string[];
}

export interface OcrResult {
  name: string;
  price: number;
}

export interface MatchedItemPair {
  receiptItemName: string;
  shoppingListItemName: string;
}

export interface AdditionalExpense {
  id: string;
  name: string;
  price: number;
}

export interface Ad {
  linkUrl: string;
  imageUrl: string;
}

export interface PlannerSettings {
  dates: Date[];
  meals: ('breakfast' | 'lunch' | 'dinner')[];
}

export enum FeedbackTopic {
  BUG = 'BUG',
  SUGGESTION = 'SUGGESTION',
  FEATURE_REQUEST = 'FEATURE_REQUEST'
}

export interface FeedbackData {
  id?: string;
  topic: FeedbackTopic;
  details: string;
  userId: string;
  createdAt: string; // ISO string
}