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
  const [potentialParentId, setPotentialParentId] = useState<string | null>(null);
  const [draggingEdgeId, setDraggingEdgeId] = useState<string | null>(null);
  const [dragPreview, setDragPreview] = useState<{ x: number; y: number } | null>(null);
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [selectedNodes, setSelectedNodes] = useState<Set<string>>(new Set());
  const [selectionBox, setSelectionBox] = useState<{ start: { x: number; y: number }; end: { x: number; y: number } } | null>(null);
  const [showGrid, setShowGrid] = useState(true);
  const [gridSize, setGridSize] = useState(20);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
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

    const rootNode = nodes[0]; // First node is always the root
    const isOnLeftSide = parent.x < rootNode.x;
    
    const childId = generateId();
    const childNode: MindMapNode = {
      id: childId,
      text: "New Node",
      x: isOnLeftSide ? parent.x - 50 : parent.x + 50, // Small offset from parent, same side
      y: parent.y + 100, // Below parent
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

    const rootNode = nodes[0]; // First node is always the root
    const isRootNode = node.id === rootNode.id;
    
    let siblingId: string;
    let siblingNode: MindMapNode;
    let newEdge: MindMapEdge;

    if (isRootNode) {
      // For root node, create a child on the left side
      siblingId = generateId();
      siblingNode = {
        id: siblingId,
        text: "New Node",
        x: rootNode.x - 250, // Position to the left of root
        y: rootNode.y + 100, // Below root
        children: [],
      };
      
      // Create edge from root to new child
      newEdge = {
        id: generateId(),
        from: rootNode.id,
        to: siblingId,
      };
      
      // Update root's children list
      const updatedNodes = nodes.map(n =>
        n.id === rootNode.id
          ? { ...n, children: [...n.children, siblingId] }
          : n
      );
      
      setNodes([...updatedNodes, siblingNode]);
      setEdges([...edges, newEdge]);
    } else {
      // For non-root nodes, create a sibling with the same parent
      const parentEdge = edges.find(e => e.to === nodeId);
      if (!parentEdge) return;

      const parent = nodes.find(n => n.id === parentEdge.from);
      if (!parent) return;

      const isOnLeftSide = node.x < rootNode.x;
      
      siblingId = generateId();
      siblingNode = {
        id: siblingId,
        text: "New Node",
        x: isOnLeftSide ? node.x - 250 : node.x + 250, // Position on same side as current node
        y: node.y, // Same Y level as sibling
        children: [],
      };

      newEdge = {
        id: generateId(),
        from: parentEdge.from,
        to: siblingId,
      };

      // Update parent's children list
      const updatedNodes = nodes.map(n =>
        n.id === parentEdge.from
          ? { ...n, children: [...n.children, siblingId] }
          : n
      );

      setNodes([...updatedNodes, siblingNode]);
      setEdges([...edges, newEdge]);
    }
    
    if (isRootNode) {
      addToast({ title: "Left child created", description: "Press Enter to create more left children" });
    } else {
      addToast({ title: "Sibling node created", description: "Press Enter to create more siblings" });
    }
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
    const connectionThreshold = 60; // Distance threshold for parent connection (adjusted for left/right connectors)

    for (const node of nodes) {
      if (node.id === draggedNodeId) continue;
      
      // Determine which connector to check based on relative position
      const isLeftSideConnection = x < node.x;
      let parentConnectorX: number, parentConnectorY: number;
      
      if (isLeftSideConnection) {
        // For left-side connections, check the right connector
        parentConnectorX = node.x + 200 + 16; // Right connector position
        parentConnectorY = node.y + 25; // Center of parent node
      } else {
        // For right-side connections, check the left connector
        parentConnectorX = node.x - 16; // Left connector position
        parentConnectorY = node.y + 25; // Center of parent node
      }
      
      const distance = Math.sqrt(
        Math.pow(x - parentConnectorX, 2) + Math.pow(y - parentConnectorY, 2)
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

  // Handle wheel events for panning
  const handleWheel = useCallback((e: React.WheelEvent) => {
    if (e.ctrlKey || e.metaKey) {
      // Zoom with Ctrl/Cmd + wheel
      e.preventDefault();
      const delta = e.deltaY > 0 ? 0.9 : 1.1;
      const newZoom = Math.max(0.1, Math.min(3, zoom * delta));
      
      // Zoom towards mouse position
      const rect = e.currentTarget.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;
      
      const newPanX = mouseX - (mouseX - pan.x) * (newZoom / zoom);
      const newPanY = mouseY - (mouseY - pan.y) * (newZoom / zoom);
      
      setZoom(newZoom);
      setPan({ x: newPanX, y: newPanY });
    } else {
      // Pan with wheel (horizontal and vertical)
      e.preventDefault();
      setPan(prevPan => ({
        x: prevPan.x - e.deltaX,
        y: prevPan.y - e.deltaY
      }));
    }
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
      // Determine which connector to check based on relative position
      const isLeftSideConnection = endX < node.x;
      let nodeConnectorX: number, nodeConnectorY: number;
      
      if (isLeftSideConnection) {
        // For left-side connections, check the right connector
        nodeConnectorX = node.x + 200 + 16; // Right connector position
        nodeConnectorY = node.y + 25; // Center of node
      } else {
        // For right-side connections, check the left connector
        nodeConnectorX = node.x - 16; // Left connector position
        nodeConnectorY = node.y + 25; // Center of node
      }
      
      const distance = Math.sqrt(
        Math.pow(endX - nodeConnectorX, 2) + Math.pow(endY - nodeConnectorY, 2)
      );
      if (distance < minDistance && distance < 40) { // 40px threshold for connection (adjusted for left/right connectors)
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

  // Handle keyboard events for multi-selection
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        // Clear all selections
        setSelectedNodes(new Set());
        setSelectedNodeId(null);
      } else if (e.key === 'Delete' && selectedNodes.size > 0) {
        // Delete all selected nodes
        selectedNodes.forEach(nodeId => handleDeleteNode(nodeId));
        setSelectedNodes(new Set());
        setSelectedNodeId(null);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [selectedNodes]);

  // Update canvas cursor based on state
  const getCanvasCursor = () => {
    if (isPanning) return 'grabbing';
    if (draggingNodeId) return 'grabbing';
    if (selectionBox) return 'crosshair';
    return 'default';
  };

  const handleCanvasClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      setSelectedNodeId(null);
    }
  };

  // Handle canvas mouse events for panning and selection
  const handleCanvasMouseDown = useCallback((e: React.MouseEvent) => {
    // Check if we're clicking on a node or edge
    const target = e.target as HTMLElement;
    const isNodeOrEdge = target.closest('[data-node]') || target.closest('[data-edge]') || target.closest('[data-svg]');
    
    console.log('Mouse down:', { 
      target: target.tagName, 
      isNodeOrEdge, 
      button: e.button,
      clientX: e.clientX,
      clientY: e.clientY
    });
    
    if (!isNodeOrEdge) {
      // We're clicking on the canvas - handle panning/selection
      if (e.button === 0) { // Left click - selection
        console.log('Starting selection box');
        setSelectionBox({ start: { x: e.clientX, y: e.clientY }, end: { x: e.clientX, y: e.clientY } });
        
        // Clear selection if not holding Ctrl/Cmd
        if (!e.ctrlKey && !e.metaKey) {
          setSelectedNodes(new Set());
          setSelectedNodeId(null);
        }
      } else if (e.button === 1) { // Middle button - panning
        console.log('Starting panning');
        e.preventDefault();
        setIsPanning(true);
        setPanStart({ x: e.clientX, y: e.clientY });
      }
    }
  }, []);

  const handleCanvasMouseMove = useCallback((e: React.MouseEvent) => {
    if (isPanning) {
      const deltaX = e.clientX - panStart.x;
      const deltaY = e.clientY - panStart.y;
      
      setPan(prevPan => ({
        x: prevPan.x + deltaX,
        y: prevPan.y + deltaY
      }));
      
      setPanStart({ x: e.clientX, y: e.clientY });
    }
    
    // Update selection box if creating one
    if (selectionBox && !isPanning) {
      setSelectionBox(prev => prev ? { ...prev, end: { x: e.clientX, y: e.clientY } } : null);
    }
  }, [isPanning, panStart, selectionBox]);

  const handleCanvasMouseUp = useCallback((e: React.MouseEvent) => {
    console.log('Mouse up:', { button: e.button, isPanning, hasSelectionBox: !!selectionBox });
    
    if (e.button === 1 && isPanning) { // Middle button release
      console.log('Stopping panning');
      setIsPanning(false);
    } else if (e.button === 0 && selectionBox) { // Left button release
      console.log('Processing selection box');
      // Process selection box
      const startX = Math.min(selectionBox.start.x, selectionBox.end.x);
      const endX = Math.max(selectionBox.start.x, selectionBox.end.x);
      const startY = Math.min(selectionBox.start.y, selectionBox.end.y);
      const endY = Math.max(selectionBox.start.y, selectionBox.end.y);
      
      // Convert screen coordinates to world coordinates
      const worldStartX = (startX - pan.x) / zoom;
      const worldEndX = (endX - pan.x) / zoom;
      const worldStartY = (startY - pan.y) / zoom;
      const worldEndY = (endY - pan.y) / zoom;
      
      // Find nodes within selection box
      const selectedNodeIds = new Set<string>();
      nodes.forEach(node => {
        const nodeCenterX = node.x + 100; // Node center X
        const nodeCenterY = node.y + 25;  // Node center Y (middle of node)
        
        if (nodeCenterX >= worldStartX && nodeCenterX <= worldEndX &&
            nodeCenterY >= worldStartY && nodeCenterY <= worldEndY) {
          selectedNodeIds.add(node.id);
        }
      });
      
      console.log('Selected nodes:', Array.from(selectedNodeIds));
      setSelectedNodes(selectedNodeIds);
      if (selectedNodeIds.size === 1) {
        setSelectedNodeId(Array.from(selectedNodeIds)[0]);
      } else if (selectedNodeIds.size > 1) {
        setSelectedNodeId(null); // Clear single selection for multi-selection
      }
      
      setSelectionBox(null);
    }
  }, [isPanning, selectionBox, pan.x, pan.y, zoom, nodes]);

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

      {/* Selection info */}
      {selectedNodes.size > 0 && (
        <div className="absolute bottom-4 left-4 z-20">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-3">
            <div className="text-sm text-gray-600 dark:text-gray-400">
              <div className="font-medium">
                {selectedNodes.size} node{selectedNodes.size !== 1 ? 's' : ''} selected
              </div>
              <div className="text-xs mt-1">
                Press Delete to remove, Escape to clear selection
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Interaction instructions */}
      <div className="absolute top-4 left-4 z-20">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-3">
          <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
            <div className="font-medium">Navigation</div>
            <div>• Left click + drag: Select nodes</div>
            <div>• Middle click + drag: Pan canvas</div>
            <div>• Wheel: Pan vertically</div>
            <div>• Ctrl/Cmd + Wheel: Zoom</div>
          </div>
        </div>
      </div>

      <div
        ref={useRef<HTMLDivElement>(null)}
        className={`relative w-full h-full overflow-hidden bg-gray-50 dark:bg-gray-900 ${
          getCanvasCursor()
        }`}
        onClick={handleCanvasClick}
        onMouseDown={handleCanvasMouseDown}
        onMouseMove={handleCanvasMouseMove}
        onMouseUp={handleCanvasMouseUp}
        onWheel={handleWheel}
      >
        {/* Grid Background */}
        {showGrid && (
          <svg className="absolute inset-0 w-full h-full" data-svg="grid">
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

        <svg className="absolute inset-0 w-full h-full" data-svg="edges">
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

        {/* Selection box overlay */}
        {selectionBox && (
          <div
            className="absolute border-2 border-blue-500 bg-blue-100 bg-opacity-20 pointer-events-none z-20"
            style={{
              left: Math.min(selectionBox.start.x, selectionBox.end.x),
              top: Math.min(selectionBox.start.y, selectionBox.end.y),
              width: Math.abs(selectionBox.end.x - selectionBox.start.x),
              height: Math.abs(selectionBox.end.y - selectionBox.start.y),
            }}
          />
        )}

        {/* Nodes */}
        <div
          className="relative w-full h-full"
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
            transformOrigin: '0 0',
          }}
        >
          {nodes.map((node) => {
            const hasIncomingEdges = edges.some(edge => edge.to === node.id);
            const hasOutgoingEdges = edges.some(edge => edge.from === node.id);
            const isSelected = selectedNodeId === node.id;
            const isMultiSelected = selectedNodes.has(node.id) && selectedNodes.size > 1;
            
            // Debug logging for selection states
            if (selectedNodes.has(node.id)) {
              console.log(`Node ${node.text}: isSelected=${isSelected}, isMultiSelected=${isMultiSelected}, selectedNodes.size=${selectedNodes.size}`);
            }
            
            return (
              <Node
                key={node.id}
                node={node}
                nodes={nodes}
                isSelected={isSelected}
                isMultiSelected={isMultiSelected}
                isDragging={draggingNodeId === node.id}
                isPotentialParent={potentialParentId === node.id}
                zoom={zoom}
                pan={pan}
                onSelect={() => {
                  // Handle multi-selection
                  if (selectedNodes.size > 1) {
                    // If multiple nodes are already selected, add this one
                    setSelectedNodes(prev => new Set([...prev, node.id]));
                    setSelectedNodeId(null); // Clear single selection
                  } else {
                    // Single selection
                    setSelectedNodes(new Set([node.id]));
                    setSelectedNodeId(node.id);
                  }
                }}
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

                  // Determine if this is a left-side connection
                  const isLeftSideConnection = draggedNode.x < parentNode.x;
                  
                  let startX: number, startY: number, endX: number, endY: number;
                  
                  if (isLeftSideConnection) {
                    // Left-side connection: from left connector to right connector
                    startX = draggedNode.x - 16; // Left connector
                    startY = draggedNode.y + 25; // Center of dragged node
                    endX = parentNode.x + 200 + 16; // Right connector
                    endY = parentNode.y + 25; // Center of parent node
                  } else {
                    // Right-side connection: from right connector to left connector
                    startX = draggedNode.x + 200 + 16; // Right connector
                    startY = draggedNode.y + 25; // Center of dragged node
                    endX = parentNode.x - 16; // Left connector
                    endY = parentNode.y + 25; // Center of parent node
                  }

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
                      {/* Connector highlight */}
                      <circle
                        cx={endX}
                        cy={endY}
                        r="8"
                        fill="#10b981"
                        opacity="0.8"
                        className="animate-pulse"
                      />
                      {/* Left connector indicator */}
                      <rect
                        x={endX - 6}
                        y={endY - 6}
                        width="12"
                        height="12"
                        fill="none"
                        stroke="#10b981"
                        strokeWidth="2"
                        opacity="0.6"
                        rx="6"
                      />
                    </g>
                  );
                })()}
              </g>
            </svg>
          </div>
        )}
        
      </div>
    </div>
  );
}
