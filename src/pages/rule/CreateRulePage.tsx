import { type DragEvent, useRef } from 'react';
import FlowCanvas from '../../components/FlowCanvas';
import { useTheme } from '../../hooks/useTheme';
import './CreateRulePage.css';

const RELATION_NODES = [
  { type: 'relation', sign: 'AND', description: 'All conditions are true' },
  { type: 'relation', sign: 'OR',  description: 'Any condition is true' },
  { type: 'relation', sign: 'NOT', description: 'Condition is false' },
];

const CONDITION_NODES = [
  { type: 'condition', sign: 'EQ',    displayName: '==',     description: 'equal' },
  { type: 'condition', sign: 'NEQ',   displayName: '!=',     description: 'not equal' },
  { type: 'condition', sign: 'GT',    displayName: '>',      description: 'greater than' },
  { type: 'condition', sign: 'GTE',   displayName: '≥',      description: 'greater than or equal' },
  { type: 'condition', sign: 'LT',    displayName: '<',      description: 'less than' },
  { type: 'condition', sign: 'LTE',   displayName: '≤',      description: 'less than or equal' },
  { type: 'condition', sign: 'CEL',   displayName: 'CEL',    description: 'CEL expression' },
  { type: 'condition', sign: 'REGEX', displayName: '^\\d+$', description: 'regular expression' },
  { type: 'condition', sign: 'IN',    displayName: 'in',     description: 'in list/map' },
  { type: 'condition', sign: 'NIN',   displayName: 'nin',    description: 'not in list/map' },
];

export type NodeDef = typeof RELATION_NODES[number] | typeof CONDITION_NODES[number];

function CreateRulePage() {
  const dragPayloadRef = useRef<NodeDef | null>(null);
  const { theme, toggle } = useTheme();

  const onDragStart = (e: DragEvent<HTMLDivElement>, node: NodeDef) => {
    dragPayloadRef.current = node;
    e.dataTransfer.setData('application/reactflow', '1');
    e.dataTransfer.effectAllowed = 'move';
  };

  const renderNodeGroup = (title: string, nodes: NodeDef[], scrollable = false) => (
    <div className={`node-group${scrollable ? ' scrollable' : ''}`}>
      <p className="node-group-title">{title}</p>
      <div className="node-list">
        {nodes.map((n) => (
          <div
            key={`${n.type}-${n.sign}`}
            className={`draggable-node node-${n.sign.toLowerCase()}`}
            draggable
            onDragStart={(e) => onDragStart(e, n)}
          >
            {'displayName' in n
              ? <span className="node-label">{n.displayName}</span>
              : <span className="node-label">{n.sign}</span>
            }
            <span className="node-desc">{n.description}</span>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="rule-page">
      <aside className="node-sidebar">
        <div className="sidebar-header">
          <h3>Nodes</h3>
          <button className="theme-toggle" onClick={toggle} title={theme === 'dark' ? 'Dark' : 'Light'}>
            {theme === 'dark' ? '🌙' : '☀️'}
          </button>
        </div>
        <p className="sidebar-hint">Drag nodes to the canvas</p>
        {renderNodeGroup('Logic Node', RELATION_NODES)}
        {renderNodeGroup('Condition Node', CONDITION_NODES, true)}
      </aside>

      <div className="flow-canvas">
        <FlowCanvas dragPayloadRef={dragPayloadRef} />
      </div>
    </div>
  );
}

export default CreateRulePage;
