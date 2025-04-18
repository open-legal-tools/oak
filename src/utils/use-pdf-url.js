import { useEffect, useState } from 'react';

/**
 * Custom hook for handling PDF URLs across different environments
 * 
 * @param {string} inputUrl - The raw URL or path to the PDF
 * @returns {object} - Object containing the processed URL and loading state
 */
export function usePdfUrl(inputUrl) {
  const [url, setUrl] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    if (!inputUrl) {
      setUrl('');
      setError(null);
      return;
    }
    
    const processUrl = async () => {
      setIsProcessing(true);
      setError(null);
      
      try {
        console.log('Processing PDF URL:', inputUrl);
        
        // Handle absolute file paths (typically from Electron file dialog)
        if (inputUrl.startsWith('/') && !inputUrl.startsWith('//')) {
          setUrl(inputUrl);
        }
        // Handle HTTP URLs
        else if (inputUrl.startsWith('http://') || inputUrl.startsWith('https://')) {
          setUrl(inputUrl);
        }
        // Handle relative paths (like ./test-assets/sample.pdf)
        else if (inputUrl.startsWith('./') || !inputUrl.includes('://')) {
          // In Electron, we want to keep relative paths as-is
          if (window.electron) {
            setUrl(inputUrl);
          } else {
            // For web, resolve relative to origin
            const base = window.location.origin;
            const resolved = new URL(inputUrl, base).toString();
            setUrl(resolved);
            console.log('Resolved relative URL:', resolved);
          }
        }
        // Other cases (like file:// URLs)
        else {
          setUrl(inputUrl);
        }
      } catch (err) {
        console.error('Error processing PDF URL:', err);
        setError(err.message || 'Failed to process PDF URL');
      } finally {
        setIsProcessing(false);
      }
    };
    
    processUrl();
  }, [inputUrl]);
  
  return { url, isProcessing, error };
}

export default usePdfUrl; 