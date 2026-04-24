import { useEffect, useRef, useState } from 'react';
import './NodeEditModal.css';

const VALUE_TYPE_OPTIONS: Record<string, string[]> = {
  EQ:  ['Expression', 'String', 'Number', 'Boolean'],
  NEQ: ['Expression', 'String', 'Number', 'Boolean'],
  GT:  ['Expression', 'String', 'Number', 'Boolean'],
  GTE: ['Expression', 'String', 'Number', 'Boolean'],
  LT:  ['Expression', 'String', 'Number', 'Boolean'],
  LTE: ['Expression', 'String', 'Number', 'Boolean'],
  IN:  ['Expression', 'List'],
  NIN: ['Expression', 'List'],
};

const EXPRESSION_ONLY_SIGNS = new Set(['CEL']);

export interface ConditionData {
  field?: string;
  value?: string;
  valueType?: string;
  expression?: string;
  name?: string;
}

const RELATION_SIGNS = ['AND', 'OR', 'NOT'] as const;

type RelationProps = {
  kind: 'relation';
  initialSign: string;
  initialName: string;
  onSave: (name: string, sign: string) => void;
};

type ConditionProps = {
  kind: 'condition';
  sign: string;
  initialField: string;
  initialValue: string;
  initialValueType: string;
  initialName: string;
  onSave: (data: ConditionData) => void;
};

type Props = (RelationProps | ConditionProps) & {
  open: boolean;
  onClose: () => void;
};

function NodeEditModal(props: Props) {
  const { open, onClose } = props;
  const firstInputRef = useRef<HTMLInputElement>(null);

  const [name, setName]             = useState('');
  const [sign, setSign]             = useState('AND');
  const [field, setField]           = useState('');
  const [value, setValue]           = useState('');
  const [valueType, setValueType]   = useState('');
  const [expression, setExpression] = useState('');

  useEffect(() => {
    if (!open) return;
    if (props.kind === 'relation') {
      setSign(props.initialSign);
      setName(props.initialName);
    } else {
      setName(props.initialName);
      const isExprOnly = EXPRESSION_ONLY_SIGNS.has(props.sign);
      if (isExprOnly) {
        setExpression(props.initialField ?? '');
      } else {
        setField(props.initialField ?? '');
        setValue(props.initialValue ?? '');
        const opts = VALUE_TYPE_OPTIONS[props.sign];
        setValueType(props.initialValueType || (opts ? opts[0] : ''));
      }
    }
    setTimeout(() => firstInputRef.current?.focus(), 0);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  if (!open) return null;

  const isExprOnly       = props.kind === 'condition' && EXPRESSION_ONLY_SIGNS.has(props.sign);
  const valueTypeOptions = props.kind === 'condition' && !isExprOnly ? VALUE_TYPE_OPTIONS[props.sign] : undefined;

  const handleSave = () => {
    if (props.kind === 'relation') {
      props.onSave(name, sign);
    } else if (isExprOnly) {
      props.onSave({ expression, name });
    } else {
      props.onSave({ field, value, valueType, name });
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    e.stopPropagation();
    if (e.nativeEvent.isComposing) return;
    if (e.key === 'Enter') handleSave();
    if (e.key === 'Escape') onClose();
  };

  return (
    <div className="modal-overlay" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal-dialog">
        <h4 className="modal-title">Edit Node</h4>

        {props.kind === 'relation' && (
          <>
            <div className="modal-field">
              <label>Type</label>
              <div className="sign-toggle">
                {RELATION_SIGNS.map(s => (
                  <button
                    key={s}
                    type="button"
                    className={`sign-btn${sign === s ? ' active' : ''}`}
                    onClick={() => setSign(s)}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
            <div className="modal-field">
              <label htmlFor="node-name">Name</label>
              <input
                id="node-name"
                ref={firstInputRef}
                value={name}
                placeholder="Enter name..."
                onChange={(e) => setName(e.target.value)}
                onKeyDown={handleKeyDown}
              />
            </div>
          </>
        )}

        {props.kind === 'condition' && isExprOnly && (
          <div className="modal-field">
            <label htmlFor="node-expression">Expression</label>
            <input
              id="node-expression"
              ref={firstInputRef}
              value={expression}
              placeholder="Enter expression..."
              onChange={(e) => setExpression(e.target.value)}
              onKeyDown={handleKeyDown}
            />
          </div>
        )}

        {props.kind === 'condition' && !isExprOnly && (
          <>
            <div className="modal-field">
              <label htmlFor="node-field">Field</label>
              <input
                id="node-field"
                ref={firstInputRef}
                value={field}
                placeholder="Enter field..."
                onChange={(e) => setField(e.target.value)}
                onKeyDown={handleKeyDown}
              />
            </div>
            <div className="modal-field">
              <label htmlFor="node-value">Value</label>
              <input
                id="node-value"
                value={value}
                placeholder="Enter value..."
                onChange={(e) => setValue(e.target.value)}
                onKeyDown={handleKeyDown}
              />
            </div>
            {valueTypeOptions && (
              <div className="modal-field">
                <label htmlFor="node-value-type">Value Type</label>
                <select
                  id="node-value-type"
                  value={valueType}
                  onChange={(e) => setValueType(e.target.value)}
                >
                  {valueTypeOptions.map((opt) => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              </div>
            )}
          </>
        )}

        {props.kind === 'condition' && (
          <div className="modal-field modal-field-divider">
            <label htmlFor="node-name">Name <span className="modal-label-hint">(optional)</span></label>
            <input
              id="node-name"
              value={name}
              placeholder="Display name..."
              onChange={(e) => setName(e.target.value)}
              onKeyDown={handleKeyDown}
            />
          </div>
        )}

        <div className="modal-actions">
          <button className="btn-cancel" onClick={onClose}>Cancel</button>
          <button className="btn-save" onClick={handleSave}>Save</button>
        </div>
      </div>
    </div>
  );
}

export default NodeEditModal;
