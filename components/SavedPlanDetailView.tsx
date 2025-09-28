import React, { useState, useMemo } from 'react';
import { SavedPlan, Meal, MealIngredientInfo, Ingredient, AdditionalExpense } from '../types';
import { MealIngredientsModal } from './MealIngredientsModal';
import { ChefHatIcon } from './icons/ChefHatIcon';

interface SavedPlanDetailViewProps {
  plan: SavedPlan;
  onBack: () => void;
}

const CostSummary: React.FC<{ shoppingList: Ingredient[], additionalExpenses: AdditionalExpense[] }> = ({ shoppingList, additionalExpenses }) => {
    const shoppingListTotal = useMemo(() => (shoppingList || []).reduce((sum, item) => sum + (item.price || 0), 0), [shoppingList]);
    const additionalExpensesTotal = useMemo(() => (additionalExpenses || []).reduce((sum, item) => sum + item.price, 0), [additionalExpenses]);
    const grandTotal = shoppingListTotal + additionalExpensesTotal;

    return (
        <div className="mt-8 pt-6 border-t-2 border-dashed">
            <h3 className="text-2xl font-bold text-gray-800 mb-4 text-center">สรุปค่าใช้จ่ายประจำสัปดาห์</h3>
            <div className="max-w-md mx-auto space-y-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="font-bold text-gray-700 mb-2">ค่าวัตถุดิบ</h4>
                    <ul className="space-y-1 text-sm max-h-40 overflow-y-auto pr-2">
                        {(shoppingList || []).map((item, index) => (
                            <li key={index} className="flex justify-between">
                                <span className="text-gray-600">{item.name}</span>
                                <span className="font-medium text-gray-700">{(item.price || 0).toFixed(2)} บาท</span>
                            </li>
                        ))}
                    </ul>
                     <div className="flex justify-between font-bold border-t pt-2 mt-2">
                        <span>รวมค่าวัตถุดิบ</span>
                        <span>{shoppingListTotal.toFixed(2)} บาท</span>
                    </div>
                </div>

                 {(additionalExpenses || []).length > 0 && (
                    <div className="bg-gray-50 p-4 rounded-lg">
                        <h4 className="font-bold text-gray-700 mb-2">รายจ่ายเพิ่มเติม</h4>
                        <ul className="space-y-1 text-sm">
                            {additionalExpenses.map((item, index) => (
                                <li key={index} className="flex justify-between">
                                    <span className="text-gray-600">{item.name}</span>
                                    <span className="font-medium text-gray-700">{item.price.toFixed(2)} บาท</span>
                                </li>
                            ))}
                        </ul>
                        <div className="flex justify-between font-bold border-t pt-2 mt-2">
                            <span>รวมรายจ่ายเพิ่มเติม</span>
                            <span>{additionalExpensesTotal.toFixed(2)} บาท</span>
                        </div>
                    </div>
                )}
                
                <div className="flex justify-between items-center text-xl p-4 bg-teal-50 rounded-lg">
                    <span className="font-bold text-gray-800">ยอดรวมทั้งหมด:</span>
                    <span className="font-bold text-teal-600">{grandTotal.toFixed(2)} บาท</span>
                </div>
            </div>
        </div>
    );
};


export const SavedPlanDetailView: React.FC<SavedPlanDetailViewProps> = ({ plan, onBack }) => {
  const [modalData, setModalData] = useState<{ mealName: string, ingredients: MealIngredientInfo[] } | null>(null);

  const handleMealClick = (meal: Meal | null) => {
    if (meal && meal.name && plan.mealIngredients[meal.name]) {
      setModalData({
        mealName: meal.name,
        ingredients: plan.mealIngredients[meal.name]
      });
    }
  };

  return (
    <>
      <div className="p-4 sm:p-6 lg:p-8">
        <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-xl p-8">
          <div className="text-center mb-8">
              <h2 className="text-3xl font-extrabold text-gray-800">แผนอาหารสำหรับสัปดาห์</h2>
              <p className="mt-2 text-lg text-gray-600">{plan.createdAt}</p>
          </div>
          <div className="space-y-4">
              {plan.mealPlan.map((day, index) => (
                  <div key={index} className="grid grid-cols-1 sm:grid-cols-4 gap-4 items-center bg-gray-50 p-3 rounded-lg">
                      <div className="font-bold text-gray-800 text-center sm:text-left">{day.day}</div>
                       <div className="text-gray-600 text-center sm:text-left">
                          <span className="mr-2">เช้า:</span> 
                          <button 
                            onClick={() => handleMealClick(day.breakfast)}
                            disabled={!day.breakfast || !plan.mealIngredients[day.breakfast.name]}
                            className="font-medium text-teal-600 hover:text-teal-800 disabled:text-gray-400 disabled:cursor-not-allowed"
                          >
                            {day.breakfast?.name || 'ไม่มีเมนู'}
                          </button>
                      </div>
                      <div className="text-gray-600 text-center sm:text-left">
                          <span className="mr-2">กลางวัน:</span> 
                          <button 
                            onClick={() => handleMealClick(day.lunch)}
                            disabled={!day.lunch || !plan.mealIngredients[day.lunch.name]}
                            className="font-medium text-teal-600 hover:text-teal-800 disabled:text-gray-400 disabled:cursor-not-allowed"
                          >
                            {day.lunch?.name || 'ไม่มีเมนู'}
                          </button>
                      </div>
                      <div className="text-gray-600 text-center sm:text-left">
                          <span className="mr-2">เย็น:</span> 
                          <button 
                            onClick={() => handleMealClick(day.dinner)}
                            disabled={!day.dinner || !plan.mealIngredients[day.dinner.name]}
                            className="font-medium text-teal-600 hover:text-teal-800 disabled:text-gray-400 disabled:cursor-not-allowed"
                          >
                            {day.dinner?.name || 'ไม่มีเมนู'}
                          </button>
                      </div>
                  </div>
              ))}
          </div>

          <CostSummary shoppingList={plan.shoppingList || []} additionalExpenses={plan.additionalExpenses || []} />

          <div className="mt-10 flex justify-center">
              <button
                  onClick={onBack}
                  className="bg-gray-200 text-gray-800 font-bold py-3 px-6 rounded-full hover:bg-gray-300 focus:outline-none focus:ring-4 focus:ring-gray-300 transition duration-300"
              >
                  กลับสู่หน้าหลัก
              </button>
          </div>
        </div>
      </div>
      {modalData && (
          <MealIngredientsModal 
            isOpen={!!modalData}
            onClose={() => setModalData(null)}
            mealName={modalData.mealName}
            ingredients={modalData.ingredients}
          />
      )}
    </>
  );
};
