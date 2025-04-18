/**
 * Electron Setup Helper
 * 
 * This script ensures all required files are properly set up for Electron
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('Running Electron setup...');

// Verify permissions on preload script
try {
  const preloadPath = path.join(__dirname, 'preload.js');
  if (fs.existsSync(preloadPath)) {
    const stats = fs.statSync(preloadPath);
    console.log(`preload.js permissions: ${stats.mode.toString(8)}`);
    
    // Ensure read permission
    fs.chmodSync(preloadPath, 0o644);
    console.log('Updated preload.js permissions to readable');
  } else {
    console.error('preload.js not found at:', preloadPath);
  }
} catch (error) {
  console.error('Error checking preload permissions:', error);
}

// Log all file access methods available
console.log('File Access Methods:');
console.log('- fs.existsSync available:', typeof fs.existsSync === 'function');
console.log('- fs.readFile available:', typeof fs.readFile === 'function');
console.log('- fs.promises.readFile available:', typeof fs.promises?.readFile === 'function');

console.log('Electron setup completed');

// Export a function to validate a PDF path
export function validatePdfPath(filePath) {
  try {
    console.log(`Validating PDF path: ${filePath}`);
    
    // Check if file exists
    if (!fs.existsSync(filePath)) {
      console.log(`File does not exist: ${filePath}`);
      
      // Check if it's a relative path that needs to be resolved
      const possiblePaths = [
        path.join(__dirname, '..', filePath), // Relative to project root
        path.join(__dirname, '../public', filePath.replace(/^\//, '')), // Relative to public dir
        path.join(__dirname, '../dist', filePath.replace(/^\//, '')) // Relative to dist dir
      ];
      
      for (const possiblePath of possiblePaths) {
        console.log(`Trying alternate path: ${possiblePath}`);
        if (fs.existsSync(possiblePath)) {
          console.log(`Found file at: ${possiblePath}`);
          return { valid: true, resolvedPath: possiblePath };
        }
      }
      
      return { valid: false, error: 'File does not exist' };
    }
    
    // Check if it's a PDF
    if (path.extname(filePath).toLowerCase() !== '.pdf') {
      return { valid: false, error: 'Not a PDF file' };
    }
    
    // Check if it's readable
    try {
      // Try to read at least 1 byte
      const fd = fs.openSync(filePath, 'r');
      const buffer = Buffer.alloc(1);
      fs.readSync(fd, buffer, 0, 1, 0);
      fs.closeSync(fd);
      return { valid: true, resolvedPath: filePath };
    } catch (readError) {
      return { valid: false, error: 'File not readable' };
    }
  } catch (error) {
    return { valid: false, error: error.message };
  }
} 