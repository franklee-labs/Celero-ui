import { useState } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import './LogicNode.css';

type NodeData = Record<string, unknown>;

function computeConditionName(data: NodeData): string {
  const sign       = data.sign as string;
  const displayName = data.displayName as string | undefined;
  const field      = data.field as string | undefined;
  const value      = data.value as string | undefined;
  const valueType  = data.valueType as string | undefined;
  const expression = data.expression as string | undefined;

  if (sign === 'CEL') return expression ?? '';
  if (!field && !value) return '';

  const op = sign === 'REGEX' ? sign : (displayName ?? sign);
  const v  = value ?? '';

  let val: string;
  switch (valueType) {
    case 'String': val = `str(${v})`;  break;
    case 'Number': val = `num(${v})`;  break;
    default:       val = v;
  }

  return `${field ?? ''} ${op} ${val}`.trim();
}

function ConditionSubLabel({ data }: { data: NodeData }) {
  const sign        = data.sign as string;
  const displayName = data.displayName as string | undefined;
  const field       = data.field as string | undefined;
  const value       = data.value as string | undefined;
  const valueType   = data.valueType as string | undefined;
  const expression  = data.expression as string | undefined;

  if (sign === 'CEL' && expression) {
    return <code className="node-code">{expression}</code>;
  }

  if (!field && !value) return null;

  const isString = valueType === 'String';
  const op = displayName ?? sign;

  return (
    <code className="node-code node-expr">
      {field && <span className="node-key">{field}</span>}
      {op    && <span className="node-op"> {op} </span>}
      {value !== undefined && (
        <span className="node-val">
          {isString && <span className="node-quote">"</span>}
          {value}
          {isString && <span className="node-quote">"</span>}
        </span>
      )}
    </code>
  );
}

function LogicNode({ data }: NodeProps) {
  const [hovered, setHovered] = useState(false);

  const sign        = data.sign as string;
  const displayName = data.displayName as string | undefined;
  const nodeType    = data.type as string;
  const description = data.description as string | undefined;
  const name        = data.name as string | undefined;
  const field       = data.field as string | undefined;
  const expression  = data.expression as string | undefined;

  const isCondition      = nodeType === 'condition';
  const topLabel         = isCondition ? (displayName ?? sign) : sign;
  const generatedName    = isCondition ? computeConditionName(data as NodeData) : '';
  const hasConditionData = isCondition && (!!field || !!expression);
  const showUserName     = isCondition && !!name;

  const subLabel = isCondition
    ? (showUserName || hasConditionData ? true : description)
    : name;

  const showTooltip = hovered && (
    (!isCondition && !!name) || (isCondition && !!generatedName)
  );

  return (
    <>
      <Handle type="target" position={Position.Top} />
      <div
        className={`logic-node-content${subLabel ? ' has-name' : ''}`}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        onDoubleClick={() => setHovered(false)}
      >
        <div className="logic-node-label"><span>{topLabel}</span></div>

        {subLabel && (
          <div className="logic-node-name">
            {isCondition && !showUserName && hasConditionData
              ? <ConditionSubLabel data={data as NodeData} />
              : (name || description)
            }
          </div>
        )}

        {showTooltip && (
          <div className="node-tooltip">
            {isCondition
              ? <code className="tt-code">{generatedName}</code>
              : name
            }
          </div>
        )}
      </div>

      {!isCondition && <Handle type="source" position={Position.Bottom} />}
    </>
  );
}

export default LogicNode;
