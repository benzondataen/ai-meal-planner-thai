import React, { useState, useRef } from 'react';
import { OcrResult } from '../types';
import { CameraIcon } from './icons/CameraIcon';

interface OcrModalProps {
  isOpen: boolean;
  onClose: () => void;
  onProcessReceipt: (file: File) => void;
  isLoading: boolean;
  isApplyingResults: boolean;
  ocrResults: OcrResult[];
  onApplyResults: (selectedItems: OcrResult[]) => void;
  shoppingListTotalItems: number;
}

export const OcrModal: React.FC<OcrModalProps> = ({ 
    isOpen, 
    onClose, 
    onProcessReceipt, 
    isLoading, 
    isApplyingResults,
    ocrResults, 
    onApplyResults, 
    shoppingListTotalItems 
}) => {
  const [selectedResults, setSelectedResults] = useState<OcrResult[]>([]);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) {
    return null;
  }

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
      onProcessReceipt(file);
    }
  };

  const handleResultToggle = (result: OcrResult) => {
    setSelectedResults(prev =>
      prev.some(item => item.name === result.name && item.price === result.price)
        ? prev.filter(item => !(item.name === result.name && item.price === result.price))
        : [...prev, result]
    );
  };
  
  const handleToggleAll = () => {
    if (selectedResults.length === ocrResults.length) {
      setSelectedResults([]);
    } else {
      setSelectedResults([...ocrResults]);
    }
  };

  const handleApply = () => {
    onApplyResults(selectedResults);
    // Don't close modal here, let the parent handle it after the async operation
  };

  const handleClose = () => {
    if (isLoading || isApplyingResults) return; // Prevent closing while loading
    setImagePreview(null);
    setSelectedResults([]);
    onClose();
  };

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="flex flex-col items-center justify-center h-64">
          <div className="w-12 h-12 border-4 border-t-4 border-gray-200 border-t-teal-500 rounded-full animate-spin"></div>
          <p className="text-gray-600 mt-4">กำลังอ่านข้อมูลจากใบเสร็จ...</p>
          {imagePreview && <img src={imagePreview} alt="Receipt preview" className="mt-4 max-h-40 rounded-lg shadow-md object-contain" />}
        </div>
      );
    }

    if (ocrResults.length > 0) {
      return (
        <div>
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-bold text-gray-800">รายการที่พบในใบเสร็จ</h3>
            <button onClick={handleToggleAll} className="text-sm font-semibold text-teal-600 hover:text-teal-800">
                {selectedResults.length === ocrResults.length ? 'ยกเลิกทั้งหมด' : 'เลือกทั้งหมด'}
            </button>
          </div>
          <ul className="space-y-2 max-h-60 overflow-y-auto pr-2 border-t border-b py-2">
            {ocrResults.map((result, index) => (
              <li key={index} className="flex items-center p-2 bg-gray-50 rounded-md cursor-pointer hover:bg-gray-100" onClick={() => handleResultToggle(result)}>
                <input
                  type="checkbox"
                  checked={selectedResults.some(item => item.name === result.name && item.price === result.price)}
                  readOnly
                  className="h-5 w-5 rounded border-gray-300 text-teal-600 focus:ring-teal-500"
                />
                <span className="ml-3 flex-grow text-gray-700">{result.name}</span>
                <span className="font-semibold text-gray-600">{result.price.toFixed(2)} บาท</span>
              </li>
            ))}
          </ul>
          <div className="mt-6 flex justify-end gap-3">
             <button 
                onClick={() => onProcessReceipt(cameraInputRef.current?.files?.[0] || fileInputRef.current?.files?.[0]!)} 
                className="text-sm text-gray-600 hover:underline disabled:text-gray-400"
                disabled={isApplyingResults}
              >
                ลองอีกครั้ง
            </button>
            <button 
              onClick={handleApply} 
              disabled={selectedResults.length === 0 || isApplyingResults} 
              className="bg-teal-600 text-white font-bold py-2 px-5 rounded-lg hover:bg-teal-700 disabled:bg-gray-300 flex items-center justify-center min-w-[120px]"
            >
              {isApplyingResults ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  กำลังจับคู่...
                </>
              ) : `ยืนยัน ${selectedResults.length} รายการ`}
            </button>
          </div>
        </div>
      );
    }

    return (
      <div className="flex flex-col items-center justify-center p-8">
        <CameraIcon className="w-16 h-16 text-gray-300 mb-4" />
        <h3 className="text-xl font-bold text-gray-700 mb-2">สแกนใบเสร็จของคุณ</h3>
        <p className="text-gray-500 text-center mb-6">ถ่ายรูปหรืออัปโหลดรูปภาพใบเสร็จเพื่อกรอกรายการและราคาโดยอัตโนมัติ</p>
        <div className="flex gap-4">
          <input type="file" accept="image/*" capture="environment" ref={cameraInputRef} onChange={handleFileChange} className="hidden" />
          <button onClick={() => cameraInputRef.current?.click()} className="flex-1 bg-teal-500 text-white font-semibold py-3 px-5 rounded-lg hover:bg-teal-600">
            ใช้กล้องถ่ายรูป
          </button>
          <input type="file" accept="image/*" ref={fileInputRef} onChange={handleFileChange} className="hidden" />
          <button onClick={() => fileInputRef.current?.click()} className="flex-1 bg-gray-200 text-gray-800 font-semibold py-3 px-5 rounded-lg hover:bg-gray-300">
            อัปโหลดรูปภาพ
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-gray-900 bg-opacity-75 flex items-center justify-center z-50 p-4" onClick={handleClose}>
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6 relative" onClick={(e) => e.stopPropagation()}>
        <button onClick={handleClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600" aria-label="Close modal" disabled={isLoading || isApplyingResults}>
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
        </button>
        {renderContent()}
      </div>
    </div>
  );
};