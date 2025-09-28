import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import { MealPlanView } from './components/MealPlanView';
import { ShoppingListView } from './components/ShoppingListView';
import { LoadingSpinner } from './components/LoadingSpinner';
import { useMealPlanner } from './hooks/useMealPlanner';
import { Ad, AppState } from './types';
import { DashboardView } from './components/DashboardView';
import { SavedPlanDetailView } from './components/SavedPlanDetailView';
import { LoginView } from './components/LoginView';
import { getAds } from './services/adsService';
import { AdPopup } from './components/AdPopup';
import { WeeklySummaryView } from './components/WeeklySummaryView';
import { SettingsModal } from './components/SettingsModal';
import { Feedback } from './components/Feedback';

function App() {
    const {
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
    } = useMealPlanner();

    const [ads, setAds] = useState<Ad[]>([]);

    useEffect(() => {
      const fetchAds = async () => {
        console.log("App.tsx: Fetching ads...");
        const adData = await getAds();
        console.log("App.tsx: Ads fetched:", adData);
        setAds(adData);
      };
      fetchAds();
    }, []);

    const renderContent = () => {
        switch (appState) {
            case AppState.AUTH_LOADING:
                return <div className="flex justify-center items-center h-64"><p>กำลังตรวจสอบการยืนยันตัวตน...</p></div>;
            case AppState.LOGIN:
                return <LoginView ads={ads} />;
            case AppState.DASHBOARD:
                return <DashboardView 
                    savedPlans={savedPlans}
                    activePlan={activePlan} 
                    onNewPlan={handleOpenNewPlanSettings} 
                    onViewPlan={handleViewPlan} 
                    onContinuePlan={handleContinuePlan}
                    error={error}
                    isDashboardLoading={isDashboardLoading}
                    />;
            case AppState.PLANNING:
                return <MealPlanView 
                    mealPlan={mealPlan} 
                    onUpdateMeal={handleUpdateMeal} 
                    onUpdateServings={handleUpdateServings}
                    onFinalize={handleFinalizePlan}
                    onAddMealToHistory={handleAddMealToHistory}
                    />;
            case AppState.SHOPPING_LIST:
                return <ShoppingListView 
                    mealPlan={mealPlan}
                    shoppingList={shoppingList} 
                    additionalExpenses={additionalExpenses}
                    onToggleItem={toggleIngredientChecked} 
                    onToggleAllItems={handleToggleAllIngredients}
                    onNavigate={navigateTo}
                    onSavePlan={handleSavePlan}
                    onUpdateIngredientPrice={handleUpdateIngredientPrice}
                    onAddAdditionalExpense={handleAddAdditionalExpense}
                    onRemoveAdditionalExpense={handleRemoveAdditionalExpense}
                    // OCR Props
                    isOcrModalOpen={isOcrModalOpen}
                    isOcrLoading={isOcrLoading}
                    isMatchingOcr={isMatchingOcr}
                    ocrResults={ocrResults}
                    openOcrModal={openOcrModal}
                    closeOcrModal={closeOcrModal}
                    handleProcessReceipt={handleProcessReceipt}
                    handleApplyOcrResults={handleApplyOcrResults}
                    />;
            case AppState.WEEKLY_SUMMARY:
                return <WeeklySummaryView
                    shoppingList={shoppingList}
                    additionalExpenses={additionalExpenses}
                    onNavigate={navigateTo}
                    onSavePlan={handleSavePlan}
                    onAddAdditionalExpense={handleAddAdditionalExpense}
                    onRemoveAdditionalExpense={handleRemoveAdditionalExpense}
                    />;
            case AppState.VIEW_SAVED_PLAN:
                return selectedPlan ? <SavedPlanDetailView plan={selectedPlan} onBack={reset} /> : <DashboardView savedPlans={savedPlans} activePlan={activePlan} onNewPlan={handleOpenNewPlanSettings} onViewPlan={handleViewPlan} onContinuePlan={handleContinuePlan} isDashboardLoading={isDashboardLoading} error={"ไม่พบแผนที่เลือก"} />;
            default:
                return <LoginView ads={ads} />;
        }
    }

    const isLoading = appState === AppState.LOADING || appState === AppState.AUTH_LOADING;

    return (
        <div className="min-h-screen bg-gray-50 font-sans">
            <Header onReset={reset} userEmail={currentUser?.email || null} onLogout={handleLogout} />
            <main className="container mx-auto px-4 sm:px-6 lg:p-8 py-10">
                {renderContent()}
            </main>
            
            <SettingsModal 
                isOpen={isSettingsModalOpen}
                onClose={closeSettingsModal}
                onSubmit={handleStartGeneration}
            />

            {currentUser && idToken && (
                <Feedback user={currentUser} idToken={idToken} />
            )}

            {/* Show overlays on top of the content */}
            {isLoading && (
                <>
                    <LoadingSpinner />
                    {ads.length > 0 && <AdPopup ads={ads} />}
                </>
            )}
        </div>
    );
}

export default App;