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
const FIELD_ONLY_SIGNS      = new Set(['EXISTS', 'ABSENT']);
const DUAL_LIST_SIGNS       = new Set(['INTERSECT', 'DISJOINT']);
const LIST_VALUE_TYPE_OPTS  = ['List', 'Expression'];

const RELATION_SIGNS = ['AND', 'OR', 'NOT'] as const;

const INT_MIN = -2147483648;
const INT_MAX =  2147483647;

export interface ConditionData {
  field?: string;
  value?: string;
  valueType?: string;
  expression?: string;
  list1?: string;
  valueType1?: string;
  list2?: string;
  valueType2?: string;
  name?: string;
  cacheable?: boolean;
  ignoreAbsence?: boolean;
  priority?: number;
}

type RelationProps = {
  kind: 'relation';
  initialSign: string;
  initialName: string;
  onSave: (name: string, sign: string) => void;
};

type ConditionProps = {
  kind: 'condition';
  sign: string;
  initialName: string;
  initialField?: string;
  initialValue?: string;
  initialValueType?: string;
  initialExpression?: string;
  initialList1?: string;
  initialValueType1?: string;
  initialList2?: string;
  initialValueType2?: string;
  initialCacheable?: boolean;
  initialIgnoreAbsence?: boolean;
  initialPriority?: number;
  onSave: (data: ConditionData) => void;
};

type Props = (RelationProps | ConditionProps) & {
  open: boolean;
  onClose: () => void;
};

function NodeEditModal(props: Props) {
  const { open, onClose } = props;
  const firstInputRef = useRef<HTMLInputElement>(null);

  const [name, setName]           = useState('');
  const [sign, setSign]           = useState('AND');
  const [field, setField]         = useState('');
  const [value, setValue]         = useState('');
  const [valueType, setValueType] = useState('');
  const [expression, setExpression] = useState('');
  const [list1, setList1]           = useState('');
  const [valueType1, setValueType1] = useState('List');
  const [list2, setList2]                   = useState('');
  const [valueType2, setValueType2]         = useState('List');
  const [cacheable, setCacheable]           = useState(false);
  const [ignoreAbsence, setIgnoreAbsence]   = useState(false);
  const [priority, setPriority]             = useState('0');
  const [priorityError, setPriorityError]   = useState('');
  const [advancedOpen, setAdvancedOpen]     = useState(false);

  useEffect(() => {
    if (!open) return;
    if (props.kind === 'relation') {
      setSign(props.initialSign);
      setName(props.initialName);
    } else {
      setName(props.initialName);
      setCacheable(props.initialCacheable ?? false);
      setIgnoreAbsence(props.initialIgnoreAbsence ?? false);
      setPriority(String(props.initialPriority ?? 0));
      setPriorityError('');
      setAdvancedOpen(false);
      const s = props.sign;
      if (EXPRESSION_ONLY_SIGNS.has(s)) {
        setExpression(props.initialExpression ?? '');
      } else if (FIELD_ONLY_SIGNS.has(s)) {
        setField(props.initialField ?? '');
      } else if (DUAL_LIST_SIGNS.has(s)) {
        setList1(props.initialList1 ?? '');
        setValueType1(props.initialValueType1 || 'List');
        setList2(props.initialList2 ?? '');
        setValueType2(props.initialValueType2 || 'List');
      } else {
        setField(props.initialField ?? '');
        setValue(props.initialValue ?? '');
        const opts = VALUE_TYPE_OPTIONS[s];
        setValueType(props.initialValueType || (opts ? opts[0] : ''));
      }
    }
    setTimeout(() => firstInputRef.current?.focus(), 0);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  if (!open) return null;

  const s              = props.kind === 'condition' ? props.sign : '';
  const isExprOnly     = EXPRESSION_ONLY_SIGNS.has(s);
  const isFieldOnly    = FIELD_ONLY_SIGNS.has(s);
  const isDualList     = DUAL_LIST_SIGNS.has(s);
  const valueTypeOpts  = VALUE_TYPE_OPTIONS[s];

  const handleSave = () => {
    if (props.kind === 'relation') {
      props.onSave(name, sign);
      return;
    }

    const p = Number(priority);
    if (!Number.isInteger(p) || p < INT_MIN || p > INT_MAX) {
      setPriorityError(`Must be an integer between ${INT_MIN} and ${INT_MAX}.`);
      return;
    }

    const adv = { cacheable, ignoreAbsence, priority: p };
    if (isExprOnly) {
      props.onSave({ expression, name, ...adv });
    } else if (isFieldOnly) {
      props.onSave({ field, name, ...adv });
    } else if (isDualList) {
      props.onSave({ list1, valueType1, list2, valueType2, name, ...adv });
    } else {
      props.onSave({ field, value, valueType, name, ...adv });
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    e.stopPropagation();
    if (e.nativeEvent.isComposing) return;
    if (e.key === 'Enter') handleSave();
    if (e.key === 'Escape') onClose();
  };

  const input = (id: string, label: string, val: string, set: (v: string) => void, placeholder: string, ref?: React.RefObject<HTMLInputElement | null>) => (
    <div className="modal-field">
      <label htmlFor={id}>{label}</label>
      <input id={id} ref={ref} value={val} placeholder={placeholder}
        onChange={e => set(e.target.value)} onKeyDown={handleKeyDown} />
    </div>
  );

  const select = (id: string, label: string, val: string, set: (v: string) => void, opts: string[]) => (
    <div className="modal-field">
      <label htmlFor={id}>{label}</label>
      <select id={id} value={val} onChange={e => set(e.target.value)}>
        {opts.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  );

  return (
    <div className="modal-overlay" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal-dialog">
        <h4 className="modal-title">Edit Node</h4>

        {props.kind === 'relation' && (
          <>
            <div className="modal-field">
              <label>Type</label>
              <div className="sign-toggle">
                {RELATION_SIGNS.map(r => (
                  <button key={r} type="button"
                    className={`sign-btn${sign === r ? ' active' : ''}`}
                    onClick={() => setSign(r)}>{r}</button>
                ))}
              </div>
            </div>
            {input('node-name', 'Name', name, setName, 'Enter name...', firstInputRef)}
          </>
        )}

        {props.kind === 'condition' && isExprOnly &&
          input('node-expression', 'Expression', expression, setExpression, 'Enter expression...', firstInputRef)}

        {props.kind === 'condition' && isFieldOnly &&
          input('node-field', 'Field', field, setField, 'Enter field...', firstInputRef)}

        {props.kind === 'condition' && isDualList && (
          <>
            {input('node-list1', 'List 1', list1, setList1, 'Enter list1...', firstInputRef)}
            {select('node-vt1', 'Value Type 1', valueType1, setValueType1, LIST_VALUE_TYPE_OPTS)}
            {input('node-list2', 'List 2', list2, setList2, 'Enter list2...')}
            {select('node-vt2', 'Value Type 2', valueType2, setValueType2, LIST_VALUE_TYPE_OPTS)}
          </>
        )}

        {props.kind === 'condition' && !isExprOnly && !isFieldOnly && !isDualList && (
          <>
            {input('node-field', 'Field', field, setField, 'Enter field...', firstInputRef)}
            {input('node-value', 'Value', value, setValue, 'Enter value...')}
            {valueTypeOpts && select('node-value-type', 'Value Type', valueType, setValueType, valueTypeOpts)}
          </>
        )}

        {props.kind === 'condition' && (
          <>
            <div className="modal-field modal-field-divider">
              <label htmlFor="node-display-name">Name <span className="modal-label-hint">(optional)</span></label>
              <input id="node-display-name" value={name} placeholder="Display name..."
                onChange={e => setName(e.target.value)} onKeyDown={handleKeyDown} />
            </div>
            <div className="modal-advanced">
              <button
                type="button"
                className="modal-advanced-toggle"
                onClick={() => setAdvancedOpen(o => !o)}
              >
                <span className={`modal-advanced-chevron${advancedOpen ? ' open' : ''}`}>›</span>
                Advanced
              </button>
              {advancedOpen && (
                <div className="modal-advanced-body">
                  <div className="modal-field">
                    <label>Cacheable</label>
                    <div className="bool-toggle">
                      <button type="button" className={`bool-btn${cacheable ? ' active' : ''}`} onClick={() => setCacheable(true)}>True</button>
                      <button type="button" className={`bool-btn${!cacheable ? ' active' : ''}`} onClick={() => setCacheable(false)}>False</button>
                    </div>
                  </div>
                  <div className="modal-field">
                    <label>Ignore Absence</label>
                    <div className="bool-toggle">
                      <button type="button" className={`bool-btn${ignoreAbsence ? ' active' : ''}`} onClick={() => setIgnoreAbsence(true)}>True</button>
                      <button type="button" className={`bool-btn${!ignoreAbsence ? ' active' : ''}`} onClick={() => setIgnoreAbsence(false)}>False</button>
                    </div>
                  </div>
                  <div className="modal-field">
                    <label htmlFor="node-priority">Priority</label>
                    <input
                      id="node-priority"
                      type="number"
                      step="1"
                      value={priority}
                      onChange={e => { setPriority(e.target.value); setPriorityError(''); }}
                      onKeyDown={handleKeyDown}
                    />
                    {priorityError && <span className="modal-field-error">{priorityError}</span>}
                  </div>
                </div>
              )}
            </div>
          </>
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
