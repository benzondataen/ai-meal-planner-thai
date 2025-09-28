// Fix for multiple "Cannot find name" and "is not a module" errors.
// This file was a placeholder and is now fully implemented with the application's core logic.
import { useState, useEffect, useCallback } from 'react';
import { User } from 'firebase/auth';
import { auth } from '../firebase';
import { 
    generateInitialMealPlan, 
    generateShoppingListAndIngredients,
    processReceiptImage,
    matchOcrItemsToShoppingList
} from '../services/geminiService';
import { getSavedPlans, savePlan } from '../services/firestoreService';
import { addMealToHistory as saveMealToHistory } from '../services/mealHistoryService';
import { fileToBase64 } from '../utils/imageUtils';
import { 
    AppState, 
    MealDay, 
    Ingredient, 
    MealIngredientInfo,
    SavedPlan,
    AdditionalExpense,
    OcrResult,
    PlannerSettings
} from '../types';

const LOCAL_STORAGE_KEY = 'aiMealPlannerActivePlan';

export const useMealPlanner = () => {
    const [appState, setAppState] = useState<AppState>(AppState.AUTH_LOADING);
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [idToken, setIdToken] = useState<string | null>(null);

    const [mealPlan, setMealPlan] = useState<MealDay[]>([]);
    const [shoppingList, setShoppingList] = useState<Ingredient[]>([]);
    const [additionalExpenses, setAdditionalExpenses] = useState<AdditionalExpense[]>([]);
    const [mealIngredients, setMealIngredients] = useState<Record<string, MealIngredientInfo[]>>({});
    const [plannerDates, setPlannerDates] = useState<string[]>([]);
    
    const [error, setError] = useState<string | null>(null);
    
    const [savedPlans, setSavedPlans] = useState<SavedPlan[]>([]);
    const [selectedPlan, setSelectedPlan] = useState<SavedPlan | null>(null);
    const [activePlan, setActivePlan] = useState<SavedPlan | null>(null);
    
    const [isDashboardLoading, setIsDashboardLoading] = useState(true);
    const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
    
    // OCR State
    const [isOcrModalOpen, setIsOcrModalOpen] = useState(false);
    const [isOcrLoading, setIsOcrLoading] = useState(false);
    const [isMatchingOcr, setIsMatchingOcr] = useState(false);
    const [ocrResults, setOcrResults] = useState<OcrResult[]>([]);

    // --- Auth and Data Loading ---

    useEffect(() => {
        const unsubscribe = auth.onAuthStateChanged(async (user) => {
            if (user) {
                setCurrentUser(user);
                const token = await user.getIdToken();
                setIdToken(token);
                
                // Load active plan from localStorage
                try {
                    const savedActivePlan = localStorage.getItem(LOCAL_STORAGE_KEY);
                    if (savedActivePlan) {
                        const parsedPlan: SavedPlan = JSON.parse(savedActivePlan);
                        if (parsedPlan.userId === user.uid) {
                            setActivePlan(parsedPlan);
                        } else {
                            localStorage.removeItem(LOCAL_STORAGE_KEY);
                        }
                    }
                } catch (e) {
                    console.error("Failed to parse active plan from localStorage", e);
                    localStorage.removeItem(LOCAL_STORAGE_KEY);
                }

                setAppState(AppState.DASHBOARD);
                
                try {
                    setIsDashboardLoading(true);
                    const plans = await getSavedPlans(user.uid, token);
                    setSavedPlans(plans);
                } catch (e: any) {
                    setError("Could not load saved plans.");
                } finally {
                    setIsDashboardLoading(false);
                }

            } else {
                setCurrentUser(null);
                setIdToken(null);
                setAppState(AppState.LOGIN);
                setMealPlan([]);
                setShoppingList([]);
                setAdditionalExpenses([]);
                setMealIngredients({});
                setActivePlan(null);
                setSavedPlans([]);
                localStorage.removeItem(LOCAL_STORAGE_KEY);
            }
        });
        return () => unsubscribe();
    }, []);

    // --- Navigation and State Management ---

    const navigateTo = (state: AppState) => setAppState(state);

    const reset = useCallback(async () => {
        setMealPlan([]);
        setShoppingList([]);
        setAdditionalExpenses([]);
        setMealIngredients({});
        setError(null);
        setSelectedPlan(null);
        setActivePlan(null);
        setPlannerDates([]);
        localStorage.removeItem(LOCAL_STORAGE_KEY);
        setAppState(AppState.DASHBOARD);

        // Refresh saved plans list
        if(currentUser && idToken) {
            try {
                setIsDashboardLoading(true);
                const plans = await getSavedPlans(currentUser.uid, idToken);
                setSavedPlans(plans);
            } catch (e: any) {
                setError("Could not refresh saved plans.");
            } finally {
                setIsDashboardLoading(false);
            }
        }
    }, [currentUser, idToken]);

    const handleLogout = () => {
        auth.signOut();
        // The onAuthStateChanged listener will handle state cleanup
    };
    
    // --- Plan Generation and Modification ---

    const handleOpenNewPlanSettings = () => {
        setIsSettingsModalOpen(true);
    };

    const closeSettingsModal = () => {
        setIsSettingsModalOpen(false);
    };

    const handleStartGeneration = async (settings: PlannerSettings) => {
        setIsSettingsModalOpen(false);
        setAppState(AppState.LOADING);
        setError(null);
        try {
            setPlannerDates(settings.dates.map(d => d.toISOString().split('T')[0]));
            const { mealPlan: newMealPlan, shoppingList: newShoppingList } = await generateInitialMealPlan(settings);
            // Default servings to 2 for all meals
            const planWithServings = newMealPlan.map(day => ({
                ...day,
                breakfast: day.breakfast ? { ...day.breakfast, servings: 2 } : undefined,
                lunch: day.lunch ? { ...day.lunch, servings: 2 } : undefined,
                dinner: day.dinner ? { ...day.dinner, servings: 2 } : undefined,
            }));
            setMealPlan(planWithServings);
            setShoppingList(newShoppingList);
            setAppState(AppState.PLANNING);
        } catch (e: any) {
            setError(e.message || 'An unknown error occurred.');
            setAppState(AppState.DASHBOARD);
        }
    };
    
    const handleUpdateMeal = (dayIndex: number, mealType: 'breakfast' | 'lunch' | 'dinner', newMealName: string) => {
        setMealPlan(currentPlan => {
            const newPlan = [...currentPlan];
            const day = newPlan[dayIndex];
            if (day && day[mealType]) {
                day[mealType]!.name = newMealName;
            } else if (day) {
                // If the meal was null/undefined, create it
                day[mealType] = { name: newMealName, servings: 2 };
            }
            return newPlan;
        });
    };

    const handleUpdateServings = (dayIndex: number, mealType: 'breakfast' | 'lunch' | 'dinner', newServings: number) => {
        if (newServings < 1) return; // Servings can't be less than 1
        setMealPlan(currentPlan => {
            const newPlan = [...currentPlan];
            const day = newPlan[dayIndex];
            if (day && day[mealType]) {
                day[mealType]!.servings = newServings;
            }
            return newPlan;
        });
    };

    const handleAddMealToHistory = (mealName: string) => {
        if (mealName.trim()) {
            saveMealToHistory(mealName.trim());
        }
    };

    const handleFinalizePlan = async () => {
        setAppState(AppState.LOADING);
        setError(null);
        try {
            const { shoppingList: newShoppingList, mealIngredients: newMealIngredients } = await generateShoppingListAndIngredients(mealPlan);
            setShoppingList(newShoppingList);
            setMealIngredients(newMealIngredients);
            setAppState(AppState.SHOPPING_LIST);
        } catch (e: any) {
            setError(e.message || "Could not generate the shopping list.");
            setAppState(AppState.PLANNING); // Go back to planning on error
        }
    };

    // --- Shopping List Management ---

    const toggleIngredientChecked = (itemName: string) => {
        setShoppingList(list =>
            list.map(item =>
                item.name === itemName ? { ...item, checked: !item.checked } : item
            )
        );
    };
    
    const handleToggleAllIngredients = () => {
        const allChecked = shoppingList.every(item => item.checked);
        setShoppingList(list => list.map(item => ({ ...item, checked: !allChecked })));
    };

    const handleUpdateIngredientPrice = (itemName: string, price: number) => {
        setShoppingList(list =>
            list.map(item =>
                item.name === itemName ? { ...item, price: isNaN(price) ? undefined : price } : item
            )
        );
    };

    const handleAddAdditionalExpense = (expense: Omit<AdditionalExpense, 'id'>) => {
        const newExpense: AdditionalExpense = { ...expense, id: Date.now().toString() };
        setAdditionalExpenses(prev => [...prev, newExpense]);
    };

    const handleRemoveAdditionalExpense = (expenseId: string) => {
        setAdditionalExpenses(prev => prev.filter(exp => exp.id !== expenseId));
    };

    // --- OCR Functionality ---

    const openOcrModal = () => setIsOcrModalOpen(true);
    const closeOcrModal = () => {
        setIsOcrModalOpen(false);
        setOcrResults([]); // Clear results on close
    };

    const handleProcessReceipt = async (file: File) => {
        setIsOcrLoading(true);
        setOcrResults([]);
        try {
            const base64Image = await fileToBase64(file);
            const results = await processReceiptImage(base64Image, file.type);
            setOcrResults(results);
        } catch (e: any) {
            alert(`Error processing receipt: ${e.message}`);
        } finally {
            setIsOcrLoading(false);
        }
    };

    const handleApplyOcrResults = async (selectedItems: OcrResult[]): Promise<number> => {
        setIsMatchingOcr(true);
        try {
            const matchedPairs = await matchOcrItemsToShoppingList(selectedItems, shoppingList);
            
            if (matchedPairs.length > 0) {
                const matchedShoppingListNames = new Set(matchedPairs.map(p => p.shoppingListItemName));
                const priceMap = new Map(selectedItems.map(item => [item.name, item.price]));

                setShoppingList(currentList => {
                    return currentList.map(item => {
                        if (matchedShoppingListNames.has(item.name)) {
                            // Find the corresponding receipt item to get the price
                            const match = matchedPairs.find(p => p.shoppingListItemName === item.name);
                            const receiptPrice = match ? priceMap.get(match.receiptItemName) : undefined;
                            return {
                                ...item,
                                checked: true,
                                price: receiptPrice !== undefined ? receiptPrice : item.price,
                            };
                        }
                        return item;
                    });
                });
            }
            closeOcrModal();
            return matchedPairs.length;
        } catch (e: any) {
            alert(`Error matching items: ${e.message}`);
            return 0;
        } finally {
            setIsMatchingOcr(false);
        }
    };

    // --- Plan Persistence ---

    const buildCurrentPlan = useCallback((): SavedPlan => {
        return {
            id: `plan_${Date.now()}`,
            createdAt: new Date().toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' }),
            mealPlan,
            shoppingList,
            mealIngredients,
            additionalExpenses,
// Fix: Changed `planDates` to `plannerDates` to match the state variable name.
            planDates: plannerDates,
            userId: currentUser!.uid,
        };
    }, [mealPlan, shoppingList, mealIngredients, additionalExpenses, currentUser, plannerDates]);

    useEffect(() => {
        // Auto-save active plan to localStorage whenever it changes
        if (appState === AppState.PLANNING || appState === AppState.SHOPPING_LIST || appState === AppState.WEEKLY_SUMMARY) {
            if (currentUser && mealPlan.length > 0) {
                const currentPlan = buildCurrentPlan();
                setActivePlan(currentPlan);
                localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(currentPlan));
            }
        }
    }, [mealPlan, shoppingList, mealIngredients, additionalExpenses, appState, currentUser, buildCurrentPlan]);

    const handleSavePlan = async () => {
        if (!currentUser || !idToken) {
            setError("You must be logged in to save a plan.");
            return;
        }
        setAppState(AppState.LOADING);
        try {
            const planToSave = buildCurrentPlan();
            await savePlan(planToSave, currentUser.uid, idToken);
            await reset(); // Resets to dashboard and re-fetches plans
        } catch (e: any) {
            setError(e.message || "Failed to save the plan.");
            setAppState(AppState.WEEKLY_SUMMARY); // Return to summary on failure
        }
    };

    const handleViewPlan = (plan: SavedPlan) => {
        setSelectedPlan(plan);
        setAppState(AppState.VIEW_SAVED_PLAN);
    };

    const handleContinuePlan = (plan: SavedPlan) => {
        setMealPlan(plan.mealPlan);
        setShoppingList(plan.shoppingList);
        setAdditionalExpenses(plan.additionalExpenses || []);
        setMealIngredients(plan.mealIngredients);
        setPlannerDates(plan.planDates || []);
        setActivePlan(plan);
        // Determine which screen to go to based on available data
        if (plan.shoppingList && plan.shoppingList.length > 0) {
            setAppState(AppState.SHOPPING_LIST);
        } else {
            setAppState(AppState.PLANNING);
        }
    };

    return {
        appState,
        currentUser,
        idToken,
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
        closeSettingsModal,
    };
};
