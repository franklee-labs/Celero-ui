import { useState, useRef, useEffect } from 'react';
import './ImportModal.css';

interface Props {
  open: boolean;
  onConfirm: (json: string) => void;
  onClose: () => void;
  error?: string;
}

function ImportModal({ open, onConfirm, onClose, error }: Props) {
  const [value, setValue] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (open) {
      setValue('');
      setTimeout(() => textareaRef.current?.focus(), 0);
    }
  }, [open]);

  if (!open) return null;

  return (
    <div className="import-overlay" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="import-dialog">
        <div className="import-header">
          <h4 className="import-title">Import</h4>
          <button className="import-close" onClick={onClose}>✕</button>
        </div>
        <textarea
          ref={textareaRef}
          className="import-textarea"
          placeholder="Paste JSON here..."
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => e.stopPropagation()}
        />
        {error && <p className="import-error">{error}</p>}
        <div className="import-actions">
          <button className="import-btn-cancel" onClick={onClose}>Cancel</button>
          <button className="import-btn-confirm" onClick={() => onConfirm(value)}>Confirm</button>
        </div>
      </div>
    </div>
  );
}

export default ImportModal;
