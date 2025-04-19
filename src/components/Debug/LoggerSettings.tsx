import React, { useState, useEffect } from 'react';
import { 
  logger, 
  getLoggerConfig, 
  configureLogger, 
  setCategoryEnabled,
  enableAllLogs,
  disableAllLogs,
  setReduxLogging,
  setReduxErrorLogging,
  LoggerConfig,
  LogLevel
} from '../../utils/logger';

/**
 * A component for controlling the logger settings at runtime.
 * This is useful for debugging but should be disabled in production.
 */
export const LoggerSettings: React.FC = () => {
  const [config, setConfig] = useState<LoggerConfig>(getLoggerConfig());
  const [isExpanded, setIsExpanded] = useState(true);

  // Initialize: Turn off Redux logging immediately when component mounts
  useEffect(() => {
    // Ensure Redux logs are completely disabled on mount
    const disableReduxLogs = () => {
      setCategoryEnabled('redux', false);
      configureLogger({
        categories: {
          redux: false
        }
      });
      console.log('%c[LOGGER] Redux logs disabled', 'background:#333; color:#ff9; padding:2px;');
      
      // Update local state to match
      setConfig(prev => ({
        ...prev,
        categories: {
          ...prev.categories,
          redux: false
        }
      }));
    };
    
    disableReduxLogs();
    
    // Do this again after a short delay to make sure it sticks
    setTimeout(disableReduxLogs, 500);
    
  }, []);

  // Update local state to match logger config
  useEffect(() => {
    setConfig(getLoggerConfig());
  }, []);

  // Toggle global logging
  const handleToggleLogging = () => {
    const newState = !config.enabled;
    if (newState) {
      enableAllLogs();
      // Still keep Redux logs disabled
      setCategoryEnabled('redux', false);
    } else {
      disableAllLogs();
    }
    
    setConfig(prev => ({ 
      ...prev, 
      enabled: newState,
      categories: {
        ...prev.categories,
        redux: false // Always keep Redux off
      }
    }));
  };

  // Update log level
  const handleLogLevelChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const level = e.target.value as LogLevel;
    configureLogger({ level });
    setConfig(prev => ({ ...prev, level }));
  };

  // Toggle category
  const handleCategoryToggle = (category: string, enabled: boolean) => {
    setCategoryEnabled(category, enabled);
    
    // Update local state
    setConfig(prev => ({
      ...prev,
      categories: {
        ...prev.categories,
        [category]: enabled
      }
    }));
  };

  // Toggle Redux logs
  const toggleReduxLogs = (enabled: boolean) => {
    setReduxLogging(enabled);
    setConfig(prev => ({
      ...prev,
      categories: {
        ...prev.categories,
        redux: enabled
      }
    }));
  };

  return (
    <div className="bg-gray-100 p-3 rounded shadow-sm text-sm">
      <div className="flex justify-between items-center cursor-pointer" 
           onClick={() => setIsExpanded(!isExpanded)}>
        <h3 className="font-semibold text-gray-700">Logger Settings</h3>
        <span>{isExpanded ? '▲' : '▼'}</span>
      </div>
      
      {isExpanded && (
        <div className="mt-3">
          <div className="flex items-center justify-between mb-3">
            <span>Enable Logging:</span>
            <button 
              onClick={handleToggleLogging}
              className={`px-2 py-1 rounded text-white ${config.enabled ? 'bg-green-500' : 'bg-red-500'}`}
            >
              {config.enabled ? 'Enabled' : 'Disabled'}
            </button>
          </div>

          <div className="flex items-center justify-between mb-3">
            <span>Log Level:</span>
            <select 
              value={config.level} 
              onChange={handleLogLevelChange}
              className="border rounded px-2 py-1"
              disabled={!config.enabled}
            >
              <option value="debug">Debug</option>
              <option value="info">Info</option>
              <option value="warn">Warning</option>
              <option value="error">Error</option>
            </select>
          </div>

          <div className="mb-3">
            <span className="font-medium block mb-2">Quick Settings:</span>
            <div className="flex flex-wrap gap-2">
              <button 
                onClick={() => toggleReduxLogs(true)}
                className={`px-2 py-1 text-xs rounded ${config.categories.redux ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
                disabled={!config.enabled}
              >
                Enable Redux Logs
              </button>
              <button 
                onClick={() => toggleReduxLogs(false)}
                className={`px-2 py-1 text-xs rounded ${!config.categories.redux ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
                disabled={!config.enabled}
              >
                Disable Redux Logs
              </button>
            </div>
          </div>

          <div className="mt-3">
            <span className="font-medium block mb-1">Categories:</span>
            <div className="grid grid-cols-2 gap-2 mt-1">
              {Object.entries(config.categories).map(([category, enabled]) => (
                <div key={category} className="flex items-center">
                  <input
                    type="checkbox"
                    id={`category-${category}`}
                    checked={enabled}
                    onChange={(e) => handleCategoryToggle(category, e.target.checked)}
                    className="mr-1"
                    disabled={!config.enabled}
                  />
                  <label 
                    htmlFor={`category-${category}`} 
                    className={!config.enabled ? 'text-gray-400' : ''}
                  >
                    {category.replace('_', ' ')}
                  </label>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};