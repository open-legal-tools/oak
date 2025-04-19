import React, { useEffect, useState } from 'react';

interface FileCheckerProps {
  paths: string[];
}

const FileChecker: React.FC<FileCheckerProps> = ({ paths }) => {
  const [results, setResults] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const checkFiles = async () => {
      const checks = await Promise.all(
        paths.map(async (path) => {
          try {
            const response = await fetch(path, { method: 'HEAD' });
            return { path, exists: response.ok };
          } catch (error) {
            return { path, exists: false };
          }
        })
      );

      const resultsMap = checks.reduce((acc, { path, exists }) => {
        acc[path] = exists;
        return acc;
      }, {} as Record<string, boolean>);

      setResults(resultsMap);
    };

    checkFiles();
  }, [paths]);

  return (
    <div className="file-checker p-4 bg-gray-100 rounded">
      <h3 className="font-bold mb-2">File Availability Check</h3>
      <ul>
        {Object.entries(results).map(([path, exists]) => (
          <li key={path} className={exists ? 'text-green-600' : 'text-red-600'}>
            {path}: {exists ? 'Available' : 'Not Found'}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default FileChecker; 