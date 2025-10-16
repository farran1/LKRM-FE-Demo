import { useState, useEffect, useCallback, useRef } from 'react';

/**
 * Custom hook for debounced search functionality
 * @param initialValue - Initial search value
 * @param delay - Delay in milliseconds (default: 500ms)
 * @param onSearch - Callback function to execute when search is triggered
 * @returns Object containing searchTerm, setSearchTerm, and isSearching
 */
export function useDebouncedSearch(
  initialValue: string = '',
  delay: number = 500,
  onSearch?: (value: string) => void
) {
  // Ensure initialValue is always a string
  const safeInitialValue = initialValue || '';
  
  const [searchTerm, setSearchTerm] = useState(safeInitialValue);
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState(safeInitialValue);
  const [isSearching, setIsSearching] = useState(false);
  const onSearchRef = useRef(onSearch);

  // Update the ref when onSearch changes
  useEffect(() => {
    onSearchRef.current = onSearch;
  }, [onSearch]);

  // Update debounced value after delay
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
      setIsSearching(false);
    }, delay);

    // If search term is not empty, show searching state
    // Ensure searchTerm is a string before calling trim()
    if (searchTerm && typeof searchTerm === 'string' && searchTerm.trim()) {
      setIsSearching(true);
    } else {
      setIsSearching(false);
    }

    return () => clearTimeout(timer);
  }, [searchTerm, delay]);

  // Trigger search when debounced value changes
  useEffect(() => {
    if (onSearchRef.current) {
      onSearchRef.current(debouncedSearchTerm);
    }
  }, [debouncedSearchTerm]);

  // Handle immediate search (for Enter key)
  const handleImmediateSearch = useCallback(() => {
    if (onSearchRef.current && searchTerm && typeof searchTerm === 'string') {
      onSearchRef.current(searchTerm);
    }
  }, [searchTerm]);

  // Clear search
  const clearSearch = useCallback(() => {
    setSearchTerm('');
    setDebouncedSearchTerm('');
    setIsSearching(false);
  }, []);

  return {
    searchTerm,
    setSearchTerm,
    debouncedSearchTerm,
    isSearching,
    handleImmediateSearch,
    clearSearch
  };
}








