import { useState, useCallback, useEffect } from 'react';
import { AppState, MealDay, Ingredient, Meal, SavedPlan, MealIngredientInfo, ActivePlan } from '../types';
import { generateInitialMealPlan, generateShoppingListAndIngredients } from '../services/geminiService';
import { getSavedPlans, savePlan } from '../services/firestoreService';
import { auth } from '../firebase';
import { onAuthStateChanged, signOut, User } from 'firebase/auth';


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
  const [appState, setAppState] = useState<AppState>(AppState.AUTH_LOADING);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [mealPlan, setMealPlan] = useState<MealDay[]>([]);
  const [shoppingList, setShoppingList] = useState<Ingredient[]>([]);
  const [allSuggestedMeals, setAllSuggestedMeals] = useState<Meal[]>([]);
  const [error, setError] = useState<string | null>(null);
  
  const [mealIngredients, setMealIngredients] = useState<Record<string, MealIngredientInfo[]>>({});
  const [savedPlans, setSavedPlans] = useState<SavedPlan[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<SavedPlan | null>(null);
  const [activePlan, setActivePlan] = useState<ActivePlan | null>(null);
  const [isDashboardLoading, setIsDashboardLoading] = useState<boolean>(true);

  // Listen for auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, user => {
      setCurrentUser(user);
      if (user) {
        setAppState(AppState.DASHBOARD);
      } else {
        // Clear all user-specific state on logout
        setMealPlan([]);
        setShoppingList([]);
        setAllSuggestedMeals([]);
        setMealIngredients({});
        setSavedPlans([]);
        setSelectedPlan(null);
        clearActivePlan();
        setError(null);
        setAppState(AppState.LOGIN);
        setIsDashboardLoading(false);
      }
    });
    return () => unsubscribe(); // Cleanup subscription
  }, []);


  // Fetch user-specific data when currentUser is set
  useEffect(() => {
    const loadUserData = async () => {
        if (!currentUser) return;

        setIsDashboardLoading(true);
        setError(null);
        try {
            const plansFromDb = await getSavedPlans(currentUser.uid);
            setSavedPlans(plansFromDb);

            const storedActivePlan = localStorage.getItem(ACTIVE_PLAN_STORAGE_KEY);
            if (storedActivePlan) {
                setActivePlan(JSON.parse(storedActivePlan));
            }
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Could not load data.');
            console.error("Failed to load user data", e);
        } finally {
            setIsDashboardLoading(false);
        }
    };
    
    loadUserData();
  }, [currentUser]);

  const clearActivePlan = useCallback(() => {
    setActivePlan(null);
    localStorage.removeItem(ACTIVE_PLAN_STORAGE_KEY);
  }, []);
  
  const handleLogout = async () => {
    try {
        await signOut(auth);
        // onAuthStateChanged will handle the rest
    } catch (error) {
        console.error("Error signing out: ", error);
        setError("ไม่สามารถออกจากระบบได้ กรุณาลองใหม่");
    }
  };


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
      const { shoppingList: newShoppingList, mealIngredients: newMealIngredients } = await generateShoppingListAndIngredients(mealPlan);
      setShoppingList(newShoppingList);
      setMealIngredients(newMealIngredients);
      
      const newActivePlan: ActivePlan = { 
        mealPlan, 
        shoppingList: newShoppingList,
        mealIngredients: newMealIngredients,
      };
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

  const handleSavePlan = async () => {
    if (!currentUser) {
      setError("กรุณาล็อกอินเพื่อบันทึกแผน");
      setAppState(AppState.LOGIN);
      return;
    }
    setAppState(AppState.LOADING);
    setError(null);
    try {
        const now = new Date();
        const newPlan: SavedPlan = {
            id: now.toISOString(),
            createdAt: now.toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' }),
            mealPlan: mealPlan,
            mealIngredients: mealIngredients
        };
        
        await savePlan(newPlan, currentUser.uid);
        
        const updatedSavedPlans = [newPlan, ...savedPlans];
        setSavedPlans(updatedSavedPlans);
        
        // Reset state for next planning session
        setMealPlan([]);
        setShoppingList([]);
        setAllSuggestedMeals([]);
        setMealIngredients({});
        clearActivePlan(); // Also clear active plan on save
    } catch (err) {
        setError(err instanceof Error ? err.message : 'An unknown error occurred while saving.');
    } finally {
        setAppState(AppState.DASHBOARD);
    }
  };
  
  const handleViewPlan = (planId: string) => {
    const planToView = savedPlans.find(p => p.id === planId);
    if (planToView) {
      setSelectedPlan(planToView);
      setAppState(AppState.VIEW_SAVED_PLAN);
    }
  };

  const reset = () => {
    if (currentUser) {
      setAppState(AppState.DASHBOARD);
      setError(null);
      setSelectedPlan(null);
    } else {
       setAppState(AppState.LOGIN);
    }
  };
  
  const navigateTo = (state: AppState) => {
    setError(null);
    setAppState(state);
  };

  const handleContinuePlan = useCallback(() => {
    if (activePlan) {
        setMealPlan(activePlan.mealPlan);
        setShoppingList(activePlan.shoppingList);
        setMealIngredients(activePlan.mealIngredients || {});
        setAppState(AppState.SHOPPING_LIST);
    }
  }, [activePlan]);

  return {
    appState,
    currentUser,
    mealPlan,
    shoppingList,
    allSuggestedMeals,
    error,
    savedPlans,
    selectedPlan,
    activePlan,
    isDashboardLoading,
    handleLogout,
    handleGeneratePlan,
    handleUpdateMeal,
    handleFinalizePlan,
    toggleIngredientChecked,
    handleSavePlan,
    handleViewPlan,
    reset,
    navigateTo,
    handleContinuePlan,
  };
};