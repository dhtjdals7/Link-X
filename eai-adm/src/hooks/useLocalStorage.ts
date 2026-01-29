import { useState, useEffect } from 'react';

export default function useLocalStorage(key: string, defaultValue: any) {
  const [value, setValue] = useState(() => {
    let currentValue;
    try {
      const item = window.localStorage.getItem(key);
      currentValue = item ? JSON.parse(item) : defaultValue;
    } catch (error) {
      currentValue = defaultValue;
    }
    return currentValue;
  });

  useEffect(() => {
    window.localStorage.setItem(key, JSON.stringify(value));
  }, [key, value]);

  return [value, setValue];
}