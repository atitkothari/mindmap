"use client";

import { FileText, Image, FileJson, Info, MousePointer, Move, Grid3X3, Settings, ZoomIn, ZoomOut, RotateCcw, Maximize2 } from "lucide-react";
import { useState } from "react";
import { MindMapNode, MindMapEdge } from "@/lib/storage";

interface ToolbarProps {
  onExport: (format: 'png' | 'svg' | 'json') => void;
  showGrid: boolean;
  onToggleGrid: () => void;
  gridSize: number;
  onGridSizeChange: (size: number) => void;
  zoom: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onZoomReset: () => void;
  onZoomToFit: () => void;
  nodes?: MindMapNode[];
  edges?: MindMapEdge[];
}

export function Toolbar({ onExport, showGrid, onToggleGrid, gridSize, onGridSizeChange, zoom, onZoomIn, onZoomOut, onZoomReset, onZoomToFit, nodes = [], edges = [] }: ToolbarProps) {
  const [showInstructions, setShowInstructions] = useState(false);
  const [showGridSettings, setShowGridSettings] = useState(false);

  return (
    <div className="absolute top-4 right-4 z-20">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-2">
        <div className="flex flex-col gap-2">
          {/* Instructions toggle */}
          <button
            onClick={() => setShowInstructions(!showInstructions)}
            className="p-2 text-gray-600 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors flex items-center gap-2"
            title="Show/Hide Instructions"
          >
            <Info className="h-4 w-4" />
            <span className="text-sm">Help</span>
          </button>

          {/* Zoom controls */}
          <div className="border-t border-gray-200 dark:border-gray-700 my-1"></div>
          
          <div className="text-xs text-gray-500 dark:text-gray-400 text-center px-2">
            {Math.round(zoom * 100)}%
          </div>
          
          <div className="flex gap-1">
            <button
              onClick={onZoomOut}
              className="p-2 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
              title="Zoom Out (Scroll down)"
            >
              <ZoomOut className="h-4 w-4" />
            </button>
            <button
              onClick={onZoomIn}
              className="p-2 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
              title="Zoom In (Scroll up)"
            >
              <ZoomIn className="h-4 w-4" />
            </button>
          </div>
          
          <div className="flex gap-1">
            <button
              onClick={onZoomReset}
              className="p-2 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
              title="Reset Zoom (1:1)"
            >
              <RotateCcw className="h-4 w-4" />
            </button>
            <button
              onClick={onZoomToFit}
              className="p-2 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
              title="Zoom to Fit All Content"
            >
              <Maximize2 className="h-4 w-4" />
            </button>
          </div>

          <div className="border-t border-gray-200 dark:border-gray-700 my-1"></div>

          {/* Grid toggle */}
          <button
            onClick={onToggleGrid}
            className={`p-2 rounded transition-colors flex items-center gap-2 ${
              showGrid 
                ? 'text-blue-600 bg-blue-100 dark:text-blue-400 dark:bg-blue-900/30' 
                : 'text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
            title="Toggle Grid"
          >
            <Grid3X3 className="h-4 w-4" />
            <div className="flex flex-col items-start">
              <span className="text-sm">Grid</span>
              {showGrid && (
                <span className="text-xs text-blue-600 dark:text-blue-400">
                  {gridSize}px
                </span>
              )}
            </div>
          </button>

          {/* Grid settings */}
          {showGrid && (
            <button
              onClick={() => setShowGridSettings(!showGridSettings)}
              className="p-2 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors flex items-center gap-2"
              title="Grid Settings"
            >
              <Settings className="h-4 w-4" />
              <span className="text-sm">Size</span>
            </button>
          )}

          {/* Grid settings panel */}
          {showGrid && showGridSettings && (
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3 max-w-xs">
              <h3 className="font-semibold text-blue-900 dark:text-blue-100 text-sm mb-2">Grid Size</h3>
              <div className="space-y-2">
                <input
                  type="range"
                  min="10"
                  max="50"
                  step="5"
                  value={gridSize}
                  onChange={(e) => onGridSizeChange(Number(e.target.value))}
                  className="w-full h-2 bg-blue-200 rounded-lg appearance-none cursor-pointer slider"
                />
                <div className="text-xs text-blue-600 dark:text-blue-300 text-center">
                  {gridSize}px
                </div>
              </div>
            </div>
          )}

          {/* Instructions panel */}
          {showInstructions && (
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3 max-w-xs">
              <h3 className="font-semibold text-blue-900 dark:text-blue-100 text-sm mb-2">How to use:</h3>
              <div className="space-y-2 text-xs text-blue-800 dark:text-blue-200">
                <div className="flex items-start gap-2">
                  <Move className="h-3 w-3 mt-0.5 flex-shrink-0" />
                  <span>Drag nodes to move them around</span>
                </div>
                <div className="flex items-start gap-2">
                  <MousePointer className="h-3 w-3 mt-0.5 flex-shrink-0" />
                  <span>Drag a node close to another to reassign its parent</span>
                </div>
                <div className="flex items-start gap-2">
                  <Grid3X3 className="h-3 w-3 mt-0.5 flex-shrink-0" />
                  <span>Toggle grid with G key or toolbar button</span>
                </div>
                <div className="flex items-start gap-2">
                  <ZoomIn className="h-3 w-3 mt-0.5 flex-shrink-0" />
                  <span>Scroll wheel to zoom, drag canvas to pan</span>
                </div>
                <div className="text-xs text-blue-600 dark:text-blue-300">
                  <strong>Keyboard shortcuts:</strong><br/>
                  Tab: Add child<br/>
                  Enter: Add sibling<br/>
                  Delete: Remove node<br/>
                  G: Toggle grid
                </div>
              </div>
            </div>
          )}

          <div className="border-t border-gray-200 dark:border-gray-700 my-1"></div>

          <button
            onClick={() => onExport('png')}
            className="p-2 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors flex items-center gap-2"
            title="Export as PNG"
          >
            <Image className="h-4 w-4" />
            <span className="text-sm">PNG</span>
          </button>
          
          <button
            onClick={() => onExport('svg')}
            className="p-2 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors flex items-center gap-2"
            title="Export as SVG"
          >
            <FileText className="h-4 w-4" />
            <span className="text-sm">SVG</span>
          </button>
          
          <button
            onClick={() => onExport('json')}
            className="p-2 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors flex items-center gap-2"
            title="Export as JSON"
          >
            <FileJson className="h-4 w-4" />
            <span className="text-sm">JSON</span>
          </button>
        </div>
      </div>
    </div>
  );
}
