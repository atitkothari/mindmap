"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { MindMapNode } from "@/lib/storage";
import { ChevronDown, ChevronRight, Plus, Trash2 } from "lucide-react";

interface NodeProps {
  node: MindMapNode;
  isSelected: boolean;
  isDragging?: boolean;
  isPotentialParent?: boolean;
  zoom?: number;
  pan?: { x: number; y: number };
  onSelect: () => void;
  onTextChange: (text: string) => void;
  onPositionChange: (x: number, y: number) => void;
  onToggleCollapse: () => void;
  onDelete: () => void;
  onAddChild: () => void;
  onAddSibling: () => void;
  onDragStart: () => void;
  onDragMove: (nodeId: string, x: number, y: number) => void;
  onDragEnd: (x: number, y: number) => void;
}

export function Node({
  node,
  isSelected,
  isDragging = false,
  isPotentialParent = false,
  zoom = 1,
  pan = { x: 0, y: 0 },
  onSelect,
  onTextChange,
  onPositionChange,
  onToggleCollapse,
  onDelete,
  onAddChild,
  onAddSibling,
  onDragStart,
  onDragMove,
  onDragEnd,
}: NodeProps) {
  
  const [isEditing, setIsEditing] = useState(false);
  const [isDraggingLocal, setIsDraggingLocal] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [currentDragPosition, setCurrentDragPosition] = useState({ x: 0, y: 0 });
  const nodeRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLInputElement>(null);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.target === textRef.current) return;
    
    e.preventDefault();
    setIsDraggingLocal(true);
    
    // Convert screen coordinates to world coordinates for drag offset
    const worldX = (e.clientX - pan.x) / zoom;
    const worldY = (e.clientY - pan.y) / zoom;
    
    setDragOffset({
      x: worldX - node.x,
      y: worldY - node.y,
    });
    setCurrentDragPosition({ x: node.x, y: node.y });
    onSelect();
    onDragStart();
  }, [node.x, node.y, zoom, pan, onSelect, onDragStart]);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDraggingLocal) return;
    
    // Convert screen coordinates to world coordinates
    const worldX = (e.clientX - pan.x) / zoom;
    const worldY = (e.clientY - pan.y) / zoom;
    
    const newX = worldX - dragOffset.x;
    const newY = worldY - dragOffset.y;
    
    // Update current drag position
    setCurrentDragPosition({ x: newX, y: newY });
    
    // Call real-time drag handler for immediate edge updates
    onDragMove(node.id, newX, newY);
    
    // Also call the regular position change for state updates
    onPositionChange(newX, newY);
  }, [isDraggingLocal, dragOffset, zoom, pan, onDragMove, node.id, onPositionChange]);

  const handleMouseUp = useCallback(() => {
    if (isDraggingLocal) {
      // Get final position for parent reassignment
      const finalX = currentDragPosition.x;
      const finalY = currentDragPosition.y;
      onDragEnd(finalX, finalY);
    }
    setIsDraggingLocal(false);
  }, [isDraggingLocal, currentDragPosition, onDragEnd]);

  // Add/remove global mouse event listeners
  useEffect(() => {
    if (isDraggingLocal) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDraggingLocal, handleMouseMove, handleMouseUp]);

  const handleDoubleClick = useCallback(() => {
    setIsEditing(true);
    setTimeout(() => textRef.current?.focus(), 0);
  }, []);

  const handleTextChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    onTextChange(e.target.value);
  }, [onTextChange]);

  const handleTextKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      setIsEditing(false);
    } else if (e.key === 'Escape') {
      setIsEditing(false);
    }
  }, []);

  const handleTextBlur = useCallback(() => {
    setIsEditing(false);
  }, []);

  const hasChildren = node.children && node.children.length > 0;

  return (
    <div
      ref={nodeRef}
      className={`absolute select-none ${isSelected ? 'z-10' : 'z-0'}`}
      style={{
        left: node.x,
        top: node.y,
        transform: isDragging || isDraggingLocal ? 'scale(1.05)' : 'scale(1)',
        transition: isDragging || isDraggingLocal ? 'none' : 'transform 0.1s ease',
      }}
    >
      {/* Grid alignment indicator - removed to ensure full opacity */}

      {/* Node content */}
      <div
        className={`
          bg-white dark:bg-gray-800 border-2 rounded-lg shadow-lg cursor-move
          ${isSelected 
            ? 'border-blue-500 shadow-blue-200 dark:shadow-blue-900' 
            : isPotentialParent
            ? 'border-green-500 shadow-green-200 dark:shadow-green-900'
            : 'border-gray-300 dark:border-gray-600'
          }
          hover:shadow-xl hover:scale-105 transition-all duration-200
          ${isPotentialParent ? 'ring-2 ring-green-300 dark:ring-green-700' : ''}
        `}
        style={{
          borderWidth: '3px',
          backgroundColor: '#ffffff',
          borderColor: isSelected ? '#3b82f6' : '#d1d5db',
          boxShadow: isSelected 
            ? '0 4px 6px -1px rgba(59, 130, 246, 0.3), 0 0 0 2px rgba(59, 130, 246, 0.2)' 
            : '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
          opacity: '1',
        }}
        onMouseEnter={(e) => {
          if (e.currentTarget) {
            e.currentTarget.style.backgroundColor = '#f8fafc';
            e.currentTarget.style.boxShadow = '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)';
          }
        }}
        onMouseLeave={(e) => {
          if (e.currentTarget) {
            e.currentTarget.style.backgroundColor = '#ffffff';
            e.currentTarget.style.boxShadow = isSelected 
              ? '0 4px 6px -1px rgba(59, 130, 246, 0.3), 0 0 0 2px rgba(59, 130, 246, 0.2)' 
              : '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)';
          }
        }}
        onMouseDown={handleMouseDown}
        onDoubleClick={handleDoubleClick}
      >
        {/* Node header */}
        <div className="flex items-center gap-2 p-3 min-w-[200px]">          
          <div className="flex-1">
            {isEditing ? (
              <input
                ref={textRef}
                type="text"
                value={node.text}
                onChange={handleTextChange}
                onKeyDown={handleTextKeyDown}
                onBlur={handleTextBlur}
                className="w-full px-2 py-1 border border-blue-300 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                autoFocus
              />
            ) : (
              <div className="px-2 py-1 text-sm text-gray-900 dark:text-white font-medium">
                {node.text}
              </div>
            )}
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-1">
            <button
              onClick={onAddChild}
              className="p-1 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 rounded transition-colors"
              title="Add child (Tab)"
            >
              <Plus className="h-3 w-3" />
            </button>
            <button
              onClick={onDelete}
              className="p-1 text-gray-400 hover:text-red-600 dark:hover:text-red-400 rounded transition-colors"
              title="Delete (Delete)"
            >
              <Trash2 className="h-3 w-3" />
            </button>
          </div>
        </div>

        {/* Collapsible indicator */}
        {/* {hasChildren && !node.collapsed && (
          <div className="px-3 pb-2">
            <div className="text-xs text-gray-500 dark:text-gray-400">
              {node.children.length} child{node.children.length !== 1 ? 'ren' : ''}
            </div>
          </div>
        )} */}
      </div>

      {/* Connection point indicator */}
      {isSelected && (
        <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-blue-500 rounded-full border-2 border-white dark:border-gray-800" />
      )}

      {/* Potential parent indicator */}
      {isPotentialParent && (
        <div className="absolute -top-2 left-1/2 transform -translate-x-1/2 px-2 py-1 bg-green-500 text-white text-xs rounded-full border border-white dark:border-gray-800 animate-pulse">
          Drop here to connect
        </div>
      )}
    </div>
  );
}