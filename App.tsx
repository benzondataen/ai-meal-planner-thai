import React from 'react';
import Header from './components/Header';
import { MealPlanView } from './components/MealPlanView';
import { ShoppingListView } from './components/ShoppingListView';
import { LoadingSpinner } from './components/LoadingSpinner';
import { useMealPlanner } from './hooks/useMealPlanner';
import { AppState, MealDay, SavedPlan } from './types';
import { DashboardView } from './components/DashboardView';
import { SavedPlanDetailView } from './components/SavedPlanDetailView';

const FinalPlanResultView: React.FC<{ mealPlan: MealDay[], onSave: () => void }> = ({ mealPlan, onSave }) => (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-xl p-8">
        <div className="text-center mb-8">
            <h2 className="text-3xl font-extrabold text-gray-800">แผนอาหารฉบับสมบูรณ์</h2>
            <p className="mt-2 text-lg text-gray-600">นี่คือเมนูใหม่จากวัตถุดิบที่คุณซื้อมา</p>
        </div>
        <div className="space-y-4">
            {mealPlan.map((day, index) => (
                <div key={index} className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-center bg-gray-50 p-3 rounded-lg">
                    <div className="font-bold text-gray-800 text-center sm:text-left">{day.day}</div>
                    <div className="text-gray-600 text-center sm:text-left">กลางวัน: {day.lunch?.name || 'ไม่มีเมนู'}</div>
                    <div className="text-gray-600 text-center sm:text-left">เย็น: {day.dinner?.name || 'ไม่มีเมนู'}</div>
                </div>
            ))}
        </div>
        <div className="mt-10 flex justify-center">
            <button
                onClick={onSave}
                className="bg-teal-600 text-white font-bold py-3 px-6 rounded-full hover:bg-teal-700 focus:outline-none focus:ring-4 focus:ring-teal-300 transition duration-300"
            >
                บันทึกแผนและกลับสู่หน้าหลัก
            </button>
        </div>
      </div>
    </div>
);

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
        handleFinalizeShopping,
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
                    onFinalizeShopping={handleFinalizeShopping}
                    error={error}
                    />;
            case AppState.FINAL_PLAN_RESULT:
                return <FinalPlanResultView mealPlan={mealPlan} onSave={handleSavePlan} />;
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
