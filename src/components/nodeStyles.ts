import type { CSSProperties } from 'react';

export const NODE_STYLES: Record<string, CSSProperties> = {
  AND:   { background: 'rgba(30, 64, 175, 0.15)',   border: '3px solid #1e40af', borderRadius: 8, color: '#60a5fa', width: 120, height: 60 },
  OR:    { background: 'rgba(15, 118, 110, 0.15)',  border: '3px solid #0f766e', borderRadius: 8, color: '#2dd4bf', width: 120, height: 60 },
  NOT:   { background: 'rgba(153, 27, 27, 0.15)',   border: '3px solid #b91c1c', borderRadius: 8, color: '#f87171', width: 120, height: 60 },
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
  condition: { background: 'rgba(249, 115, 22, 0.15)', border: '2px solid #f97316', borderRadius: 8, color: '#fb923c', width: 120, height: 60 },
};
