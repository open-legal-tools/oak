// components/a11y/ScreenReaderAnnouncer.tsx
import React, { useState, useEffect } from 'react';

interface ScreenReaderAnnouncerProps {
  message?: string;
}

const ScreenReaderAnnouncer: React.FC<ScreenReaderAnnouncerProps> = ({ message }) => {
  const [announcement, setAnnouncement] = useState(message || '');
  
  useEffect(() => {
    if (message) {
      setAnnouncement(message);
    }
  }, [message]);
  
  return (
    <div 
      className="sr-only" 
      aria-live="polite"
      role="status"
    >
      {announcement}
    </div>
  );
};

// Singleton pattern for global announcements
let globalAnnounce: ((message: string) => void) | null = null;

export const ScreenReaderAnnouncerProvider: React.FC<{children: React.ReactNode}> = ({ children }) => {
  const [message, setMessage] = useState('');
  
  // Expose the announce function globally
  useEffect(() => {
    globalAnnounce = setMessage;
    return () => {
      globalAnnounce = null;
    };
  }, []);
  
  return (
    <>
      <ScreenReaderAnnouncer message={message} />
      {children}
    </>
  );
};

// Function to announce messages from anywhere
export function announce(message: string) {
  if (globalAnnounce) {
    globalAnnounce(message);
  }
}

export default ScreenReaderAnnouncer;