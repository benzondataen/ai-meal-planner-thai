
import React from 'react';
import { ChefHatIcon } from './icons/ChefHatIcon';

interface WelcomeScreenProps {
  onGenerate: () => void;
  error?: string | null;
}

export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ onGenerate, error }) => {
  return (
    <div className="flex flex-col items-center justify-center text-center p-8">
      <div className="bg-teal-100 rounded-full p-6 mb-6">
        <ChefHatIcon className="h-16 w-16 text-teal-600" />
      </div>
      <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-800 mb-4">
        วางแผนเมนูอาหารสำหรับสัปดาห์
      </h2>
      <p className="max-w-xl text-lg text-gray-600 mb-8">
        ให้ AI ช่วยคุณคิดเมนูอาหารสำหรับ 2 คน (มื้อกลางวันและมื้อเย็น) ตลอดทั้งสัปดาห์ พร้อมสร้างรายการของที่ต้องซื้อให้โดยอัตโนมัติ
      </p>
      {error && (
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6 rounded-md" role="alert">
          <p className="font-bold">เกิดข้อผิดพลาด</p>
          <p>{error}</p>
        </div>
      )}
      <button
        onClick={onGenerate}
        className="bg-teal-600 text-white font-bold py-4 px-8 rounded-full text-lg hover:bg-teal-700 focus:outline-none focus:ring-4 focus:ring-teal-300 transform transition duration-300 ease-in-out hover:scale-105"
      >
        สร้างแผนอาหารสำหรับสัปดาห์นี้
      </button>
    </div>
  );
};
