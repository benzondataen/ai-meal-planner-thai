
import React from 'react';
import { ChefHatIcon } from './icons/ChefHatIcon';

interface HeaderProps {
    onReset: () => void;
}

const Header: React.FC<HeaderProps> = ({ onReset }) => {
  return (
    <header className="bg-white shadow-md">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          <div 
            className="flex items-center space-x-3 cursor-pointer"
            onClick={onReset}
          >
            <ChefHatIcon className="h-8 w-8 text-teal-600" />
            <h1 className="text-2xl font-bold text-gray-800 tracking-tight">
              AI Meal Planner
            </h1>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
