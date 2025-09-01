import React from 'react';
import { MealDay, Meal } from '../types';

interface MealPlanViewProps {
  mealPlan: MealDay[];
  allSuggestedMeals: Meal[];
  onUpdateMeal: (dayIndex: number, mealType: 'lunch' | 'dinner', newMealName: string) => void;
  onFinalize: () => void;
}

const MealCard: React.FC<{day: MealDay, dayIndex: number, allSuggestedMeals: Meal[], onUpdateMeal: MealPlanViewProps['onUpdateMeal']}> = ({ day, dayIndex, allSuggestedMeals, onUpdateMeal }) => {
    return (
        <div className="bg-white rounded-xl shadow-lg overflow-hidden transform hover:-translate-y-1 transition-transform duration-300">
            <div className="bg-teal-500 p-4">
                <h3 className="text-xl font-bold text-white text-center">{day.day}</h3>
            </div>
            <div className="p-6 space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">มื้อกลางวัน</label>
                    <select
                        value={day.lunch?.name || ''}
                        onChange={(e) => onUpdateMeal(dayIndex, 'lunch', e.target.value)}
                        className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-teal-500 focus:border-teal-500"
                    >
                        {allSuggestedMeals.map(meal => <option key={`lunch-${dayIndex}-${meal.name}`} value={meal.name}>{meal.name}</option>)}
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">มื้อเย็น</label>
                    <select
                        value={day.dinner?.name || ''}
                        onChange={(e) => onUpdateMeal(dayIndex, 'dinner', e.target.value)}
                        className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-teal-500 focus:border-teal-500"
                    >
                        {allSuggestedMeals.map(meal => <option key={`dinner-${dayIndex}-${meal.name}`} value={meal.name}>{meal.name}</option>)}
                    </select>
                </div>
            </div>
        </div>
    );
}


export const MealPlanView: React.FC<MealPlanViewProps> = ({ mealPlan, allSuggestedMeals, onUpdateMeal, onFinalize }) => {
  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-10">
          <h2 className="text-3xl font-extrabold text-gray-800">แผนอาหารประจำสัปดาห์ของคุณ</h2>
          <p className="mt-2 text-lg text-gray-600">คุณสามารถปรับเปลี่ยนเมนูในแต่ละวันได้ตามต้องการ</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {mealPlan.map((day, index) => (
            <MealCard key={index} day={day} dayIndex={index} allSuggestedMeals={allSuggestedMeals} onUpdateMeal={onUpdateMeal} />
          ))}
        </div>
        <div className="mt-12 flex justify-center">
            <button
            onClick={onFinalize}
            className="bg-teal-600 text-white font-bold py-4 px-8 rounded-full text-lg hover:bg-teal-700 focus:outline-none focus:ring-4 focus:ring-teal-300 transform transition duration-300 ease-in-out hover:scale-105"
            >
            ยืนยันเมนูและสร้างรายการซื้อของ
            </button>
        </div>
      </div>
    </div>
  );
};