export interface MindMapNode {
  id: string;
  text: string;
  x: number;
  y: number;
  children: string[];
  collapsed?: boolean;
}

export interface MindMapEdge {
  id: string;
  from: string;
  to: string;
}

export interface MindMap {
  id: string;
  name: string;
  nodes: MindMapNode[];
  edges: MindMapEdge[];
  createdAt: number;
  updatedAt: number;
}

const STORAGE_KEY = 'mindmaps';

export const storage = {
  // Get all mind maps
  getAllMaps: (): MindMap[] => {
    if (typeof window === 'undefined') return [];
    
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Error reading from localStorage:', error);
      return [];
    }
  },

  // Get a specific mind map
  getMap: (id: string): MindMap | null => {
    const maps = storage.getAllMaps();
    return maps.find(map => map.id === id) || null;
  },

  // Save a mind map
  saveMap: (map: MindMap): void => {
    if (typeof window === 'undefined') return;
    
    try {
      const maps = storage.getAllMaps();
      const existingIndex = maps.findIndex(m => m.id === map.id);
      
      if (existingIndex >= 0) {
        maps[existingIndex] = { ...map, updatedAt: Date.now() };
      } else {
        maps.push({ ...map, createdAt: Date.now(), updatedAt: Date.now() });
      }
      
      localStorage.setItem(STORAGE_KEY, JSON.stringify(maps));
    } catch (error) {
      console.error('Error saving to localStorage:', error);
    }
  },

  // Delete a mind map
  deleteMap: (id: string): void => {
    if (typeof window === 'undefined') return;
    
    try {
      const maps = storage.getAllMaps();
      const filteredMaps = maps.filter(map => map.id !== id);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(filteredMaps));
    } catch (error) {
      console.error('Error deleting from localStorage:', error);
    }
  },

  // Duplicate a mind map
  duplicateMap: (id: string): MindMap | null => {
    const original = storage.getMap(id);
    if (!original) return null;
    
    const duplicated: MindMap = {
      ...original,
      id: generateId(),
      name: `${original.name} (Copy)`,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    
    storage.saveMap(duplicated);
    return duplicated;
  },

  // Rename a mind map
  renameMap: (id: string, newName: string): void => {
    const map = storage.getMap(id);
    if (!map) return;
    
    const updated = { ...map, name: newName, updatedAt: Date.now() };
    storage.saveMap(updated);
  },
};

// Utility function to generate unique IDs
export const generateId = (): string => {
  return Math.random().toString(36).substr(2, 9);
};

// Create a new empty mind map
export const createNewMap = (name: string): MindMap => {
  const rootNode: MindMapNode = {
    id: generateId(),
    text: 'Root',
    //center the root node
    x: window.innerWidth / 2 - 150,
    y: window.innerHeight / 2 - 150,
    children: [],
  };

  const newMap: MindMap = {
    id: generateId(),
    name,
    nodes: [rootNode],
    edges: [],
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };

  storage.saveMap(newMap);
  return newMap;
};
