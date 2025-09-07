import React, { useState, useMemo } from 'react';
import { Ingredient, AppState } from '../types';
import { IngredientUsageModal } from './IngredientUsageModal';
import { InfoIcon } from './icons/InfoIcon';

interface ShoppingListViewProps {
  shoppingList: Ingredient[];
  onToggleItem: (itemName: string) => void;
  onNavigate: (state: AppState) => void;
  onSavePlan: () => void;
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

export const ShoppingListView: React.FC<ShoppingListViewProps> = ({ shoppingList, onToggleItem, onNavigate, onSavePlan }) => {
  const [activeFilters, setActiveFilters] = useState<string[]>([]);
  const [modalData, setModalData] = useState<{ name: string; usedIn?: string[] } | null>(null);

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

  return (
    <>
      <div className="p-4 sm:p-6 lg:p-8">
        <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow-xl p-6 sm:p-8">
          <div className="text-center mb-6">
            <h2 className="text-3xl font-extrabold text-gray-800">รายการของที่ต้องซื้อ</h2>
            <p className="mt-2 text-lg text-gray-600">
              ติ๊กรายการที่คุณซื้อแล้ว และกดปุ่ม (i) เพื่อดูเมนูที่เกี่ยวข้อง
            </p>
          </div>

          <div className="mb-6">
            <p className="text-sm font-medium text-gray-600 mb-3">ตัวกรองหมวดหมู่:</p>
            <div className="flex flex-wrap gap-2">
                <CategoryFilterButton category="ทั้งหมด" isActive={activeFilters.length === 0} onClick={() => setActiveFilters([])} />
                {categories.map(cat => (
                    <CategoryFilterButton key={cat} category={cat} isActive={activeFilters.includes(cat)} onClick={() => toggleFilter(cat)} />
                ))}
            </div>
          </div>

          <div className="space-y-6 max-h-[50vh] overflow-y-auto pr-2 custom-scrollbar">
            {filteredCategories.map(category => (
              <div key={category}>
                <h3 className="text-lg font-bold text-teal-700 border-b-2 border-teal-100 pb-2 mb-3">{category}</h3>
                <ul className="space-y-3">
                  {categorizedItems[category].map((item) => (
                    <li
                      key={item.name}
                      className="flex items-center p-3 bg-gray-50 rounded-lg"
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
                      <span className={`ml-3 text-sm font-medium ${item.checked ? 'text-gray-400' : 'text-gray-500'}`}>
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => setModalData({ name: item.name, usedIn: item.usedIn })}
                        className="ml-4 p-1 text-gray-400 hover:text-teal-600 rounded-full hover:bg-teal-100 focus:outline-none focus:ring-2 focus:ring-teal-500 transition-colors"
                        aria-label={`Show meals for ${item.name}`}
                      >
                        <InfoIcon className="w-5 h-5" />
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          
          <div className="mt-8 pt-6 border-t">
              <div className="flex justify-between items-center mb-4">
                  <span className="text-lg font-bold text-gray-800">ทั้งหมด: {purchasedCount} / {totalCount} รายการ</span>
              </div>
              <div className="flex flex-col sm:flex-row justify-center gap-4">
                  <button
                      onClick={() => onNavigate(AppState.PLANNING)}
                      className="w-full sm:w-auto bg-gray-200 text-gray-800 font-bold py-3 px-6 rounded-full hover:bg-gray-300 focus:outline-none focus:ring-4 focus:ring-gray-200 transition duration-300"
                  >
                      กลับไปแก้ไขเมนู
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
      </div>
      <IngredientUsageModal
        isOpen={modalData !== null}
        onClose={() => setModalData(null)}
        ingredientName={modalData?.name || ''}
        mealNames={modalData?.usedIn}
      />
    </>
  );
};
