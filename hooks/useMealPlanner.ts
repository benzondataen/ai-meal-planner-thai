import { useState, useCallback, useEffect } from 'react';
import { AppState, MealDay, Ingredient, Meal, SavedPlan, MealIngredientInfo, ActivePlan } from '../types';
import { generateInitialMealPlan, regenerateShoppingList, adaptPlanFromPurchasedIngredients } from '../services/geminiService';

const SAVED_PLANS_STORAGE_KEY = 'mealPlannerSavedPlans';
const ACTIVE_PLAN_STORAGE_KEY = 'mealPlannerActivePlan';

const mergeMealDays = (plan: MealDay[]): MealDay[] => {
    const dayMap = new Map<string, MealDay>();
    const dayOrder: string[] = [];

    plan.forEach(dayEntry => {
        if (!dayEntry) return;

        if (!dayMap.has(dayEntry.day)) {
            dayMap.set(dayEntry.day, { day: dayEntry.day, lunch: null, dinner: null });
            dayOrder.push(dayEntry.day);
        }
        
        const existingDay = dayMap.get(dayEntry.day)!;
        if (dayEntry.lunch) {
            existingDay.lunch = dayEntry.lunch;
        }
        if (dayEntry.dinner) {
            existingDay.dinner = dayEntry.dinner;
        }
    });

    return dayOrder.map(day => dayMap.get(day)!);
};

export const useMealPlanner = () => {
  const [appState, setAppState] = useState<AppState>(AppState.DASHBOARD);
  const [mealPlan, setMealPlan] = useState<MealDay[]>([]);
  const [shoppingList, setShoppingList] = useState<Ingredient[]>([]);
  const [allSuggestedMeals, setAllSuggestedMeals] = useState<Meal[]>([]);
  const [error, setError] = useState<string | null>(null);
  
  const [finalMealIngredients, setFinalMealIngredients] = useState<Record<string, MealIngredientInfo[]>>({});
  const [savedPlans, setSavedPlans] = useState<SavedPlan[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<SavedPlan | null>(null);
  const [activePlan, setActivePlan] = useState<ActivePlan | null>(null);

  useEffect(() => {
    try {
      const storedPlans = localStorage.getItem(SAVED_PLANS_STORAGE_KEY);
      if (storedPlans) {
        setSavedPlans(JSON.parse(storedPlans));
      }
      const storedActivePlan = localStorage.getItem(ACTIVE_PLAN_STORAGE_KEY);
      if (storedActivePlan) {
        setActivePlan(JSON.parse(storedActivePlan));
      }
    } catch (e) {
      console.error("Failed to load data from localStorage", e);
    }
  }, []);

  const clearActivePlan = useCallback(() => {
    setActivePlan(null);
    localStorage.removeItem(ACTIVE_PLAN_STORAGE_KEY);
  }, []);

  const handleGeneratePlan = useCallback(async () => {
    clearActivePlan(); // Clear any previous in-progress plan
    setAppState(AppState.LOADING);
    setError(null);
    try {
      const { mealPlan: newPlan, shoppingList: newShoppingList } = await generateInitialMealPlan();
      const mergedPlan = mergeMealDays(newPlan);
      setMealPlan(mergedPlan);
      setShoppingList([]); // Shopping list is generated later

      const uniqueMeals = mergedPlan.reduce((acc, day) => {
        if (day.lunch?.name && !acc.some(meal => meal.name === day.lunch.name)) {
          acc.push(day.lunch);
        }
        if (day.dinner?.name && !acc.some(meal => meal.name === day.dinner.name)) {
          acc.push(day.dinner);
        }
        return acc;
      }, [] as Meal[]);
      setAllSuggestedMeals(uniqueMeals);
      setAppState(AppState.PLANNING);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred.');
      setAppState(AppState.DASHBOARD);
    }
  }, [clearActivePlan]);

  const handleUpdateMeal = (dayIndex: number, mealType: 'lunch' | 'dinner', newMealName: string) => {
    const updatedPlan = [...mealPlan];
     if (updatedPlan[dayIndex]) {
        const meal = { name: newMealName };
        updatedPlan[dayIndex][mealType] = meal;
    }
    setMealPlan(updatedPlan);
  };
  
  const handleFinalizePlan = useCallback(async () => {
    setAppState(AppState.LOADING);
    setError(null);
    try {
      const newShoppingList = await regenerateShoppingList(mealPlan);
      setShoppingList(newShoppingList);
      
      const newActivePlan = { mealPlan, shoppingList: newShoppingList };
      setActivePlan(newActivePlan);
      localStorage.setItem(ACTIVE_PLAN_STORAGE_KEY, JSON.stringify(newActivePlan));
      
      setAppState(AppState.SHOPPING_LIST);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred.');
      setAppState(AppState.PLANNING);
    }
  }, [mealPlan]);

  const toggleIngredientChecked = (itemName: string) => {
    const updatedShoppingList = shoppingList.map(item => 
        item.name === itemName ? {...item, checked: !item.checked} : item
    );
    setShoppingList(updatedShoppingList);

     if (activePlan) {
        const updatedActivePlan = { ...activePlan, shoppingList: updatedShoppingList };
        setActivePlan(updatedActivePlan);
        localStorage.setItem(ACTIVE_PLAN_STORAGE_KEY, JSON.stringify(updatedActivePlan));
    }
  };
  
  const handleFinalizeShopping = useCallback(async () => {
    const purchasedIngredients = shoppingList.filter(item => item.checked);
    if (purchasedIngredients.length === 0) {
        setError("กรุณาเลือกวัตถุดิบที่ซื้อมาอย่างน้อย 1 รายการ");
        setTimeout(() => setError(null), 3000);
        return;
    }
    setAppState(AppState.LOADING);
    setError(null);
    try {
        const { mealPlan: newPlan, mealIngredients } = await adaptPlanFromPurchasedIngredients(purchasedIngredients);
        const mergedPlan = mergeMealDays(newPlan);
        setMealPlan(mergedPlan);
        setFinalMealIngredients(mealIngredients);
        setShoppingList([]);
        clearActivePlan(); // Plan is finished
        setAppState(AppState.FINAL_PLAN_RESULT);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred.');
      setAppState(AppState.SHOPPING_LIST);
    }
  }, [shoppingList, clearActivePlan]);

  const handleSavePlan = () => {
    const now = new Date();
    const newPlan: SavedPlan = {
      id: now.toISOString(),
      createdAt: now.toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' }),
      mealPlan: mealPlan,
      mealIngredients: finalMealIngredients
    };
    const updatedSavedPlans = [newPlan, ...savedPlans];
    setSavedPlans(updatedSavedPlans);
    localStorage.setItem(SAVED_PLANS_STORAGE_KEY, JSON.stringify(updatedSavedPlans));
    
    // Reset state for next planning session
    setMealPlan([]);
    setShoppingList([]);
    setAllSuggestedMeals([]);
    setFinalMealIngredients({});
    setError(null);
    clearActivePlan(); // Also clear active plan on save
    setAppState(AppState.DASHBOARD);
  };
  
  const handleViewPlan = (planId: string) => {
    const planToView = savedPlans.find(p => p.id === planId);
    if (planToView) {
      setSelectedPlan(planToView);
      setAppState(AppState.VIEW_SAVED_PLAN);
    }
  };

  const reset = () => {
    // This now just goes to the dashboard without clearing active plan
    setAppState(AppState.DASHBOARD);
    setError(null);
    setSelectedPlan(null);
  };
  
  const navigateTo = (state: AppState) => {
    setError(null);
    setAppState(state);
  };

  const handleContinuePlan = useCallback(() => {
    if (activePlan) {
        setMealPlan(activePlan.mealPlan);
        setShoppingList(activePlan.shoppingList);
        setAppState(AppState.SHOPPING_LIST);
    }
  }, [activePlan]);

  return {
    appState,
    mealPlan,
    shoppingList,
    allSuggestedMeals,
    error,
    savedPlans,
    selectedPlan,
    activePlan,
    handleGeneratePlan,
    handleUpdateMeal,
    handleFinalizePlan,
    toggleIngredientChecked,
    handleFinalizeShopping,
    handleSavePlan,
    handleViewPlan,
    reset,
    navigateTo,
    handleContinuePlan,
  };
};
