import { useCallback, useEffect, useRef, useState, type DragEvent, type CSSProperties, type MouseEvent, type RefObject } from 'react';
import type { NodeDef } from '../pages/rule/CreateRulePage';
import {
  ReactFlow,
  MiniMap,
  Controls,
  ControlButton,
  Background,
  useNodesState,
  useEdgesState,
  useStore,
  addEdge,
  type Node,
  type Edge,
  type Connection,
  type ReactFlowInstance,
  MarkerType,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import LogicNode from './LogicNode';
import NodeEditModal, { type ConditionData } from './NodeEditModal';
import ExportModal from './ExportModal';
import ImportModal from './ImportModal';
import { buildTreeJson } from './exportTree';
import { parseImportJson } from './importTree';
import { NODE_STYLES } from './nodeStyles';

const nodeTypes = { logicNode: LogicNode };

function LockWatcher({ onLockChange }: { onLockChange: (locked: boolean) => void }) {
  const nodesDraggable = useStore(s => s.nodesDraggable);
  useEffect(() => {
    onLockChange(!nodesDraggable);
  }, [nodesDraggable, onLockChange]);
  return null;
}

const usedIds = new Set<string>();

const genId = (sign: string): string => {
  let id: string;
  do {
    id = `${sign}-${crypto.randomUUID().replace(/-/g, '').slice(0, 8)}`;
  } while (usedIds.has(id));
  usedIds.add(id);
  return id;
};

type EditingNode =
  | { id: string; kind: 'relation'; sign: string; name: string }
  | { id: string; kind: 'condition'; sign: string; field: string; value: string; valueType: string; name: string };

interface Props {
  dragPayloadRef: RefObject<NodeDef | null>;
}

function FlowCanvas({ dragPayloadRef }: Props) {
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const instanceRef = useRef<ReactFlowInstance | null>(null);
  const [isLocked, setIsLocked] = useState(false);
  const [editingNode, setEditingNode] = useState<EditingNode | null>(null);
  const [exportState, setExportState] = useState<{ open: boolean; content?: string; error?: string }>({ open: false });
  const [importState, setImportState] = useState<{ open: boolean; error?: string }>({ open: false });

  const handleLockChange = useCallback((locked: boolean) => {
    setIsLocked(locked);
  }, []);

  const handleExport = () => {
    const result = buildTreeJson(nodes, edges);
    if (result.ok) {
      setExportState({ open: true, content: result.json });
    } else {
      setExportState({ open: true, error: result.error });
    }
  };

  const handleImport = (json: string) => {
    const result = parseImportJson(json);
    if (!result.ok) {
      setImportState({ open: true, error: result.error });
      return;
    }
    usedIds.clear();
    result.nodes.forEach(n => usedIds.add(n.id));
    setNodes(result.nodes);
    setEdges(result.edges);
    setImportState({ open: false });
  };

  const onConnect = useCallback(
    (params: Connection) => {
      if (params.source === params.target) return;
      setEdges((eds) => addEdge(params, eds));
    },
    [setEdges],
  );

  const onDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const onDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (!wrapperRef.current || !instanceRef.current) return;

    const payload = dragPayloadRef.current;
    if (!payload) return;
    dragPayloadRef.current = null;

    const bounds = wrapperRef.current.getBoundingClientRect();
    const position = instanceRef.current.screenToFlowPosition({
      x: e.clientX - bounds.left,
      y: e.clientY - bounds.top,
    });

    setNodes((nds) => [
      ...nds,
      {
        id: genId(payload.sign),
        type: 'logicNode',
        position,
        data: {
          sign: payload.sign,
          type: payload.type,
          description: payload.description,
          displayName: 'displayName' in payload ? payload.displayName : undefined,
        },
        style: NODE_STYLES[payload.sign] ?? NODE_STYLES[payload.type],
      },
    ]);
  };

  const onNodeDoubleClick = useCallback((_: MouseEvent, node: Node) => {
    const nodeType = node.data.type as string;
    if (nodeType === 'relation') {
      setEditingNode({ id: node.id, kind: 'relation', sign: node.data.sign as string, name: (node.data.name as string) ?? '' });
    } else if (nodeType === 'condition') {
      setEditingNode({
        id: node.id,
        kind: 'condition',
        sign: node.data.sign as string,
        field: (node.data.field as string) ?? '',
        value: (node.data.value as string) ?? '',
        valueType: (node.data.valueType as string) ?? '',
        name: (node.data.name as string) ?? '',
      });
    }
  }, []);

  const updateNode = (id: string, patch: Record<string, string>, style?: CSSProperties) => {
    setNodes((nds) =>
      nds.map((n) => {
        if (n.id !== id) return n;
        return { ...n, data: { ...n.data, ...patch }, ...(style ? { style } : {}) };
      }),
    );
    setEditingNode(null);
  };

  return (
    <div ref={wrapperRef} style={{ width: '100%', height: '100%' }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onInit={(inst) => { instanceRef.current = inst; }}
        onDragOver={onDragOver}
        onDrop={onDrop}
        onNodeDoubleClick={onNodeDoubleClick}
        defaultEdgeOptions={{ markerEnd: { type: MarkerType.ArrowClosed } }}
        fitView
      >
        <LockWatcher onLockChange={handleLockChange} />
        <MiniMap />
        <Controls>
          <ControlButton title="Export tree" onClick={handleExport}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="17 8 12 3 7 8" />
              <line x1="12" y1="3" x2="12" y2="15" />
            </svg>
          </ControlButton>
          <ControlButton
            title={isLocked ? 'Unlock to import' : 'Import tree'}
            onClick={() => { if (!isLocked) setImportState({ open: true }); }}
            style={{ opacity: isLocked ? 0.35 : 1, cursor: isLocked ? 'not-allowed' : 'pointer' }}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
          </ControlButton>
        </Controls>
        <Background />
      </ReactFlow>

      {editingNode?.kind === 'relation' && (
        <NodeEditModal
          open
          kind="relation"
          initialSign={editingNode.sign}
          initialName={editingNode.name}
          onSave={(name, newSign) =>
            updateNode(editingNode.id, { name, sign: newSign }, NODE_STYLES[newSign])
          }
          onClose={() => setEditingNode(null)}
        />
      )}
      {editingNode?.kind === 'condition' && (
        <NodeEditModal
          open
          kind="condition"
          sign={editingNode.sign}
          initialField={editingNode.field}
          initialValue={editingNode.value}
          initialValueType={editingNode.valueType}
          initialName={editingNode.name}
          onSave={(data: ConditionData) => updateNode(editingNode.id, { ...data })}
          onClose={() => setEditingNode(null)}
        />
      )}

      <ExportModal
        open={exportState.open}
        content={exportState.content}
        error={exportState.error}
        onClose={() => setExportState({ open: false })}
      />

      <ImportModal
        open={importState.open}
        error={importState.error}
        onConfirm={handleImport}
        onClose={() => setImportState({ open: false })}
      />
    </div>
  );
}

export default FlowCanvas;
