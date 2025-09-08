import React, { useState, useEffect, useMemo } from 'react';
import { Ad } from '../types';

interface AdPopupProps {
  ads: Ad[];
}

// Fisher-Yates shuffle algorithm to randomize ad order
const shuffleArray = (array: Ad[]) => {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
};

export const AdPopup: React.FC<AdPopupProps> = ({ ads }) => {
  const [isVisible, setIsVisible] = useState(true);
  const [currentAdIndex, setCurrentAdIndex] = useState(0);

  // Shuffle ads only once when the component mounts or the ad list changes
  const shuffledAds = useMemo(() => shuffleArray(ads), [ads]);

  useEffect(() => {
    if (shuffledAds.length > 1) {
      const intervalId = setInterval(() => {
        setCurrentAdIndex(prevIndex => (prevIndex + 1) % shuffledAds.length);
      }, 5000); // Change ad every 5 seconds

      return () => clearInterval(intervalId);
    }
  }, [shuffledAds.length]);

  if (!isVisible || shuffledAds.length === 0) {
    return null;
  }

  const currentAd = shuffledAds[currentAdIndex];
  
  const domain = useMemo(() => {
        try {
            return new URL(currentAd.linkUrl).hostname.replace('www.', '');
        } catch {
            return '';
        }
    }, [currentAd.linkUrl]);


  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:top-auto md:bottom-4 w-auto max-w-xs z-60">
      <div className="relative bg-white rounded-lg shadow-2xl transition-all duration-300 ease-in-out overflow-hidden">
        <button
          onClick={() => setIsVisible(false)}
          className="absolute top-2 right-2 bg-gray-800 text-white rounded-full h-6 w-6 flex items-center justify-center text-sm z-10 hover:bg-black"
          aria-label="Close Ad"
        >
          &times;
        </button>
        
        <a href={currentAd.linkUrl} target="_blank" rel="noopener noreferrer" className="block no-underline">
            {currentAd.imageUrl && (
                <img src={currentAd.imageUrl} alt={currentAd.title || 'Ad Image'} className="w-full h-32 object-cover" />
            )}
             <div className="p-3">
                <p className="text-xs text-gray-500 mb-1 font-semibold uppercase tracking-wider">โฆษณา</p>
                <span className="text-xs text-gray-500 uppercase font-semibold">{domain}</span>
                <h4 className="font-bold text-gray-800 text-sm truncate">{currentAd.title || currentAd.linkUrl}</h4>
            </div>
        </a>
      </div>
    </div>
  );
};