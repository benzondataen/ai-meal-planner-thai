// Fix for multiple "Cannot find name" and "is not a module" errors.
// This file was a placeholder and is now fully implemented.
import React from 'react';
import { SavedPlan } from '../types';
import { ChefHatIcon } from './icons/ChefHatIcon';

interface DashboardViewProps {
  savedPlans: SavedPlan[];
  activePlan: SavedPlan | null;
  onNewPlan: () => void;
  onViewPlan: (plan: SavedPlan) => void;
  onContinuePlan: (plan: SavedPlan) => void;
  error: string | null;
  isDashboardLoading: boolean;
}

const getPlanStatus = (planDates: string[] | undefined): { text: string; bgColor: string; textColor: string } | null => {
    if (!planDates || planDates.length === 0) {
        return null;
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Dates from JSON are strings, convert them to Date objects for comparison
    const start = new Date(planDates[0]);
    const end = new Date(planDates[planDates.length - 1]);
    start.setHours(0, 0, 0, 0);
    end.setHours(0, 0, 0, 0);

    if (end < today) {
        return { text: 'สำเร็จแล้ว', bgColor: 'bg-green-100', textColor: 'text-green-800' };
    }
    if (start > today) {
        return { text: 'สัปดาห์หน้า', bgColor: 'bg-yellow-100', textColor: 'text-yellow-800' };
    }
    return { text: 'สัปดาห์นี้', bgColor: 'bg-blue-100', textColor: 'text-blue-800' };
};


const PlanCard: React.FC<{ plan: SavedPlan, onSelect: (plan: SavedPlan) => void, actionLabel: string, actionClass: string }> = ({ plan, onSelect, actionLabel, actionClass }) => {
    const status = getPlanStatus(plan.planDates);
    return (
        <div className="bg-white p-4 rounded-lg shadow-md flex justify-between items-center">
            <div>
                 <div className="flex items-center space-x-2 mb-1">
                     <p className="font-semibold text-gray-800">แผนอาหาร</p>
                     {status && (
                        <span className={`px-2 py-0.5 text-xs font-bold rounded-full ${status.bgColor} ${status.textColor}`}>
                            {status.text}
                        </span>
                     )}
                </div>
                <p className="text-sm text-gray-600">
                    {plan.planDates && plan.planDates.length > 0
                        ? `${new Date(plan.planDates[0]).toLocaleDateString('th-TH', {day: 'numeric', month: 'short'})} - ${new Date(plan.planDates[plan.planDates.length - 1]).toLocaleDateString('th-TH', {day: 'numeric', month: 'short', year: 'numeric'})}`
                        : plan.createdAt
                    }
                </p>
            </div>
            <button
                onClick={() => onSelect(plan)}
                className={`font-semibold py-2 px-4 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors ${actionClass}`}
            >
                {actionLabel}
            </button>
        </div>
    );
};


export const DashboardView: React.FC<DashboardViewProps> = ({ savedPlans, activePlan, onNewPlan, onViewPlan, onContinuePlan, error, isDashboardLoading }) => {

  return (
    <div className="max-w-4xl mx-auto">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-extrabold text-gray-800">AI Meal Planner</h1>
        <p className="mt-4 text-xl text-gray-600">
            วางแผนมื้ออาหารสำหรับสัปดาห์ของคุณอย่างง่ายดาย
        </p>
      </div>
      
      {error && (
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-8 rounded-md" role="alert">
          <p className="font-bold">เกิดข้อผิดพลาด</p>
          <p>{error}</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
        {/* Left Column: New Plan & Active Plan */}
        <div className="space-y-8">
            <div className="bg-white p-6 rounded-xl shadow-lg text-center">
                <div className="mx-auto bg-teal-100 rounded-full h-16 w-16 flex items-center justify-center mb-4">
                    <ChefHatIcon className="h-9 w-9 text-teal-600" />
                </div>
                <h2 className="text-2xl font-bold text-gray-800 mb-2">สร้างแผนใหม่</h2>
                <p className="text-gray-600 mb-6">เริ่มวางแผนเมนูอาหารสำหรับสัปดาห์หน้าของคุณ</p>
                <button
                    onClick={onNewPlan}
                    className="w-full bg-teal-600 text-white font-bold py-3 px-6 rounded-full text-lg hover:bg-teal-700 focus:outline-none focus:ring-4 focus:ring-teal-300 transform transition duration-300 ease-in-out hover:scale-105"
                >
                    เริ่มเลย
                </button>
            </div>

            {activePlan && (
                <div className="bg-yellow-50 border-2 border-yellow-200 p-6 rounded-xl shadow-lg">
                    <h2 className="text-2xl font-bold text-yellow-800 mb-3">แผนที่กำลังดำเนินการ</h2>
                    <PlanCard 
                        plan={activePlan} 
                        onSelect={onContinuePlan} 
                        actionLabel="ทำต่อ" 
                        actionClass="bg-yellow-400 text-yellow-900 hover:bg-yellow-500 focus:ring-yellow-400"
                    />
                </div>
            )}
        </div>

        {/* Right Column: Saved Plans */}
        <div className="bg-white p-6 rounded-xl shadow-lg">
             <h2 className="text-2xl font-bold text-gray-800 mb-4">แผนที่บันทึกไว้</h2>
             {isDashboardLoading ? (
                 <div className="flex justify-center items-center h-40">
                     <div className="w-8 h-8 border-2 border-t-2 border-gray-200 border-t-teal-500 rounded-full animate-spin"></div>
                     <p className="ml-3 text-gray-600">กำลังโหลด...</p>
                 </div>
             ) : savedPlans.length > 0 ? (
                 <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
                     {savedPlans.map(plan => (
                        <PlanCard 
                            key={plan.id} 
                            plan={plan} 
                            onSelect={onViewPlan} 
                            actionLabel="ดูรายละเอียด" 
                            actionClass="bg-gray-200 text-gray-700 hover:bg-gray-300 focus:ring-gray-400"
                        />
                     ))}
                 </div>
             ) : (
                 <p className="text-gray-500 text-center py-10">คุณยังไม่มีแผนที่บันทึกไว้</p>
             )}
        </div>
      </div>
    </div>
  );
};