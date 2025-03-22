import { useLayout } from '../../contexts/LayoutContext';

const SplitControls: React.FC<{ paneId: string }> = ({ paneId }) => {
  const { splitPane, canAddPane } = useLayout();

  return (
    <div className="split-controls absolute top-2 right-2 flex gap-1">
      <button
        onClick={() => splitPane(paneId, 'horizontal')}
        disabled={!canAddPane}
        className="p-1 hover:bg-gray-100 rounded"
      >
        ➔
      </button>
      <button
        onClick={() => splitPane(paneId, 'vertical')}
        disabled={!canAddPane}
        className="p-1 hover:bg-gray-100 rounded"
      >
        ⬍
      </button>
    </div>
  );
};

export default SplitControls; 