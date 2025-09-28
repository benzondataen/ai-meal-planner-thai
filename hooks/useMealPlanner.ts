import { useState, useCallback, useEffect } from 'react';
import { AppState, MealDay, Ingredient, Meal, SavedPlan, MealIngredientInfo, ActivePlan, AdditionalExpense, OcrResult, MatchedItemPair, PlannerSettings } from '../types';
import { generateInitialMealPlan, generateShoppingListAndIngredients, processReceiptImage, matchOcrItemsToShoppingList } from '../services/geminiService';
import { getSavedPlans, savePlan } from '../services/firestoreService';
import firebase, { auth } from '../firebase';
import { addMealToHistory } from '../services/mealHistoryService';
import { fileToBase64 } from '../utils/imageUtils';
import { fuzzySearch } from '../utils/fuzzySearch';


const ACTIVE_PLAN_STORAGE_KEY = 'mealPlannerActivePlan';

export const useMealPlanner = () => {
  const [appState, setAppState] = useState<AppState>(AppState.AUTH_LOADING);
  const [currentUser, setCurrentUser] = useState<firebase.User | null>(null);
  const [mealPlan, setMealPlan] = useState<MealDay[]>([]);
  const [shoppingList, setShoppingList] = useState<Ingredient[]>([]);
  const [additionalExpenses, setAdditionalExpenses] = useState<AdditionalExpense[]>([]);
  const [error, setError] = useState<string | null>(null);
  
  const [mealIngredients, setMealIngredients] = useState<Record<string, MealIngredientInfo[]>>({});
  const [savedPlans, setSavedPlans] = useState<SavedPlan[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<SavedPlan | null>(null);
  const [activePlan, setActivePlan] = useState<ActivePlan | null>(null);
  const [isDashboardLoading, setIsDashboardLoading] = useState<boolean>(true);
  
  // Settings Modal State
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);

  // OCR State
  const [isOcrModalOpen, setIsOcrModalOpen] = useState(false);
  const [isOcrLoading, setIsOcrLoading] = useState(false);
  const [ocrResults, setOcrResults] = useState<OcrResult[]>([]);
  const [isMatchingOcr, setIsMatchingOcr] = useState(false);


  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(user => {
      setCurrentUser(user);
      if (user) {
        setAppState(AppState.DASHBOARD);
      } else {
        setMealPlan([]);
        setShoppingList([]);
        setAdditionalExpenses([]);
        setMealIngredients({});
        setSavedPlans([]);
        setSelectedPlan(null);
        clearActivePlan();
        setError(null);
        setAppState(AppState.LOGIN);
        setIsDashboardLoading(false);
      }
    });
    return () => unsubscribe();
  }, []);


  useEffect(() => {
    const loadUserData = async () => {
        if (!currentUser) return;

        setIsDashboardLoading(true);
        setError(null);
        try {
            const idToken = await currentUser.getIdToken(true);
            const plansFromDb = await getSavedPlans(currentUser.uid, idToken);
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
        await auth.signOut();
    } catch (error) {
        console.error("Error signing out: ", error);
        setError("ไม่สามารถออกจากระบบได้ กรุณาลองใหม่");
    }
  };


  const handleOpenNewPlanSettings = useCallback(() => {
    clearActivePlan();
    setError(null);
    setIsSettingsModalOpen(true);
  }, [clearActivePlan]);

  const handleStartGeneration = useCallback(async (settings: PlannerSettings) => {
    setIsSettingsModalOpen(false);
    setAppState(AppState.LOADING);
    setError(null);
    try {
      const { mealPlan: newPlan } = await generateInitialMealPlan(settings);

      const planWithServings = newPlan.map(day => {
        const newDay: MealDay = { day: day.day };
        if (day.breakfast) newDay.breakfast = { ...day.breakfast, servings: 2 };
        if (day.lunch) newDay.lunch = { ...day.lunch, servings: 2 };
        if (day.dinner) newDay.dinner = { ...day.dinner, servings: 2 };
        return newDay;
      });

      setMealPlan(planWithServings);
      setShoppingList([]);
      setAdditionalExpenses([]);
      setAppState(AppState.PLANNING);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred.');
      setAppState(AppState.DASHBOARD);
    }
  }, []);

  const handleUpdateMeal = (dayIndex: number, mealType: 'breakfast' | 'lunch' | 'dinner', newMealName: string) => {
    const updatedPlan = [...mealPlan];
     if (updatedPlan[dayIndex]) {
        let meal = updatedPlan[dayIndex][mealType];
        if (!meal) {
            meal = { name: newMealName, servings: 2 };
        } else {
            meal.name = newMealName;
        }
        updatedPlan[dayIndex][mealType] = meal;
        setMealPlan(updatedPlan);
    }
  };
  
  const handleUpdateServings = (dayIndex: number, mealType: 'breakfast' | 'lunch' | 'dinner', newServings: number) => {
    const updatedPlan = [...mealPlan];
    const day = updatedPlan[dayIndex];
    if (day && day[mealType]) {
        const validServings = Math.max(1, newServings);
        day[mealType]!.servings = validServings;
        setMealPlan([...updatedPlan]);
    }
  };

  const handleAddMealToHistory = useCallback((mealName: string) => {
    addMealToHistory(mealName);
  }, []);

  const handleFinalizePlan = useCallback(async () => {
    setAppState(AppState.LOADING);
    setError(null);
    try {
      const { shoppingList: newShoppingList, mealIngredients: newMealIngredients } = await generateShoppingListAndIngredients(mealPlan);
      
      const filteredShoppingList = newShoppingList.filter(item => item.usedIn && item.usedIn.length > 0);
      const pricedShoppingList = filteredShoppingList.map(item => ({ ...item, price: 0 }));

      setShoppingList(pricedShoppingList);
      setMealIngredients(newMealIngredients);
      setAdditionalExpenses([]);
      
      const newActivePlan: ActivePlan = { 
        mealPlan, 
        shoppingList: pricedShoppingList,
        mealIngredients: newMealIngredients,
        additionalExpenses: [],
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
  
  const handleToggleAllIngredients = () => {
    const areAllChecked = shoppingList.length > 0 && shoppingList.every(item => item.checked);
    const newCheckedState = !areAllChecked;
    const updatedShoppingList = shoppingList.map(item => ({ ...item, checked: newCheckedState }));
    setShoppingList(updatedShoppingList);

    if (activePlan) {
      const updatedActivePlan = { ...activePlan, shoppingList: updatedShoppingList };
      setActivePlan(updatedActivePlan);
      localStorage.setItem(ACTIVE_PLAN_STORAGE_KEY, JSON.stringify(updatedActivePlan));
    }
  };


  const handleUpdateIngredientPrice = (itemName: string, price: number) => {
    const updatedShoppingList = shoppingList.map(item => 
      item.name === itemName ? { ...item, price: isNaN(price) ? 0 : price } : item
    );
    setShoppingList(updatedShoppingList);
    if (activePlan) {
        const updatedActivePlan = { ...activePlan, shoppingList: updatedShoppingList };
        setActivePlan(updatedActivePlan);
        localStorage.setItem(ACTIVE_PLAN_STORAGE_KEY, JSON.stringify(updatedActivePlan));
    }
  };

  const handleAddAdditionalExpense = (expense: Omit<AdditionalExpense, 'id'>) => {
    const newExpense = { ...expense, id: Date.now().toString() };
    const newExpenses = [...additionalExpenses, newExpense];
    setAdditionalExpenses(newExpenses);
    if (activePlan) {
        const updatedActivePlan = { ...activePlan, additionalExpenses: newExpenses };
        setActivePlan(updatedActivePlan);
        localStorage.setItem(ACTIVE_PLAN_STORAGE_KEY, JSON.stringify(updatedActivePlan));
    }
  };

  const handleRemoveAdditionalExpense = (expenseId: string) => {
    const newExpenses = additionalExpenses.filter(exp => exp.id !== expenseId);
    setAdditionalExpenses(newExpenses);
    if (activePlan) {
        const updatedActivePlan = { ...activePlan, additionalExpenses: newExpenses };
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
            mealIngredients: mealIngredients,
            shoppingList: shoppingList,
            additionalExpenses: additionalExpenses,
        };
        
        const idToken = await currentUser.getIdToken(true);
        await savePlan(newPlan, currentUser.uid, idToken);
        
        const updatedSavedPlans = [newPlan, ...savedPlans];
        setSavedPlans(updatedSavedPlans);
        
        setMealPlan([]);
        setShoppingList([]);
        setAdditionalExpenses([]);
        setMealIngredients({});
        clearActivePlan();
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
        setAdditionalExpenses(activePlan.additionalExpenses || []);
        setAppState(AppState.SHOPPING_LIST);
    }
  }, [activePlan]);

  // OCR Handlers
  const handleProcessReceipt = async (imageFile: File) => {
    setIsOcrLoading(true);
    setOcrResults([]);
    setError(null);
    try {
        const base64Image = await fileToBase64(imageFile);
        const results = await processReceiptImage(base64Image, imageFile.type);
        setOcrResults(results);
    } catch (err) {
        setError(err instanceof Error ? err.message : "เกิดข้อผิดพลาดในการอ่านใบเสร็จ");
    } finally {
        setIsOcrLoading(false);
    }
  };

  const handleApplyOcrResults = async (selectedItems: OcrResult[]): Promise<number> => {
    if (selectedItems.length === 0) return 0;
    
    setIsMatchingOcr(true);
    setError(null);
    let matchedCount = 0;

    try {
      const uncheckedItems = shoppingList.filter(item => !item.checked);
      const matchedPairs = await matchOcrItemsToShoppingList(selectedItems, uncheckedItems);
      
      const updatedShoppingList = [...shoppingList];

      matchedPairs.forEach(pair => {
        const ocrItem = selectedItems.find(item => item.name === pair.receiptItemName);
        const itemIndex = updatedShoppingList.findIndex(item => item.name === pair.shoppingListItemName && !item.checked);

        if (ocrItem && itemIndex !== -1) {
            updatedShoppingList[itemIndex] = {
                ...updatedShoppingList[itemIndex],
                price: ocrItem.price,
                checked: true,
            };
            matchedCount++;
        }
      });
      
      setShoppingList(updatedShoppingList);
      if (activePlan) {
          const updatedActivePlan = { ...activePlan, shoppingList: updatedShoppingList };
          setActivePlan(updatedActivePlan);
          localStorage.setItem(ACTIVE_PLAN_STORAGE_KEY, JSON.stringify(updatedActivePlan));
      }
      setIsOcrModalOpen(false);
      return matchedCount;

    } catch (err) {
        setError(err instanceof Error ? err.message : "เกิดข้อผิดพลาดในการจับคู่รายการ");
        return 0; // Return 0 on error
    } finally {
        setIsMatchingOcr(false);
    }
  };
  
  const openOcrModal = () => {
      setOcrResults([]);
      setError(null);
      setIsOcrModalOpen(true);
  };
  const closeOcrModal = () => setIsOcrModalOpen(false);


  return {
    appState,
    currentUser,
    mealPlan,
    shoppingList,
    additionalExpenses,
    mealIngredients,
    error,
    savedPlans,
    selectedPlan,
    activePlan,
    isDashboardLoading,
    isSettingsModalOpen,
    isOcrModalOpen,
    isOcrLoading,
    ocrResults,
    isMatchingOcr,
    handleLogout,
    handleOpenNewPlanSettings,
    handleStartGeneration,
    handleUpdateMeal,
    handleUpdateServings,
    handleAddMealToHistory,
    handleFinalizePlan,
    toggleIngredientChecked,
    handleToggleAllIngredients,
    handleUpdateIngredientPrice,
    handleAddAdditionalExpense,
    handleRemoveAdditionalExpense,
    handleSavePlan,
    handleViewPlan,
    reset,
    navigateTo,
    handleContinuePlan,
    handleProcessReceipt,
    handleApplyOcrResults,
    openOcrModal,
    closeOcrModal,
    closeSettingsModal: () => setIsSettingsModalOpen(false),
  };
};
