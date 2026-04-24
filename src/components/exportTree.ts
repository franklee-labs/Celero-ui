import type { Node, Edge } from '@xyflow/react';

interface TreeNode {
  id: string;
  [key: string]: unknown;
  children: TreeNode[];
}

export type ExportResult =
  | { ok: true;  json: string }
  | { ok: false; error: string };

const SIGNS_REQUIRE_FIELD_VALUE_VALUETYPE = new Set(['EQ', 'NEQ', 'LT', 'LTE', 'GT', 'GTE', 'IN', 'NIN']);

function validateConditionNode(id: string, data: Record<string, unknown>): string | null {
  const sign      = data.sign as string;
  const field     = (data.field as string | undefined)?.trim();
  const value     = (data.value as string | undefined)?.trim();
  const valueType = (data.valueType as string | undefined)?.trim();
  const expression = (data.expression as string | undefined)?.trim();

  if (sign === 'CEL') {
    if (!expression) return `Node [${id}] (CEL): "expression" is required.`;
    return null;
  }

  if (sign === 'REGEX') {
    if (!field) return `Node [${id}] (REGEX): "field" is required.`;
    if (!value) return `Node [${id}] (REGEX): "value" is required.`;
    return null;
  }

  if (SIGNS_REQUIRE_FIELD_VALUE_VALUETYPE.has(sign)) {
    if (!field)     return `Node [${id}] (${sign}): "field" is required.`;
    if (!value)     return `Node [${id}] (${sign}): "value" is required.`;
    if (!valueType) return `Node [${id}] (${sign}): "valueType" is required.`;
    return null;
  }

  return null;
}

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

  const visited = new Set<string>();
  const stack   = new Set<string>();
  let errorMsg: string | null = null;

  function traverse(nodeId: string): TreeNode | null {
    if (errorMsg) return null;

    if (stack.has(nodeId)) {
      errorMsg = `Cycle detected at node [${nodeId}].`;
      return null;
    }
    if (visited.has(nodeId)) return null;

    const node = nodeMap[nodeId];
    if (!node) return null;

    visited.add(nodeId);
    stack.add(nodeId);

    const data      = node.data as Record<string, unknown>;
    const nodeType  = data.type as string;
    const childIds  = childMap[nodeId] ?? [];

    // Rule 1: condition nodes must not have children
    if (nodeType === 'condition' && childIds.length > 0) {
      errorMsg = `Node [${nodeId}] is a condition node and must not have children.`;
      stack.delete(nodeId);
      return null;
    }

    // Relation node child count rules
    if (nodeType === 'relation') {
      const sign = data.sign as string;
      if (sign === 'AND' && childIds.length < 1) {
        errorMsg = `Node [${nodeId}] (AND) must have at least 1 child.`;
        stack.delete(nodeId);
        return null;
      }
      if (sign === 'OR' && childIds.length < 2) {
        errorMsg = `Node [${nodeId}] (OR) must have at least 2 children.`;
        stack.delete(nodeId);
        return null;
      }
      if (sign === 'NOT' && childIds.length !== 1) {
        errorMsg = `Node [${nodeId}] (NOT) must have exactly 1 child (currently: ${childIds.length}).`;
        stack.delete(nodeId);
        return null;
      }
    }

    // Rule 3: validate condition node field completeness
    if (nodeType === 'condition') {
      const validationError = validateConditionNode(nodeId, data);
      if (validationError) {
        errorMsg = validationError;
        stack.delete(nodeId);
        return null;
      }
    }

    const children = childIds
      .map(traverse)
      .filter((n): n is TreeNode => n !== null);

    stack.delete(nodeId);

    return { id: nodeId, ...data, children };
  }

  const tree = traverse(roots[0].id);

  if (errorMsg) {
    return { ok: false, error: errorMsg };
  }

  return { ok: true, json: JSON.stringify(tree, null, 2) };
}
