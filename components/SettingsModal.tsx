import React, { useState, useMemo } from 'react';
import { PlannerSettings } from '../types';
import { getDaysInMonth, getFirstDayOfMonth, isSameDay } from '../utils/calendarUtils';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (settings: PlannerSettings) => void;
}

const MealCheckbox: React.FC<{
    id: 'breakfast' | 'lunch' | 'dinner';
    label: string;
    checked: boolean;
    onChange: (id: 'breakfast' | 'lunch' | 'dinner', checked: boolean) => void;
}> = ({ id, label, checked, onChange }) => (
    <label htmlFor={id} className="flex items-center space-x-2 cursor-pointer p-3 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors">
        <input
            id={id}
            type="checkbox"
            checked={checked}
            onChange={(e) => onChange(id, e.target.checked)}
            className="h-5 w-5 rounded border-gray-300 text-teal-600 focus:ring-teal-500"
        />
        <span className="font-medium text-gray-700">{label}</span>
    </label>
);


export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose, onSubmit }) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDates, setSelectedDates] = useState<Date[]>([]);
  const [selectedMeals, setSelectedMeals] = useState({
    breakfast: true,
    lunch: true,
    dinner: true,
  });

  const handleDateClick = (day: number) => {
    const clickedDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
    const dateIndex = selectedDates.findIndex(date => isSameDay(date, clickedDate));
    if (dateIndex > -1) {
      setSelectedDates(selectedDates.filter((_, i) => i !== dateIndex));
    } else {
      setSelectedDates([...selectedDates, clickedDate].sort((a,b) => a.getTime() - b.getTime()));
    }
  };
  
  const handleMealChange = (id: 'breakfast' | 'lunch' | 'dinner', checked: boolean) => {
      setSelectedMeals(prev => ({ ...prev, [id]: checked }));
  };

  const changeMonth = (offset: number) => {
    setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() + offset, 1));
  };
  
  const handleGoToToday = () => {
    setCurrentMonth(new Date());
  };

  const handleResetDates = () => {
    setSelectedDates([]);
  };

  const handleSubmit = () => {
      const meals = (Object.keys(selectedMeals) as Array<keyof typeof selectedMeals>).filter(key => selectedMeals[key]);
      if (selectedDates.length > 0 && meals.length > 0) {
          onSubmit({ dates: selectedDates, meals });
      }
  };

  const calendarGrid = useMemo(() => {
    const daysInMonth = getDaysInMonth(currentMonth);
    const firstDay = getFirstDayOfMonth(currentMonth).getDay(); // 0 (Sun) - 6 (Sat)
    const grid = Array(firstDay).fill(null);
    for (let i = 1; i <= daysInMonth; i++) {
      grid.push(i);
    }
    return grid;
  }, [currentMonth]);

  if (!isOpen) {
    return null;
  }
  
  const today = new Date();
  const atLeastOneMealSelected = Object.values(selectedMeals).some(v => v);

  return (
    <div className="fixed inset-0 bg-gray-900 bg-opacity-75 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6 relative" onClick={(e) => e.stopPropagation()}>
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600" aria-label="Close modal">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
        </button>
        
        <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">ตั้งค่าแผนอาหาร</h2>

        <div className="mb-6">
            <h3 className="font-semibold text-gray-700 mb-3">1. เลือกวันที่ต้องการวางแผน</h3>
            <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex justify-between items-center mb-3">
                    <button onClick={() => changeMonth(-1)} className="p-2 rounded-full text-gray-600 hover:bg-gray-200 hover:text-gray-900 font-bold text-xl">&lt;</button>
                    <h4 className="font-bold text-lg text-gray-800">{currentMonth.toLocaleDateString('th-TH', { month: 'long', year: 'numeric' })}</h4>
                    <button onClick={() => changeMonth(1)} className="p-2 rounded-full text-gray-600 hover:bg-gray-200 hover:text-gray-900 font-bold text-xl">&gt;</button>
                </div>
                <div className="flex justify-between items-center mb-3 text-sm px-1">
                    <button
                        onClick={handleGoToToday}
                        className="font-semibold text-teal-600 hover:text-teal-800 transition-colors"
                    >
                        ไปที่เดือนปัจจุบัน
                    </button>
                    <button
                        onClick={handleResetDates}
                        className="font-semibold text-red-500 hover:text-red-700 transition-colors"
                    >
                        ล้างวันที่เลือก
                    </button>
                </div>
                <div className="grid grid-cols-7 gap-1 text-center text-sm">
                    {['อา', 'จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส'].map(day => <div key={day} className="font-semibold text-gray-700">{day}</div>)}
                    {calendarGrid.map((day, index) => {
                        if (!day) return <div key={`empty-${index}`}></div>;
                        const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
                        const isSelected = selectedDates.some(d => isSameDay(d, date));
                        const isToday = isSameDay(today, date);
                        return (
                            <button 
                                key={day} 
                                onClick={() => handleDateClick(day)}
                                className={`w-9 h-9 flex items-center justify-center rounded-full transition-colors ${
                                    isSelected
                                        ? 'bg-teal-600 text-white font-bold'
                                        : isToday
                                        ? 'bg-teal-100 text-teal-800 font-bold hover:bg-teal-300'
                                        : 'text-gray-900 hover:bg-gray-200'
                                }`}
                            >
                                {day}
                            </button>
                        );
                    })}
                </div>
            </div>
        </div>
        
         <div className="mb-8">
            <h3 className="font-semibold text-gray-700 mb-3">2. เลือกมื้ออาหาร</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <MealCheckbox id="breakfast" label="มื้อเช้า" checked={selectedMeals.breakfast} onChange={handleMealChange} />
                <MealCheckbox id="lunch" label="มื้อกลางวัน" checked={selectedMeals.lunch} onChange={handleMealChange} />
                <MealCheckbox id="dinner" label="มื้อเย็น" checked={selectedMeals.dinner} onChange={handleMealChange} />
            </div>
        </div>

        <button
            onClick={handleSubmit}
            disabled={selectedDates.length === 0 || !atLeastOneMealSelected}
            className="w-full bg-teal-600 text-white font-bold py-3 px-6 rounded-full text-lg hover:bg-teal-700 focus:outline-none focus:ring-4 focus:ring-teal-300 disabled:bg-gray-300 disabled:cursor-not-allowed"
        >
            สร้างแผนอาหาร
        </button>

      </div>
    </div>
  );
};