import React, { useCallback } from 'react';
import { useLayout } from '../../hooks/useLayout';

const SwapControls: React.FC<{ 
  sourcePaneId: string;
  targetPaneId: string;
}> = ({ sourcePaneId, targetPaneId }) => {
  const { swapPanes } = useLayout();

  return (
    <div className="swap-controls absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
      <button
        onClick={() => swapPanes(sourcePaneId, targetPaneId)}
        className="bg-white p-2 rounded-full shadow-lg border"
      >
        ↔
      </button>
    </div>
  );
};

export default SwapControls; 