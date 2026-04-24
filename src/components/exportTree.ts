import type { Node, Edge } from '@xyflow/react';

interface TreeNode {
  id: string;
  data: Record<string, unknown>;
  children: TreeNode[];
}

export type ExportResult =
  | { ok: true;  json: string }
  | { ok: false; error: string };

export function buildTreeJson(nodes: Node[], edges: Edge[]): ExportResult {
  if (nodes.length === 0) {
    return { ok: false, error: 'No nodes in the canvas.' };
  }

  const childMap: Record<string, string[]> = {};
  const hasParent = new Set<string>();

  for (const edge of edges) {
    if (!childMap[edge.source]) childMap[edge.source] = [];
    childMap[edge.source].push(edge.target);
    hasParent.add(edge.target);
  }

  const nodeMap = Object.fromEntries(nodes.map(n => [n.id, n]));
  const roots = nodes.filter(n => !hasParent.has(n.id));

  if (roots.length === 0) {
    return { ok: false, error: 'No root node found — the graph contains a cycle that covers all nodes.' };
  }

  if (roots.length > 1) {
    const ids = roots.map(r => r.id).join(', ');
    return { ok: false, error: `Multiple root nodes detected (${roots.length}): ${ids}\n\nEach tree must have exactly one root.` };
  }

  // Cycle detection via DFS path tracking
  const visited = new Set<string>();
  const stack = new Set<string>();
  let cycleInfo: string | null = null;

  function traverse(nodeId: string): TreeNode | null {
    if (cycleInfo) return null;

    if (stack.has(nodeId)) {
      cycleInfo = `Cycle detected at node [${nodeId}].`;
      return null;
    }
    if (visited.has(nodeId)) return null;

    const node = nodeMap[nodeId];
    if (!node) return null;

    visited.add(nodeId);
    stack.add(nodeId);

    const children = (childMap[nodeId] ?? [])
      .map(traverse)
      .filter((n): n is TreeNode => n !== null);

    stack.delete(nodeId);

    return { id: nodeId, data: node.data as Record<string, unknown>, children };
  }

  const tree = traverse(roots[0].id);

  if (cycleInfo) {
    return { ok: false, error: cycleInfo };
  }

  return { ok: true, json: JSON.stringify(tree, null, 2) };
}
