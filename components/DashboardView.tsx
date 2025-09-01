import React from 'react';
import { SavedPlan, ActivePlan } from '../types';
import { ChefHatIcon } from './icons/ChefHatIcon';

interface DashboardViewProps {
  savedPlans: SavedPlan[];
  activePlan: ActivePlan | null;
  onNewPlan: () => void;
  onViewPlan: (planId: string) => void;
  onContinuePlan: () => void;
  error?: string | null;
}

export const DashboardView: React.FC<DashboardViewProps> = ({ savedPlans, activePlan, onNewPlan, onViewPlan, onContinuePlan, error }) => {
  return (
    <div className="max-w-4xl mx-auto">
      <div className="text-center mb-10">
        <h2 className="text-3xl font-extrabold text-gray-800">แดชบอร์ดแผนอาหาร</h2>
        <p className="mt-2 text-lg text-gray-600">ดูแผนที่บันทึกไว้ หรือสร้างแผนใหม่สำหรับสัปดาห์นี้</p>
      </div>
      
      {error && (
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6 rounded-md" role="alert">
          <p className="font-bold">เกิดข้อผิดพลาด</p>
          <p>{error}</p>
        </div>
      )}

      {activePlan && (
        <div className="mb-10 bg-teal-50 border-2 border-teal-200 rounded-2xl p-6 text-center shadow-lg">
          <h3 className="text-xl font-bold text-gray-800 mb-2">แผนที่กำลังดำเนินการ</h3>
          <p className="text-gray-600 mb-4">คุณมีแผนที่ยังจัดทำไม่เสร็จ กลับไปทำต่อได้เลย</p>
          <button
            onClick={onContinuePlan}
            className="bg-teal-500 text-white font-bold py-3 px-6 rounded-full text-lg hover:bg-teal-600 focus:outline-none focus:ring-4 focus:ring-teal-300 transform transition duration-300 ease-in-out hover:scale-105"
          >
            ไปที่รายการซื้อของต่อ
          </button>
        </div>
      )}

      <div className="mb-10 flex justify-center">
        <button
          onClick={onNewPlan}
          className="bg-teal-600 text-white font-bold py-4 px-8 rounded-full text-lg hover:bg-teal-700 focus:outline-none focus:ring-4 focus:ring-teal-300 transform transition duration-300 ease-in-out hover:scale-105"
        >
          {activePlan ? 'สร้างแผนใหม่ (ทับแผนที่กำลังทำ)' : 'สร้างแผนอาหารสัปดาห์ใหม่'}
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-xl p-6 sm:p-8">
        <h3 className="text-xl font-bold text-gray-800 mb-4 border-b pb-2">แผนอาหารที่บันทึกไว้</h3>
        {savedPlans.length > 0 ? (
          <ul className="space-y-3 max-h-[50vh] overflow-y-auto pr-2">
            {savedPlans.map(plan => (
              <li key={plan.id}>
                <button
                  onClick={() => onViewPlan(plan.id)}
                  className="w-full text-left flex items-center p-4 bg-gray-50 hover:bg-teal-50 rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-teal-500"
                >
                  <ChefHatIcon className="h-6 w-6 text-teal-500 mr-4 flex-shrink-0" />
                  <span className="font-semibold text-gray-700">แผนสำหรับสัปดาห์ของ {plan.createdAt}</span>
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-center text-gray-500 py-8">คุณยังไม่มีแผนอาหารที่บันทึกไว้</p>
        )}
      </div>
    </div>
  );
};
