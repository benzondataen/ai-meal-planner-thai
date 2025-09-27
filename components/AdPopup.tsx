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
  console.log("AdPopup received ads props:", ads);
  const [isVisible, setIsVisible] = useState(true);
  const [currentAdIndex, setCurrentAdIndex] = useState(0);

  // Shuffle ads only once when the component mounts or the ad list changes
  const shuffledAds = useMemo(() => shuffleArray(ads), [ads]);

  useEffect(() => {
    if (shuffledAds.length > 1) {
      const intervalId = setInterval(() => {
        setCurrentAdIndex(prevIndex => (prevIndex + 1) % shuffledAds.length);
      }, 20000); // Change ad every 20 seconds

      return () => clearInterval(intervalId);
    }
  }, [shuffledAds.length]);

  if (!isVisible || shuffledAds.length === 0) {
    return null;
  }

  const currentAd = shuffledAds[currentAdIndex];

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:top-1/2 md:-translate-y-1/2 md:bottom-auto w-auto max-w-xs z-60">
      <div className="relative bg-white rounded-lg shadow-2xl p-4 transition-all duration-300 ease-in-out">
        <button
          onClick={() => setIsVisible(false)}
          className="absolute -top-2 -right-2 bg-gray-800 text-white rounded-full h-7 w-7 flex items-center justify-center text-lg z-10 hover:bg-black"
          aria-label="Close Ad"
        >
          &times;
        </button>
        <p className="text-xs text-gray-500 mb-1 font-semibold uppercase tracking-wider">โฆษณา</p>
        <a href={currentAd.linkUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-teal-600 hover:underline break-words">
          {currentAd.linkUrl}
        </a>
      </div>
    </div>
  );
};
