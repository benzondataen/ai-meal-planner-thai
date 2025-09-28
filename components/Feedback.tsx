import React, { useState } from 'react';
import { User } from 'firebase/auth';
import { FeedbackIcon } from './icons/FeedbackIcon';
import { FeedbackTopic, FeedbackData } from '../types';
import { saveFeedback } from '../services/firestoreService';

interface FeedbackProps {
  user: User;
  idToken: string;
}

type SubmissionStatus = 'idle' | 'submitting' | 'success' | 'error';

export const Feedback: React.FC<FeedbackProps> = ({ user, idToken }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [topic, setTopic] = useState<FeedbackTopic>(FeedbackTopic.SUGGESTION);
  const [details, setDetails] = useState('');
  const [status, setStatus] = useState<SubmissionStatus>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  const handleOpenModal = () => setIsModalOpen(true);
  const handleCloseModal = () => {
    if (status === 'submitting') return;
    setIsModalOpen(false);
    // Reset form after a small delay to allow for closing animation
    setTimeout(() => {
        setStatus('idle');
        setDetails('');
        setTopic(FeedbackTopic.SUGGESTION);
        setErrorMessage('');
    }, 300);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!details.trim()) {
        setErrorMessage('กรุณาใส่รายละเอียด');
        return;
    }

    setStatus('submitting');
    setErrorMessage('');

    const feedbackData: Omit<FeedbackData, 'id'> = {
        topic,
        details,
        userId: user.uid,
        createdAt: new Date().toISOString(),
    };

    try {
        await saveFeedback(feedbackData, idToken);
        setStatus('success');
        setDetails('');
    } catch (error) {
        setStatus('error');
        setErrorMessage('เกิดข้อผิดพลาดในการส่งข้อมูล');
    }
  };
  
  const topicLabels: Record<FeedbackTopic, string> = {
      [FeedbackTopic.BUG]: 'แจ้งปัญหา (Bug)',
      [FeedbackTopic.SUGGESTION]: 'ข้อเสนอแนะ',
      [FeedbackTopic.FEATURE_REQUEST]: 'แนะนำฟีเจอร์ใหม่'
  };

  return (
    <>
      <button
        onClick={handleOpenModal}
        className="fixed bottom-6 left-6 bg-teal-600 text-white p-4 rounded-full shadow-lg hover:bg-teal-700 focus:outline-none focus:ring-4 focus:ring-teal-300 transform transition-transform hover:scale-110 z-50"
        aria-label="ส่งข้อเสนอแนะ"
      >
        <FeedbackIcon className="h-6 w-6" />
      </button>

      {isModalOpen && (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-75 flex items-center justify-center z-50 p-4" onClick={handleCloseModal}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 relative" onClick={(e) => e.stopPropagation()}>
            <button onClick={handleCloseModal} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600" aria-label="Close modal">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
            </button>
            
            <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">ส่งข้อเสนอแนะ</h2>

            {status === 'success' ? (
                <div className="text-center p-8">
                    <h3 className="text-xl font-bold text-green-600 mb-2">ขอบคุณสำหรับข้อเสนอแนะ!</h3>
                    <p className="text-gray-600">เราได้รับข้อมูลของคุณแล้ว และจะนำไปพัฒนาต่อไป</p>
                    <button onClick={handleCloseModal} className="mt-6 bg-teal-600 text-white font-bold py-2 px-6 rounded-full hover:bg-teal-700">
                        ปิด
                    </button>
                </div>
            ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label htmlFor="topic" className="block text-sm font-medium text-gray-700 mb-1">หัวข้อ</label>
                        <select
                            id="topic"
                            value={topic}
                            onChange={(e) => setTopic(e.target.value as FeedbackTopic)}
                            className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-teal-500 focus:border-teal-500"
                        >
                            {Object.entries(topicLabels).map(([key, label]) => (
                                <option key={key} value={key}>{label}</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label htmlFor="details" className="block text-sm font-medium text-gray-700 mb-1">รายละเอียด</label>
                        <textarea
                            id="details"
                            rows={5}
                            value={details}
                            onChange={(e) => setDetails(e.target.value)}
                            className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-teal-500 focus:border-teal-500"
                            placeholder="บอกเราเพิ่มเติมเกี่ยวกับความคิดของคุณ..."
                        />
                    </div>

                    {(status === 'error' || errorMessage) && (
                        <p className="text-sm text-red-600">{errorMessage}</p>
                    )}

                    <button
                        type="submit"
                        disabled={status === 'submitting'}
                        className="w-full bg-teal-600 text-white font-bold py-3 px-6 rounded-full text-lg hover:bg-teal-700 focus:outline-none focus:ring-4 focus:ring-teal-300 disabled:bg-gray-400 flex items-center justify-center"
                    >
                        {status === 'submitting' ? (
                            <>
                                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                กำลังส่ง...
                            </>
                        ) : 'ส่งข้อเสนอแนะ'}
                    </button>
                </form>
            )}
          </div>
        </div>
      )}
    </>
  );
};