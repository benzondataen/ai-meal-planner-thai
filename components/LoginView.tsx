
import React, { useState, useMemo } from 'react';
import { ChefHatIcon } from './icons/ChefHatIcon';
import firebase, { auth } from '../firebase';
// Fix for errors on line 4: Module '"firebase/auth"' has no exported member 'GoogleAuthProvider' or 'signInWithPopup'.
// Switched to v8 compatibility syntax.
// import 'firebase/auth-compat'; // This is redundant as it's handled in firebase.ts
import { Ad } from '../types';

const GoogleIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w.org/2000/svg" viewBox="0 0 48 48" width="24px" height="24px" {...props}>
        <path fill="#4285F4" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12s5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24s8.955,20,20,20s20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z" />
        <path fill="#34A853" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571l5.657,5.657C40.078,36.659,44,30.836,44,24C44,22.659,43.862,21.35,43.611,20.083z" />
        <path fill="#FBBC05" d="M9.804,28.99c-0.456-1.354-0.71-2.793-0.71-4.29s0.254-2.936,0.71-4.29l-5.657-5.657C2.353,17.9,2,20.846,2,24s0.353,6.1,1.148,8.843L9.804,28.99z" />
        <path fill="#EA4335" d="M24,48c5.268,0,10.046-1.947,13.59-5.181l-5.657-5.657C30.231,38.223,27.285,39,24,39c-3.6,0-6.733-1.447-8.961-3.784l-5.657,5.657C12.012,44.383,17.594,48,24,48z" />
        <path fill="none" d="M0,0h48v48H0z" />
    </svg>
);

const AdCard: React.FC<{ ad: Ad }> = ({ ad }) => {
    const domain = useMemo(() => {
        try {
            return new URL(ad.linkUrl).hostname.replace('www.', '');
        } catch {
            return '';
        }
    }, [ad.linkUrl]);

    return (
        <div className="my-8 w-full">
             <p className="text-xs text-gray-500 mb-2 font-semibold uppercase tracking-wider text-left">โฆษณา</p>
            <a href={ad.linkUrl} target="_blank" rel="noopener noreferrer" className="block bg-gray-100 rounded-lg shadow-inner overflow-hidden text-left no-underline hover:bg-gray-200 transition-colors">
                {ad.imageUrl && (
                    <img src={ad.imageUrl} alt={ad.title || 'Ad image'} className="w-full h-40 object-cover" />
                )}
                <div className="p-4">
                    <span className="text-xs text-gray-500 uppercase font-semibold">{domain}</span>
                    <h4 className="font-bold text-gray-800 truncate">{ad.title || ad.linkUrl}</h4>
                    {ad.description && (
                        <p className="text-sm text-gray-600 mt-1 line-clamp-2">{ad.description}</p>
                    )}
                </div>
            </a>
        </div>
    );
};


interface LoginViewProps {
  ads: Ad[];
}

export const LoginView: React.FC<LoginViewProps> = ({ ads }) => {
  const [error, setError] = useState<string | null>(null);
  const [isSigningIn, setIsSigningIn] = useState(false);

  const randomAd = useMemo(() => {
    if (!ads || ads.length === 0) return null;
    return ads[Math.floor(Math.random() * ads.length)];
  }, [ads]);

  const handleGoogleSignIn = async () => {
    setIsSigningIn(true);
    setError(null);
    const provider = new firebase.auth.GoogleAuthProvider();
    try {
      await auth.signInWithPopup(provider);
    } catch (err: any) {
      if (err.code !== 'auth/popup-closed-by-user') {
        setError('ไม่สามารถลงชื่อเข้าใช้ได้ กรุณาลองอีกครั้ง');
        console.error("Google Sign-In Error: ", err);
      }
    } finally {
      setIsSigningIn(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center text-center p-8 max-w-md mx-auto">
      <div className="bg-teal-100 rounded-full p-6 mb-6">
        <ChefHatIcon className="h-16 w-16 text-teal-600" />
      </div>
      <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-800 mb-4">
        ยินดีต้อนรับ
      </h2>
      <p className="max-w-xl text-lg text-gray-600 mb-8">
        ลงชื่อเข้าใช้ด้วยบัญชี Google เพื่อเริ่มสร้างแผนอาหารและบันทึกข้อมูลของคุณ
      </p>

      {randomAd && <AdCard ad={randomAd} />}

      {error && (
        <p className="text-red-500 text-sm mb-4">{error}</p>
      )}

      <button
        onClick={handleGoogleSignIn}
        disabled={isSigningIn}
        className="w-full flex items-center justify-center bg-white border border-gray-300 text-gray-700 font-bold py-3 px-8 rounded-full text-lg hover:bg-gray-50 focus:outline-none focus:ring-4 focus:ring-gray-200 transform transition duration-300 ease-in-out disabled:opacity-50 disabled:cursor-wait"
      >
        <GoogleIcon className="mr-3" />
        {isSigningIn ? 'กำลังลงชื่อเข้าใช้...' : 'ลงชื่อเข้าใช้ด้วย Google'}
      </button>
    </div>
  );
};