import type { Node, Edge } from '@xyflow/react';
import { NODE_STYLES } from './nodeStyles';

interface RawNode {
  id: string;
  children?: RawNode[];
  [key: string]: unknown;
}

const GAP_X = 200;
const GAP_Y = 130;

function subtreeWidth(node: RawNode): number {
  const children = node.children ?? [];
  if (children.length === 0) return 1;
  return children.reduce((sum, c) => sum + subtreeWidth(c), 0);
}

function assignPositions(
  node: RawNode,
  leftOffset: number,
  depth: number,
  positions: Map<string, { x: number; y: number }>,
) {
  const w = subtreeWidth(node);
  positions.set(node.id, { x: (leftOffset + w / 2) * GAP_X, y: depth * GAP_Y });

  let childOffset = leftOffset;
  for (const child of node.children ?? []) {
    assignPositions(child, childOffset, depth + 1, positions);
    childOffset += subtreeWidth(child);
  }
}

export type ImportResult =
  | { ok: true; nodes: Node[]; edges: Edge[] }
  | { ok: false; error: string };

export function parseImportJson(json: string): ImportResult {
  let raw: unknown;
  try {
    raw = JSON.parse(json);
  } catch {
    return { ok: false, error: 'Invalid JSON — please check the format.' };
  }

  const root = raw as RawNode;
  if (typeof root !== 'object' || root === null || !root.id) {
    return { ok: false, error: 'JSON must be an object with an "id" field.' };
  }

  const positions = new Map<string, { x: number; y: number }>();
  assignPositions(root, 0, 0, positions);

  const nodes: Node[] = [];
  const edges: Edge[] = [];
  // Local set to detect duplicates within the imported JSON itself
  const seenInImport = new Set<string>();

  let errorMsg: string | null = null;

  function traverse(node: RawNode) {
    if (errorMsg) return;
    const { id, children = [], ...rest } = node;

    if (seenInImport.has(id)) {
      errorMsg = `Duplicate id "${id}" found within the imported JSON.`;
      return;
    }
    seenInImport.add(id);

    const sign = rest.sign as string | undefined;
    const type = rest.type as string | undefined;
    const style = (sign && NODE_STYLES[sign]) || (type && NODE_STYLES[type]) || {};

    nodes.push({
      id,
      type: 'logicNode',
      position: positions.get(id) ?? { x: 0, y: 0 },
      data: rest as Record<string, unknown>,
      style,
    });

    for (const child of children) {
      edges.push({ id: `${id}->${child.id}`, source: id, target: child.id });
      traverse(child);
    }
  }

  traverse(root);

  if (errorMsg) return { ok: false, error: errorMsg };

  return { ok: true, nodes, edges };
}
