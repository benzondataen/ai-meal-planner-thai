const MEAL_HISTORY_KEY = 'mealPlannerUserMealHistory';
const MAX_HISTORY_SIZE = 100; // Prevent localStorage from growing indefinitely

/**
 * Retrieves the user's past meal entries from localStorage.
 * @returns An array of meal names.
 */
export const getMealHistory = (): string[] => {
    try {
        const storedHistory = localStorage.getItem(MEAL_HISTORY_KEY);
        if (storedHistory) {
            const history = JSON.parse(storedHistory);
            if (Array.isArray(history)) {
                return history;
            }
        }
    } catch (error) {
        console.error("Error reading meal history from localStorage:", error);
    }
    return [];
};

/**
 * Adds a new meal name to the user's history in localStorage.
 * Avoids duplicates and trims the history if it gets too long.
 * @param mealName The new meal name to add.
 */
export const addMealToHistory = (mealName: string): void => {
    if (!mealName || typeof mealName !== 'string' || mealName.trim().length === 0) {
        return;
    }

    const trimmedMealName = mealName.trim();

    try {
        const currentHistory = getMealHistory();
        
        // Use a Set for efficient duplicate checking
        const historySet = new Set(currentHistory);
        if (!historySet.has(trimmedMealName)) {
            // Add new item to the end
            const newHistory = [...currentHistory, trimmedMealName];

            // Trim the oldest entries if the history is too long
            while (newHistory.length > MAX_HISTORY_SIZE) {
                newHistory.shift();
            }

            localStorage.setItem(MEAL_HISTORY_KEY, JSON.stringify(newHistory));
        }
    } catch (error) {
        console.error("Error saving meal history to localStorage:", error);
    }
};
