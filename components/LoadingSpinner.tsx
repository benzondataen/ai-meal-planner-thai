
import React, { useState, useEffect } from 'react';

const messages = [
  "กำลังใช้ AI ช่วยคิดเมนูอร่อยๆ...",
  "จัดเรียงวัตถุดิบให้ง่ายต่อการซื้อ...",
  "กำลังค้นหาสูตรอาหารที่ทำง่ายที่สุด...",
  "อีกไม่นานแผนอาหารของคุณก็จะพร้อมแล้ว...",
  "AI กำลังทำงานอย่างหนักเพื่อคุณ...",
];

export const LoadingSpinner: React.FC = () => {
  const [message, setMessage] = useState(messages[0]);

  useEffect(() => {
    const intervalId = setInterval(() => {
      setMessage(messages[Math.floor(Math.random() * messages.length)]);
    }, 3000);

    return () => clearInterval(intervalId);
  }, []);


  return (
    <div className="fixed inset-0 bg-gray-900 bg-opacity-75 flex flex-col items-center justify-center z-50 transition-opacity duration-300">
      <div className="w-16 h-16 border-4 border-t-4 border-gray-200 border-t-teal-500 rounded-full animate-spin"></div>
      <p className="text-white text-lg mt-6 font-semibold">{message}</p>
    </div>
  );
};
