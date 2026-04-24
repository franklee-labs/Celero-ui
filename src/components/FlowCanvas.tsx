import { useCallback, useRef, useState, type DragEvent, type CSSProperties, type MouseEvent, type RefObject } from 'react';
import type { NodeDef } from '../pages/rule/CreateRulePage';
import {
  ReactFlow,
  MiniMap,
  Controls,
  ControlButton,
  Background,
  useNodesState,
  useEdgesState,
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
import { buildTreeJson } from './exportTree';

const nodeTypes = { logicNode: LogicNode };

let nodeIdCounter = 1;

const NODE_STYLES: Record<string, CSSProperties> = {
  // relation
  AND:   { background: 'rgba(30, 64, 175, 0.15)',   border: '3px solid #1e40af', borderRadius: 8, color: '#60a5fa', width: 120, height: 60 },
  OR:    { background: 'rgba(15, 118, 110, 0.15)',  border: '3px solid #0f766e', borderRadius: 8, color: '#2dd4bf', width: 120, height: 60 },
  NOT:   { background: 'rgba(153, 27, 27, 0.15)',   border: '3px solid #b91c1c', borderRadius: 8, color: '#f87171', width: 120, height: 60 },
  // condition pairs (complementary colors)
  EQ:    { background: 'rgba(59, 130, 246, 0.15)',  border: '2px solid #3b82f6', borderRadius: 8, color: '#60a5fa', width: 120, height: 60 },
  NEQ:   { background: 'rgba(249, 115, 22, 0.15)',  border: '2px solid #f97316', borderRadius: 8, color: '#fb923c', width: 120, height: 60 },
  GT:    { background: 'rgba(16, 185, 129, 0.15)',  border: '2px solid #10b981', borderRadius: 8, color: '#34d399', width: 120, height: 60 },
  LTE:   { background: 'rgba(239, 68, 68, 0.15)',   border: '2px solid #ef4444', borderRadius: 8, color: '#f87171', width: 120, height: 60 },
  GTE:   { background: 'rgba(6, 182, 212, 0.15)',   border: '2px solid #06b6d4', borderRadius: 8, color: '#67e8f9', width: 120, height: 60 },
  LT:    { background: 'rgba(236, 72, 153, 0.15)',  border: '2px solid #ec4899', borderRadius: 8, color: '#f472b6', width: 120, height: 60 },
  IN:    { background: 'rgba(124, 58, 237, 0.15)',  border: '2px solid #7c3aed', borderRadius: 8, color: '#a78bfa', width: 120, height: 60 },
  NIN:   { background: 'rgba(234, 179, 8, 0.15)',   border: '2px solid #eab308', borderRadius: 8, color: '#fcd34d', width: 120, height: 60 },
  CEL:   { background: 'rgba(99, 102, 241, 0.15)',  border: '2px solid #6366f1', borderRadius: 8, color: '#818cf8', width: 120, height: 60 },
  REGEX: { background: 'rgba(100, 116, 139, 0.15)', border: '2px solid #64748b', borderRadius: 8, color: '#94a3b8', width: 120, height: 60 },
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
  const [editingNode, setEditingNode] = useState<EditingNode | null>(null);
  const [exportState, setExportState] = useState<{ open: boolean; content?: string; error?: string }>({ open: false });

  const handleExport = () => {
    const result = buildTreeJson(nodes, edges);
    if (result.ok) {
      setExportState({ open: true, content: result.json });
    } else {
      setExportState({ open: true, error: result.error });
    }
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
        id: `${payload.sign}-${nodeIdCounter++}`,
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
        <MiniMap />
        <Controls>
          <ControlButton title="Export tree" onClick={handleExport}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="17 8 12 3 7 8" />
              <line x1="12" y1="3" x2="12" y2="15" />
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
            updateNode(
              editingNode.id,
              { name, sign: newSign },
              NODE_STYLES[newSign],
            )
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
    </div>
  );
}

export default FlowCanvas;
