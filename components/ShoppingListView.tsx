import React, { useState, useMemo } from 'react';
import { Ingredient, AppState, AdditionalExpense, OcrResult, MealDay } from '../types';
import { IngredientUsageModal } from './IngredientUsageModal';
import { InfoIcon } from './icons/InfoIcon';
import { OcrModal } from './OcrModal';
import { CameraIcon } from './icons/CameraIcon';

interface ShoppingListViewProps {
  mealPlan: MealDay[];
  shoppingList: Ingredient[];
  additionalExpenses: AdditionalExpense[];
  onToggleItem: (itemName: string) => void;
  onToggleAllItems: () => void;
  onNavigate: (state: AppState) => void;
  onSavePlan: () => void;
  onUpdateIngredientPrice: (itemName: string, price: number) => void;
  onAddAdditionalExpense: (expense: Omit<AdditionalExpense, 'id'>) => void;
  onRemoveAdditionalExpense: (expenseId: string) => void;
  
  // OCR Props
  isOcrModalOpen: boolean;
  isOcrLoading: boolean;
  isMatchingOcr: boolean;
  ocrResults: OcrResult[];
  openOcrModal: () => void;
  closeOcrModal: () => void;
  handleProcessReceipt: (file: File) => void;
  handleApplyOcrResults: (selectedItems: OcrResult[]) => Promise<number>;
}

const CategoryFilterButton: React.FC<{ category: string; isActive: boolean; onClick: () => void; }> = ({ category, isActive, onClick }) => (
  <button
    onClick={onClick}
    className={`px-4 py-2 text-sm font-semibold rounded-full transition-colors duration-200 ${
      isActive
        ? 'bg-teal-600 text-white shadow'
        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
    }`}
  >
    {category}
  </button>
);

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


export const ShoppingListView: React.FC<ShoppingListViewProps> = ({ 
    mealPlan, shoppingList, additionalExpenses, onToggleItem, onToggleAllItems, onNavigate, onSavePlan, onUpdateIngredientPrice, onAddAdditionalExpense, onRemoveAdditionalExpense,
    isOcrModalOpen, isOcrLoading, isMatchingOcr, ocrResults, openOcrModal, closeOcrModal, handleProcessReceipt, handleApplyOcrResults
}) => {
  const [activeFilters, setActiveFilters] = useState<string[]>([]);
  const [modalData, setModalData] = useState<{ name: string; mealUsage: Map<string, number> } | null>(null);
  const [confirmationMessage, setConfirmationMessage] = useState<string | null>(null);

  const { categorizedItems, categories } = useMemo(() => {
    const categorized = shoppingList.reduce((acc, item, index) => {
      const category = item.category || 'อื่นๆ';
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push({ ...item, originalIndex: index });
      return acc;
    }, {} as Record<string, (Ingredient & { originalIndex: number })[]>);
    return {
      categorizedItems: categorized,
      categories: Object.keys(categorized).sort(),
    };
  }, [shoppingList]);

  const toggleFilter = (category: string) => {
    setActiveFilters(prev =>
      prev.includes(category)
        ? prev.filter(c => c !== category)
        : [...prev, category]
    );
  };
  
  const filteredCategories = useMemo(() => {
    if (activeFilters.length === 0) {
      return categories;
    }
    return categories.filter(c => activeFilters.includes(c));
  }, [categories, activeFilters]);

  const purchasedCount = shoppingList.filter(item => item.checked).length;
  const totalCount = shoppingList.length;

  const shoppingListTotal = useMemo(() => shoppingList.reduce((sum, item) => sum + (item.price || 0), 0), [shoppingList]);
  const additionalExpensesTotal = useMemo(() => additionalExpenses.reduce((sum, item) => sum + item.price, 0), [additionalExpenses]);
  const grandTotal = shoppingListTotal + additionalExpensesTotal;
  
  const handleApplyOcrWithAlert = async (selectedItems: OcrResult[]) => {
      const initialPurchasedCount = purchasedCount;
      const matchedCount = await handleApplyOcrResults(selectedItems);
      const newPurchasedCount = shoppingList.filter(item => item.checked).length;
      const remainingCount = totalCount - newPurchasedCount;
      setConfirmationMessage(`จับคู่สำเร็จ ${matchedCount} รายการ! ยังเหลืออีก ${remainingCount} รายการที่ต้องตรวจสอบ`);
      // Auto-dismiss message after 5 seconds
      setTimeout(() => setConfirmationMessage(null), 5000);
  };

  const handleShowUsage = (ingredientName: string) => {
    // Find the specific ingredient in the main shopping list.
    const ingredient = shoppingList.find(i => i.name === ingredientName);
    
    // The `usedIn` array is the source of truth for which meals use this ingredient.
    const mealNamesUsedIn = ingredient?.usedIn || [];

    // If the AI didn't associate this ingredient with any meal, show an empty list.
    if (mealNamesUsedIn.length === 0) {
        setModalData({ name: ingredientName, mealUsage: new Map() });
        return;
    }

    // Create a map to sum the total servings for each unique meal name.
    const mealServingsCount = new Map<string, number>();

    // Iterate through the entire meal plan to find all occurrences of the meals
    // and sum their servings.
    for (const day of mealPlan) {
        for (const mealType of ['breakfast', 'lunch', 'dinner'] as const) {
            const meal = day[mealType];
            
            // If the current meal from the plan is listed in our ingredient's `usedIn` array...
            if (meal?.name && mealNamesUsedIn.includes(meal.name)) {
                // ...add its servings to the total for that meal name.
                const currentServings = mealServingsCount.get(meal.name) || 0;
                mealServingsCount.set(meal.name, currentServings + (meal.servings || 0));
            }
        }
    }

    setModalData({ name: ingredientName, mealUsage: mealServingsCount });
};


  return (
    <>
      <div className="p-4 sm:p-6 lg:p-8">
        <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-xl p-6 sm:p-8">
          <div className="text-center mb-6">
            <h2 className="text-3xl font-extrabold text-gray-800">รายการของที่ต้องซื้อและค่าใช้จ่าย</h2>
            <p className="mt-2 text-lg text-gray-600">
              ใส่ราคาของแต่ละรายการ หรือใช้ตัวช่วยสแกนใบเสร็จเพื่อความรวดเร็ว
            </p>
          </div>
          
          {confirmationMessage && (
            <div className="bg-green-100 border-l-4 border-green-500 text-green-700 p-4 mb-6 rounded-md" role="alert">
                <p>{confirmationMessage}</p>
            </div>
          )}


          <div className="mb-6">
            <p className="text-sm font-medium text-gray-600 mb-3">ตัวกรองหมวดหมู่:</p>
            <div className="flex flex-wrap gap-2">
                <CategoryFilterButton category="ทั้งหมด" isActive={activeFilters.length === 0} onClick={() => setActiveFilters([])} />
                {categories.map(cat => (
                    <CategoryFilterButton key={cat} category={cat} isActive={activeFilters.includes(cat)} onClick={() => toggleFilter(cat)} />
                ))}
            </div>
          </div>

          <div className="space-y-6 max-h-[45vh] overflow-y-auto pr-2 custom-scrollbar">
            {filteredCategories.map(category => (
              <div key={category}>
                <h3 className="text-lg font-bold text-teal-700 border-b-2 border-teal-100 pb-2 mb-3">{category}</h3>
                <ul className="space-y-3">
                  {categorizedItems[category].map((item) => (
                    <li
                      key={item.name}
                      className="flex items-center p-3 bg-gray-50 rounded-lg flex-wrap sm:flex-nowrap gap-2"
                    >
                      <div className="flex items-center flex-grow cursor-pointer" onClick={() => onToggleItem(item.name)}>
                        <input
                          type="checkbox"
                          checked={!!item.checked}
                          readOnly
                          className="h-5 w-5 rounded border-gray-300 text-teal-600 focus:ring-teal-500"
                          aria-labelledby={`item-label-${item.originalIndex}`}
                        />
                        <span id={`item-label-${item.originalIndex}`} className={`ml-3 text-md ${item.checked ? 'line-through text-gray-400' : 'text-gray-700'}`}>
                          {item.name}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0 ml-auto">
                        <span className={`text-sm font-medium ${item.checked ? 'text-gray-400' : 'text-gray-500'}`}>
                          {item.quantity}
                        </span>
                        <input
                            type="number"
                            value={item.price || ''}
                            onChange={(e) => onUpdateIngredientPrice(item.name, parseFloat(e.target.value))}
                            className="w-24 p-1 border border-gray-300 rounded-md shadow-sm text-right focus:ring-teal-500 focus:border-teal-500"
                            placeholder="ราคา"
                            min="0"
                            step="0.25"
                        />
                         <span className="text-sm text-gray-500">บาท</span>
                        <button
                          onClick={() => handleShowUsage(item.name)}
                          className="p-1 text-gray-400 hover:text-teal-600 rounded-full hover:bg-teal-100 focus:outline-none focus:ring-2 focus:ring-teal-500 transition-colors"
                          aria-label={`Show meals for ${item.name}`}
                        >
                          <InfoIcon className="w-5 h-5" />
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          
           <div className="mt-8 pt-6 border-t">
              <h3 className="text-lg font-bold text-gray-800 mb-2">รายจ่ายเพิ่มเติม</h3>
              <p className="text-sm text-gray-500 mb-3">เพิ่มรายการอื่นๆ ที่ซื้อในสัปดาห์นี้ เช่น ของใช้ในบ้าน</p>
              <div className="space-y-2 mb-4">
                {additionalExpenses.map(exp => (
                    <div key={exp.id} className="flex justify-between items-center p-2 bg-gray-50 rounded-md">
                        <span className="text-gray-700">{exp.name}</span>
                        <div className="flex items-center gap-2">
                            <span className="font-medium text-gray-600">{exp.price.toFixed(2)} บาท</span>
                            <button onClick={() => onRemoveAdditionalExpense(exp.id)} className="text-red-400 hover:text-red-600">&times;</button>
                        </div>
                    </div>
                ))}
              </div>
              <AddExpenseForm onAdd={onAddAdditionalExpense} />
           </div>

          <div className="mt-8 pt-6 border-t-2 border-dashed">
             <div className="flex items-center justify-center mb-6">
                <button
                    onClick={openOcrModal}
                    className="flex items-center gap-2 bg-blue-500 text-white font-bold py-2 px-5 rounded-full hover:bg-blue-600 focus:outline-none focus:ring-4 focus:ring-blue-300 transition duration-300"
                >
                    <CameraIcon className="w-5 h-5" />
                    สแกนใบเสร็จ
                </button>
            </div>
              <div className="space-y-2 mb-6">
                <div className="flex justify-between items-center text-md">
                    <span className="text-gray-600">รวมค่าวัตถุดิบ:</span>
                    <span className="font-semibold text-gray-800">{shoppingListTotal.toFixed(2)} บาท</span>
                </div>
                 <div className="flex justify-between items-center text-md">
                    <span className="text-gray-600">รวมรายจ่ายเพิ่มเติม:</span>
                    <span className="font-semibold text-gray-800">{additionalExpensesTotal.toFixed(2)} บาท</span>
                </div>
                 <div className="flex justify-between items-center text-xl">
                    <span className="font-bold text-gray-800">ยอดรวมทั้งหมด:</span>
                    <span className="font-bold text-teal-600">{grandTotal.toFixed(2)} บาท</span>
                </div>
              </div>
              <div className="flex justify-between items-center mb-4">
                  <span className="text-lg font-bold text-gray-800">เช็คแล้ว: {purchasedCount} / {totalCount} รายการ</span>
                  {totalCount > 0 && (
                      <button
                          onClick={onToggleAllItems}
                          className="text-sm font-semibold text-teal-600 hover:text-teal-800 transition-colors"
                      >
                          {purchasedCount === totalCount ? 'ยกเลิกการเลือกทั้งหมด' : 'เลือกทั้งหมด'}
                      </button>
                  )}
              </div>
              <div className="flex flex-col sm:flex-row justify-center gap-4">
                  <button
                      onClick={() => onNavigate(AppState.PLANNING)}
                      className="w-full sm:w-auto bg-gray-200 text-gray-800 font-bold py-3 px-6 rounded-full hover:bg-gray-300 focus:outline-none focus:ring-4 focus:ring-gray-200 transition duration-300"
                  >
                      กลับไปแก้ไขเมนู
                  </button>
                  <button
                      onClick={() => onNavigate(AppState.WEEKLY_SUMMARY)}
                      className="w-full sm:w-auto bg-teal-600 text-white font-bold py-3 px-6 rounded-full hover:bg-teal-700 focus:outline-none focus:ring-4 focus:ring-teal-300 transition duration-300"
                  >
                      ไปที่หน้าสรุปค่าใช้จ่าย
                  </button>
              </div>
          </div>
        </div>
      </div>
      <IngredientUsageModal
        isOpen={modalData !== null}
        onClose={() => setModalData(null)}
        ingredientName={modalData?.name || ''}
        mealUsage={modalData?.mealUsage || new Map()}
      />
      <OcrModal 
        isOpen={isOcrModalOpen}
        onClose={closeOcrModal}
        isLoading={isOcrLoading}
        isApplyingResults={isMatchingOcr}
        ocrResults={ocrResults}
        onProcessReceipt={handleProcessReceipt}
        onApplyResults={handleApplyOcrWithAlert}
        shoppingListTotalItems={totalCount}
      />
    </>
  );
};