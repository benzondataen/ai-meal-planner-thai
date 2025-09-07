import React from 'react';
import { ChefHatIcon } from './icons/ChefHatIcon';

interface HeaderProps {
    onReset: () => void;
    userEmail: string | null;
    onLogout: () => void;
}

const Header: React.FC<HeaderProps> = ({ onReset, userEmail, onLogout }) => {
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
          {userEmail && (
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600 hidden sm:block" title={userEmail}>{userEmail}</span>
              <button
                onClick={onLogout}
                className="bg-gray-200 text-gray-700 font-semibold py-2 px-4 rounded-lg text-sm hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-400 transition-colors"
              >
                ออกจากระบบ
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;