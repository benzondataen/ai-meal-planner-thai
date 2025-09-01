import React from 'react';
import { MealIngredientInfo } from '../types';
import { ChefHatIcon } from './icons/ChefHatIcon';

interface MealIngredientsModalProps {
  isOpen: boolean;
  onClose: () => void;
  mealName: string;
  ingredients: MealIngredientInfo[];
}

export const MealIngredientsModal: React.FC<MealIngredientsModalProps> = ({ isOpen, onClose, mealName, ingredients = [] }) => {
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
            <ChefHatIcon className="h-6 w-6 text-teal-600 mr-3 flex-shrink-0" />
            <h2 className="text-xl sm:text-2xl font-bold text-gray-800 truncate">
                วัตถุดิบสำหรับ "{mealName}"
            </h2>
        </div>

        <div className="border-t border-gray-200 mt-4 pt-4">
          {ingredients.length > 0 ? (
            <ul className="space-y-2 max-h-60 overflow-y-auto pr-2">
              {ingredients.map((ing, index) => (
                <li key={index} className="flex justify-between items-center text-gray-700 bg-gray-50 p-3 rounded-lg">
                  <span className="truncate pr-2">{ing.name}</span>
                  <span className="flex-shrink-0 text-sm font-semibold text-gray-500">
                      {ing.quantity}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-500 text-center py-4">
              ไม่มีข้อมูลวัตถุดิบสำหรับเมนูนี้
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
