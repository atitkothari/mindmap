"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { MindMap, MindMapNode, MindMapEdge, generateId } from "@/lib/storage";
import { Node } from "./Node";
import { Edge } from "./Edge";
import { Toolbar } from "./Toolbar";
import { useToasts } from "./ToastContext";

interface MindMapEditorProps {
  map: MindMap;
  onSave: (map: MindMap) => void;
}

export function MindMapEditor({ map, onSave }: MindMapEditorProps) {
  const [nodes, setNodes] = useState<MindMapNode[]>(map.nodes);
  const [edges, setEdges] = useState<MindMapEdge[]>(map.edges);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [draggingNodeId, setDraggingNodeId] = useState<string | null>(null);
  const [draggingEdgeId, setDraggingEdgeId] = useState<string | null>(null);
  const [dragPreview, setDragPreview] = useState<{ x: number; y: number } | null>(null);
  const [potentialParentId, setPotentialParentId] = useState<string | null>(null);
  const [showGrid, setShowGrid] = useState(true);
  const [gridSize, setGridSize] = useState(20);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [lastPanPoint, setLastPanPoint] = useState({ x: 0, y: 0 });
  const mapRef = useRef(map);
  const onSaveRef = useRef(onSave);
  const { addToast } = useToasts();

  // Update refs when props change
  useEffect(() => {
    mapRef.current = map;
    onSaveRef.current = onSave;
  }, [map, onSave]);

  // Auto-save on changes with debouncing
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      const updatedMap = { ...mapRef.current, nodes, edges, updatedAt: Date.now() };
      onSaveRef.current(updatedMap);
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [nodes, edges]);

  // Initialize with root node if no nodes exist
  useEffect(() => {
    if (nodes.length === 0) {
      const rootNode: MindMapNode = {
        id: generateId(),
        text: "Start Here",
        x: 400,
        y: 300,
        children: [],
      };
      setNodes([rootNode]);
      console.log('Created root node'); // Debug log
    }
  }, [nodes.length]);

  const handleCreateChild = useCallback((parentId: string) => {
    const parent = nodes.find(n => n.id === parentId);
    if (!parent) return;

    const childId = generateId();
    const childNode: MindMapNode = {
      id: childId,
      text: "New Node",
      x: parent.x + 200,
      y: parent.y + 100,
      children: [],
    };

    const newEdge: MindMapEdge = {
      id: generateId(),
      from: parentId,
      to: childId,
    };

    const updatedNodes = nodes.map(node =>
      node.id === parentId
        ? { ...node, children: [...node.children, childId] }
        : node
    );

    setNodes([...updatedNodes, childNode]);
    setEdges([...edges, newEdge]);
    
    addToast({ title: "Child node created", description: "Press Tab to create more children" });
  }, [nodes, edges, addToast]);

  const handleCreateSibling = useCallback((nodeId: string) => {
    const node = nodes.find(n => n.id === nodeId);
    if (!node) return;

    const parentEdge = edges.find(e => e.to === nodeId);
    if (!parentEdge) return;

    const parent = nodes.find(n => n.id === parentEdge.from);
    if (!parent) return;

    const siblingId = generateId();
    const siblingNode: MindMapNode = {
      id: siblingId,
      text: "New Node",
      x: node.x + 200,
      y: node.y,
      children: [],
    };

    const newEdge: MindMapEdge = {
      id: generateId(),
      from: parentEdge.from,
      to: siblingId,
    };

    const updatedNodes = nodes.map(n =>
      n.id === parentEdge.from
        ? { ...n, children: [...n.children, siblingId] }
        : n
    );

    setNodes([...updatedNodes, siblingNode]);
    setEdges([...edges, newEdge]);
    
    addToast({ title: "Sibling node created", description: "Press Enter to create more siblings" });
  }, [nodes, edges, addToast]);

  const handleDeleteNode = useCallback((nodeId: string) => {
    const descendants = new Set<string>();
    const findDescendants = (id: string) => {
      descendants.add(id);
      const node = nodes.find(n => n.id === id);
      if (node) {
        node.children.forEach(findDescendants);
      }
    };
    findDescendants(nodeId);

    const updatedNodes = nodes.filter(n => !descendants.has(n.id));
    const updatedEdges = edges.filter(e => !descendants.has(e.from) && !descendants.has(e.to));

    const finalNodes = updatedNodes.map(node => ({
      ...node,
      children: node.children.filter(childId => !descendants.has(childId))
    }));

    setNodes(finalNodes);
    setEdges(updatedEdges);
    
    addToast({ title: "Node deleted", description: "Node and all children removed" });
  }, [nodes, edges, addToast]);

  const handleUpdateNode = useCallback((nodeId: string, updates: Partial<MindMapNode>) => {
    setNodes(nodes.map(node =>
      node.id === nodeId ? { ...node, ...updates } : node
    ));
  }, [nodes]);

  // Check for potential parent during drag
  const checkPotentialParent = useCallback((draggedNodeId: string, x: number, y: number) => {
    const draggedNode = nodes.find(n => n.id === draggedNodeId);
    if (!draggedNode) return null;

    let closestParent: MindMapNode | null = null;
    let minDistance = Infinity;
    const connectionThreshold = 80; // Distance threshold for parent connection

    for (const node of nodes) {
      if (node.id === draggedNodeId) continue;
      
      // Calculate distance from dragged node center to potential parent center
      const distance = Math.sqrt(
        Math.pow(x - (node.x + 100), 2) + Math.pow(y - (node.y + 25), 2)
      );
      
      if (distance < connectionThreshold && distance < minDistance) {
        // Check if this would create a circular reference
        const wouldCreateCycle = checkForCircularReference(draggedNodeId, node.id);
        if (!wouldCreateCycle) {
          minDistance = distance;
          closestParent = node;
        }
      }
    }

    return closestParent;
  }, [nodes]);

  // Snap position to grid
  const snapToGrid = useCallback((x: number, y: number): { x: number; y: number } => {
    if (!showGrid) return { x, y };
    const snappedX = Math.round(x / gridSize) * gridSize;
    const snappedY = Math.round(y / gridSize) * gridSize;
    return { x: snappedX, y: snappedY };
  }, [showGrid, gridSize]);

  // Zoom controls
  const handleZoomIn = useCallback(() => {
    setZoom(prev => Math.min(prev * 1.2, 3));
  }, []);

  const handleZoomOut = useCallback(() => {
    setZoom(prev => Math.max(prev / 1.2, 0.1));
  }, []);

  const handleZoomReset = useCallback(() => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  }, []);

  const handleZoomToFit = useCallback(() => {
    if (nodes.length === 0) return;
    
    // Calculate bounds of all nodes
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    nodes.forEach(node => {
      minX = Math.min(minX, node.x);
      minY = Math.min(minY, node.y);
      maxX = Math.max(maxX, node.x + 200); // Node width
      maxY = Math.max(maxY, node.y + 50);  // Node height
    });
    
    const contentWidth = maxX - minX;
    const contentHeight = maxY - minY;
    
    // Get viewport dimensions (assuming 100vh - header height)
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight - 64; // Subtract header height
    
    // Calculate zoom to fit content with padding
    const padding = 100;
    const zoomX = (viewportWidth - padding) / contentWidth;
    const zoomY = (viewportHeight - padding) / contentHeight;
    const newZoom = Math.min(zoomX, zoomY, 1); // Don't zoom in beyond 1x
    
    setZoom(newZoom);
    
    // Center the content
    const centerX = (viewportWidth - contentWidth * newZoom) / 2;
    const centerY = (viewportHeight - contentHeight * newZoom) / 2;
    setPan({
      x: centerX - minX * newZoom,
      y: centerY - minY * newZoom
    });
  }, [nodes]);

  // Pan handling
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.target === e.currentTarget && e.button === 0) { // Left click on canvas
      setIsPanning(true);
      setLastPanPoint({ x: e.clientX, y: e.clientY });
    }
  }, []);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isPanning) return;
    
    const deltaX = e.clientX - lastPanPoint.x;
    const deltaY = e.clientY - lastPanPoint.y;
    
    setPan(prev => ({
      x: prev.x + deltaX,
      y: prev.y + deltaY
    }));
    
    setLastPanPoint({ x: e.clientX, y: e.clientY });
  }, [isPanning, lastPanPoint]);

  const handleMouseUp = useCallback(() => {
    setIsPanning(false);
  }, []);

  // Wheel zoom
  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    
    const rect = e.currentTarget.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    
    const zoomFactor = e.deltaY > 0 ? 0.9 : 1.1;
    const newZoom = Math.max(0.1, Math.min(3, zoom * zoomFactor));
    
    // Zoom towards mouse position
    const scaleChange = newZoom / zoom;
    const newPanX = mouseX - (mouseX - pan.x) * scaleChange;
    const newPanY = mouseY - (mouseY - pan.y) * scaleChange;
    
    setZoom(newZoom);
    setPan({ x: newPanX, y: newPanY });
  }, [zoom, pan]);

  // Check if connecting two nodes would create a circular reference
  const checkForCircularReference = useCallback((childId: string, parentId: string): boolean => {
    const visited = new Set<string>();
    const stack = [parentId];
    
    while (stack.length > 0) {
      const currentId = stack.pop()!;
      if (currentId === childId) return true; // Circular reference detected
      if (visited.has(currentId)) continue;
      
      visited.add(currentId);
      const currentNode = nodes.find(n => n.id === currentId);
      if (currentNode) {
        stack.push(...currentNode.children);
      }
    }
    
    return false;
  }, [nodes]);

  // Real-time position update during dragging (for smooth edge movement)
  const handleDragStart = useCallback((nodeId: string) => {
    setDraggingNodeId(nodeId);
    setPotentialParentId(null);
  }, []);

  const handleDragMove = useCallback((nodeId: string, x: number, y: number) => {
    // Apply grid snapping if grid is enabled
    const snappedPosition = snapToGrid(x, y);
    
    // Update node position immediately for smooth dragging
    setNodes(prevNodes => 
      prevNodes.map(node =>
        node.id === nodeId ? { ...node, x: snappedPosition.x, y: snappedPosition.y } : node
      )
    );

    // Check for potential parent during drag
    const potentialParent = checkPotentialParent(nodeId, snappedPosition.x, snappedPosition.y);
    setPotentialParentId(potentialParent?.id || null);
  }, [snapToGrid, checkPotentialParent]);

  const handleDragEnd = useCallback((nodeId: string, finalX: number, finalY: number) => {
    const potentialParent = checkPotentialParent(nodeId, finalX, finalY);
    
    if (potentialParent) {
      // Reassign parent
      reassignParent(nodeId, potentialParent.id);
      addToast({ 
        title: "Parent reassigned", 
        description: `"${nodes.find(n => n.id === nodeId)?.text}" is now a child of "${potentialParent.text}"` 
      });
    }
    
    setDraggingNodeId(null);
    setPotentialParentId(null);
  }, [checkPotentialParent, nodes, addToast]);

  // Reassign parent for a node
  const reassignParent = useCallback((nodeId: string, newParentId: string) => {
    const newParent = nodes.find(n => n.id === newParentId);
    if (!newParent) return;

    // Remove old parent connection
    const oldEdge = edges.find(e => e.to === nodeId);
    
    // Create new parent connection
    const newEdge: MindMapEdge = {
      id: generateId(),
      from: newParentId,
      to: nodeId,
    };

    // Update nodes and edges atomically
    setNodes(prevNodes => {
      return prevNodes.map(node => {
        if (node.id === newParentId) {
          return { ...node, children: [...node.children, nodeId] };
        } else if (oldEdge && node.id === oldEdge.from) {
          return { ...node, children: node.children.filter(id => id !== nodeId) };
        }
        return node;
      });
    });

    setEdges(prevEdges => {
      const filteredEdges = oldEdge ? prevEdges.filter(e => e.id !== oldEdge.id) : prevEdges;
      return [...filteredEdges, newEdge];
    });
  }, [nodes, edges]);

  // Edge reassignment functionality
  const handleEdgeDragStart = useCallback((edgeId: string, startX: number, startY: number) => {
    setDraggingEdgeId(edgeId);
    setDragPreview({ x: startX, y: startY });
  }, []);

  const handleEdgeDragMove = useCallback((x: number, y: number) => {
    if (draggingEdgeId) {
      setDragPreview({ x, y });
    }
  }, [draggingEdgeId]);

  const handleEdgeDragEnd = useCallback((endX: number, endY: number) => {
    if (!draggingEdgeId || !dragPreview) return;

    // Find the edge being dragged
    const edge = edges.find(e => e.id === draggingEdgeId);
    if (!edge) return;

    // Find the target node (closest node to drop point)
    let targetNode: MindMapNode | null = null;
    let minDistance = Infinity;

    for (const node of nodes) {
      const distance = Math.sqrt(
        Math.pow(endX - (node.x + 100), 2) + Math.pow(endY - (node.y + 25), 2)
      );
      if (distance < minDistance && distance < 50) { // 50px threshold for connection
        minDistance = distance;
        targetNode = node;
      }
    }

    if (targetNode && targetNode.id !== edge.from && targetNode.id !== edge.to) {
      // Reassign the "to" end of the edge
      const newEdge: MindMapEdge = { ...edge, to: targetNode.id };
      
      setEdges(prevEdges => 
        prevEdges.map(e => e.id === edge.id ? newEdge : e)
      );

      addToast({ 
        title: "Edge reassigned", 
        description: `Connection moved to ${targetNode.text}` 
      });
    }

    setDraggingEdgeId(null);
    setDragPreview(null);
  }, [draggingEdgeId, dragPreview, edges, nodes, addToast]);

  const handleExport = useCallback((format: 'png' | 'svg' | 'json') => {
    switch (format) {
      case 'json':
        const dataStr = JSON.stringify({ nodes, edges }, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${map.name}.json`;
        link.click();
        URL.revokeObjectURL(url);
        break;
      case 'png':
      case 'svg':
        addToast({ title: "Export", description: `${format.toUpperCase()} export coming soon!` });
        break;
    }
  }, [nodes, edges, map.name, addToast]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!selectedNodeId) return;

      switch (e.key) {
        case 'Tab':
          e.preventDefault();
          handleCreateChild(selectedNodeId);
          break;
        case 'Enter':
          e.preventDefault();
          handleCreateSibling(selectedNodeId);
          break;
        case 'Delete':
        case 'Backspace':
          e.preventDefault();
          handleDeleteNode(selectedNodeId);
          setSelectedNodeId(null);
          break;
      }
    };

    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      // Grid toggle shortcut (G key)
      if (e.key.toLowerCase() === 'g' && !e.ctrlKey && !e.altKey && !e.metaKey) {
        e.preventDefault();
        setShowGrid(prev => !prev);
        addToast({ 
          title: "Grid toggled", 
          description: `Grid is now ${!showGrid ? 'on' : 'off'}` 
        });
      }
      
      // Zoom shortcuts
      if (e.key === '+' || e.key === '=') {
        e.preventDefault();
        handleZoomIn();
        addToast({ 
          title: "Zoomed in", 
          description: `Zoom: ${Math.round(zoom * 1.2 * 100)}%` 
        });
      }
      
      if (e.key === '-') {
        e.preventDefault();
        handleZoomOut();
        addToast({ 
          title: "Zoomed out", 
          description: `Zoom: ${Math.round(zoom / 1.2 * 100)}%` 
        });
      }
      
      if (e.key === '0') {
        e.preventDefault();
        handleZoomReset();
        addToast({ 
          title: "Zoom reset", 
          description: "Zoom: 100%" 
        });
      }
      
      if (e.key === '1') {
        e.preventDefault();
        handleZoomToFit();
        addToast({ 
          title: "Zoom to fit", 
          description: "Content fitted to viewport" 
        });
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('keydown', handleGlobalKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('keydown', handleGlobalKeyDown);
    };
  }, [selectedNodeId, handleCreateChild, handleCreateSibling, handleDeleteNode, showGrid, addToast, zoom, handleZoomIn, handleZoomOut, handleZoomReset, handleZoomToFit]);

  const handleCanvasClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      setSelectedNodeId(null);
    }
  };

  const handleCanvasMouseDown = (e: React.MouseEvent) => {
    handleMouseDown(e);
    handleCanvasClick(e);
  };

  const handleCanvasMouseMove = (e: React.MouseEvent) => {
    handleMouseMove(e);
  };

  const handleCanvasMouseUp = (e: React.MouseEvent) => {
    handleMouseUp();
  };

  return (
    <div className="relative h-full">
      {/* Toolbar */}
      <Toolbar
        onExport={handleExport}
        showGrid={showGrid}
        onToggleGrid={() => setShowGrid(!showGrid)}
        gridSize={gridSize}
        onGridSizeChange={setGridSize}
        zoom={zoom}
        onZoomIn={handleZoomIn}
        onZoomOut={handleZoomOut}
        onZoomReset={handleZoomReset}
        onZoomToFit={handleZoomToFit}
        nodes={nodes}
        edges={edges}
      />

      {/* Zoom and Pan Info */}
      {/* <div className="absolute top-4 left-4 z-20">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-3">
          <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
            <div>Zoom: {Math.round(zoom * 100)}%</div>
            <div>Pan: ({Math.round(pan.x)}, {Math.round(pan.y)})</div>
            <div className="text-xs text-gray-500">
              Scroll to zoom, drag to pan
            </div>
          </div>
        </div>
      </div> */}

      <div 
        ref={useRef<HTMLDivElement>(null)}
        className={`relative w-full h-full overflow-hidden bg-gray-50 dark:bg-gray-900 ${
          isPanning ? 'cursor-grabbing' : 'cursor-grab'
        }`}
        onClick={handleCanvasClick}
        onMouseDown={handleCanvasMouseDown}
        onMouseMove={handleCanvasMouseMove}
        onMouseUp={handleCanvasMouseUp}
        onWheel={handleWheel}
      >
        {/* Grid Background */}
        {showGrid && (
          <svg 
            className="absolute inset-0 w-full h-full pointer-events-none transition-opacity duration-300 ease-in-out"
            style={{ opacity: showGrid ? 1 : 0 }}
          >
            <defs>
              <pattern
                id="grid"
                width={gridSize * zoom}
                height={gridSize * zoom}
                patternUnits="userSpaceOnUse"
              >
                <path
                  d={`M ${gridSize * zoom} 0 L 0 0 0 ${gridSize * zoom}`}
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="0.5"
                  className="text-gray-200 dark:text-gray-700"
                />
              </pattern>
              <pattern
                id="major-grid"
                width={gridSize * 5 * zoom}
                height={gridSize * 5 * zoom}
                patternUnits="userSpaceOnUse"
              >
                <path
                  d={`M ${gridSize * 5 * zoom} 0 L 0 0 0 ${gridSize * 5 * zoom}`}
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1"
                  className="text-gray-300 dark:text-gray-600"
                />
              </pattern>
            </defs>
            <rect 
              width="100%" 
              height="100%" 
              fill="url(#grid)"
              transform={`translate(${pan.x % (gridSize * zoom)}, ${pan.y % (gridSize * zoom)})`}
            />
            <rect 
              width="100%" 
              height="100%" 
              fill="url(#major-grid)"
              transform={`translate(${pan.x % (gridSize * 5 * zoom)}, ${pan.y % (gridSize * 5 * zoom)})`}
            />
          </svg>
        )}

        <svg className="absolute inset-0 w-full h-full">
          <g transform={`translate(${pan.x}, ${pan.y}) scale(${zoom})`}>
            {edges.map((edge) => {
              const fromNode = nodes.find(n => n.id === edge.from);
              const toNode = nodes.find(n => n.id === edge.to);
              if (!fromNode || !toNode) return null;
              
              const isDragging = draggingNodeId === edge.from || draggingNodeId === edge.to;
              
              return (
                <Edge
                  key={edge.id}
                  edge={edge}
                  fromNode={fromNode}
                  toNode={toNode}
                  isDragging={isDragging}
                  onDragStart={handleEdgeDragStart}
                  onDragMove={handleEdgeDragMove}
                  onDragEnd={handleEdgeDragEnd}
                />
              );
            })}
          </g>
        </svg>

        {/* Connection preview overlay */}
        {draggingNodeId && potentialParentId && (
          <div className="absolute inset-0 pointer-events-none">
            <svg className="w-full h-full">
              <g transform={`translate(${pan.x}, ${pan.y}) scale(${zoom})`}>
                <defs>
                  <marker
                    id="preview-arrow"
                    viewBox="0 0 10 10"
                    refX="9"
                    refY="3"
                    markerWidth="6"
                    markerHeight="6"
                    orient="auto"
                  >
                    <path d="M0,0 L0,6 L9,3 z" fill="#10b981" />
                  </marker>
                  <filter id="glow">
                    <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
                    <feMerge> 
                      <feMergeNode in="coloredBlur"/>
                      <feMergeNode in="SourceGraphic"/>
                    </feMerge>
                  </filter>
                </defs>
                {(() => {
                  const draggedNode = nodes.find(n => n.id === draggingNodeId);
                  const parentNode = nodes.find(n => n.id === potentialParentId);
                  if (!draggedNode || !parentNode) return null;

                  const startX = draggedNode.x + 100;
                  const startY = draggedNode.y + 25;
                  const endX = parentNode.x + 100;
                  const endY = parentNode.y + 25;

                  return (
                    <g>
                      {/* Glowing dashed preview line */}
                      <line
                        x1={startX}
                        y1={startY}
                        x2={endX}
                        y2={endY}
                        stroke="#10b981"
                        strokeWidth="4"
                        strokeDasharray="8,4"
                        opacity="0.9"
                        markerEnd="url(#preview-arrow)"
                        filter="url(#glow)"
                      />
                      {/* Connection radius indicator with animation */}
                      <circle
                        cx={endX}
                        cy={endY}
                        r="40"
                        fill="none"
                        stroke="#10b981"
                        strokeWidth="3"
                        strokeDasharray="4,4"
                        opacity="0.6"
                        className="animate-pulse"
                      />
                      {/* Inner connection zone */}
                      <circle
                        cx={endX}
                        cy={endY}
                        r="25"
                        fill="none"
                        stroke="#10b981"
                        strokeWidth="2"
                        opacity="0.4"
                      />
                    </g>
                  );
                })()}
              </g>
            </svg>
          </div>
        )}
        
        <div
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
            transformOrigin: '0 0',
          }}
        >
          {nodes.map((node) => {
            const hasIncomingEdges = edges.some(edge => edge.to === node.id);
            const hasOutgoingEdges = edges.some(edge => edge.from === node.id);
            
            return (
              <Node
                key={node.id}
                node={node}
                isSelected={selectedNodeId === node.id}
                isDragging={draggingNodeId === node.id}
                isPotentialParent={potentialParentId === node.id}
                zoom={zoom}
                pan={pan}
                onSelect={() => setSelectedNodeId(node.id)}
                onTextChange={(text) => handleUpdateNode(node.id, { text })}
                onPositionChange={(x, y) => handleUpdateNode(node.id, { x, y })}
                onToggleCollapse={() => handleUpdateNode(node.id, { collapsed: !node.collapsed })}
                onDelete={() => handleDeleteNode(node.id)}
                onAddChild={() => handleCreateChild(node.id)}
                onAddSibling={() => handleCreateSibling(node.id)}
                onDragStart={() => handleDragStart(node.id)}
                onDragMove={handleDragMove}
                onDragEnd={(x, y) => handleDragEnd(node.id, x, y)}
                hasIncomingEdges={hasIncomingEdges}
                hasOutgoingEdges={hasOutgoingEdges}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}
