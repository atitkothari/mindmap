"use client";

import { MindMapEdge, MindMapNode } from "@/lib/storage";

interface EdgeProps {
  edge: MindMapEdge;
  fromNode: MindMapNode;
  toNode: MindMapNode;
  isDragging?: boolean;
  onDragStart?: (edgeId: string, x: number, y: number) => void;
  onDragMove?: (x: number, y: number) => void;
  onDragEnd?: (x: number, y: number) => void;
}

export function Edge({ 
  edge,
  fromNode, 
  toNode, 
  isDragging = false,
  onDragStart,
  onDragMove,
  onDragEnd
}: EdgeProps) {
  // Calculate edge path
  const fromX = fromNode.x + 100; // Center of node (assuming 200px width)
  const fromY = fromNode.y + 50;  // Bottom of node
  const toX = toNode.x + 100;     // Center of node
  const toY = toNode.y + 25;      // Top of node

  // Create a curved path
  const midX = (fromX + toX) / 2;
  const midY = fromY + (toY - fromY) * 0.3;

  const path = `M ${fromX} ${fromY} Q ${midX} ${midY} ${toX} ${toY}`;

  const handleMouseDown = (e: React.MouseEvent) => {
    if (onDragStart) {
      onDragStart(edge.id, e.clientX, e.clientY);
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (onDragMove) {
      onDragMove(e.clientX, e.clientY);
    }
  };

  const handleMouseUp = (e: React.MouseEvent) => {
    if (onDragEnd) {
      onDragEnd(e.clientX, e.clientY);
    }
  };

  return (
    <g>
      {/* Main edge line - make it draggable */}
      <path
        d={path}
        stroke={isDragging ? "#3b82f6" : ( "#94a3b8")}
        strokeWidth={isDragging ? "3" : "2"}
        fill="none"
        markerEnd="url(#arrowhead)"
        className={isDragging ? "transition-none cursor-grabbing" : "transition-all duration-200 cursor-grab"}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        style={{ cursor: 'grab' }}
      />
      
      {/* Arrow marker definition */}
      <defs>
        <marker
          id="arrowhead"
          markerWidth="10"
          markerHeight="7"
          refX="9"
          refY="3.5"
          orient="auto"
        >
          <polygon
            points="0 0, 10 3.5, 0 7"
            fill={isDragging ? "#3b82f6" : ("#94a3b8")}
          />
        </marker>
      </defs>
    </g>
  );
}
