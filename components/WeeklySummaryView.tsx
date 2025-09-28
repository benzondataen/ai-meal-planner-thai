import React, { useState, useMemo } from 'react';
import { Ingredient, AdditionalExpense, AppState } from '../types';

const AddExpenseForm: React.FC<{ onAdd: (expense: Omit<AdditionalExpense, 'id'>) => void }> = ({ onAdd }) => {
    const [name, setName] = useState('');
    const [price, setPrice] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const priceValue = parseFloat(price);
        if (name.trim() && !isNaN(priceValue) && priceValue >= 0) {
            onAdd({ name: name.trim(), price: priceValue });
            setName('');
            setPrice('');
        }
    };

    return (
        <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-2 mt-2">
            <input 
                type="text" 
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="ชื่อรายการ" 
                className="flex-grow p-2 border border-gray-300 rounded-md shadow-sm focus:ring-teal-500 focus:border-teal-500"
            />
            <input 
                type="number" 
                value={price}
                onChange={e => setPrice(e.target.value)}
                placeholder="ราคา (บาท)" 
                className="w-full sm:w-28 p-2 border border-gray-300 rounded-md shadow-sm focus:ring-teal-500 focus:border-teal-500"
                min="0"
                step="0.25"
            />
            <button type="submit" className="bg-teal-500 text-white font-semibold py-2 px-4 rounded-md hover:bg-teal-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500">
                เพิ่ม
            </button>
        </form>
    );
};

interface WeeklySummaryViewProps {
  shoppingList: Ingredient[];
  additionalExpenses: AdditionalExpense[];
  onNavigate: (state: AppState) => void;
  onSavePlan: () => void;
  onAddAdditionalExpense: (expense: Omit<AdditionalExpense, 'id'>) => void;
  onRemoveAdditionalExpense: (expenseId: string) => void;
}

export const WeeklySummaryView: React.FC<WeeklySummaryViewProps> = ({
  shoppingList,
  additionalExpenses,
  onNavigate,
  onSavePlan,
  onAddAdditionalExpense,
  onRemoveAdditionalExpense,
}) => {
  const shoppingListTotal = useMemo(() => shoppingList.reduce((sum, item) => sum + (item.price || 0), 0), [shoppingList]);
  const additionalExpensesTotal = useMemo(() => additionalExpenses.reduce((sum, item) => sum + item.price, 0), [additionalExpenses]);
  const grandTotal = shoppingListTotal + additionalExpensesTotal;

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-xl p-6 sm:p-8">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-extrabold text-gray-800">สรุปค่าใช้จ่ายประจำสัปดาห์</h2>
          <p className="mt-2 text-lg text-gray-600">ตรวจสอบความถูกต้องและเพิ่มรายจ่ายอื่นๆ ก่อนบันทึกแผน</p>
        </div>

        <div className="max-w-lg mx-auto">
          {/* Cost Breakdown */}
          <div className="space-y-3 mb-8">
            <div className="flex justify-between items-center text-lg p-4 bg-gray-50 rounded-lg">
                <span className="text-gray-600">รวมค่าวัตถุดิบ:</span>
                <span className="font-semibold text-gray-800">{shoppingListTotal.toFixed(2)} บาท</span>
            </div>
             <div className="flex justify-between items-center text-lg p-4 bg-gray-50 rounded-lg">
                <span className="text-gray-600">รวมรายจ่ายเพิ่มเติม:</span>
                <span className="font-semibold text-gray-800">{additionalExpensesTotal.toFixed(2)} บาท</span>
            </div>
             <div className="flex justify-between items-center text-2xl p-5 bg-teal-50 rounded-lg">
                <span className="font-bold text-gray-800">ยอดรวมทั้งหมด:</span>
                <span className="font-bold text-teal-600">{grandTotal.toFixed(2)} บาท</span>
            </div>
          </div>

          {/* Additional Expenses Management */}
          <div className="mt-8 pt-6 border-t">
              <h3 className="text-xl font-bold text-gray-800 mb-2">จัดการรายจ่ายเพิ่มเติม</h3>
              <div className="space-y-2 mb-4 max-h-40 overflow-y-auto pr-2">
                {additionalExpenses.length > 0 ? additionalExpenses.map(exp => (
                    <div key={exp.id} className="flex justify-between items-center p-2 bg-gray-50 rounded-md">
                        <span className="text-gray-700">{exp.name}</span>
                        <div className="flex items-center gap-2">
                            <span className="font-medium text-gray-600">{exp.price.toFixed(2)} บาท</span>
                            <button 
                              onClick={() => onRemoveAdditionalExpense(exp.id)} 
                              className="text-red-400 hover:text-red-600 font-bold text-xl leading-none"
                              aria-label={`Remove ${exp.name}`}
                            >
                              &times;
                            </button>
                        </div>
                    </div>
                )) : (
                  <p className="text-gray-500 text-center py-4">ยังไม่มีรายจ่ายเพิ่มเติม</p>
                )}
              </div>
              <AddExpenseForm onAdd={onAddAdditionalExpense} />
           </div>
        </div>

        {/* Navigation Buttons */}
        <div className="mt-12 pt-6 border-t-2 border-dashed flex flex-col sm:flex-row justify-center gap-4">
            <button
                onClick={() => onNavigate(AppState.SHOPPING_LIST)}
                className="w-full sm:w-auto bg-gray-200 text-gray-800 font-bold py-3 px-6 rounded-full hover:bg-gray-300 focus:outline-none focus:ring-4 focus:ring-gray-200 transition duration-300"
            >
                กลับไปที่รายการซื้อของ
            </button>
            <button
                onClick={onSavePlan}
                className="w-full sm:w-auto bg-teal-600 text-white font-bold py-3 px-6 rounded-full hover:bg-teal-700 focus:outline-none focus:ring-4 focus:ring-teal-300 transition duration-300"
            >
                บันทึกแผนและสิ้นสุด
            </button>
        </div>
      </div>
    </div>
  );
};
