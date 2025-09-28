import React, { useState, useEffect, useRef } from 'react';
import { fuzzySearch } from '../utils/fuzzySearch';

interface AutocompleteInputProps {
  value: string;
  onChange: (newValue: string) => void;
  onBlur: (event: React.FocusEvent<HTMLInputElement>) => void;
  allSuggestions: string[];
  placeholder?: string;
}

export const AutocompleteInput: React.FC<AutocompleteInputProps> = ({ value, onChange, onBlur, allSuggestions, placeholder }) => {
  const [filteredSuggestions, setFilteredSuggestions] = useState<string[]>([]);
  const [isSuggestionsVisible, setIsSuggestionsVisible] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const suggestionsListRef = useRef<HTMLUListElement>(null);

  useEffect(() => {
    // Hide suggestions when clicking outside the component
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsSuggestionsVisible(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);
  
  // Scroll active item into view when navigating with keyboard
  useEffect(() => {
    if (isSuggestionsVisible && activeIndex > -1 && suggestionsListRef.current) {
        const activeItem = suggestionsListRef.current.children[activeIndex] as HTMLLIElement;
        if (activeItem) {
            activeItem.scrollIntoView({
                block: 'nearest',
            });
        }
    }
  }, [activeIndex, isSuggestionsVisible]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    onChange(newValue);
    setActiveIndex(-1); // Reset selection on text change
    if (newValue) {
      setFilteredSuggestions(fuzzySearch(newValue, allSuggestions));
      setIsSuggestionsVisible(true);
    } else {
      setIsSuggestionsVisible(false);
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    onChange(suggestion);
    setIsSuggestionsVisible(false);
    setActiveIndex(-1);
  };

  const handleFocus = () => {
      if (value) {
          setFilteredSuggestions(fuzzySearch(value, allSuggestions));
          setIsSuggestionsVisible(true);
      }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isSuggestionsVisible || filteredSuggestions.length === 0) return;

    switch (e.key) {
        case 'ArrowDown':
            e.preventDefault();
            setActiveIndex(prevIndex =>
                prevIndex === filteredSuggestions.length - 1 ? 0 : prevIndex + 1
            );
            break;
        case 'ArrowUp':
            e.preventDefault();
            setActiveIndex(prevIndex =>
                prevIndex <= 0 ? filteredSuggestions.length - 1 : prevIndex - 1
            );
            break;
        case 'Enter':
            if (activeIndex > -1) {
                e.preventDefault();
                handleSuggestionClick(filteredSuggestions[activeIndex]);
            }
            break;
        case 'Escape':
            setIsSuggestionsVisible(false);
            setActiveIndex(-1);
            break;
    }
  };


  return (
    <div className="relative" ref={containerRef}>
      <input
        type="text"
        value={value}
        onChange={handleInputChange}
        onBlur={onBlur}
        onFocus={handleFocus}
        onKeyDown={handleKeyDown}
        className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-teal-500 focus:border-teal-500"
        placeholder={placeholder}
        autoComplete="off"
      />
      {isSuggestionsVisible && filteredSuggestions.length > 0 && (
        <ul
          ref={suggestionsListRef} 
          className="absolute z-10 w-full bg-white border border-gray-300 rounded-md shadow-lg mt-1 max-h-60 overflow-y-auto"
        >
          {filteredSuggestions.map((suggestion, index) => (
            <li
              key={index}
              className={`p-2 cursor-pointer ${
                index === activeIndex ? 'bg-teal-100' : 'hover:bg-teal-100'
              }`}
              onMouseDown={(e) => { 
                  e.preventDefault(); // Prevent blur event from firing before click
                  handleSuggestionClick(suggestion);
              }}
            >
              {suggestion}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};
