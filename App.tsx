import React from 'react';
import Header from './components/Header';
import { MealPlanView } from './components/MealPlanView';
import { ShoppingListView } from './components/ShoppingListView';
import { LoadingSpinner } from './components/LoadingSpinner';
import { useMealPlanner } from './hooks/useMealPlanner';
import { AppState } from './types';
import { DashboardView } from './components/DashboardView';
import { SavedPlanDetailView } from './components/SavedPlanDetailView';
import { LoginView } from './components/LoginView';

function App() {
    const {
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
        handleContinuePlan
    } = useMealPlanner();

    const renderContent = () => {
        switch (appState) {
            case AppState.AUTH_LOADING:
                return <div className="flex justify-center items-center h-64"><p>กำลังตรวจสอบการยืนยันตัวตน...</p></div>;
            case AppState.LOGIN:
                return <LoginView />;
            case AppState.DASHBOARD:
                return <DashboardView 
                    savedPlans={savedPlans}
                    activePlan={activePlan} 
                    onNewPlan={handleGeneratePlan} 
                    onViewPlan={handleViewPlan} 
                    onContinuePlan={handleContinuePlan}
                    error={error}
                    isDashboardLoading={isDashboardLoading}
                    />;
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
                return selectedPlan ? <SavedPlanDetailView plan={selectedPlan} onBack={reset} /> : <DashboardView savedPlans={savedPlans} activePlan={activePlan} onNewPlan={handleGeneratePlan} onViewPlan={handleViewPlan} onContinuePlan={handleContinuePlan} isDashboardLoading={isDashboardLoading} error={"ไม่พบแผนที่เลือก"} />;
            default:
                return <LoginView />;
        }
    }

    return (
        <div className="min-h-screen bg-gray-50 font-sans">
            <Header onReset={reset} userEmail={currentUser?.email || null} onLogout={handleLogout} />
            <main className="container mx-auto px-4 sm:px-6 lg:p-8 py-10">
                {(appState === AppState.LOADING || appState === AppState.AUTH_LOADING) && <LoadingSpinner />}
                {renderContent()}
            </main>
        </div>
    );
}

export default App;