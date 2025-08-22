"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Plus, Edit, Copy, Trash2, Calendar, Clock } from "lucide-react";
import { storage, createNewMap, MindMap } from "@/lib/storage";
import { ThemeToggle } from "@/components/theme-toggle";

export default function Dashboard() {
  const [maps, setMaps] = useState<MindMap[]>([]);
  const [newMapName, setNewMapName] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    setMaps(storage.getAllMaps());
  }, []);

  const handleCreateMap = () => {
    if (!newMapName.trim()) return;
    
    const newMap = createNewMap(newMapName.trim());
    setMaps(storage.getAllMaps());
    setNewMapName("");
    setIsCreating(false);
    
    // Redirect to the new map
    window.location.href = `/editor/${newMap.id}`;
  };

  const handleDeleteMap = (id: string) => {
    if (confirm("Are you sure you want to delete this mind map?")) {
      storage.deleteMap(id);
      setMaps(storage.getAllMaps());
    }
  };

  const handleDuplicateMap = (id: string) => {
    const duplicated = storage.duplicateMap(id);
    if (duplicated) {
      setMaps(storage.getAllMaps());
    }
  };

  const handleRenameMap = (id: string, newName: string) => {
    if (newName.trim()) {
      storage.renameMap(id, newName.trim());
      setMaps(storage.getAllMaps());
    }
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString();
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              MindMap
            </h1>
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
            Your Mind Maps
          </h2>
          <button
            onClick={() => setIsCreating(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
          >
            <Plus className="h-5 w-5" />
            New Map
          </button>
        </div>

        {isCreating && (
          <div className="mb-6 p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
            <div className="flex gap-2">
              <input
                type="text"
                value={newMapName}
                onChange={(e) => setNewMapName(e.target.value)}
                placeholder="Enter map name..."
                className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                onKeyPress={(e) => e.key === "Enter" && handleCreateMap()}
                autoFocus
              />
              <button
                onClick={handleCreateMap}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors"
              >
                Create
              </button>
              <button
                onClick={() => {
                  setIsCreating(false);
                  setNewMapName("");
                }}
                className="px-4 py-2 bg-gray-300 hover:bg-gray-400 text-gray-700 rounded-md transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {maps.length === 0 ? (
          <div className="text-center py-12">
            <div className="mx-auto w-24 h-24 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center mb-4">
              <Plus className="h-12 w-12 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              No mind maps yet
            </h3>
            <p className="text-gray-500 dark:text-gray-400 mb-6">
              Create your first mind map to get started
            </p>
            <button
              onClick={() => setIsCreating(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
            >
              Create Your First Map
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {maps.map((map) => (
              <MapCard
                key={map.id}
                map={map}
                onDelete={handleDeleteMap}
                onDuplicate={handleDuplicateMap}
                onRename={handleRenameMap}
                formatDate={formatDate}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

interface MapCardProps {
  map: MindMap;
  onDelete: (id: string) => void;
  onDuplicate: (id: string) => void;
  onRename: (id: string, newName: string) => void;
  formatDate: (timestamp: number) => string;
}

function MapCard({ map, onDelete, onDuplicate, onRename, formatDate }: MapCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(map.name);

  const handleRename = () => {
    onRename(map.id, editName);
    setIsEditing(false);
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow">
      <div className="p-6">
        <div className="flex items-start justify-between mb-4">
          {isEditing ? (
            <div className="flex-1 mr-2">
              <input
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                onKeyPress={(e) => e.key === "Enter" && handleRename()}
                autoFocus
              />
            </div>
          ) : (
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex-1">
              {map.name}
            </h3>
          )}
          
          <div className="flex gap-1">
            {isEditing ? (
              <>
                <button
                  onClick={handleRename}
                  className="p-1 text-green-600 hover:text-green-700"
                  title="Save"
                >
                  ✓
                </button>
                <button
                  onClick={() => {
                    setIsEditing(false);
                    setEditName(map.name);
                  }}
                  className="p-1 text-gray-600 hover:text-gray-700"
                  title="Cancel"
                >
                  ✕
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => setIsEditing(true)}
                  className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  title="Rename"
                >
                  <Edit className="h-4 w-4" />
                </button>
                <button
                  onClick={() => onDuplicate(map.id)}
                  className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  title="Duplicate"
                >
                  <Copy className="h-4 w-4" />
                </button>
                <button
                  onClick={() => onDelete(map.id)}
                  className="p-1 text-red-400 hover:text-red-600"
                  title="Delete"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </>
            )}
          </div>
        </div>

        <div className="space-y-2 text-sm text-gray-500 dark:text-gray-400 mb-4">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            <span>Created: {formatDate(map.createdAt)}</span>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            <span>Updated: {formatDate(map.updatedAt)}</span>
          </div>
          <div>
            <span>{map.nodes.length} nodes, {map.edges.length} connections</span>
          </div>
        </div>

        <Link
          href={`/editor/${map.id}`}
          className="block w-full bg-blue-600 hover:bg-blue-700 text-white text-center py-2 px-4 rounded-md font-medium transition-colors"
        >
          Open Map
        </Link>
      </div>
    </div>
  );
}
