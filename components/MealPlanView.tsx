import React from 'react';
import { Meal, MealDay } from '../types';

interface MealPlanViewProps {
  mealPlan: MealDay[];
  onUpdateMeal: (dayIndex: number, mealType: 'breakfast' | 'lunch' | 'dinner', newMealName: string) => void;
  onUpdateServings: (dayIndex: number, mealType: 'breakfast' | 'lunch' | 'dinner', newServings: number) => void;
  onFinalize: () => void;
  onAddMealToHistory: (mealName: string) => void;
}

const ServingsControl: React.FC<{ 
    meal: Meal | undefined, 
    onUpdate: (newServings: number) => void 
}> = ({ meal, onUpdate }) => {
    if (!meal?.name) return null; // Only show servings control if there is a meal

    const currentServings = meal.servings || 2;

    return (
        <div className="flex items-center justify-between mt-3">
            <label className="text-sm font-medium text-gray-500">จำนวนคน</label>
            <div className="flex items-center gap-2">
                <button
                    onClick={() => onUpdate(currentServings - 1)}
                    className="w-7 h-7 flex items-center justify-center bg-gray-200 text-gray-700 rounded-full font-bold text-lg hover:bg-gray-300 disabled:opacity-50"
                    disabled={currentServings <= 1}
                    aria-label="ลดจำนวนคน"
                >
                    -
                </button>
                <span className="w-8 text-center font-semibold text-gray-800">{currentServings}</span>
                <button
                    onClick={() => onUpdate(currentServings + 1)}
                    className="w-7 h-7 flex items-center justify-center bg-gray-200 text-gray-700 rounded-full font-bold text-lg hover:bg-gray-300"
                    aria-label="เพิ่มจำนวนคน"
                >
                    +
                </button>
            </div>
        </div>
    );
};

const MealCard: React.FC<{
    day: MealDay, 
    dayIndex: number, 
    onUpdateMeal: MealPlanViewProps['onUpdateMeal'],
    onUpdateServings: MealPlanViewProps['onUpdateServings'],
    onAddMealToHistory: MealPlanViewProps['onAddMealToHistory']
}> = ({ day, dayIndex, onUpdateMeal, onUpdateServings, onAddMealToHistory }) => {
    
    const handleBlur = (event: React.FocusEvent<HTMLInputElement>) => {
        onAddMealToHistory(event.target.value);
    };

    return (
        <div className="bg-white rounded-xl shadow-lg overflow-hidden transform hover:-translate-y-1 transition-transform duration-300">
            <div className="bg-teal-500 p-4">
                <h3 className="text-xl font-bold text-white text-center">{day.day}</h3>
            </div>
            <div className="p-6 space-y-4">
                {day.hasOwnProperty('breakfast') && (
                    <div>
                        <label className="block text-sm font-medium text-gray-500 mb-1">มื้อเช้า</label>
                        <input
                            type="text"
                            value={day.breakfast?.name || ''}
                            onChange={(e) => onUpdateMeal(dayIndex, 'breakfast', e.target.value)}
                            onBlur={handleBlur}
                            className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-teal-500 focus:border-teal-500"
                            placeholder="กรอกชื่อเมนู..."
                        />
                        <ServingsControl meal={day.breakfast} onUpdate={(s) => onUpdateServings(dayIndex, 'breakfast', s)} />
                    </div>
                )}
                {day.hasOwnProperty('lunch') && (
                    <div>
                        <label className="block text-sm font-medium text-gray-500 mb-1">มื้อกลางวัน</label>
                        <input
                            type="text"
                            value={day.lunch?.name || ''}
                            onChange={(e) => onUpdateMeal(dayIndex, 'lunch', e.target.value)}
                            onBlur={handleBlur}
                            className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-teal-500 focus:border-teal-500"
                            placeholder="กรอกชื่อเมนู..."
                        />
                        <ServingsControl meal={day.lunch} onUpdate={(s) => onUpdateServings(dayIndex, 'lunch', s)} />
                    </div>
                )}
                {day.hasOwnProperty('dinner') && (
                    <div>
                        <label className="block text-sm font-medium text-gray-500 mb-1">มื้อเย็น</label>
                        <input
                            type="text"
                            value={day.dinner?.name || ''}
                            onChange={(e) => onUpdateMeal(dayIndex, 'dinner', e.target.value)}
                            onBlur={handleBlur}
                            className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-teal-500 focus:border-teal-500"
                            placeholder="กรอกชื่อเมนู..."
                        />
                        <ServingsControl meal={day.dinner} onUpdate={(s) => onUpdateServings(dayIndex, 'dinner', s)} />
                    </div>
                )}
            </div>
        </div>
    );
}


export const MealPlanView: React.FC<MealPlanViewProps> = ({ mealPlan, onUpdateMeal, onUpdateServings, onFinalize, onAddMealToHistory }) => {
  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-10">
          <h2 className="text-3xl font-extrabold text-gray-800">แผนอาหารประจำสัปดาห์ของคุณ</h2>
          <p className="mt-2 text-lg text-gray-600">คุณสามารถปรับเปลี่ยนเมนูและจำนวนคนในแต่ละมื้อได้ตามต้องการ</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {mealPlan.map((day, index) => (
            <MealCard 
                key={index} 
                day={day} 
                dayIndex={index} 
                onUpdateMeal={onUpdateMeal}
                onUpdateServings={onUpdateServings}
                onAddMealToHistory={onAddMealToHistory} 
            />
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
