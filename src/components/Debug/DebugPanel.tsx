import React, { useState, useEffect } from 'react';
import { LoggerSettings } from './LoggerSettings';
import { DocumentRenderDebug } from './DocumentRenderDebug';
import { LayoutInspector } from './LayoutInspector';
import { logger, setCategoryEnabled } from '../../utils/logger';

/**
 * A simplified debug panel that can be toggled with a keyboard shortcut
 */
export const DebugPanel: React.FC = () => {
  const [isVisible, setIsVisible] = useState(true); // Default to visible for testing

  const [activeTab, setActiveTab] = useState<'settings' | 'stats' | 'layout'>('settings');

  // Initialize: Ensure redux logs are off by default
  useEffect(() => {
    // This ensures redux logs are disabled when the component mounts
    setCategoryEnabled('redux', false);
    
    // Simple marker in console to confirm panel is working
    console.log('%c[DEBUG PANEL] Initialized and ready', 'background:#333; color:#bada55; padding:2px;');
    
    // Add keyboard event listener
    const toggleVisibility = (e: KeyboardEvent) => {
      if (e.code === 'KeyD' && (e.altKey || e.metaKey)) {
        e.preventDefault();
        console.log('%c[DEBUG PANEL] Toggling visibility', 'background:#333; color:#bada55');
        setIsVisible(prev => !prev);
      }
    };
    
    window.addEventListener('keydown', toggleVisibility);
    
    return () => {
      window.removeEventListener('keydown', toggleVisibility);
    };
  }, []);

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-0 right-0 w-80 bg-white shadow-lg rounded-tl-lg overflow-hidden z-50 border border-gray-300">
      <div className="bg-gray-800 text-white p-2 flex justify-between items-center">
        <h2 className="text-sm font-semibold">Debug Panel</h2>
        <button 
          onClick={() => setIsVisible(false)}
          className="text-gray-300 hover:text-white"
          aria-label="Close debug panel"
        >
          ✕
        </button>
      </div>
      
      <div className="flex border-b border-gray-300">
        <button 
          className={`flex-1 py-2 px-4 text-sm ${activeTab === 'settings' ? 'bg-gray-100 font-medium' : 'bg-white'}`}
          onClick={() => setActiveTab('settings')}
        >
          Settings
        </button>
        <button 
          className={`flex-1 py-2 px-4 text-sm ${activeTab === 'stats' ? 'bg-gray-100 font-medium' : 'bg-white'}`}
          onClick={() => setActiveTab('stats')}
        >
          Stats
        </button>
        <button 
          className={`flex-1 py-2 px-4 text-sm ${activeTab === 'layout' ? 'bg-gray-100 font-medium' : 'bg-white'}`}
          onClick={() => setActiveTab('layout')}
        >
          Layout
        </button>
      </div>
      
      <div className="p-3 max-h-96 overflow-y-auto">
        {activeTab === 'settings' && (
          <LoggerSettings />
        )}
        
        {activeTab === 'stats' && (
          <DocumentRenderDebug />
        )}
        
        {activeTab === 'layout' && (
          <LayoutInspector />
        )}
      </div>
      
      <div className="bg-gray-100 p-2 rounded mx-3 mb-3">
        <p className="text-xs text-gray-600">
          Keyboard Shortcuts:
          <br />
          <kbd className="px-1 py-0.5 bg-gray-200 rounded">Option+D</kbd> or <kbd className="px-1 py-0.5 bg-gray-200 rounded">Alt+D</kbd> Toggle debug panel
        </p>
      </div>
    </div>
  );
};