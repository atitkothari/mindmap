"use client";

import { MindMapEdge, MindMapNode } from "@/lib/storage";
import { useState } from "react";

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
  const [isHovered, setIsHovered] = useState(false);
  
  // Calculate edge path to connect to actual connector points
  // Node dimensions: 200px width, 50px height
  const nodeWidth = 200;
  const nodeHeight = 50;
  const connectorOffset = 16; // 16px offset from edge (matching the new connector size)
  
  // Determine connection direction based on node positions
  const isLeftSideConnection = toNode.x < fromNode.x;
  
  let fromX: number, fromY: number, toX: number, toY: number;
  
  if (isLeftSideConnection) {
    // Left-side connection: from left connector to right connector
    fromX = fromNode.x - connectorOffset; // Left connector
    fromY = fromNode.y + nodeHeight / 2; // Center of node
    toX = toNode.x + nodeWidth + connectorOffset; // Right connector
    toY = toNode.y + nodeHeight / 2; // Center of node
  } else {
    // Right-side connection: from right connector to left connector
    fromX = fromNode.x + nodeWidth + connectorOffset; // Right connector
    fromY = fromNode.y + nodeHeight / 2; // Center of node
    toX = toNode.x - connectorOffset; // Left connector
    toY = toNode.y + nodeHeight / 2; // Center of node
  }

  // Create a curved path with better control points
  const deltaX = toX - fromX;
  const deltaY = toY - fromY;
  
  // Calculate the distance for better curve control
  const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
  
  // Adjust control points based on distance and direction
  const controlOffset = Math.min(distance * 0.3, 80); // Cap the control offset
  
  // Control points for smooth curves - create more natural horizontal flow
  const controlPoint1X = fromX + deltaX * 0.25;
  const controlPoint1Y = fromY;
  const controlPoint2X = fromX + deltaX * 0.75;
  const controlPoint2Y = toY;

  // Use cubic bezier for smoother curves
  const path = `M ${fromX} ${fromY} C ${controlPoint1X} ${controlPoint1Y}, ${controlPoint2X} ${controlPoint2Y}, ${toX} ${toY}`;

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
    <g data-edge={edge.id}>
      {/* Main edge line - make it draggable */}
      <path
        d={path}
        stroke={isDragging ? "#3b82f6" : (isHovered ? "#64748b" : "#94a3b8")}
        strokeWidth={isDragging ? "3" : (isHovered ? "2.5" : "2")}
        fill="none"
        className={isDragging ? "transition-none cursor-grabbing" : "transition-all duration-200 cursor-grab"}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        style={{ 
          cursor: 'grab',
          filter: isDragging ? 'drop-shadow(0 0 8px rgba(59, 130, 246, 0.6))' : 'none',
          strokeDasharray: isDragging ? '5,5' : 'none'
        }}
      />
      
      {/* Connection point indicators - show when hovering */}
      {isHovered && (
        <>
          {/* From node connection point */}
          <circle
            cx={fromX}
            cy={fromY}
            r="4"
            fill="#10b981"
            stroke="#ffffff"
            strokeWidth="2"
            opacity="0.9"
          />
          {/* To node connection point */}
          <circle
            cx={toX}
            cy={toY}
            r="4"
            fill="#3b82f6"
            stroke="#ffffff"
            strokeWidth="2"
            opacity="0.9"
          />
          {/* Directional flow indicator */}
          <path
            d={`M ${fromX + (toX - fromX) * 0.3} ${fromY + (toY - fromY) * 0.3} l -3 -3 l 6 0 z`}
            fill="#64748b"
            opacity="0.8"
          />
          {/* Flow direction dots */}
          <circle
            cx={fromX + (toX - fromX) * 0.5}
            cy={fromY + (toY - fromY) * 0.5}
            r="2"
            fill="#64748b"
            opacity="0.6"
          />
        </>
      )}
    </g>
  );
}
