import React, { createContext, useContext, useState } from 'react';

interface ScreenReaderContextType {
  announce: (message: string) => void;
}

const ScreenReaderContext = createContext<ScreenReaderContextType | null>(null);

export const useScreenReader = () => {
  const context = useContext(ScreenReaderContext);
  if (!context) {
    throw new Error('useScreenReader must be used within a ScreenReaderAnnouncerProvider');
  }
  return context;
};

export const announce = (message: string) => {
  const announcer = document.getElementById('screen-reader-announcer');
  if (announcer) {
    announcer.textContent = message;
  }
};

interface ScreenReaderAnnouncerProviderProps {
  children: React.ReactNode;
}

export const ScreenReaderAnnouncerProvider: React.FC<ScreenReaderAnnouncerProviderProps> = ({ children }) => {
  const [, setAnnouncements] = useState<string[]>([]);

  const announceMessage = (message: string) => {
    setAnnouncements(prev => [...prev, message]);
    announce(message);
  };

  return (
    <ScreenReaderContext.Provider value={{ announce: announceMessage }}>
      {children}
      <div
        id="screen-reader-announcer"
        aria-live="polite"
        aria-atomic="true"
        style={{
          position: 'absolute',
          width: '1px',
          height: '1px',
          padding: '0',
          overflow: 'hidden',
          clip: 'rect(0, 0, 0, 0)',
          whiteSpace: 'nowrap',
          border: '0'
        }}
      />
    </ScreenReaderContext.Provider>
  );
}; 