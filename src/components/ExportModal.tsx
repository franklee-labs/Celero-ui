import './ExportModal.css';

interface Props {
  open: boolean;
  content?: string;
  error?: string;
  onClose: () => void;
}

function ExportModal({ open, content, error, onClose }: Props) {
  if (!open) return null;

  return (
    <div className="export-overlay" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="export-dialog">
        <div className="export-header">
          <h4 className="export-title">{error ? 'Export Failed' : 'Export'}</h4>
          <button className="export-close" onClick={onClose}>✕</button>
        </div>
        {error
          ? <pre className="export-error">{error}</pre>
          : <pre className="export-content">{content}</pre>
        }
      </div>
    </div>
  );
}

export default ExportModal;
