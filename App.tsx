import React from 'react';
import Header from './components/Header';
import { MealPlanView } from './components/MealPlanView';
import { ShoppingListView } from './components/ShoppingListView';
import { LoadingSpinner } from './components/LoadingSpinner';
import { useMealPlanner } from './hooks/useMealPlanner';
import { AppState, MealDay, SavedPlan } from './types';
import { DashboardView } from './components/DashboardView';
import { SavedPlanDetailView } from './components/SavedPlanDetailView';

function App() {
    const {
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
        handleSavePlan,
        handleViewPlan,
        reset,
        navigateTo,
        handleContinuePlan
    } = useMealPlanner();

    const renderContent = () => {
        switch (appState) {
            case AppState.DASHBOARD:
                return <DashboardView 
                    savedPlans={savedPlans}
                    activePlan={activePlan} 
                    onNewPlan={handleGeneratePlan} 
                    onViewPlan={handleViewPlan} 
                    onContinuePlan={handleContinuePlan}
                    error={error} />;
            case AppState.PLANNING:
                return <MealPlanView 
                    mealPlan={mealPlan} 
                    allSuggestedMeals={allSuggestedMeals} 
                    onUpdateMeal={handleUpdateMeal} 
                    onFinalize={handleFinalizePlan} />;
            case AppState.SHOPPING_LIST:
                return <ShoppingListView 
                    shoppingList={shoppingList} 
                    onToggleItem={toggleIngredientChecked} 
                    onNavigate={navigateTo}
                    onSavePlan={handleSavePlan}
                    />;
            case AppState.VIEW_SAVED_PLAN:
                return selectedPlan ? <SavedPlanDetailView plan={selectedPlan} onBack={reset} /> : <DashboardView savedPlans={savedPlans} activePlan={activePlan} onNewPlan={handleGeneratePlan} onViewPlan={handleViewPlan} onContinuePlan={handleContinuePlan} error={"ไม่พบแผนที่เลือก"} />;
            default:
                return <DashboardView savedPlans={savedPlans} activePlan={activePlan} onNewPlan={handleGeneratePlan} onViewPlan={handleViewPlan} onContinuePlan={handleContinuePlan} error={error} />;
        }
    }

    return (
        <div className="min-h-screen bg-gray-50 font-sans">
            <Header onReset={reset} />
            <main className="container mx-auto px-4 sm:px-6 lg:p-8 py-10">
                {appState === AppState.LOADING && <LoadingSpinner />}
                {renderContent()}
            </main>
        </div>
    );
}

export default App;
