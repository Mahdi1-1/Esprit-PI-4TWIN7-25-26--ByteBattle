import { useState, useEffect } from 'react';

export const useTypewriter = (text: string, speed: number = 50, delay: number = 0): string => {
  const [displayedText, setDisplayedText] = useState('');

  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    let i = 0;

    const typeChar = () => {
      setDisplayedText(text.slice(0, i + 1));
      i++;
      if (i < text.length) {
        timeoutId = setTimeout(typeChar, speed);
      }
    };

    const initialDelayId = setTimeout(typeChar, delay);

    return () => {
      clearTimeout(initialDelayId);
      clearTimeout(timeoutId);
    };
  }, [text, speed, delay]);

  return displayedText;
};
