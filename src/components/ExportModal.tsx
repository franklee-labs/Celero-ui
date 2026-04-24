import { useState } from 'react';
import './ExportModal.css';

interface Props {
  open: boolean;
  content?: string;
  error?: string;
  onClose: () => void;
}

function ExportModal({ open, content, error, onClose }: Props) {
  const [copied, setCopied] = useState(false);

  if (!open) return null;

  const handleCopy = () => {
    if (!content) return;
    navigator.clipboard.writeText(content).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="export-overlay" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="export-dialog">
        <div className="export-header">
          <h4 className="export-title">{error ? 'Export Failed' : 'Export'}</h4>
          <div className="export-header-actions">
            {!error && (
              <button className="export-copy" onClick={handleCopy}>
                {copied ? '✓ Copied' : 'Copy'}
              </button>
            )}
            <button className="export-close" onClick={onClose}>✕</button>
          </div>
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
