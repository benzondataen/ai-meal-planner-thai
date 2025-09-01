import React, { useState } from 'react';
import { SavedPlan, Meal, MealIngredientInfo } from '../types';
import { MealIngredientsModal } from './MealIngredientsModal';

interface SavedPlanDetailViewProps {
  plan: SavedPlan;
  onBack: () => void;
}

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
                  <div key={index} className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-center bg-gray-50 p-3 rounded-lg">
                      <div className="font-bold text-gray-800 text-center sm:text-left">{day.day}</div>
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