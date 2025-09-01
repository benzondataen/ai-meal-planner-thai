import React, { useMemo } from 'react';
import { InfoIcon } from './icons/InfoIcon';

interface IngredientUsageModalProps {
  isOpen: boolean;
  onClose: () => void;
  ingredientName: string;
  mealNames?: string[];
}

export const IngredientUsageModal: React.FC<IngredientUsageModalProps> = ({ isOpen, onClose, ingredientName, mealNames = [] }) => {
  const mealCounts = useMemo(() => {
    if (!mealNames) return [];
    const counts: Record<string, number> = {};
    for (const name of mealNames) {
      counts[name] = (counts[name] || 0) + 1;
    }
    return Object.entries(counts);
  }, [mealNames]);

  if (!isOpen) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 bg-gray-900 bg-opacity-75 flex items-center justify-center z-50 p-4 transition-opacity"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 relative"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
          aria-label="Close modal"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
        </button>

        <div className="flex items-center mb-4">
            <InfoIcon className="h-6 w-6 text-teal-600 mr-3 flex-shrink-0" />
            <h2 className="text-xl sm:text-2xl font-bold text-gray-800 truncate">
                เมนูที่ใช้ "{ingredientName}"
            </h2>
        </div>

        <div className="border-t border-gray-200 mt-4 pt-4">
          {mealCounts.length > 0 ? (
            <ul className="space-y-2 max-h-60 overflow-y-auto pr-2">
              {mealCounts.map(([name, count]) => (
                <li key={name} className="flex justify-between items-center text-gray-700 bg-gray-50 p-3 rounded-lg">
                  <span className="truncate pr-2">{name}</span>
                  {count > 1 && (
                    <span className="flex-shrink-0 text-sm font-semibold text-white bg-teal-500 rounded-full px-2.5 py-0.5">
                      x{count}
                    </span>
                  )}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-500 text-center py-4">
              ไม่มีข้อมูลเมนูสำหรับวัตถุดิบนี้
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
